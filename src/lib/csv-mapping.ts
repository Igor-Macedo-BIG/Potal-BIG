// Mapeamento automático de colunas CSV Meta Ads → campos do banco de dados

export type CampoBD = 
  | 'ignorar'
  | 'nome_campanha'
  | 'periodo_inicio'
  | 'periodo_fim'
  | 'alcance'
  | 'impressoes'
  | 'cliques'
  | 'visualizacoes_pagina'
  | 'leads'
  | 'checkouts'
  | 'vendas'
  | 'investimento'
  | 'faturamento'
  | 'frequencia';

export interface MapeamentoCampo {
  csvHeader: string;
  campoBD: CampoBD;
  label: string;
}

// Labels amigáveis para exibir no dropdown de mapeamento
export const LABELS_CAMPOS: Record<CampoBD, string> = {
  ignorar: '— Ignorar —',
  nome_campanha: 'Nome da Campanha',
  periodo_inicio: 'Data Início',
  periodo_fim: 'Data Fim',
  alcance: 'Alcance',
  impressoes: 'Impressões',
  cliques: 'Cliques',
  visualizacoes_pagina: 'Visualizações de Página',
  leads: 'Leads',
  checkouts: 'Checkouts',
  vendas: 'Vendas',
  investimento: 'Investimento (R$)',
  faturamento: 'Faturamento (R$)',
  frequencia: 'Frequência (info)',
};

// Regras de autodetecção — cada regra é um array de palavras-chave (case insensitive)
// que, ao aparecerem no header do CSV, mapeiam para o campo correspondente
const REGRAS_AUTODETECT: { keywords: string[]; campo: CampoBD }[] = [
  // Nome da campanha
  { keywords: ['nome da campanha', 'campaign name', 'nome campanha'], campo: 'nome_campanha' },
  
  // Datas
  { keywords: ['início dos relatórios', 'reporting starts', 'inicio dos relatorios', 'data início', 'start date'], campo: 'periodo_inicio' },
  { keywords: ['término dos relatórios', 'reporting ends', 'termino dos relatorios', 'data fim', 'end date'], campo: 'periodo_fim' },
  
  // Investimento
  { keywords: ['valor usado', 'amount spent', 'valor gasto', 'custo total', 'spend'], campo: 'investimento' },
  
  // Alcance
  { keywords: ['alcance', 'reach'], campo: 'alcance' },
  
  // Cliques
  { keywords: ['cliques (todos)', 'clicks (all)', 'cliques no link', 'link clicks', 'cliques'], campo: 'cliques' },
  
  // Visualizações de página
  { keywords: ['visualizações da página de destino', 'landing page views', 'visualizações de página', 'page views', 'visualizacoes'], campo: 'visualizacoes_pagina' },
  
  // Leads
  { keywords: ['novos contatos de mensagem', 'leads', 'messaging contacts', 'new messaging contacts', 'contatos'], campo: 'leads' },
  
  // Checkouts
  { keywords: ['finalizações de compra', 'checkout', 'checkouts initiated', 'finalizacoes'], campo: 'checkouts' },
  
  // Vendas
  { keywords: ['compras no site', 'website purchases', 'compras', 'purchases', 'conversões'], campo: 'vendas' },
  
  // Faturamento / ROAS (se houver valor monetário de vendas)
  { keywords: ['retorno sobre o investimento', 'roas', 'purchase value', 'valor de compra', 'receita'], campo: 'faturamento' },
  
  // Frequência (info apenas)
  { keywords: ['frequência', 'frequency', 'frequencia'], campo: 'frequencia' },
];

/**
 * Detecta automaticamente o mapeamento de uma coluna CSV para um campo do BD
 */
export function autoDetectarCampo(csvHeader: string): CampoBD {
  const headerLower = csvHeader.toLowerCase().trim();
  
  for (const regra of REGRAS_AUTODETECT) {
    for (const keyword of regra.keywords) {
      if (headerLower.includes(keyword.toLowerCase())) {
        return regra.campo;
      }
    }
  }
  
  return 'ignorar';
}

/**
 * Auto-detecta mapeamento para todas as colunas do CSV
 * Garante que não há duplicatas (se dois headers mapeiam pro mesmo campo, o segundo vira 'ignorar')
 */
export function autoDetectarMapeamento(csvHeaders: string[]): MapeamentoCampo[] {
  const camposUsados = new Set<CampoBD>();
  
  return csvHeaders.map((header) => {
    let campo = autoDetectarCampo(header);
    
    // Evitar duplicatas (exceto 'ignorar')
    if (campo !== 'ignorar' && camposUsados.has(campo)) {
      campo = 'ignorar';
    }
    
    if (campo !== 'ignorar') {
      camposUsados.add(campo);
    }
    
    return {
      csvHeader: header,
      campoBD: campo,
      label: LABELS_CAMPOS[campo],
    };
  });
}

/**
 * Lista todos os campos disponíveis para mapeamento
 */
export function getCamposDisponiveis(): { value: CampoBD; label: string }[] {
  return Object.entries(LABELS_CAMPOS).map(([value, label]) => ({
    value: value as CampoBD,
    label,
  }));
}
