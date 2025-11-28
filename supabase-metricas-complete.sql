-- Script SQL completo para criar/atualizar a tabela de métricas
-- Execute este script no SQL Editor do Supabase

-- ======================================
-- Tabela: metricas
-- ======================================
CREATE TABLE IF NOT EXISTS public.metricas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tipo TEXT NOT NULL DEFAULT 'campanha',
    referencia_id UUID NOT NULL,
    periodo_inicio DATE NOT NULL,
    periodo_fim DATE NOT NULL,
    
    -- Métricas de Tráfego
    alcance INTEGER DEFAULT 0,
    impressoes INTEGER DEFAULT 0,
    cliques INTEGER DEFAULT 0,
    visualizacoes_pagina INTEGER DEFAULT 0,
    leads INTEGER DEFAULT 0,
    checkouts INTEGER DEFAULT 0,
    vendas INTEGER DEFAULT 0,
    
    -- Métricas Financeiras
    investimento DECIMAL(10,2) DEFAULT 0,
    faturamento DECIMAL(10,2) DEFAULT 0,
    investimento_trafego DECIMAL(10,2) DEFAULT 0,
    
    -- Métricas Calculadas
    roas DECIMAL(10,2) DEFAULT 0,
    ctr DECIMAL(10,2) DEFAULT 0,
    cpm DECIMAL(10,2) DEFAULT 0,
    cpc DECIMAL(10,2) DEFAULT 0,
    cpl DECIMAL(10,2) DEFAULT 0,
    taxa_conversao DECIMAL(10,2) DEFAULT 0,
    
    -- Detalhes por Departamento (JSONB)
    detalhe_sdr JSONB,
    detalhe_closer JSONB,
    detalhe_social_seller JSONB,
    detalhe_cs JSONB,
    
    -- Metadados
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Adicionar colunas se não existirem (para atualizar tabelas existentes)
DO $$ 
BEGIN
    -- Verificar e adicionar detalhe_sdr
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'metricas' AND column_name = 'detalhe_sdr'
    ) THEN
        ALTER TABLE public.metricas ADD COLUMN detalhe_sdr JSONB;
    END IF;

    -- Verificar e adicionar detalhe_closer
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'metricas' AND column_name = 'detalhe_closer'
    ) THEN
        ALTER TABLE public.metricas ADD COLUMN detalhe_closer JSONB;
    END IF;

    -- Verificar e adicionar detalhe_social_seller
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'metricas' AND column_name = 'detalhe_social_seller'
    ) THEN
        ALTER TABLE public.metricas ADD COLUMN detalhe_social_seller JSONB;
    END IF;

    -- Verificar e adicionar detalhe_cs
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'metricas' AND column_name = 'detalhe_cs'
    ) THEN
        ALTER TABLE public.metricas ADD COLUMN detalhe_cs JSONB;
    END IF;

    -- Verificar e adicionar investimento_trafego
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'metricas' AND column_name = 'investimento_trafego'
    ) THEN
        ALTER TABLE public.metricas ADD COLUMN investimento_trafego DECIMAL(10,2) DEFAULT 0;
    END IF;
END $$;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_metricas_referencia_id ON public.metricas(referencia_id);
CREATE INDEX IF NOT EXISTS idx_metricas_periodo_inicio ON public.metricas(periodo_inicio);
CREATE INDEX IF NOT EXISTS idx_metricas_periodo_fim ON public.metricas(periodo_fim);
CREATE INDEX IF NOT EXISTS idx_metricas_tipo ON public.metricas(tipo);

-- Habilitar RLS
ALTER TABLE public.metricas ENABLE ROW LEVEL SECURITY;

-- Política RLS (permitir tudo por enquanto)
DROP POLICY IF EXISTS "Enable all access for metricas" ON public.metricas;
CREATE POLICY "Enable all access for metricas" ON public.metricas
    FOR ALL USING (true);

-- Comentários
COMMENT ON TABLE public.metricas IS 'Métricas de desempenho das campanhas por departamento';
COMMENT ON COLUMN public.metricas.detalhe_sdr IS 'Detalhes específicos do departamento SDR (JSONB)';
COMMENT ON COLUMN public.metricas.detalhe_closer IS 'Detalhes específicos do departamento Closer (JSONB)';
COMMENT ON COLUMN public.metricas.detalhe_social_seller IS 'Detalhes específicos do departamento Social Seller (JSONB)';
COMMENT ON COLUMN public.metricas.detalhe_cs IS 'Detalhes específicos do departamento Customer Success (JSONB)';

-- ======================================
-- Estrutura JSONB esperada para cada detalhe:
-- ======================================

-- detalhe_sdr:
-- {
--   "preencheram_diagnostico": 0,
--   "qualificados_para_mentoria": 0,
--   "para_downsell": 0,
--   "agendados_diagnostico": 0,
--   "agendados_mentoria": 0,
--   "nomes_qualificados": ""
-- }

-- detalhe_closer:
-- {
--   "calls_realizadas": 0,
--   "nao_compareceram": 0,
--   "vendas_mentoria": 0,
--   "vendas_downsell": 0,
--   "em_negociacao": 0,
--   "em_followup": 0,
--   "vendas_perdidas": 0
-- }

-- detalhe_social_seller:
-- {
--   "leads_contatados": 0,
--   "agendados_diagnostico": 0,
--   "agendados_mentoria": 0,
--   "agendados_consultoria": 0,
--   "downsell_vendido": 0
-- }

-- detalhe_cs:
-- {
--   "alunas_contatadas": 0,
--   "suporte_prestado": 0,
--   "suporte_resolvidos": 0,
--   "suporte_pendentes": 0,
--   "produtos_vendidos": 0
-- }
