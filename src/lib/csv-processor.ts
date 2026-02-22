// Processador de CSV Meta Ads → métricas no Supabase

import { supabase } from '@/lib/supabase';
import { calcularMetricas } from '@/types/hierarchical';
import type { MapeamentoCampo, CampoBD } from '@/lib/csv-mapping';

export interface LinhaCSVProcessada {
  nome_campanha: string;
  periodo_inicio: string;
  periodo_fim: string;
  alcance: number;
  impressoes: number;
  cliques: number;
  visualizacoes_pagina: number;
  leads: number;
  checkouts: number;
  vendas: number;
  investimento: number;
  faturamento: number;
}

export interface ResultadoImportacao {
  totalLinhas: number;
  linhasComDados: number;
  linhasZeradas: number;
  campanhasNovas: number;
  campanhasExistentes: number;
  metricasInseridas: number;
  metricasAtualizadas: number;
  erros: string[];
}

/**
 * Parseia um valor numérico vindo do CSV (lidando com formatos BR e US)
 */
function parseNumero(valor: string | undefined | null): number {
  if (!valor || valor.trim() === '' || valor === '—' || valor === '-' || valor === 'N/A') return 0;
  
  // Remover espaços
  let limpo = valor.trim();
  
  // Detectar formato brasileiro (1.234,56) vs americano (1,234.56)
  // Se tem vírgula seguida de exatamente 2-3 dígitos no final, é formato BR
  if (/,\d{1,3}$/.test(limpo) && limpo.includes('.')) {
    // Formato BR: 1.487,48 → 1487.48
    limpo = limpo.replace(/\./g, '').replace(',', '.');
  } else if (/,\d{1,3}$/.test(limpo)) {
    // Formato BR sem milhar: 487,48 → 487.48
    limpo = limpo.replace(',', '.');
  } else {
    // Formato US ou inteiro: remover vírgulas de milhar
    limpo = limpo.replace(/,/g, '');
  }
  
  // Remover símbolos monetários
  limpo = limpo.replace(/[R$\s]/g, '');
  
  const num = parseFloat(limpo);
  return isNaN(num) ? 0 : num;
}

/**
 * Parseia uma data do CSV (suporta YYYY-MM-DD, DD/MM/YYYY, etc.)
 */
function parseData(valor: string | undefined | null): string {
  if (!valor || valor.trim() === '') return '';
  
  const limpo = valor.trim();
  
  // Formato ISO: 2026-01-01
  if (/^\d{4}-\d{2}-\d{2}/.test(limpo)) {
    return limpo.substring(0, 10);
  }
  
  // Formato BR: 01/01/2026
  if (/^\d{2}\/\d{2}\/\d{4}/.test(limpo)) {
    const [dia, mes, ano] = limpo.split('/');
    return `${ano}-${mes}-${dia}`;
  }
  
  // Formato US: 01/01/2026 (ambíguo, tenta interpretar como MM/DD/YYYY)
  if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(limpo)) {
    const [mes, dia, ano] = limpo.split('/');
    return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
  }
  
  return limpo;
}

/**
 * Transforma linhas brutas do CSV + mapeamento → linhas processadas
 */
export function processarLinhasCSV(
  linhasBrutas: Record<string, string>[],
  mapeamento: MapeamentoCampo[],
  filtrarZerados: boolean = true
): { linhasComDados: LinhaCSVProcessada[]; linhasZeradas: number } {
  const mapaColuna: Record<CampoBD, string> = {} as any;
  
  for (const m of mapeamento) {
    if (m.campoBD !== 'ignorar') {
      mapaColuna[m.campoBD] = m.csvHeader;
    }
  }
  
  const getValor = (linha: Record<string, string>, campo: CampoBD): string => {
    const header = mapaColuna[campo];
    if (!header) return '';
    return linha[header] || '';
  };
  
  let linhasZeradas = 0;
  const linhasComDados: LinhaCSVProcessada[] = [];
  
  for (const linha of linhasBrutas) {
    const nomeCampanha = getValor(linha, 'nome_campanha').trim();
    if (!nomeCampanha) continue;
    
    const alcance = parseNumero(getValor(linha, 'alcance'));
    const impressoes = parseNumero(getValor(linha, 'impressoes'));
    const cliques = parseNumero(getValor(linha, 'cliques'));
    const visualizacoes = parseNumero(getValor(linha, 'visualizacoes_pagina'));
    const leads = parseNumero(getValor(linha, 'leads'));
    const checkouts = parseNumero(getValor(linha, 'checkouts'));
    const vendas = parseNumero(getValor(linha, 'vendas'));
    const investimento = parseNumero(getValor(linha, 'investimento'));
    const faturamento = parseNumero(getValor(linha, 'faturamento'));
    
    const todosZerados = alcance === 0 && impressoes === 0 && cliques === 0 && 
                          visualizacoes === 0 && leads === 0 && checkouts === 0 && 
                          vendas === 0 && investimento === 0 && faturamento === 0;
    
    if (todosZerados) {
      linhasZeradas++;
      if (filtrarZerados) continue;
    }
    
    linhasComDados.push({
      nome_campanha: nomeCampanha,
      periodo_inicio: parseData(getValor(linha, 'periodo_inicio')),
      periodo_fim: parseData(getValor(linha, 'periodo_fim')),
      alcance: Math.round(alcance),
      impressoes: Math.round(impressoes),
      cliques: Math.round(cliques),
      visualizacoes_pagina: Math.round(visualizacoes),
      leads: Math.round(leads),
      checkouts: Math.round(checkouts),
      vendas: Math.round(vendas),
      investimento: Math.round(investimento * 100) / 100,
      faturamento: Math.round(faturamento * 100) / 100,
    });
  }
  
  return { linhasComDados, linhasZeradas };
}

/**
 * Busca ou cria campanhas no Supabase a partir dos nomes do CSV
 * Retorna mapa nome_campanha → campanha_id
 */
async function buscarOuCriarCampanhas(
  nomesCampanhas: string[],
  funilId: string
): Promise<{ mapa: Map<string, string>; novas: number; existentes: number; erros: string[] }> {
  const mapa = new Map<string, string>();
  let novas = 0;
  let existentes = 0;
  const erros: string[] = [];
  
  // Buscar todas as campanhas do funil de uma vez
  const { data: campanhasExistentes, error: errBusca } = await supabase
    .from('campanhas')
    .select('id, nome')
    .eq('funil_id', funilId);
  
  if (errBusca) {
    erros.push(`Erro ao buscar campanhas: ${errBusca.message}`);
    return { mapa, novas, existentes, erros };
  }
  
  // Criar mapa normalizado de campanhas existentes
  const mapaNormalizado = new Map<string, { id: string; nome: string }>();
  for (const c of campanhasExistentes || []) {
    mapaNormalizado.set(c.nome.toLowerCase().trim(), { id: c.id, nome: c.nome });
  }
  
  // Para cada nome de campanha único no CSV
  const nomesUnicos = [...new Set(nomesCampanhas)];
  
  for (const nome of nomesUnicos) {
    const nomeNorm = nome.toLowerCase().trim();
    
    if (mapaNormalizado.has(nomeNorm)) {
      mapa.set(nome, mapaNormalizado.get(nomeNorm)!.id);
      existentes++;
    } else {
      // Criar nova campanha
      const { data: novaCampanha, error: errInsert } = await supabase
        .from('campanhas')
        .insert({
          nome: nome,
          funil_id: funilId,
          plataforma: 'Meta Ads',
          ativo: true,
        })
        .select('id')
        .single();
      
      if (errInsert) {
        erros.push(`Erro ao criar campanha "${nome}": ${errInsert.message}`);
      } else if (novaCampanha) {
        mapa.set(nome, novaCampanha.id);
        novas++;
      }
    }
  }
  
  return { mapa, novas, existentes, erros };
}

/**
 * Importa todas as linhas processadas para o Supabase
 */
export async function importarCSVParaSupabase(
  linhas: LinhaCSVProcessada[],
  funilId: string,
  onProgress?: (mensagem: string, progresso: number) => void
): Promise<ResultadoImportacao> {
  const resultado: ResultadoImportacao = {
    totalLinhas: linhas.length,
    linhasComDados: linhas.length,
    linhasZeradas: 0,
    campanhasNovas: 0,
    campanhasExistentes: 0,
    metricasInseridas: 0,
    metricasAtualizadas: 0,
    erros: [],
  };
  
  if (linhas.length === 0) {
    resultado.erros.push('Nenhuma linha com dados para importar');
    return resultado;
  }
  
  // Etapa 1: Buscar/criar campanhas
  onProgress?.('Sincronizando campanhas...', 10);
  
  const nomesCampanhas = linhas.map(l => l.nome_campanha);
  const { mapa: mapaCampanhas, novas, existentes, erros: errosCampanhas } = 
    await buscarOuCriarCampanhas(nomesCampanhas, funilId);
  
  resultado.campanhasNovas = novas;
  resultado.campanhasExistentes = existentes;
  resultado.erros.push(...errosCampanhas);
  
  // Etapa 2: Limpar métricas antigas no range de datas (substituição completa)
  onProgress?.('Limpando métricas anteriores do período...', 20);
  
  // Descobrir o range global de datas do CSV
  const todasDatasInicio = linhas.map(l => l.periodo_inicio).filter(Boolean).sort();
  const todasDatasFim = linhas.map(l => l.periodo_fim).filter(Boolean).sort();
  const dataInicioGlobal = todasDatasInicio[0];
  const dataFimGlobal = todasDatasFim[todasDatasFim.length - 1];
  
  if (dataInicioGlobal && dataFimGlobal) {
    // Para cada campanha que será importada, deletar métricas existentes no range
    const campanhaIdsUnicos = [...new Set(
      linhas
        .map(l => mapaCampanhas.get(l.nome_campanha))
        .filter(Boolean) as string[]
    )];
    
    for (const campanhaId of campanhaIdsUnicos) {
      // Deletar métricas que se sobrepõem com o período do CSV
      // Isso cobre: período exato, registros diários dentro do range, semanais, etc.
      const { error: errDelete } = await supabase
        .from('metricas')
        .delete()
        .eq('tipo', 'campanha')
        .eq('referencia_id', campanhaId)
        .gte('periodo_inicio', dataInicioGlobal)
        .lte('periodo_inicio', dataFimGlobal);
      
      if (errDelete) {
        resultado.erros.push(`Erro ao limpar métricas anteriores da campanha ${campanhaId}: ${errDelete.message}`);
      }
    }
  }
  
  // Etapa 3: Inserir métricas novas
  onProgress?.('Importando métricas...', 30);
  
  const total = linhas.length;
  
  for (let i = 0; i < linhas.length; i++) {
    const linha = linhas[i];
    const campanhaId = mapaCampanhas.get(linha.nome_campanha);
    
    if (!campanhaId) {
      resultado.erros.push(`Campanha não encontrada/criada: "${linha.nome_campanha}"`);
      continue;
    }
    
    // Calcular métricas derivadas
    const roas = calcularMetricas.roas(linha.faturamento, linha.investimento);
    const ctr = calcularMetricas.ctr(linha.cliques, linha.impressoes);
    const cpm = calcularMetricas.cpm(linha.investimento, linha.impressoes);
    const cpc = calcularMetricas.cpc(linha.investimento, linha.cliques);
    const cpl = calcularMetricas.cpl(linha.investimento, linha.leads);
    const taxa_conversao = calcularMetricas.taxaConversao(linha.vendas, linha.leads);
    
    const dadosMetrica = {
      tipo: 'campanha' as const,
      referencia_id: campanhaId,
      periodo_inicio: linha.periodo_inicio,
      periodo_fim: linha.periodo_fim,
      alcance: linha.alcance,
      impressoes: linha.impressoes,
      cliques: linha.cliques,
      visualizacoes_pagina: linha.visualizacoes_pagina,
      leads: linha.leads,
      checkouts: linha.checkouts,
      vendas: linha.vendas,
      investimento: linha.investimento,
      faturamento: linha.faturamento,
      roas: Math.round(roas * 100) / 100,
      ctr: Math.round(ctr * 100) / 100,
      cpm: Math.round(cpm * 100) / 100,
      cpc: Math.round(cpc * 100) / 100,
      cpl: Math.round(cpl * 100) / 100,
      taxa_conversao: Math.round(taxa_conversao * 100) / 100,
    };
    
    // Inserir diretamente (métricas antigas do período já foram deletadas)
    const { error: errInsert } = await supabase
      .from('metricas')
      .insert(dadosMetrica);
    
    if (errInsert) {
      resultado.erros.push(`Erro ao inserir métrica para "${linha.nome_campanha}": ${errInsert.message}`);
    } else {
      resultado.metricasInseridas++;
    }
    
    // Atualizar progresso
    const progresso = 30 + Math.round(((i + 1) / total) * 65);
    onProgress?.(`Importando ${i + 1} de ${total}...`, progresso);
  }
  
  onProgress?.('Importação concluída!', 100);
  
  return resultado;
}
