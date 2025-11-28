-- NOVO SCHEMA COMPLETO - HIERARQUIA FUNIS/CAMPANHAS/CONJUNTOS/CRIATIVOS
-- Execute este script no Supabase SQL Editor

-- 1. Atualizar tabela empresas (já existe, mas vamos garantir)
CREATE TABLE IF NOT EXISTS empresas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR NOT NULL,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Nova tabela funis
CREATE TABLE IF NOT EXISTS funis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR NOT NULL,
  descricao TEXT,
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Atualizar tabela campanhas (adicionar funil_id)
DROP TABLE IF EXISTS campanhas CASCADE;
CREATE TABLE campanhas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR NOT NULL,
  tipo VARCHAR CHECK (tipo IN ('vendas', 'leads', 'awareness')) DEFAULT 'leads',
  funil_id UUID REFERENCES funis(id) ON DELETE CASCADE,
  plataforma VARCHAR NOT NULL DEFAULT 'Meta Ads',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Nova tabela conjuntos_anuncio
CREATE TABLE IF NOT EXISTS conjuntos_anuncio (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR NOT NULL,
  campanha_id UUID REFERENCES campanhas(id) ON DELETE CASCADE,
  publico TEXT NOT NULL,
  idade_min INTEGER DEFAULT 18,
  idade_max INTEGER DEFAULT 65,
  localizacao TEXT DEFAULT 'Brasil',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Nova tabela criativos
DROP TABLE IF EXISTS criativos CASCADE;
CREATE TABLE criativos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conjunto_id UUID REFERENCES conjuntos_anuncio(id) ON DELETE CASCADE,
  nome VARCHAR NOT NULL,
  tipo VARCHAR CHECK (tipo IN ('imagem', 'video', 'carrossel', 'texto')) NOT NULL,
  url_midia TEXT,
  descricao TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Nova tabela metricas (genérica para todos os níveis)
DROP TABLE IF EXISTS metricas CASCADE;
CREATE TABLE metricas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo VARCHAR CHECK (tipo IN ('funil', 'campanha', 'conjunto', 'criativo')) NOT NULL,
  referencia_id UUID NOT NULL,
  periodo_inicio DATE NOT NULL,
  periodo_fim DATE NOT NULL,
  alcance INTEGER DEFAULT 0,
  impressoes INTEGER DEFAULT 0,
  cliques INTEGER DEFAULT 0,
  visualizacoes_pagina INTEGER DEFAULT 0,
  leads INTEGER DEFAULT 0,
  checkouts INTEGER DEFAULT 0,
  vendas INTEGER DEFAULT 0,
  investimento DECIMAL(12,2) DEFAULT 0,
  faturamento DECIMAL(12,2) DEFAULT 0,
  roas DECIMAL(8,2) GENERATED ALWAYS AS (
    CASE 
      WHEN investimento > 0 THEN faturamento / investimento
      ELSE 0 
    END
  ) STORED,
  ctr DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE 
      WHEN impressoes > 0 THEN (cliques::DECIMAL / impressoes::DECIMAL) * 100
      ELSE 0 
    END
  ) STORED,
  cpm DECIMAL(10,2) GENERATED ALWAYS AS (
    CASE 
      WHEN impressoes > 0 THEN (investimento / impressoes::DECIMAL) * 1000
      ELSE 0 
    END
  ) STORED,
  cpc DECIMAL(10,2) GENERATED ALWAYS AS (
    CASE 
      WHEN cliques > 0 THEN investimento / cliques::DECIMAL
      ELSE 0 
    END
  ) STORED,
  cpl DECIMAL(10,2) GENERATED ALWAYS AS (
    CASE 
      WHEN leads > 0 THEN investimento / leads::DECIMAL
      ELSE 0 
    END
  ) STORED,
  taxa_conversao DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE 
      WHEN leads > 0 THEN (vendas::DECIMAL / leads::DECIMAL) * 100
      ELSE 0 
    END
  ) STORED,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tipo, referencia_id, periodo_inicio, periodo_fim)
);

-- 7. Índices para performance
CREATE INDEX IF NOT EXISTS idx_funis_empresa_id ON funis(empresa_id);
CREATE INDEX IF NOT EXISTS idx_campanhas_funil_id ON campanhas(funil_id);
CREATE INDEX IF NOT EXISTS idx_conjuntos_campanha_id ON conjuntos_anuncio(campanha_id);
CREATE INDEX IF NOT EXISTS idx_criativos_conjunto_id ON criativos(conjunto_id);
CREATE INDEX IF NOT EXISTS idx_metricas_tipo_referencia ON metricas(tipo, referencia_id);
CREATE INDEX IF NOT EXISTS idx_metricas_periodo ON metricas(periodo_inicio, periodo_fim);

-- 8. RLS (Row Level Security)
ALTER TABLE funis ENABLE ROW LEVEL SECURITY;
ALTER TABLE campanhas ENABLE ROW LEVEL SECURITY;
ALTER TABLE conjuntos_anuncio ENABLE ROW LEVEL SECURITY;
ALTER TABLE criativos ENABLE ROW LEVEL SECURITY;
ALTER TABLE metricas ENABLE ROW LEVEL SECURITY;

-- 9. Políticas de segurança
CREATE POLICY "Usuários podem ver funis da própria empresa" ON funis
  FOR ALL USING (
    empresa_id IN (
      SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem ver campanhas da própria empresa" ON campanhas
  FOR ALL USING (
    funil_id IN (
      SELECT f.id FROM funis f
      JOIN usuarios u ON f.empresa_id = u.empresa_id
      WHERE u.id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem ver conjuntos da própria empresa" ON conjuntos_anuncio
  FOR ALL USING (
    campanha_id IN (
      SELECT c.id FROM campanhas c
      JOIN funis f ON c.funil_id = f.id
      JOIN usuarios u ON f.empresa_id = u.empresa_id
      WHERE u.id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem ver criativos da própria empresa" ON criativos
  FOR ALL USING (
    conjunto_id IN (
      SELECT ca.id FROM conjuntos_anuncio ca
      JOIN campanhas c ON ca.campanha_id = c.id
      JOIN funis f ON c.funil_id = f.id
      JOIN usuarios u ON f.empresa_id = u.empresa_id
      WHERE u.id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem ver métricas da própria empresa" ON metricas
  FOR ALL USING (true); -- Será refinada com base no tipo e referencia_id

-- 10. Dados de exemplo
-- Inserir empresa se não existir
INSERT INTO empresas (id, nome) 
VALUES ('550e8400-e29b-41d4-a716-446655440000', 'Lídia Cabral Consultoria')
ON CONFLICT (id) DO NOTHING;

-- Inserir funis de exemplo
INSERT INTO funis (id, nome, descricao, empresa_id) VALUES
  ('f1111111-1111-1111-1111-111111111111', 'Masterclass de Vendas', 'Funil completo da masterclass', '550e8400-e29b-41d4-a716-446655440000'),
  ('f2222222-2222-2222-2222-222222222222', 'Funil de Aplicação', 'Processo de candidatura', '550e8400-e29b-41d4-a716-446655440000'),
  ('f3333333-3333-3333-3333-333333333333', 'Lançamento Digital', 'Campanha de lançamento', '550e8400-e29b-41d4-a716-446655440000')
ON CONFLICT (id) DO NOTHING;

-- Inserir campanhas de exemplo
INSERT INTO campanhas (id, nome, tipo, funil_id) VALUES
  ('c1111111-1111-1111-1111-111111111111', 'Campanha Masterclass Março', 'leads', 'f1111111-1111-1111-1111-111111111111'),
  ('c2222222-2222-2222-2222-222222222222', 'Campanha Aplicação Q1', 'leads', 'f2222222-2222-2222-2222-222222222222'),
  ('c3333333-3333-3333-3333-333333333333', 'Pré-Lançamento', 'awareness', 'f3333333-3333-3333-3333-333333333333')
ON CONFLICT (id) DO NOTHING;

-- Inserir conjuntos de anúncio de exemplo
INSERT INTO conjuntos_anuncio (id, nome, campanha_id, publico) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Mulheres 25-35 RJ/SP', 'c1111111-1111-1111-1111-111111111111', 'Mulheres interessadas em empreendedorismo'),
  ('22222222-2222-2222-2222-222222222222', 'Lookalike 1% Clientes', 'c1111111-1111-1111-1111-111111111111', 'Público similar aos melhores clientes'),
  ('33333333-3333-3333-3333-333333333333', 'Público Quente', 'c2222222-2222-2222-2222-222222222222', 'Visitantes do site últimos 30 dias')
ON CONFLICT (id) DO NOTHING;

-- Inserir criativos de exemplo
INSERT INTO criativos (id, conjunto_id, nome, tipo, descricao) VALUES
  ('1c111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Vídeo Depoimento Principal', 'video', 'Depoimento da cliente X sobre resultados'),
  ('2c222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Carrossel Benefícios', 'carrossel', 'Lista dos principais benefícios'),
  ('3c333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'Imagem + CTA Urgência', 'imagem', 'Oferta por tempo limitado')
ON CONFLICT (id) DO NOTHING;

-- Inserir métricas de exemplo (últimos 7 dias)
INSERT INTO metricas (tipo, referencia_id, periodo_inicio, periodo_fim, alcance, impressoes, cliques, leads, vendas, investimento, faturamento) VALUES
  -- Métricas do funil Masterclass
  ('funil', 'f1111111-1111-1111-1111-111111111111', CURRENT_DATE - INTERVAL '7 days', CURRENT_DATE, 45200, 125800, 3250, 185, 22, 4500.00, 52800.00),
  
  -- Métricas da campanha Março
  ('campanha', 'c1111111-1111-1111-1111-111111111111', CURRENT_DATE - INTERVAL '7 days', CURRENT_DATE, 32100, 89400, 2100, 120, 15, 2800.00, 36000.00),
  
  -- Métricas do conjunto Mulheres 25-35
  ('conjunto', '11111111-1111-1111-1111-111111111111', CURRENT_DATE - INTERVAL '7 days', CURRENT_DATE, 18500, 52200, 1250, 68, 8, 1500.00, 19200.00),
  
  -- Métricas do criativo Vídeo Depoimento
  ('criativo', '1c111111-1111-1111-1111-111111111111', CURRENT_DATE - INTERVAL '7 days', CURRENT_DATE, 12800, 35600, 890, 45, 5, 950.00, 12000.00)
ON CONFLICT (tipo, referencia_id, periodo_inicio, periodo_fim) DO NOTHING;

SELECT 'Banco de dados hierárquico configurado com sucesso! 🚀' as status;