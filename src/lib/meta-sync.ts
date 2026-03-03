/**
 * Meta Marketing API Sync Service
 * 
 * Sincroniza campanhas, conjuntos de anúncios, anúncios e métricas
 * da Meta Marketing API para o banco de dados Supabase.
 * 
 * Estratégia: 
 * - Campanhas/Conjuntos/Anúncios: upsert pelo meta_id
 * - Métricas: delete + insert por período (evita duplicação)
 * 
 * @author Painel Tráfego Pago
 */

import { supabase } from '@/lib/supabase';
import { 
  MetaClient, 
  MetaCampaign, 
  MetaAdSet, 
  MetaAd, 
  MetaInsight,
  extractLeadsFromActions,
  extractPurchasesFromActions,
  extractPageViewsFromActions,
  extractMessagesFromActions,
  extractWhatsAppLeadsFromActions,
  extractMessengerLeadsFromActions
} from '@/lib/meta-client';

// ============================================
// Tipos
// ============================================

export interface IntegracaoMeta {
  id: string;
  empresa_id: string;
  access_token: string;
  ad_account_id: string;
  business_id?: string;
  ativo: boolean;
  ultima_sincronizacao?: string;
}

export interface SyncResult {
  sucesso: boolean;
  campanhas: {
    processadas: number;
    criadas: number;
    atualizadas: number;
  };
  conjuntos: {
    processados: number;
    criados: number;
    atualizados: number;
  };
  anuncios: {
    processados: number;
    criados: number;
    atualizados: number;
  };
  metricas: {
    processadas: number;
    inseridas: number;
  };
  erros: string[];
  duracao: number;
}

export interface SyncOptions {
  /** Sincronizar campanhas */
  syncCampaigns?: boolean;
  /** Sincronizar conjuntos de anúncios */
  syncAdSets?: boolean;
  /** Sincronizar anúncios individuais */
  syncAds?: boolean;
  /** Sincronizar métricas */
  syncInsights?: boolean;
  /** Período para métricas (ex: last_7d, last_30d) */
  datePreset?: string;
  /** Período customizado para métricas */
  timeRange?: { since: string; until: string };
  /** Funil padrão para novas campanhas (null = não vinculado) */
  funilPadrao?: string | null;
  /** Data inicial para filtrar campanhas (YYYY-MM-DD) — padrão: 1º do mês */
  periodo_inicio?: string;
}

// ============================================
// Funções principais de sync
// ============================================

/**
 * Sincroniza todos os dados da Meta para o Supabase
 */
export async function syncMetaToSupabase(
  integracao: IntegracaoMeta,
  options: SyncOptions = {}
): Promise<SyncResult> {
  const startTime = Date.now();
  
  const result: SyncResult = {
    sucesso: true,
    campanhas: { processadas: 0, criadas: 0, atualizadas: 0 },
    conjuntos: { processados: 0, criados: 0, atualizados: 0 },
    anuncios: { processados: 0, criados: 0, atualizados: 0 },
    metricas: { processadas: 0, inseridas: 0 },
    erros: [],
    duracao: 0
  };

  // Criar log de sincronização
  const { data: logData } = await supabase
    .from('sync_logs_meta')
    .insert({
      empresa_id: integracao.empresa_id,
      integracao_id: integracao.id,
      tipo: 'completo',
      status: 'em_andamento'
    })
    .select()
    .single();
  const logId = logData?.id;

  try {
    // Criar cliente Meta
    const client = new MetaClient({
      accessToken: integracao.access_token,
      adAccountId: integracao.ad_account_id
    });

    // Validar token
    const tokenInfo = await client.validateToken();
    if (!tokenInfo.isValid) {
      throw new Error('Token de acesso inválido ou expirado');
    }

    // Mapeamento de IDs Meta → IDs locais
    const campanhaMap = new Map<string, string>();
    const conjuntoMap = new Map<string, string>();
    const anuncioMap = new Map<string, string>();

    // 1. Sincronizar Campanhas
    if (options.syncCampaigns !== false) {
      const campanhasResult = await syncCampaigns(
        client, 
        integracao.empresa_id,
        options.funilPadrao || null,
        options.periodo_inicio // Filtra campanhas criadas após esta data
      );
      result.campanhas = campanhasResult.stats;
      result.erros.push(...campanhasResult.erros);
      campanhasResult.mapping.forEach((local, meta) => campanhaMap.set(meta, local));
    }

    // 2. Sincronizar Conjuntos de Anúncios
    if (options.syncAdSets !== false) {
      const conjuntosResult = await syncAdSets(client, campanhaMap);
      result.conjuntos = conjuntosResult.stats;
      result.erros.push(...conjuntosResult.erros);
      conjuntosResult.mapping.forEach((local, meta) => conjuntoMap.set(meta, local));
    }

    // 3. Sincronizar Anúncios
    if (options.syncAds !== false) {
      const anunciosResult = await syncAds(client, conjuntoMap);
      result.anuncios = anunciosResult.stats;
      result.erros.push(...anunciosResult.erros);
      anunciosResult.mapping.forEach((local, meta) => anuncioMap.set(meta, local));
    }

    // 4. Sincronizar Métricas
    if (options.syncInsights !== false) {
      // Calcular período explícito (não confiar em date_preset que não retorna datas)
      let timeRange = options.timeRange;
      if (!timeRange) {
        let hoje = new Date();
        let inicio = new Date();
        
        // Mapear datePreset para período
        if (options.datePreset === 'this_month') {
          // Este mês: 1º do mês atual até hoje
          inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        } else if (options.datePreset === 'last_month') {
          // Mês passado completo
          inicio = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
          hoje = new Date(hoje.getFullYear(), hoje.getMonth(), 0); // último dia mês anterior
        } else {
          const diasAtras =
            options.datePreset === 'last_7d' ? 7 :
            options.datePreset === 'last_14d' ? 14 :
            options.datePreset === 'last_30d' ? 30 :
            options.datePreset === 'last_60d' ? 60 :
            options.datePreset === 'last_90d' ? 90 :
            30; // padrão: 30d
          inicio.setDate(hoje.getDate() - diasAtras);
        }
        
        timeRange = {
          since: inicio.toISOString().split('T')[0],
          until: hoje.toISOString().split('T')[0]
        };
      }

      const metricasResult = await syncInsights(
        client,
        campanhaMap,
        conjuntoMap,
        anuncioMap,
        timeRange
      );
      result.metricas = metricasResult.stats;
      result.erros.push(...metricasResult.erros);
    }

    // Atualizar timestamp da última sincronização
    await supabase
      .from('integracoes_meta')
      .update({ 
        ultima_sincronizacao: new Date().toISOString(),
        erro_sincronizacao: null
      })
      .eq('id', integracao.id);

  } catch (error) {
    result.sucesso = false;
    const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
    result.erros.push(errorMsg);
    
    // Salvar erro na integração
    await supabase
      .from('integracoes_meta')
      .update({ erro_sincronizacao: errorMsg })
      .eq('id', integracao.id);
  }

  result.duracao = Date.now() - startTime;

  // Atualizar log de sincronização com detalhamento completo
  if (logId) {
    // Montar JSON com detalhes por nível
    const detalhes = JSON.stringify({
      campanhas: result.campanhas,
      conjuntos: result.conjuntos,
      anuncios: result.anuncios,
      metricas: result.metricas,
      erros: result.erros.length > 0 ? result.erros : undefined,
      ad_account_id: integracao.ad_account_id,
      duracao_ms: result.duracao
    });

    await supabase
      .from('sync_logs_meta')
      .update({
        status: result.sucesso ? 'sucesso' : 'erro',
        registros_processados: result.campanhas.processadas + result.conjuntos.processados + result.anuncios.processados,
        registros_criados: result.campanhas.criadas + result.conjuntos.criados + result.anuncios.criados,
        registros_atualizados: result.campanhas.atualizadas + result.conjuntos.atualizados + result.anuncios.atualizados,
        erro_detalhe: detalhes,
        finalizado_em: new Date().toISOString()
      })
      .eq('id', logId);
  }

  return result;
}

// ============================================
// Sync de Campanhas
// ============================================

async function syncCampaigns(
  client: MetaClient,
  empresaId: string,
  funilPadraoId: string | null,
  filtroDataInicio?: string // YYYY-MM-DD — filtra campanhas criadas após esta data
): Promise<{
  stats: { processadas: number; criadas: number; atualizadas: number };
  erros: string[];
  mapping: Map<string, string>;
}> {
  const stats = { processadas: 0, criadas: 0, atualizadas: 0 };
  const erros: string[] = [];
  const mapping = new Map<string, string>();

  try {
    // Buscar campanhas da Meta (1 chamada de API)
    const todasCampanhas = await client.getCampaigns();

    console.log(`[Sync Campanhas] Total de campanhas na conta: ${todasCampanhas.length}`);

    // ============================================
    // Filtrar por GASTO > 0 — 1 ÚNICA chamada de API
    // ============================================
    // Buscar campanhas com gasto nos últimos 90 dias (não só mês atual)
    // para capturar campanhas que gastaram no mês passado mas pararam
    const periodoSince = filtroDataInicio || getFirstDayOfLast90Days();
    const periodoUntil = new Date().toISOString().split('T')[0];

    let campanhasComGastoIds = new Set<string>();
    try {
      const insightsAgregados = await client.getInsights({
        level: 'campaign',
        timeRange: { since: periodoSince, until: periodoUntil },
        fields: ['campaign_id', 'spend'],
        dailyBreakdown: false // agregado, sem breakdown diário
      });

      // Somar gastos por campaign_id
      const gastosPorCampanha = new Map<string, number>();
      for (const insight of insightsAgregados) {
        const cid = insight.campaign_id;
        if (!cid) continue;
        const spend = parseFloat(insight.spend) || 0;
        gastosPorCampanha.set(cid, (gastosPorCampanha.get(cid) || 0) + spend);
      }

      for (const [cid, gasto] of gastosPorCampanha.entries()) {
        if (gasto > 0) {
          campanhasComGastoIds.add(cid);
        }
      }

      console.log(`[Sync Campanhas] Campanhas com gasto > 0 (via insights agregados): ${campanhasComGastoIds.size}`);
    } catch (err) {
      // Se falhar ao buscar insights agregados, incluir TODAS as campanhas como fallback
      console.error(`[Sync Campanhas] Erro ao buscar insights agregados, incluindo todas:`, err instanceof Error ? err.message : 'Erro');
      erros.push(`Aviso: não foi possível filtrar por gasto, incluindo todas as ${todasCampanhas.length} campanhas`);
      campanhasComGastoIds = new Set(todasCampanhas.map(c => c.id));
    }

    const metaCampaigns = todasCampanhas.filter(c => campanhasComGastoIds.has(c.id));
    stats.processadas = metaCampaigns.length;

    console.log(`[Sync Campanhas] Campanhas filtradas para sincronização: ${metaCampaigns.length}`);

    // Pré-carregar todas as campanhas existentes com meta_id para mapear rapidamente
    const { data: existingCampanhas } = await supabase
      .from('campanhas')
      .select('id, meta_id')
      .not('meta_id', 'is', null);
    const existingMap = new Map<string, string>();
    (existingCampanhas || []).forEach(c => {
      if (c.meta_id) existingMap.set(c.meta_id, c.id);
    });

    for (const mc of metaCampaigns) {
      try {
        const existingId = existingMap.get(mc.id);

        if (existingId) {
          // Atualizar existente (inclui empresa_id para corrigir campanhas antigas sem ele)
          const { error: updateError } = await supabase
            .from('campanhas')
            .update({
              nome: mc.name,
              ativo: mc.status === 'ACTIVE',
              empresa_id: empresaId,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingId);
          
          if (updateError) {
            console.error(`[Sync] Erro ao atualizar campanha "${mc.name}":`, updateError.message);
            erros.push(`Erro ao atualizar campanha ${mc.name}: ${updateError.message}`);
          } else {
            mapping.set(mc.id, existingId);
            stats.atualizadas++;
          }
        } else {
          // Criar nova campanha (funil_id pode ser null)
          // Mapear objective da Meta para valores aceitos pelo banco
          const tipoMap: Record<string, string> = {
            'OUTCOME_SALES': 'vendas',
            'OUTCOME_LEADS': 'leads',
            'OUTCOME_AWARENESS': 'awareness',
            'OUTCOME_ENGAGEMENT': 'leads',
            'OUTCOME_TRAFFIC': 'leads',
            'OUTCOME_APP_PROMOTION': 'vendas',
            'CONVERSIONS': 'vendas',
            'LEAD_GENERATION': 'leads',
            'LINK_CLICKS': 'leads',
            'REACH': 'awareness',
            'BRAND_AWARENESS': 'awareness',
            'POST_ENGAGEMENT': 'leads',
            'VIDEO_VIEWS': 'awareness',
            'MESSAGES': 'leads',
          };
          const tipoNormalizado = tipoMap[mc.objective] || 'leads';
          const { data: created, error } = await supabase
            .from('campanhas')
            .insert({
              nome: mc.name,
              meta_id: mc.id,
              funil_id: funilPadraoId || null,
              empresa_id: empresaId,
              plataforma: 'Meta Ads',
              tipo: tipoNormalizado,
              ativo: mc.status === 'ACTIVE'
            })
            .select()
            .single();

          if (error) {
            console.error(`[Sync] Erro ao criar campanha "${mc.name}":`, error.message, error.details, error.hint);
            erros.push(`Erro ao criar campanha ${mc.name}: ${error.message}`);
          } else {
            mapping.set(mc.id, created.id);
            stats.criadas++;
            if (!funilPadraoId) {
              erros.push(`Campanha "${mc.name}" criada sem funil - vincule manualmente na aba Campanhas`);
            }
          }
        }
      } catch (err) {
        erros.push(`Erro processando campanha ${mc.name}: ${err instanceof Error ? err.message : 'Erro'}`);
      }
    }

    console.log(`[Sync Campanhas] Resultado: ${stats.criadas} criadas, ${stats.atualizadas} atualizadas, ${erros.length} erros`);
    if (stats.processadas > 0 && stats.criadas === 0 && stats.atualizadas === 0) {
      console.error('[Sync Campanhas] ⚠️ NENHUMA campanha foi salva no banco! Possível problema de constraint (funil_id NOT NULL?) ou RLS.');
    }
  } catch (err) {
    erros.push(`Erro buscando campanhas da Meta: ${err instanceof Error ? err.message : 'Erro'}`);
  }

  return { stats, erros, mapping };
}

// ============================================
// Sync de Conjuntos de Anúncios
// ============================================

async function syncAdSets(
  client: MetaClient,
  campanhaMap: Map<string, string>
): Promise<{
  stats: { processados: number; criados: number; atualizados: number };
  erros: string[];
  mapping: Map<string, string>;
}> {
  const stats = { processados: 0, criados: 0, atualizados: 0 };
  const erros: string[] = [];
  const mapping = new Map<string, string>();

  try {
    const metaAdSets = await client.getAdSets();
    stats.processados = metaAdSets.length;

    // Pré-carregar conjuntos existentes
    const { data: existingConjuntos, error: preloadConjuntosError } = await supabase
      .from('conjuntos_anuncio')
      .select('id, meta_id')
      .not('meta_id', 'is', null);

    if (preloadConjuntosError) {
      // Coluna meta_id ainda não foi criada — migration pendente
      const msg = preloadConjuntosError.message || '';
      if (msg.toLowerCase().includes('meta_id') || preloadConjuntosError.code === '42703') {
        erros.push('⚠️ Coluna meta_id não existe em conjuntos_anuncio. Execute no Supabase SQL Editor: scripts/fix_metricas_tipo_constraint_FINAL.sql');
        return { stats, erros, mapping };
      }
    }

    const existingMap = new Map<string, string>();
    (existingConjuntos || []).forEach(c => {
      if (c.meta_id) existingMap.set(c.meta_id, c.id);
    });

    for (const mas of metaAdSets) {
      try {
        const existingId = existingMap.get(mas.id);

        if (existingId) {
          // Atualizar
          await supabase
            .from('conjuntos_anuncio')
            .update({
              nome: mas.name,
              publico: extractTargetingDescription(mas),
              ativo: mas.status === 'ACTIVE',
              updated_at: new Date().toISOString()
            })
            .eq('id', existingId);

          mapping.set(mas.id, existingId);
          stats.atualizados++;
        } else {
          // Verificar se a campanha pai existe localmente
          const campanhaLocalId = campanhaMap.get(mas.campaign_id);
          
          if (campanhaLocalId) {
            const { data: created, error } = await supabase
              .from('conjuntos_anuncio')
              .insert({
                nome: mas.name,
                meta_id: mas.id,
                campanha_id: campanhaLocalId,
                publico: extractTargetingDescription(mas),
                ativo: mas.status === 'ACTIVE'
              })
              .select()
              .single();

            if (error) {
              erros.push(`Erro ao criar conjunto ${mas.name}: ${error.message}`);
            } else {
              mapping.set(mas.id, created.id);
              stats.criados++;
            }
          } else {
            // Campanha pai não está sincronizada
            erros.push(`Conjunto "${mas.name}" ignorado - campanha pai não vinculada`);
          }
        }
      } catch (err) {
        erros.push(`Erro processando conjunto ${mas.name}: ${err instanceof Error ? err.message : 'Erro'}`);
      }
    }
  } catch (err) {
    erros.push(`Erro buscando conjuntos da Meta: ${err instanceof Error ? err.message : 'Erro'}`);
  }

  return { stats, erros, mapping };
}

// ============================================
// Sync de Anúncios
// ============================================

async function syncAds(
  client: MetaClient,
  conjuntoMap: Map<string, string>
): Promise<{
  stats: { processados: number; criados: number; atualizados: number };
  erros: string[];
  mapping: Map<string, string>;
}> {
  const stats = { processados: 0, criados: 0, atualizados: 0 };
  const erros: string[] = [];
  const mapping = new Map<string, string>();

  try {
    const metaAds = await client.getAds();
    stats.processados = metaAds.length;

    // Pré-carregar anúncios existentes
    const { data: existingAnuncios, error: preloadAnunciosError } = await supabase
      .from('anuncios')
      .select('id, meta_id')
      .not('meta_id', 'is', null);

    if (preloadAnunciosError) {
      const msg = preloadAnunciosError.message || '';
      if (msg.toLowerCase().includes('meta_id') || preloadAnunciosError.code === '42703') {
        erros.push('⚠️ Coluna meta_id não existe em anuncios. Execute no Supabase SQL Editor: scripts/fix_metricas_tipo_constraint_FINAL.sql');
        return { stats, erros, mapping };
      }
    }

    const existingMap = new Map<string, string>();
    (existingAnuncios || []).forEach(a => {
      if (a.meta_id) existingMap.set(a.meta_id, a.id);
    });

    // Detectar se coluna thumbnail_url existe (tenta uma vez, cacheia resultado)
    let thumbnailSupported = true;
    let imageUrlSupported = true;

    for (const ma of metaAds) {
      try {
        const existingId = existingMap.get(ma.id);

        if (existingId) {
          // Atualizar
          const updatePayload: Record<string, any> = {
            nome: ma.name,
            tipo: ma.creative?.name || 'Anúncio',
            updated_at: new Date().toISOString()
          };
          if (thumbnailSupported) {
            updatePayload.thumbnail_url = ma.creative?.thumbnail_url || null;
          }
          if (imageUrlSupported) {
            updatePayload.image_url = ma.creative?.image_url || null;
          }

          const { error: updateError } = await supabase
            .from('anuncios')
            .update(updatePayload)
            .eq('id', existingId);

          // Se falhou por coluna inexistente, retry sem thumbnail_url/image_url
          if (updateError && (updateError.message?.includes('thumbnail_url') || updateError.message?.includes('image_url'))) {
            thumbnailSupported = false;
            imageUrlSupported = false;
            await supabase
              .from('anuncios')
              .update({
                nome: ma.name,
                tipo: ma.creative?.name || 'Anúncio',
                updated_at: new Date().toISOString()
              })
              .eq('id', existingId);
          }

          mapping.set(ma.id, existingId);
          stats.atualizados++;
        } else {
          // Verificar se o conjunto pai existe
          const conjuntoLocalId = conjuntoMap.get(ma.adset_id);
          
          if (conjuntoLocalId) {
            const insertPayload: Record<string, any> = {
              nome: ma.name,
              meta_id: ma.id,
              conjunto_anuncio_id: conjuntoLocalId,
              tipo: ma.creative?.name || 'Anúncio'
            };
            if (thumbnailSupported) {
              insertPayload.thumbnail_url = ma.creative?.thumbnail_url || null;
            }
            if (imageUrlSupported) {
              insertPayload.image_url = ma.creative?.image_url || null;
            }

            let { data: created, error } = await supabase
              .from('anuncios')
              .insert(insertPayload)
              .select('id')
              .single();

            // Se falhou por coluna inexistente, retry sem thumbnail_url/image_url
            if (error && (error.message?.includes('thumbnail_url') || error.message?.includes('image_url'))) {
              thumbnailSupported = false;
              imageUrlSupported = false;
              const retryResult = await supabase
                .from('anuncios')
                .insert({
                  nome: ma.name,
                  meta_id: ma.id,
                  conjunto_anuncio_id: conjuntoLocalId,
                  tipo: ma.creative?.name || 'Anúncio'
                })
                .select('id')
                .single();
              created = retryResult.data;
              error = retryResult.error;
            }

            if (error) {
              erros.push(`Erro ao criar anúncio ${ma.name}: ${error.message}`);
            } else if (created) {
              mapping.set(ma.id, created.id);
              stats.criados++;
            }
          } else {
            erros.push(`Anúncio "${ma.name}" ignorado - conjunto pai não vinculado`);
          }
        }
      } catch (err) {
        erros.push(`Erro processando anúncio ${ma.name}: ${err instanceof Error ? err.message : 'Erro'}`);
      }
    }
  } catch (err) {
    erros.push(`Erro buscando anúncios da Meta: ${err instanceof Error ? err.message : 'Erro'}`);
  }

  return { stats, erros, mapping };
}

// ============================================
// Sync de Métricas (Insights)
// ============================================

async function syncInsights(
  client: MetaClient,
  campanhaMap: Map<string, string>,
  conjuntoMap: Map<string, string>,
  anuncioMap: Map<string, string>,
  timeRange: { since: string; until: string }
): Promise<{
  stats: { processadas: number; inseridas: number };
  erros: string[];
}> {
  const stats = { processadas: 0, inseridas: 0 };
  const erros: string[] = [];

  // ── Enriquecer maps com TODOS os registros existentes no banco ─────────────
  // Garante que mesmo que syncAdSets/syncAds só processaram poucos registros
  // neste run, o syncInsights consegue resolver TODOS os meta_ids do banco.
  try {
    const [{ data: dbCampanhas }, { data: dbConjuntos }, { data: dbAnuncios }] = await Promise.all([
      supabase.from('campanhas').select('id, meta_id').not('meta_id', 'is', null),
      supabase.from('conjuntos_anuncio').select('id, meta_id').not('meta_id', 'is', null),
      supabase.from('anuncios').select('id, meta_id').not('meta_id', 'is', null),
    ]);
    (dbCampanhas || []).forEach(r => { if (r.meta_id) campanhaMap.set(r.meta_id, r.id); });
    (dbConjuntos || []).forEach(r => { if (r.meta_id) conjuntoMap.set(r.meta_id, r.id); });
    (dbAnuncios || []).forEach(r => { if (r.meta_id) anuncioMap.set(r.meta_id, r.id); });
  } catch (err) {
    erros.push(`Aviso: não foi possível pré-carregar mapeamentos do banco: ${err instanceof Error ? err.message : 'Erro'}`);
  }
  // ──────────────────────────────────────────────────────────────────────────

  // Helper para upsert de um lote de insights
  async function upsertInsights(
    insights: MetaInsight[],
    tipo: 'campanha' | 'conjunto' | 'anuncio',
    idMap: Map<string, string>,
    idKey: 'campaign_id' | 'adset_id' | 'ad_id'
  ) {
    for (const insight of insights) {
      try {
        const metaId = insight[idKey];
        if (!metaId) continue;

        const localId = idMap.get(metaId);
        if (!localId) continue; // entidade ainda não sincronizada, ignorar

        const periodoInicio = insight.date_start;
        const periodoFim = insight.date_stop;

        if (!periodoInicio || !periodoFim) {
          erros.push(`Insight sem data (${tipo} ${metaId}) - pulado`);
          continue;
        }

        // Construir métrica (SOMENTE colunas base, sem as GENERATED ALWAYS)
        const metrica = convertInsightToMetrica(insight, localId, tipo);

        // Upsert pelo UNIQUE(tipo, referencia_id, periodo_inicio, periodo_fim)
        const { error } = await supabase
          .from('metricas')
          .upsert(metrica, {
            onConflict: 'tipo,referencia_id,periodo_inicio,periodo_fim',
            ignoreDuplicates: false
          });

        if (error) {
          erros.push(`Erro inserindo métrica ${tipo}: ${error.message}`);
        } else {
          stats.inseridas++;
        }
      } catch (err) {
        erros.push(`Erro processando insight ${tipo}: ${err instanceof Error ? err.message : 'Erro'}`);
      }
    }
  }

  // ── Nível Campanha ──────────────────────────────────────────────────────────
  try {
    const insightsCampanha = await client.getInsights({
      level: 'campaign',
      timeRange,
      dailyBreakdown: true
    });
    stats.processadas += insightsCampanha.length;
    await upsertInsights(insightsCampanha, 'campanha', campanhaMap, 'campaign_id');
  } catch (err) {
    erros.push(`Erro buscando insights de campanhas: ${err instanceof Error ? err.message : 'Erro'}`);
  }

  // ── Nível Conjunto de Anúncios ──────────────────────────────────────────────
  try {
    const insightsConjunto = await client.getInsights({
      level: 'adset',
      timeRange,
      dailyBreakdown: true
    });
    stats.processadas += insightsConjunto.length;
    await upsertInsights(insightsConjunto, 'conjunto', conjuntoMap, 'adset_id');
  } catch (err) {
    erros.push(`Erro buscando insights de conjuntos: ${err instanceof Error ? err.message : 'Erro'}`);
  }

  // ── Nível Anúncio ────────────────────────────────────────────────────────────
  try {
    const insightsAnuncio = await client.getInsights({
      level: 'ad',
      timeRange,
      dailyBreakdown: true
    });
    stats.processadas += insightsAnuncio.length;
    await upsertInsights(insightsAnuncio, 'anuncio', anuncioMap, 'ad_id');
  } catch (err) {
    erros.push(`Erro buscando insights de anúncios: ${err instanceof Error ? err.message : 'Erro'}`);
  }

  return { stats, erros };
}

// ============================================
// Helpers de Data e Filtro
// ============================================

function getFirstDayOfMonth(): string {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  return firstDay.toISOString().split('T')[0]; // YYYY-MM-DD
}

function getFirstDayOfLast90Days(): string {
  const now = new Date();
  now.setDate(now.getDate() - 90);
  return now.toISOString().split('T')[0]; // YYYY-MM-DD
}

// ============================================
// Helpers de Targeting
// ============================================

function extractTargetingDescription(adset: MetaAdSet): string {
  if (!adset.targeting) return 'Público geral';

  const parts: string[] = [];

  if (adset.targeting.age_min || adset.targeting.age_max) {
    parts.push(`${adset.targeting.age_min || 18}-${adset.targeting.age_max || 65}+ anos`);
  }

  if (adset.targeting.genders) {
    const genderMap: Record<number, string> = { 1: 'Homens', 2: 'Mulheres' };
    const genders = adset.targeting.genders.map(g => genderMap[g] || '').filter(Boolean);
    if (genders.length > 0) parts.push(genders.join(', '));
  }

  if (adset.targeting.geo_locations?.cities) {
    const cities = adset.targeting.geo_locations.cities.map(c => c.name).slice(0, 3);
    if (cities.length > 0) parts.push(cities.join(', '));
  } else if (adset.targeting.geo_locations?.countries) {
    parts.push(adset.targeting.geo_locations.countries.join(', '));
  }

  return parts.length > 0 ? parts.join(' | ') : 'Público geral';
}

function convertInsightToMetrica(
  insight: MetaInsight, 
  referenciaId: string,
  tipo: 'campanha' | 'conjunto' | 'anuncio' = 'campanha'
): Record<string, unknown> {
  const impressoes = parseInt(insight.impressions, 10) || 0;
  const alcance = parseInt(insight.reach, 10) || 0;
  const cliques = parseInt(insight.clicks, 10) || 0;
  const investimento = parseFloat(insight.spend) || 0;
  const leads = extractLeadsFromActions(insight.actions);
  const vendas = extractPurchasesFromActions(insight.actions);
  const visualizacoesPagina = extractPageViewsFromActions(insight.actions);
  const leads_whatsapp = extractWhatsAppLeadsFromActions(insight.actions);
  const leads_messenger = extractMessengerLeadsFromActions(insight.actions);
  const mensagens = leads_whatsapp + leads_messenger;

  // ATENÇÃO: NÃO incluir roas, ctr, cpm, cpc, cpl, taxa_conversao — são GENERATED ALWAYS no banco
  return {
    tipo,
    referencia_id: referenciaId,
    periodo_inicio: insight.date_start,
    periodo_fim: insight.date_stop,
    alcance,
    impressoes,
    cliques,
    visualizacoes_pagina: visualizacoesPagina,
    leads,
    checkouts: 0,
    vendas,
    investimento,
    faturamento: 0,
    mensagens,
    leads_whatsapp,
    leads_messenger
  };
}

// ============================================
// Buscar integração ativa de uma empresa
// ============================================

export async function getIntegracaoMeta(empresaId: string): Promise<IntegracaoMeta | null> {
  const { data, error } = await supabase
    .from('integracoes_meta')
    .select('*')
    .eq('empresa_id', empresaId)
    .eq('ativo', true)
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return data as IntegracaoMeta;
}

/**
 * Busca TODAS as integrações ativas de uma empresa
 */
export async function getIntegracoesMetaAll(empresaId: string): Promise<IntegracaoMeta[]> {
  const { data, error } = await supabase
    .from('integracoes_meta')
    .select('*')
    .eq('empresa_id', empresaId)
    .eq('ativo', true)
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data as IntegracaoMeta[];
}

// ============================================
// Buscar campanhas não vinculadas a funil
// ============================================

export async function getCampanhasNaoVinculadas(empresaId: string): Promise<Array<{
  id: string;
  nome: string;
  meta_id: string;
  funil_id: string | null;
}>> {
  // Primeiro buscamos as campanhas que têm meta_id mas funil_id nulo
  // Como campanhas estão vinculadas a funis, precisamos buscar diferente
  
  // Buscar todas as campanhas que têm meta_id
  const { data, error } = await supabase
    .from('campanhas')
    .select('id, nome, meta_id, funil_id')
    .not('meta_id', 'is', null);

  if (error || !data) return [];
  
  // Filtrar apenas as que pertencem à empresa (via funil) ou não têm funil
  // Por enquanto retorna todas com meta_id
  return data.filter(c => c.meta_id);
}

// ============================================
// Vincular campanha a funil
// ============================================

export async function vincularCampanhaAFunil(
  campanhaId: string, 
  funilId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('campanhas')
    .update({ funil_id: funilId })
    .eq('id', campanhaId);

  return !error;
}

// ============================================
// Salvar/atualizar credenciais Meta
// ============================================

export async function salvarCredenciaisMeta(
  empresaId: string,
  credentials: {
    accessToken: string;
    adAccountId: string;
    businessId?: string;
  }
): Promise<{ sucesso: boolean; erro?: string }> {
  try {
    const formattedAccountId = credentials.adAccountId.startsWith('act_') 
      ? credentials.adAccountId 
      : `act_${credentials.adAccountId}`;

    // Verificar se já existe uma integração com o MESMO ad_account_id
    const { data: existing } = await supabase
      .from('integracoes_meta')
      .select('id')
      .eq('empresa_id', empresaId)
      .eq('ad_account_id', formattedAccountId)
      .maybeSingle();

    const payload = {
      empresa_id: empresaId,
      access_token: credentials.accessToken,
      ad_account_id: formattedAccountId,
      business_id: credentials.businessId || null,
      ativo: true,
      updated_at: new Date().toISOString()
    };

    if (existing) {
      // Atualizar conta existente (mesmo ad_account_id)
      const { error } = await supabase
        .from('integracoes_meta')
        .update(payload)
        .eq('id', existing.id);

      if (error) return { sucesso: false, erro: error.message };
    } else {
      // Criar nova conta
      const { error } = await supabase
        .from('integracoes_meta')
        .insert(payload);

      if (error) return { sucesso: false, erro: error.message };
    }

    return { sucesso: true };
  } catch (err) {
    return { 
      sucesso: false, 
      erro: err instanceof Error ? err.message : 'Erro desconhecido' 
    };
  }
}
