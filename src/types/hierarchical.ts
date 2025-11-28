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