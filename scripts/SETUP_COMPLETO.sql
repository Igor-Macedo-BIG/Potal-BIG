-- Script COMPLETO para setup inicial do Painel de Tráfego Pago
-- Execute este script NO Supabase SQL Editor PRIMEIRO
-- Este script cria toda a estrutura necessária incluindo integração Meta

-- ======================================
-- 1. Tabela: empresas
-- ======================================
CREATE TABLE IF NOT EXISTS empresas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR NOT NULL,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir empresa padrão se não existir
INSERT INTO empresas (nome) 
VALUES ('Lídia Cabral Consultoria')
ON CONFLICT DO NOTHING;

-- ======================================
-- 2. Tabela: usuarios
-- ======================================
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  nome VARCHAR NOT NULL,
  email VARCHAR UNIQUE NOT NULL,
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'gestor', 'sdr', 'closer', 'social-seller', 'cs', 'trafego')),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Migração: adiciona role se a tabela já existia sem essa coluna
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'admin';

-- ======================================
-- 3. Tabela: funis
-- ======================================
CREATE TABLE IF NOT EXISTS funis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR NOT NULL,
  descricao TEXT,
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ======================================
-- 4. Tabela: campanhas
-- ======================================
CREATE TABLE IF NOT EXISTS campanhas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR NOT NULL,
  tipo VARCHAR,
  funil_id UUID REFERENCES funis(id) ON DELETE SET NULL,
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
  plataforma VARCHAR DEFAULT 'Meta Ads',
  ativo BOOLEAN DEFAULT true,
  meta_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Migração: adiciona colunas que podem faltar em instalações existentes
ALTER TABLE campanhas ADD COLUMN IF NOT EXISTS meta_id TEXT;
ALTER TABLE campanhas ADD COLUMN IF NOT EXISTS plataforma VARCHAR DEFAULT 'Meta Ads';
ALTER TABLE campanhas ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE;

-- Migração: ON DELETE CASCADE → SET NULL para funil_id (campanha sobrevive se funil for deletado)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'campanhas_funil_id_fkey') THEN
    ALTER TABLE campanhas DROP CONSTRAINT campanhas_funil_id_fkey;
    ALTER TABLE campanhas ADD CONSTRAINT campanhas_funil_id_fkey
      FOREIGN KEY (funil_id) REFERENCES funis(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_campanhas_meta_id ON campanhas(meta_id);

-- ======================================
-- 5. Tabela: conjuntos_anuncio
-- ======================================
CREATE TABLE IF NOT EXISTS conjuntos_anuncio (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR NOT NULL,
  publico TEXT,
  ativo BOOLEAN DEFAULT true,
  campanha_id UUID REFERENCES campanhas(id) ON DELETE CASCADE,
  meta_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Migração: adiciona meta_id se a tabela já existia sem essa coluna
ALTER TABLE conjuntos_anuncio ADD COLUMN IF NOT EXISTS meta_id TEXT;

CREATE INDEX IF NOT EXISTS idx_conjuntos_meta_id ON conjuntos_anuncio(meta_id);

-- ======================================
-- 6. Tabela: anuncios
-- ======================================
CREATE TABLE IF NOT EXISTS anuncios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR NOT NULL,
  tipo TEXT,
  conjunto_anuncio_id UUID REFERENCES conjuntos_anuncio(id) ON DELETE CASCADE,
  meta_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Migração: adiciona meta_id se a tabela já existia sem essa coluna
ALTER TABLE anuncios ADD COLUMN IF NOT EXISTS meta_id TEXT;

CREATE INDEX IF NOT EXISTS idx_anuncios_meta_id ON anuncios(meta_id);

-- ======================================
-- 7. Tabela: metricas
-- ======================================
CREATE TABLE IF NOT EXISTS metricas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo TEXT NOT NULL DEFAULT 'campanha',
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
  
  investimento DECIMAL(10,2) DEFAULT 0,
  faturamento DECIMAL(10,2) DEFAULT 0,
  investimento_trafego DECIMAL(10,2) DEFAULT 0,
  
  roas DECIMAL(10,2) DEFAULT 0,
  ctr DECIMAL(10,2) DEFAULT 0,
  cpm DECIMAL(10,2) DEFAULT 0,
  cpc DECIMAL(10,2) DEFAULT 0,
  cpl DECIMAL(10,2) DEFAULT 0,
  taxa_conversao DECIMAL(10,2) DEFAULT 0,
  
  detalhe_sdr JSONB,
  detalhe_closer JSONB,
  detalhe_social_seller JSONB,
  detalhe_cs JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ======================================
-- 8. Tabela: integracoes_meta
-- Para integração com Meta Marketing API
-- Suporta MÚLTIPLAS contas Meta por empresa
-- ======================================
CREATE TABLE IF NOT EXISTS integracoes_meta (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    
    access_token TEXT,
    token_expiry TIMESTAMP WITH TIME ZONE,
    
    ad_account_id TEXT,
    business_id TEXT,
    
    ativo BOOLEAN DEFAULT false,
    ultima_sincronizacao TIMESTAMP WITH TIME ZONE,
    erro_sincronizacao TEXT,
    
    sincronizar_automaticamente BOOLEAN DEFAULT false,
    intervalo_sincronizacao INTEGER DEFAULT 60,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Migração: remover UNIQUE constraint antiga em empresa_id (permitir múltiplas contas)
ALTER TABLE integracoes_meta DROP CONSTRAINT IF EXISTS integracoes_meta_empresa_id_key;

-- Adicionar unique composto: mesma empresa não pode ter o mesmo ad_account_id duas vezes
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'integracoes_meta_empresa_account_unique'
  ) THEN
    ALTER TABLE integracoes_meta ADD CONSTRAINT integracoes_meta_empresa_account_unique UNIQUE (empresa_id, ad_account_id);
  END IF;
END $$;

-- ======================================
-- 9. Tabela: sync_logs_meta
-- Log de sincronizações
-- ======================================
CREATE TABLE IF NOT EXISTS sync_logs_meta (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    integracao_id UUID REFERENCES integracoes_meta(id) ON DELETE SET NULL,
    tipo TEXT NOT NULL,
    status TEXT NOT NULL,
    registros_processados INTEGER DEFAULT 0,
    registros_criados INTEGER DEFAULT 0,
    registros_atualizados INTEGER DEFAULT 0,
    erro_detalhe TEXT,
    iniciado_em TIMESTAMP WITH TIME ZONE DEFAULT now(),
    finalizado_em TIMESTAMP WITH TIME ZONE
);

-- Migração: adicionar integracao_id se a tabela já existia
ALTER TABLE sync_logs_meta ADD COLUMN IF NOT EXISTS integracao_id UUID REFERENCES integracoes_meta(id) ON DELETE SET NULL;

-- ======================================
-- Índices
-- ======================================
CREATE INDEX IF NOT EXISTS idx_integracoes_empresa ON integracoes_meta(empresa_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_empresa ON sync_logs_meta(empresa_id, iniciado_em DESC);

-- ======================================
-- Row Level Security (RLS)
-- ======================================
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE funis ENABLE ROW LEVEL SECURITY;
ALTER TABLE campanhas ENABLE ROW LEVEL SECURITY;
ALTER TABLE conjuntos_anuncio ENABLE ROW LEVEL SECURITY;
ALTER TABLE anuncios ENABLE ROW LEVEL SECURITY;
ALTER TABLE metricas ENABLE ROW LEVEL SECURITY;
ALTER TABLE integracoes_meta ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_logs_meta ENABLE ROW LEVEL SECURITY;

-- Permitir acesso para desenvolvimento
DROP POLICY IF EXISTS "Enable all access" ON empresas;
CREATE POLICY "Enable all access" ON empresas FOR ALL USING (true);

DROP POLICY IF EXISTS "Enable all access" ON usuarios;
CREATE POLICY "Enable all access" ON usuarios FOR ALL USING (true);

DROP POLICY IF EXISTS "Enable all access" ON funis;
CREATE POLICY "Enable all access" ON funis FOR ALL USING (true);

DROP POLICY IF EXISTS "Enable all access" ON campanhas;
CREATE POLICY "Enable all access" ON campanhas FOR ALL USING (true);

DROP POLICY IF EXISTS "Enable all access" ON conjuntos_anuncio;
CREATE POLICY "Enable all access" ON conjuntos_anuncio FOR ALL USING (true);

DROP POLICY IF EXISTS "Enable all access" ON anuncios;
CREATE POLICY "Enable all access" ON anuncios FOR ALL USING (true);

DROP POLICY IF EXISTS "Enable all access" ON metricas;
CREATE POLICY "Enable all access" ON metricas FOR ALL USING (true);

DROP POLICY IF EXISTS "Enable all access" ON integracoes_meta;
CREATE POLICY "Enable all access" ON integracoes_meta FOR ALL USING (true);

DROP POLICY IF EXISTS "Enable all access" ON sync_logs_meta;
CREATE POLICY "Enable all access" ON sync_logs_meta FOR ALL USING (true);

-- ======================================
-- PRONTO! Schema completo criado
-- ======================================
-- Agora você pode:
-- 1. Criar um usuário na Auth do Supabase
-- 2. Criar um registro na tabela usuarios ligando ao auth.users
-- 3. Usar a aplicação normalmente
-- ======================================
