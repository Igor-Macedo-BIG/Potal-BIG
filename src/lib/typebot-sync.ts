/**
 * Typebot Sync Library
 * 
 * Busca resultados da API do Typebot.io e salva métricas SDR no Supabase.
 * Mesma abordagem da Meta: pull de dados por período → grava em `metricas`.
 * 
 * API: GET https://app.typebot.io/api/v1/typebots/{typebotId}/results
 * Campos retornados: id, createdAt, hasStarted, isCompleted, variables, answers
 */

import { SupabaseClient } from '@supabase/supabase-js';

// ============================================
// Tipos
// ============================================

export interface IntegracaoTypebot {
  id: string;
  empresa_id: string;
  nome: string;
  typebot_id: string;
  api_token: string;
  ativo: boolean;
  variavel_nome: string;
  variavel_email: string;
  base_url: string | null;
  funil_id: string | null; // Funil ao qual o Typebot esta vinculado
}

export interface TypebotSyncOptions {
  dataInicio: string;  // YYYY-MM-DD
  dataFim: string;     // YYYY-MM-DD
}

export interface TypebotResult {
  id: string;
  createdAt: string;
  typebotId: string;
  hasStarted: boolean;
  isCompleted: boolean;
  isArchived: boolean;
  variables: Array<{
    id: string;
    name: string;
    value: string | string[] | null;
    isSessionVariable?: boolean;
  }>;
  answers: Array<{
    blockId: string;
    content: string;
    attachedFileUrls?: string[];
  }>;
}

export interface TypebotSyncResult {
  iniciados: number;
  concluidos: number;
  total_resultados: number;
  nomes_concluidos: string[];
  periodo_inicio: string;
  periodo_fim: string;
  erros: string[];
}

const TYPEBOT_API_BASE_DEFAULT = 'https://app.typebot.io';

function getApiBase(baseUrl: string | null | undefined): string {
  if (baseUrl && baseUrl.trim()) {
    // Extrair apenas o dominio (protocolo + host), removendo qualquer path
    let url = baseUrl.trim().replace(/\/$/, '');
    try {
      const parsed = new URL(url);
      return `${parsed.protocol}//${parsed.host}/api/v1`;
    } catch {
      // Fallback: limpar paths conhecidos manualmente
      url = url.replace(/\/api\/v1\/?.*$/, '');
      url = url.replace(/\/typebots?\/?.*$/, '');
      url = url.replace(/\/$/, '');
      return `${url}/api/v1`;
    }
  }
  return `${TYPEBOT_API_BASE_DEFAULT}/api/v1`;
}

// ============================================
// Funções de busca da API do Typebot
// ============================================

/**
 * Busca todos os resultados de um typebot paginando pela API
 * e filtrando pelo período desejado.
 */
async function buscarResultadosPorPeriodo(
  apiToken: string,
  typebotId: string,
  dataInicio: Date,
  dataFim: Date,
  baseUrl?: string | null
): Promise<{ results: TypebotResult[]; erros: string[] }> {
  const results: TypebotResult[] = [];
  const erros: string[] = [];
  let cursor: number | undefined = undefined;
  let pagina = 0;
  const MAX_PAGINAS = 50; // Seguranca: maximo 50 paginas x 500 = 25.000 resultados

  // Limpar token (remover espacos, quebras de linha)
  const token = apiToken.trim();

  while (pagina < MAX_PAGINAS) {
    pagina++;

    // Montar URL com paginacao
    const params = new URLSearchParams({
      limit: '100',
      timeFilter: 'allTime',
    });
    if (cursor !== undefined) {
      params.set('cursor', String(cursor));
    }

    const apiBase = getApiBase(baseUrl);
    const url = `${apiBase}/typebots/${typebotId}/results?${params}`;

    // Debug: verificar token e URL
    console.log(`[Typebot Sync] Pagina ${pagina} | URL: ${url}`);
    console.log(`[Typebot Sync] Token (primeiros 8 chars): ${token?.slice(0, 8)}... | Tamanho: ${token?.length || 0}`);

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });
    } catch (fetchError: any) {
      erros.push(`Erro de rede ao buscar resultados (página ${pagina}): ${fetchError.message}`);
      break;
    }

    if (!response.ok) {
      let bodyText = '';
      try { bodyText = await response.text(); } catch {}
      console.error(`[Typebot API] HTTP ${response.status} | URL: ${url} | Body: ${bodyText}`);
      if (response.status === 401 || response.status === 403) {
        erros.push(`Token de API invalido ou sem permissao (HTTP ${response.status}). Resposta: ${bodyText.slice(0, 200)}`);
      } else if (response.status === 404) {
        erros.push(`Typebot ID "${typebotId}" nao encontrado (404). Verifique se o ID esta correto. URL: ${url}`);
      } else {
        erros.push(`Erro na API do Typebot: HTTP ${response.status}. Resposta: ${bodyText.slice(0, 200)}`);
      }
      break;
    }

    const data = await response.json();
    const pageResults: TypebotResult[] = data.results || [];

    if (pageResults.length === 0) break;

    // Ordenados por createdAt DESC — parar quando passamos da data de início
    let pararPaginacao = false;

    for (const result of pageResults) {
      const criado = new Date(result.createdAt);

      // Resultado mais novo que o fim → pular
      if (criado > dataFim) continue;

      // Resultado mais antigo que o início → parar
      if (criado < dataInicio) {
        pararPaginacao = true;
        break;
      }

      // Dentro do período
      results.push(result);
    }

    if (pararPaginacao || data.nextCursor == null) break;
    cursor = data.nextCursor;
  }

  return { results, erros };
}

// ============================================
// Função Principal de Sync
// ============================================

export async function syncTypebotToSupabase(
  supabase: SupabaseClient,
  integracao: IntegracaoTypebot,
  options: TypebotSyncOptions
): Promise<TypebotSyncResult> {
  const erros: string[] = [];

  // Ajustar datas para início e fim do dia
  const dataInicio = new Date(`${options.dataInicio}T00:00:00.000Z`);
  const dataFim = new Date(`${options.dataFim}T23:59:59.999Z`);

  // 1. Buscar resultados da API do Typebot
  const { results, erros: errosBusca } = await buscarResultadosPorPeriodo(
    integracao.api_token,
    integracao.typebot_id,
    dataInicio,
    dataFim,
    integracao.base_url
  );

  erros.push(...errosBusca);

  if (erros.length > 0 && results.length === 0) {
    // Falha total — não gravar nada
    return {
      iniciados: 0,
      concluidos: 0,
      total_resultados: 0,
      nomes_concluidos: [],
      periodo_inicio: options.dataInicio,
      periodo_fim: options.dataFim,
      erros,
    };
  }

  // 2. Calcular métricas
  const iniciados = results.filter((r) => r.hasStarted).length;
  const concluidos = results.filter((r) => r.isCompleted).length;

  // 3. Extrair nomes dos leads que concluíram
  const nomesConcluidos: string[] = [];
  const variavelNome = integracao.variavel_nome || 'Nome';

  results
    .filter((r) => r.isCompleted)
    .forEach((r) => {
      const varNome = r.variables?.find(
        (v) => v.name?.toLowerCase() === variavelNome.toLowerCase()
      );
      const nomeValor = Array.isArray(varNome?.value)
        ? varNome.value[0]
        : varNome?.value;

      if (nomeValor && typeof nomeValor === 'string' && nomeValor.trim()) {
        nomesConcluidos.push(nomeValor.trim());
      }
    });

  // 4. Gravar metricas DIARIAS no funil vinculado (1 linha por dia, igual a Meta)
  if (!integracao.funil_id) {
    erros.push('Nenhum funil vinculado a esta integracao. Vincule um funil nas configuracoes.');
    return {
      iniciados,
      concluidos,
      total_resultados: results.length,
      nomes_concluidos: nomesConcluidos,
      periodo_inicio: options.dataInicio,
      periodo_fim: options.dataFim,
      erros,
    };
  }

  // Agrupar resultados por dia (YYYY-MM-DD baseado em createdAt)
  const porDia = new Map<string, { iniciados: number; concluidos: number; nomes: string[] }>();

  // Inicializar todos os dias do periodo com zero
  const cursor = new Date(dataInicio);
  while (cursor <= dataFim) {
    const diaStr = cursor.toISOString().split('T')[0];
    porDia.set(diaStr, { iniciados: 0, concluidos: 0, nomes: [] });
    cursor.setDate(cursor.getDate() + 1);
  }

  // Distribuir resultados nos dias corretos
  for (const result of results) {
    const dia = new Date(result.createdAt).toISOString().split('T')[0];
    let entry = porDia.get(dia);
    if (!entry) {
      entry = { iniciados: 0, concluidos: 0, nomes: [] };
      porDia.set(dia, entry);
    }
    if (result.hasStarted) entry.iniciados++;
    if (result.isCompleted) {
      entry.concluidos++;
      // Extrair nome
      const varNome = result.variables?.find(
        (v) => v.name?.toLowerCase() === variavelNome.toLowerCase()
      );
      const nomeValor = Array.isArray(varNome?.value) ? varNome.value[0] : varNome?.value;
      if (nomeValor && typeof nomeValor === 'string' && nomeValor.trim()) {
        entry.nomes.push(nomeValor.trim());
      }
    }
  }

  // Upsert uma metrica por dia (periodo_inicio = periodo_fim = dia)
  for (const [dia, dados] of porDia) {
    // Buscar metrica existente para preservar campos do CRM Kommo
    const { data: metricaExistente } = await supabase
      .from('metricas')
      .select('id, detalhe_sdr')
      .eq('referencia_id', integracao.funil_id)
      .eq('tipo', 'funil')
      .eq('periodo_inicio', dia)
      .eq('periodo_fim', dia)
      .single();

    const detalheSdrExistente = metricaExistente?.detalhe_sdr || {};

    const detalhe: Record<string, any> = {
      // Campos do Typebot (SOBRESCREVE a cada sync)
      comecou_diagnostico: dados.iniciados,
      // "Chegaram ao CRM Kommo" — Kommo é a fonte primária; Typebot usa concluidos como fallback
      chegaram_crm_kommo: detalheSdrExistente.chegaram_crm_kommo || dados.concluidos,
      // Campos do CRM Kommo (PRESERVA — nao vem do Typebot)
      qualificados_para_mentoria: detalheSdrExistente.qualificados_para_mentoria || 0,
      para_downsell: detalheSdrExistente.para_downsell || 0,
      agendados_diagnostico: detalheSdrExistente.agendados_diagnostico || 0,
      agendados_mentoria: detalheSdrExistente.agendados_mentoria || 0,
      nomes_qualificados: detalheSdrExistente.nomes_qualificados || '',
    };

    const metricaPayload: Record<string, any> = {
      tipo: 'funil',
      referencia_id: integracao.funil_id,
      periodo_inicio: dia,
      periodo_fim: dia,
      detalhe_sdr: detalhe,
      updated_at: new Date().toISOString(),
    };

    // Se nao existe, incluir leads
    if (!metricaExistente) {
      metricaPayload.leads = dados.concluidos;
    }

    const { error: errUpsert } = await supabase
      .from('metricas')
      .upsert(metricaPayload, {
        onConflict: 'tipo,referencia_id,periodo_inicio,periodo_fim',
        ignoreDuplicates: false,
      });

    if (errUpsert) erros.push(`Erro dia ${dia}: ${errUpsert.message}`);
  }

  // 5. Atualizar status na integração
  await supabase
    .from('integracoes_typebot')
    .update({
      ultima_sincronizacao: new Date().toISOString(),
      erro_sincronizacao: erros.length > 0 ? erros.join('; ') : null,
      total_sincronizados: (results.length),
      updated_at: new Date().toISOString(),
    })
    .eq('id', integracao.id);

  return {
    iniciados,
    concluidos,
    total_resultados: results.length,
    nomes_concluidos: nomesConcluidos,
    periodo_inicio: options.dataInicio,
    periodo_fim: options.dataFim,
    erros,
  };
}