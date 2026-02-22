/**
 * Kommo CRM Sync Library
 * 
 * Sincroniza leads de pipelines do Kommo CRM para o Supabase.
 * API: https://{subdomain}.kommo.com/api/v4/
 * Auth: Bearer {long-lived-token}
 * Rate limit: 7 req/s → usamos delay de 150ms entre requests
 * 
 * Padrão: pull de dados por período → snapshots diários por estágio → 
 *         popula detalhe_sdr e detalhe_closer na tabela metricas
 */

import { SupabaseClient } from '@supabase/supabase-js';
import type {
  IntegracaoKommo,
  KommoPipeline,
  KommoStage,
  DetalheSDR,
  DetalheCloser,
} from '@/types/hierarchical';

// ============================================
// Tipos internos
// ============================================

interface KommoLead {
  id: number;
  name: string;
  price: number;
  responsible_user_id: number;
  group_id: number;
  status_id: number;
  pipeline_id: number;
  loss_reason_id: number | null;
  created_by: number;
  updated_by: number;
  created_at: number;  // Unix timestamp
  updated_at: number;  // Unix timestamp
  closed_at: number | null;
  closest_task_at: number | null;
  is_deleted: boolean;
  custom_fields_values: any[] | null;
  score: number | null;
  account_id: number;
  labor_cost: number | null;
  _embedded?: {
    tags?: Array<{ id: number; name: string }>;
    contacts?: Array<{ id: number; is_main: boolean }>;
    companies?: Array<{ id: number }>;
    loss_reason?: Array<{ id: number; name: string }>;
  };
}

interface KommoApiResponse<T> {
  _page: number;
  _links: { self: { href: string }; next?: { href: string } };
  _embedded: T;
}

interface KommoPipelineApi {
  id: number;
  name: string;
  sort: number;
  is_main: boolean;
  is_unsorted_on: boolean;
  is_archive: boolean;
  account_id: number;
  _embedded: {
    statuses: Array<{
      id: number;
      name: string;
      sort: number;
      is_editable: boolean;
      pipeline_id: number;
      color: string;
      type: number; // 0=normal, 1=won, 2=lost
      account_id: number;
    }>;
  };
}

export interface KommoSyncOptions {
  dataInicio: string;  // YYYY-MM-DD
  dataFim: string;     // YYYY-MM-DD
}

export interface KommoSyncResult {
  pipeline_nome: string;
  total_leads: number;
  leads_por_estagio: Array<{
    stage_id: number;
    stage_nome: string;
    quantidade: number;
    valor: number;
    nomes: string[];
  }>;
  erros: string[];
  _leads?: KommoLead[]; // Leads brutos para uso interno (métricas departamentais)
  _passaramPor?: Map<number, Set<number>>; // Histórico: leadId → Set<stageIds que passou>
}

// ============================================
// Rate limiting helper
// ============================================
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

let lastRequestTime = 0;

async function rateLimitedFetch(url: string, options: RequestInit): Promise<Response> {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < 150) {
    await delay(150 - elapsed);
  }
  lastRequestTime = Date.now();

  const response = await fetch(url, options);

  // Handle 429 Too Many Requests
  if (response.status === 429) {
    console.warn('⚠️ Kommo rate limit atingido, aguardando 1s...');
    await delay(1000);
    lastRequestTime = Date.now();
    return fetch(url, options);
  }

  return response;
}

// ============================================
// API helpers
// ============================================

function getBaseUrl(subdominio: string): string {
  return `https://${subdominio}.kommo.com/api/v4`;
}

function getHeaders(token: string): Record<string, string> {
  return {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  };
}

// ============================================
// 1. Buscar pipelines e estágios
// ============================================

export async function buscarPipelines(
  integracao: IntegracaoKommo
): Promise<{ pipelines: Array<{ id: number; nome: string; stages: KommoStage[] }>; erros: string[] }> {
  const erros: string[] = [];
  const pipelines: Array<{ id: number; nome: string; stages: KommoStage[] }> = [];

  try {
    const url = `${getBaseUrl(integracao.subdominio)}/leads/pipelines`;
    const response = await rateLimitedFetch(url, {
      method: 'GET',
      headers: getHeaders(integracao.access_token),
    });

    if (!response.ok) {
      const text = await response.text();
      erros.push(`Erro ao buscar pipelines: HTTP ${response.status} - ${text}`);
      return { pipelines, erros };
    }

    const data = await response.json();
    const pipelinesApi: KommoPipelineApi[] = data._embedded?.pipelines || [];

    for (const p of pipelinesApi) {
      const stages: KommoStage[] = (p._embedded?.statuses || [])
        .sort((a, b) => a.sort - b.sort)
        .map((s) => ({
          id: s.id,
          name: s.name,
          sort: s.sort,
          color: s.color || '#999',
          type: s.type,
        }));

      pipelines.push({
        id: p.id,
        nome: p.name,
        stages,
      });
    }
  } catch (err: any) {
    erros.push(`Erro de conexão: ${err.message}`);
  }

  return { pipelines, erros };
}

// ============================================
// 2. Validar conexão (GET /api/v4/account)
// ============================================

export async function validarConexao(
  subdominio: string,
  token: string
): Promise<{ valido: boolean; nome_conta?: string; erro?: string }> {
  try {
    const url = `${getBaseUrl(subdominio)}/account`;
    const response = await rateLimitedFetch(url, {
      method: 'GET',
      headers: getHeaders(token),
    });

    if (!response.ok) {
      return { valido: false, erro: `HTTP ${response.status}: ${response.statusText}` };
    }

    const data = await response.json();
    return { valido: true, nome_conta: data.name };
  } catch (err: any) {
    return { valido: false, erro: err.message };
  }
}

// ============================================
// 3. Buscar leads paginados de uma pipeline
// ============================================

async function buscarLeadsPorPipeline(
  integracao: IntegracaoKommo,
  pipelineIdKommo: number,
  options: KommoSyncOptions
): Promise<{ leads: KommoLead[]; erros: string[] }> {
  const erros: string[] = [];
  const allLeads: KommoLead[] = [];
  const baseUrl = getBaseUrl(integracao.subdominio);
  const headers = getHeaders(integracao.access_token);

  // Converter datas para Unix timestamps
  const fromTimestamp = Math.floor(new Date(options.dataInicio + 'T00:00:00').getTime() / 1000);
  const toTimestamp = Math.floor(new Date(options.dataFim + 'T23:59:59').getTime() / 1000);

  let page = 1;
  let hasMore = true;

  while (hasMore) {
    try {
      const params = new URLSearchParams({
        'filter[pipeline_id][]': pipelineIdKommo.toString(),
        'limit': '250',
        'page': page.toString(),
        'order[created_at]': 'asc',
        'with': 'contacts',
      });

      // Filtro por data de criação — buscar leads criados no período
      params.append('filter[created_at][from]', fromTimestamp.toString());
      params.append('filter[created_at][to]', toTimestamp.toString());

      const url = `${baseUrl}/leads?${params.toString()}`;
      const response = await rateLimitedFetch(url, { method: 'GET', headers });

      if (response.status === 204) {
        // Sem resultados
        hasMore = false;
        break;
      }

      if (!response.ok) {
        const text = await response.text();
        erros.push(`Erro página ${page}: HTTP ${response.status} - ${text}`);
        hasMore = false;
        break;
      }

      const data: KommoApiResponse<{ leads: KommoLead[] }> = await response.json();
      const leads = data._embedded?.leads || [];

      allLeads.push(...leads);

      // Verificar se há próxima página
      if (leads.length < 250 || !data._links?.next) {
        hasMore = false;
      } else {
        page++;
      }
    } catch (err: any) {
      erros.push(`Erro ao buscar leads página ${page}: ${err.message}`);
      hasMore = false;
    }
  }

  return { leads: allLeads, erros };
}

// ============================================
// 4. Buscar TODOS os leads de uma pipeline (sem filtro de data)
//    Para snapshot de estado atual
// ============================================

async function buscarTodosLeadsPipeline(
  integracao: IntegracaoKommo,
  pipelineIdKommo: number
): Promise<{ leads: KommoLead[]; erros: string[] }> {
  const erros: string[] = [];
  const allLeads: KommoLead[] = [];
  const baseUrl = getBaseUrl(integracao.subdominio);
  const headers = getHeaders(integracao.access_token);

  let page = 1;
  let hasMore = true;

  while (hasMore) {
    try {
      const params = new URLSearchParams({
        'filter[pipeline_id][]': pipelineIdKommo.toString(),
        'limit': '250',
        'page': page.toString(),
        'with': 'contacts',
      });

      const url = `${baseUrl}/leads?${params.toString()}`;
      const response = await rateLimitedFetch(url, { method: 'GET', headers });

      if (response.status === 204) {
        hasMore = false;
        break;
      }

      if (!response.ok) {
        const text = await response.text();
        erros.push(`Erro página ${page}: HTTP ${response.status} - ${text}`);
        hasMore = false;
        break;
      }

      const data: KommoApiResponse<{ leads: KommoLead[] }> = await response.json();
      const leads = data._embedded?.leads || [];

      allLeads.push(...leads);

      if (leads.length < 250 || !data._links?.next) {
        hasMore = false;
      } else {
        page++;
      }
    } catch (err: any) {
      erros.push(`Erro ao buscar leads página ${page}: ${err.message}`);
      hasMore = false;
    }
  }

  return { leads: allLeads, erros };
}

// ============================================
// 4b. Buscar histórico de transições de estágio (eventos)
//     Endpoint: /api/v4/events?filter[type]=lead_status_changed
//     Retorna: para cada lead, quais estágios ele PASSOU (entrou)
// ============================================

async function buscarEventosEstagios(
  integracao: IntegracaoKommo,
  pipelineKommoId: number,
  leadIds: Set<number>
): Promise<{ passaramPor: Map<number, Set<number>>; erros: string[] }> {
  const erros: string[] = [];
  // Map<leadId, Set<stageId>> — todos os estágios que o lead entrou
  const passaramPor = new Map<number, Set<number>>();
  const baseUrl = getBaseUrl(integracao.subdominio);
  const headers = getHeaders(integracao.access_token);

  let page = 1;
  let hasMore = true;
  let totalEventos = 0;
  const MAX_PAGES = 100; // Segurança: máximo ~10.000 eventos

  while (hasMore && page <= MAX_PAGES) {
    try {
      const params = new URLSearchParams({
        'filter[type]': 'lead_status_changed',
        'limit': '100',
        'page': page.toString(),
      });

      const url = `${baseUrl}/events?${params.toString()}`;
      const response = await rateLimitedFetch(url, { method: 'GET', headers });

      if (response.status === 204) {
        hasMore = false;
        break;
      }

      if (!response.ok) {
        const text = await response.text();
        erros.push(`Erro ao buscar eventos página ${page}: HTTP ${response.status} - ${text}`);
        hasMore = false;
        break;
      }

      const data = await response.json();
      const events = data?._embedded?.events || [];
      totalEventos += events.length;

      for (const event of events) {
        const leadId = event.entity_id;
        // Só processar leads que pertencem à nossa pipeline
        if (!leadIds.has(leadId)) continue;

        // value_after contém o estágio para onde o lead foi
        const valueAfter = event.value_after;
        if (Array.isArray(valueAfter)) {
          for (const va of valueAfter) {
            const leadStatus = va?.lead_status;
            if (leadStatus && leadStatus.pipeline_id === pipelineKommoId) {
              if (!passaramPor.has(leadId)) passaramPor.set(leadId, new Set());
              passaramPor.get(leadId)!.add(leadStatus.id);
            }
          }
        }

        // value_before contém o estágio de onde o lead saiu (também passou por lá)
        const valueBefore = event.value_before;
        if (Array.isArray(valueBefore)) {
          for (const vb of valueBefore) {
            const leadStatus = vb?.lead_status;
            if (leadStatus && leadStatus.pipeline_id === pipelineKommoId) {
              if (!passaramPor.has(leadId)) passaramPor.set(leadId, new Set());
              passaramPor.get(leadId)!.add(leadStatus.id);
            }
          }
        }
      }

      // Próxima página
      if (events.length < 100 || !data._links?.next) {
        hasMore = false;
      } else {
        page++;
      }
    } catch (err: any) {
      erros.push(`Erro ao buscar eventos página ${page}: ${err.message}`);
      hasMore = false;
    }
  }

  console.log(`📊 Eventos processados: ${totalEventos}, leads com histórico: ${passaramPor.size}`);
  return { passaramPor, erros };
}

// ============================================
// 5. Sincronizar pipelines (metadados)
// ============================================

export async function sincronizarPipelines(
  supabase: SupabaseClient,
  integracao: IntegracaoKommo
): Promise<{ pipelines: Array<{ pipeline_id_kommo: number; nome: string; stages_count: number }>; erros: string[] }> {
  const erros: string[] = [];
  const result: Array<{ pipeline_id_kommo: number; nome: string; stages_count: number }> = [];

  const { pipelines, erros: errosBusca } = await buscarPipelines(integracao);
  erros.push(...errosBusca);

  for (const pipeline of pipelines) {
    const { error } = await supabase
      .from('kommo_pipelines')
      .upsert(
        {
          integracao_id: integracao.id,
          pipeline_id_kommo: pipeline.id,
          nome: pipeline.nome,
          stages: pipeline.stages,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'integracao_id,pipeline_id_kommo' }
      );

    if (error) {
      erros.push(`Erro ao salvar pipeline ${pipeline.nome}: ${error.message}`);
    } else {
      result.push({
        pipeline_id_kommo: pipeline.id,
        nome: pipeline.nome,
        stages_count: pipeline.stages.length,
      });
    }
  }

  return { pipelines: result, erros };
}

// ============================================
// 6. Sincronizar leads de uma pipeline (snapshot por data de criação)
//
//    Modelo COORTE: cada lead é agrupado pela data de criação.
//    Quando o dashboard filtra "Janeiro", mostra: dos leads criados
//    em Janeiro, quantos estão em cada estágio AGORA.
//    Cada sync atualiza todos os meses — dados sempre frescos.
// ============================================

export async function sincronizarLeadsPipeline(
  supabase: SupabaseClient,
  integracao: IntegracaoKommo,
  pipelineRef: KommoPipeline,
  options?: KommoSyncOptions
): Promise<KommoSyncResult> {
  const erros: string[] = [];

  // Sempre buscar TODOS os leads da pipeline (snapshot completo)
  // Usamos buscarTodosLeadsPipeline para ter o estado mais recente de cada lead
  const { leads, erros: errosLeads } = await buscarTodosLeadsPipeline(
    integracao,
    pipelineRef.pipeline_id_kommo
  );

  erros.push(...errosLeads);

  // Mapear stage_id → nome usando os stages salvos na pipeline
  const stageMap = new Map<number, string>();
  for (const stage of pipelineRef.stages) {
    stageMap.set(stage.id, stage.name);
  }

  // ========================================
  // AGRUPAR por (data_criação, status_id)
  // ========================================
  // Chave: "YYYY-MM-DD|status_id"
  const porDataEstagio = new Map<string, { nomes: string[]; quantidade: number; valor: number }>();
  // Também manter totais globais por estágio para o retorno
  const totaisGlobais = new Map<number, { nomes: string[]; quantidade: number; valor: number }>();

  for (const lead of leads) {
    // Data de criação do lead (Unix → YYYY-MM-DD)
    const dataCriacao = lead.created_at
      ? new Date(lead.created_at * 1000).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]; // fallback se não tiver created_at

    const key = `${dataCriacao}|${lead.status_id}`;
    let entry = porDataEstagio.get(key);
    if (!entry) {
      entry = { nomes: [], quantidade: 0, valor: 0 };
      porDataEstagio.set(key, entry);
    }
    entry.quantidade++;
    entry.valor += lead.price || 0;
    if (lead.name && lead.name.trim()) {
      entry.nomes.push(lead.name.trim());
    }

    // Totais globais para retorno
    let globalEntry = totaisGlobais.get(lead.status_id);
    if (!globalEntry) {
      globalEntry = { nomes: [], quantidade: 0, valor: 0 };
      totaisGlobais.set(lead.status_id, globalEntry);
    }
    globalEntry.quantidade++;
    globalEntry.valor += lead.price || 0;
    if (lead.name && lead.name.trim()) {
      globalEntry.nomes.push(lead.name.trim());
    }
  }

  // ========================================
  // LIMPAR snapshots antigos desta pipeline e REINSERIR
  // (garante que estágios zerados desapareçam)
  // ========================================
  const { error: errDelete } = await supabase
    .from('kommo_snapshots')
    .delete()
    .eq('pipeline_ref_id', pipelineRef.id);

  if (errDelete) {
    erros.push(`Erro ao limpar snapshots antigos: ${errDelete.message}`);
  }

  // Inserir novos snapshots em batch
  const snapshotsToInsert: Array<Record<string, any>> = [];
  for (const [key, dados] of porDataEstagio) {
    const [dataCriacao, stageIdStr] = key.split('|');
    const stageId = parseInt(stageIdStr, 10);
    const stageName = stageMap.get(stageId) || `Estágio ${stageId}`;

    snapshotsToInsert.push({
      pipeline_ref_id: pipelineRef.id,
      data_referencia: dataCriacao, // Data de CRIAÇÃO do lead, não data do sync
      stage_id_kommo: stageId,
      stage_nome: stageName,
      quantidade_leads: dados.quantidade,
      valor_total: dados.valor, // Kommo armazena em reais
      nomes_leads: dados.nomes.join('\n'),
      updated_at: new Date().toISOString(),
    });
  }

  // Inserir em lotes de 200
  const BATCH_SIZE = 200;
  for (let i = 0; i < snapshotsToInsert.length; i += BATCH_SIZE) {
    const batch = snapshotsToInsert.slice(i, i + BATCH_SIZE);
    const { error: errInsert } = await supabase
      .from('kommo_snapshots')
      .insert(batch);

    if (errInsert) {
      erros.push(`Erro ao inserir batch de snapshots (${i}-${i + batch.length}): ${errInsert.message}`);
    }
  }

  // ========================================
  // BUSCAR HISTÓRICO DE TRANSIÇÕES (eventos do Kommo)
  // Para saber quais estágios cada lead PASSOU, não só onde está agora
  // ========================================
  const leadIdsSet = new Set(leads.map(l => l.id));
  const { passaramPor, erros: errosEventos } = await buscarEventosEstagios(
    integracao,
    pipelineRef.pipeline_id_kommo,
    leadIdsSet
  );
  erros.push(...errosEventos);

  // Adicionar estágio ATUAL de cada lead ao histórico
  // (se um lead está em VENDA REALIZADA, ele "passou" por lá)
  for (const lead of leads) {
    if (!passaramPor.has(lead.id)) passaramPor.set(lead.id, new Set());
    passaramPor.get(lead.id)!.add(lead.status_id);
  }

  // Resultado para retorno (totais globais)
  const leadsPorEstagio: KommoSyncResult['leads_por_estagio'] = [];
  for (const [stageId, dados] of totaisGlobais) {
    const stageName = stageMap.get(stageId) || `Estágio ${stageId}`;
    leadsPorEstagio.push({
      stage_id: stageId,
      stage_nome: stageName,
      quantidade: dados.quantidade,
      valor: dados.valor,
      nomes: dados.nomes,
    });
  }

  return {
    pipeline_nome: pipelineRef.nome,
    total_leads: leads.length,
    leads_por_estagio: leadsPorEstagio,
    erros,
    _leads: leads,
    _passaramPor: passaramPor,
  };
}

// ============================================
// 7. Atualizar métricas departamentais (detalhe_sdr + detalhe_closer)
//    Gravar UMA linha por dia de CRIAÇÃO dos leads (não por dia de sync).
//    Isso permite que o dashboard filtre por período corretamente.
// ============================================

export async function atualizarMetricasDepartamento(
  supabase: SupabaseClient,
  pipelineRef: KommoPipeline,
  leads: KommoLead[],
  passaramPor: Map<number, Set<number>>,
  syncResult: KommoSyncResult
): Promise<{ erros: string[] }> {
  const erros: string[] = [];
  const mapeamento = pipelineRef.mapeamento_departamentos || {};
  const funilId = pipelineRef.funil_id;

  if (!funilId) {
    erros.push('Pipeline não vinculada a um funil — métricas departamentais não atualizadas');
    return { erros };
  }

  const sdrStages = new Set<number>(mapeamento.sdr || []);
  const closerStages = new Set<number>(mapeamento.closer || []);

  if (sdrStages.size === 0 && closerStages.size === 0) {
    return { erros };
  }

  // Mapear stage_id → nome
  const stageMap = new Map<number, string>();
  for (const stage of pipelineRef.stages) {
    stageMap.set(stage.id, stage.name);
  }

  // ========================================
  // Agrupar leads por data de criação
  // Para cada dia, calcular campos SDR e Closer
  // ========================================
  interface DayData {
    sdr: {
      qualificados: number; nomes_qualificados: string[];
      para_downsell: number;
      agendados_diagnostico: number;
      agendados_mentoria: number;
    };
    closer: {
      vendas_mentoria: number; nomes_vendas: string[];
      vendas_downsell: number;
      em_negociacao: number;
      em_followup: number;
      vendas_perdidas: number;
      lead_desqualificado: number;
      nao_compareceram: number;
      valor_vendas: number; // Soma do price dos leads com venda (em centavos do Kommo)
    };
    total_leads: number;
  }

  const porDia = new Map<string, DayData>();

  for (const lead of leads) {
    const dataCriacao = lead.created_at
      ? new Date(lead.created_at * 1000).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];

    let dayData = porDia.get(dataCriacao);
    if (!dayData) {
      dayData = {
        sdr: { qualificados: 0, nomes_qualificados: [], para_downsell: 0, agendados_diagnostico: 0, agendados_mentoria: 0 },
        closer: { vendas_mentoria: 0, nomes_vendas: [], vendas_downsell: 0, em_negociacao: 0, em_followup: 0, vendas_perdidas: 0, lead_desqualificado: 0, nao_compareceram: 0, valor_vendas: 0 },
        total_leads: 0,
      };
      porDia.set(dataCriacao, dayData);
    }
    dayData.total_leads++;

    const nome = (stageMap.get(lead.status_id) || '').toUpperCase();
    const leadName = (lead.name || '').trim();

    // ===== Obter todos os estágios que este lead PASSOU (histórico completo) =====
    const stagesPassed = passaramPor.get(lead.id) || new Set([lead.status_id]);

    // Helper: verificar se o lead passou por algum estágio cujo nome contém X
    const passouPorEstagioComNome = (...keywords: string[]) => {
      for (const stageId of stagesPassed) {
        const stageName = (stageMap.get(stageId) || '').toUpperCase();
        for (const kw of keywords) {
          if (stageName.includes(kw)) return true;
        }
      }
      return false;
    };

    // ===== MÉTRICAS SDR: calculadas sobre TODOS os leads do pipeline =====
    // Lógica por estágio ATUAL (posição presente):
    //   - "LEAD DESQUALIFICADO" agora = "Leads para Downsell"
    //   - Todo o resto = "Qualificados para Mentoria" (com nomes)
    //   - Total de leads = "Chegaram ao CRM Kommo"
    // Lógica HISTÓRICA (passou pelo estágio):
    //   - Lead que PASSOU por "AGENDADO" = "Agendados para Mentoria" (mesmo que já saiu)

    const isDesqualificado = nome.includes('DESQUALIFICAD');

    if (isDesqualificado) {
      dayData.sdr.para_downsell++;
    } else {
      dayData.sdr.qualificados++;
      if (leadName) dayData.sdr.nomes_qualificados.push(leadName);
    }

    // Agendados — usando histórico: lead que PASSOU por qualquer estágio AGENDADO
    if (passouPorEstagioComNome('AGENDADO', 'AGENDAMENT')) {
      // Verificar que não é "NÃO AGENDADO"
      let isNaoAgendado = false;
      for (const stageId of stagesPassed) {
        const sn = (stageMap.get(stageId) || '').toUpperCase();
        if ((sn.includes('AGENDADO') || sn.includes('AGENDAMENT'))
            && (sn.includes('NAO AGENDADO') || sn.includes('NÃO AGENDADO'))) {
          isNaoAgendado = true;
        }
      }
      if (!isNaoAgendado) {
        dayData.sdr.agendados_mentoria++;
      }
    }

    // ===== MÉTRICAS CLOSER: usando histórico para estágios-chave =====
    // Vendas e estágios terminais: usar estágio ATUAL (posição presente)
    // Follow-up, Não compareceu: usar HISTÓRICO (passou pelo estágio)

    if (closerStages.has(lead.status_id)) {
      // Estágios terminais — contar pela posição ATUAL
      if (nome.includes('VENDA REALIZADA') || nome.includes('VENDIDO') || nome.includes('WON')) {
        dayData.closer.vendas_mentoria++;
        dayData.closer.valor_vendas += lead.price || 0;
        if (leadName) dayData.closer.nomes_vendas.push(leadName);
      }
      if (nome.includes('DOWNSELL') && nome.includes('VEND')) {
        dayData.closer.vendas_downsell++;
        dayData.closer.valor_vendas += lead.price || 0;
      }
      if (nome.includes('PERDIDA') || nome.includes('LOST')) {
        dayData.closer.vendas_perdidas++;
      }
      if (isDesqualificado) {
        dayData.closer.lead_desqualificado++;
      }
    }

    // Histórico para closer: leads que PASSARAM por esses estágios (mesmo que já saíram)
    if (passouPorEstagioComNome('NEGOCIA')) {
      dayData.closer.em_negociacao++;
    }
    if (passouPorEstagioComNome('FOLLOW')) {
      dayData.closer.em_followup++;
    }
    if (passouPorEstagioComNome('NAO COMPARECEU', 'NÃO COMPARECEU', 'STANBY', 'STAND BY', 'STANDY')) {
      dayData.closer.nao_compareceram++;
    }
  }

  // ========================================
  // Para cada dia, upsert na tabela metricas
  // (preservar campos do Typebot ao fazer merge)
  // ========================================
  for (const [dia, dayData] of porDia) {
    // Buscar métrica existente do dia para preservar campos do Typebot
    const { data: metricaExistente } = await supabase
      .from('metricas')
      .select('id, detalhe_sdr, detalhe_closer')
      .eq('referencia_id', funilId)
      .eq('tipo', 'funil')
      .eq('periodo_inicio', dia)
      .eq('periodo_fim', dia)
      .single();

    const sdrExistente = metricaExistente?.detalhe_sdr || {};
    const closerExistente = metricaExistente?.detalhe_closer || {};

    // Calcular faturamento do dia (valor das vendas do Kommo)
    const faturamentoDia = dayData.closer.valor_vendas; // Kommo armazena em reais

    const metricaPayload: Record<string, any> = {
      tipo: 'funil',
      referencia_id: funilId,
      periodo_inicio: dia,
      periodo_fim: dia,
      leads: dayData.total_leads,
      vendas: dayData.closer.vendas_mentoria + dayData.closer.vendas_downsell,
      faturamento: faturamentoDia,
      updated_at: new Date().toISOString(),
    };

    if (sdrStages.size > 0) {
      metricaPayload.detalhe_sdr = {
        // Campo do Typebot (PRESERVA — não vem do Kommo)
        comecou_diagnostico: sdrExistente.comecou_diagnostico || 0,
        // Campo do Kommo (total de leads no pipeline = "chegaram ao CRM")
        chegaram_crm_kommo: dayData.total_leads,
        // Campos calculados do CRM Kommo (SOBRESCREVE a cada sync)
        qualificados_para_mentoria: dayData.sdr.qualificados,
        para_downsell: dayData.sdr.para_downsell,
        agendados_diagnostico: dayData.sdr.agendados_diagnostico,
        agendados_mentoria: dayData.sdr.agendados_mentoria,
        nomes_qualificados: dayData.sdr.nomes_qualificados.join('\n'),
      };
    }

    if (closerStages.size > 0) {
      // Calls realizadas = agendados (SDR) - não compareceram
      const callsRealizadas = Math.max(dayData.sdr.agendados_mentoria - dayData.closer.nao_compareceram, 0);
      metricaPayload.detalhe_closer = {
        calls_realizadas: callsRealizadas,
        nao_compareceram: dayData.closer.nao_compareceram,
        vendas_mentoria: dayData.closer.vendas_mentoria,
        vendas_downsell: dayData.closer.vendas_downsell,
        em_negociacao: dayData.closer.em_negociacao,
        em_followup: dayData.closer.em_followup,
        vendas_perdidas: dayData.closer.vendas_perdidas,
        lead_desqualificado: dayData.closer.lead_desqualificado,
        nomes_vendas: dayData.closer.nomes_vendas.join('\n'),
        valor_vendas: dayData.closer.valor_vendas, // Kommo armazena em reais
      };
    }

    const { error: errUpsert } = await supabase
      .from('metricas')
      .upsert(metricaPayload, {
        onConflict: 'tipo,referencia_id,periodo_inicio,periodo_fim',
        ignoreDuplicates: false,
      });

    if (errUpsert) {
      erros.push(`Erro ao atualizar métricas do dia ${dia}: ${errUpsert.message}`);
    }
  }

  return { erros };
}

// ============================================
// 8. Função principal de sync
// ============================================

export async function syncKommoToSupabase(
  supabase: SupabaseClient,
  integracao: IntegracaoKommo,
  pipelineRef: KommoPipeline,
  options?: KommoSyncOptions
): Promise<KommoSyncResult & { erros_departamento: string[] }> {
  // 1. Sincronizar leads da pipeline (retorna leads brutos também)
  const syncResultFull = await sincronizarLeadsPipeline(
    supabase,
    integracao,
    pipelineRef,
    options
  );

  const { _leads, _passaramPor, ...syncResult } = syncResultFull;

  // 2. Atualizar métricas departamentais (passando leads brutos + histórico de estágios)
  const { erros: errosDept } = await atualizarMetricasDepartamento(
    supabase,
    pipelineRef,
    _leads || [],
    _passaramPor || new Map(),
    syncResult
  );

  // 3. Atualizar status da integração
  await supabase
    .from('integracoes_kommo')
    .update({
      ultima_sincronizacao: new Date().toISOString(),
      erro_sincronizacao: syncResult.erros.length > 0 ? syncResult.erros.join('; ') : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', integracao.id);

  return {
    ...syncResult,
    erros_departamento: errosDept,
  };
}
