// Tipos TypeScript para a nova arquitetura hierárquica

export interface Empresa {
  id: string;
  nome: string;
  logo_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Funil {
  id: string;
  nome: string;
  descricao?: string;
  empresa_id: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  // Relacionamentos
  empresa?: Empresa;
  campanhas?: Campanha[];
  metricas?: Metrica[];
}

export interface Campanha {
  id: string;
  nome: string;
  tipo: 'vendas' | 'leads' | 'awareness';
  funil_id: string;
  plataforma: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  // Relacionamentos
  funil?: Funil;
  conjuntos_anuncio?: ConjuntoAnuncio[];
  metricas?: Metrica[];
}

export interface ConjuntoAnuncio {
  id: string;
  nome: string;
  campanha_id: string;
  publico: string;
  idade_min: number;
  idade_max: number;
  localizacao: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  // Relacionamentos
  campanha?: Campanha;
  criativos?: Criativo[];
  metricas?: Metrica[];
}

export interface Criativo {
  id: string;
  conjunto_id: string;
  nome: string;
  tipo: 'imagem' | 'video' | 'carrossel' | 'texto';
  url_midia?: string;
  descricao?: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  // Relacionamentos
  conjunto?: ConjuntoAnuncio;
  metricas?: Metrica[];
}

export interface Metrica {
  id: string;
  tipo: 'funil' | 'campanha' | 'conjunto' | 'criativo';
  referencia_id: string;
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
  // Campos calculados
  roas: number;
  ctr: number;
  cpm: number;
  cpc: number;
  cpl: number;
  taxa_conversao: number;
  created_at: string;
}

// Tipos para Dashboard e Filtros
export interface FiltrosDashboard {
  empresa_id?: string;
  funil_id?: string;
  campanha_id?: string;
  conjunto_id?: string;
  criativo_id?: string;
  periodo_inicio: string;
  periodo_fim: string;
}

export interface MetricasAgregadas {
  alcance: number;
  impressoes: number;
  cliques: number;
  visualizacoes_pagina: number;
  leads: number;
  checkouts: number;
  vendas: number;
  investimento: number;
  faturamento: number;
  roas: number;
  ctr: number;
  cpm: number;
  cpc: number;
  cpl: number;
  taxa_conversao: number;
}

export interface DashboardResponse {
  metricas: MetricasAgregadas;
  series_tempo: {
    data: string;
    investimento: number;
    leads: number;
    vendas: number;
    cliques: number;
    alcance: number;
  }[];
  comparativo_criativos?: {
    criativo: Criativo;
    metricas: MetricasAgregadas;
  }[];
  hierarquia?: HierarquiaItem[];
}

// Para a tabela hierárquica colapsável
export interface HierarquiaItem {
  id: string;
  nome: string;
  tipo: 'funil' | 'campanha' | 'conjunto' | 'criativo';
  nivel: number;
  parent_id?: string;
  metricas: MetricasAgregadas;
  children?: HierarquiaItem[];
  expandido?: boolean;
  status_performance: 'excelente' | 'bom' | 'medio' | 'ruim'; // baseado no ROAS/CTR
}

// Enums úteis
export const TiposCampanha = {
  VENDAS: 'vendas' as const,
  LEADS: 'leads' as const,
  AWARENESS: 'awareness' as const,
} as const;

export const TiposCriativo = {
  IMAGEM: 'imagem' as const,
  VIDEO: 'video' as const,
  CARROSSEL: 'carrossel' as const,
  TEXTO: 'texto' as const,
} as const;

export const PlataformasAds = {
  META: 'Meta Ads' as const,
  GOOGLE: 'Google Ads' as const,
  TIKTOK: 'TikTok Ads' as const,
  LINKEDIN: 'LinkedIn Ads' as const,
} as const;

// ============================================
// Kommo CRM Types
// ============================================

export interface IntegracaoKommo {
  id: string;
  empresa_id: string;
  nome: string;
  subdominio: string;
  access_token: string;
  ativo: boolean;
  funil_id: string | null;
  ultima_sincronizacao: string | null;
  erro_sincronizacao: string | null;
  created_at: string;
  updated_at: string;
}

export interface KommoStage {
  id: number;
  name: string;
  sort: number;
  color: string;
  type?: number; // 0=normal, 1=closed won, 2=closed lost
}

export interface KommoPipeline {
  id: string;
  integracao_id: string;
  pipeline_id_kommo: number;
  nome: string;
  stages: KommoStage[];
  mapeamento_departamentos: {
    sdr?: number[];    // stage IDs para SDR
    closer?: number[]; // stage IDs para Closer
  };
  funil_id: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface KommoSnapshot {
  id: string;
  pipeline_ref_id: string;
  data_referencia: string;
  stage_id_kommo: number;
  stage_nome: string;
  quantidade_leads: number;
  valor_total: number;
  nomes_leads: string;
  created_at: string;
  updated_at: string;
}

export interface DetalheSDR {
  comecou_diagnostico: number;
  chegaram_crm_kommo: number;
  qualificados_para_mentoria: number;
  para_downsell: number;
  agendados_diagnostico: number;
  agendados_mentoria: number;
  nomes_qualificados: string;
}

export interface DetalheCloser {
  calls_realizadas: number;
  nao_compareceram: number;
  vendas_mentoria: number;
  vendas_downsell: number;
  em_negociacao: number;
  em_followup: number;
  vendas_perdidas: number;
  lead_desqualificado: number;
  nomes_vendas: string;
}

export interface KommoSyncLog {
  id: string;
  empresa_id: string;
  integracao_id: string;
  pipeline_id_kommo: number;
  status: 'running' | 'success' | 'partial' | 'error';
  periodo_inicio: string;
  periodo_fim: string;
  total_leads: number;
  leads_por_estagio: Array<{
    stage_id: number;
    stage_nome: string;
    quantidade: number;
    valor: number;
  }>;
  erro_detalhe: string | null;
  detalhes: Record<string, any>;
  iniciado_em: string;
  finalizado_em: string | null;
}

// ============================================
// Funnel visualization types
// ============================================

export interface FunnelStageData {
  stage_id: number;
  stage_nome: string;
  quantidade: number;
  valor: number;
  percentual_total: number;     // % em relação ao total de leads
  taxa_conversao: number;       // % de conversão do estágio anterior
  color: string;
  tipo: 'active' | 'won' | 'lost';
}

// Utilitários para cálculos
export const calcularMetricas = {
  roas: (faturamento: number, investimento: number): number => 
    investimento > 0 ? faturamento / investimento : 0,
  
  ctr: (cliques: number, impressoes: number): number => 
    impressoes > 0 ? (cliques / impressoes) * 100 : 0,
  
  cpm: (investimento: number, impressoes: number): number => 
    impressoes > 0 ? (investimento / impressoes) * 1000 : 0,
  
  cpc: (investimento: number, cliques: number): number => 
    cliques > 0 ? investimento / cliques : 0,
  
  cpl: (investimento: number, leads: number): number => 
    leads > 0 ? investimento / leads : 0,
  
  taxaConversao: (vendas: number, leads: number): number => 
    leads > 0 ? (vendas / leads) * 100 : 0,
  
  statusPerformance: (roas: number, ctr: number): 'excelente' | 'bom' | 'medio' | 'ruim' => {
    if (roas >= 3 && ctr >= 2) return 'excelente';
    if (roas >= 2 && ctr >= 1.5) return 'bom';
    if (roas >= 1.5 && ctr >= 1) return 'medio';
    return 'ruim';
  }
};