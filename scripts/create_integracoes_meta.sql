-- Script SQL para criar tabelas de integração com Meta Marketing API
-- Execute este script no SQL Editor do Supabase
-- IMPORTANTE: Certifique-se que o schema base já foi criado (empresas, funis, campanhas, etc)

-- ======================================
-- 0. Verificar/Criar estrutura base se não existir
-- ======================================

-- Criar tabela empresas (se não existir)
CREATE TABLE IF NOT EXISTS empresas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR NOT NULL,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela funis (se não existir)
CREATE TABLE IF NOT EXISTS funis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR NOT NULL,
  descricao TEXT,
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela campanhas (se não existir)
CREATE TABLE IF NOT EXISTS campanhas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR NOT NULL,
  tipo VARCHAR,
  funil_id UUID REFERENCES funis(id) ON DELETE CASCADE,
  plataforma VARCHAR DEFAULT 'Meta Ads',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela conjuntos_anuncio (se não existir)
CREATE TABLE IF NOT EXISTS conjuntos_anuncio (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR NOT NULL,
  publico TEXT,
  ativo BOOLEAN DEFAULT true,
  campanha_id UUID REFERENCES campanhas(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela anuncios (se não existir)
CREATE TABLE IF NOT EXISTS anuncios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR NOT NULL,
  tipo TEXT,
  conjunto_anuncio_id UUID REFERENCES conjuntos_anuncio(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ======================================
-- 1. Tabela: integracoes_meta
-- Armazena credenciais OAuth e status da integração
-- ======================================
CREATE TABLE IF NOT EXISTS integracoes_meta (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    
    -- Credenciais OAuth
    access_token TEXT,
    token_expiry TIMESTAMP WITH TIME ZONE,
    
    -- IDs da conta
    ad_account_id TEXT,                    -- Ex: "act_123456789"
    business_id TEXT,                       -- Ex: "123456789"
    
    -- Status
    ativo BOOLEAN DEFAULT false,
    ultima_sincronizacao TIMESTAMP WITH TIME ZONE,
    erro_sincronizacao TEXT,
    
    -- Configurações
    sincronizar_automaticamente BOOLEAN DEFAULT false,
    intervalo_sincronizacao INTEGER DEFAULT 60,  -- minutos
    
    -- Metadados
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- Uma integração por empresa
    UNIQUE(empresa_id)
);

ALTER TABLE integracoes_meta ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all access for integracoes_meta" ON integracoes_meta;
CREATE POLICY "Enable all access for integracoes_meta" ON integracoes_meta
    FOR ALL USING (true);

COMMENT ON TABLE integracoes_meta IS 'Integrações com Meta Marketing API por empresa';
COMMENT ON COLUMN integracoes_meta.ad_account_id IS 'ID da conta de anúncios Meta (formato: act_XXXXXXX)';
COMMENT ON COLUMN integracoes_meta.access_token IS 'Token de acesso OAuth (criptografar em produção)';

-- ======================================
-- 2. Adicionar coluna meta_id nas tabelas existentes
-- Para fazer o mapeamento entre IDs locais e IDs da Meta
-- ======================================

-- Campanhas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campanhas' AND column_name = 'meta_id'
    ) THEN
        ALTER TABLE campanhas ADD COLUMN meta_id TEXT;
        CREATE INDEX idx_campanhas_meta_id ON campanhas(meta_id);
    END IF;
END $$;

-- Conjuntos de Anúncio
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'conjuntos_anuncio' AND column_name = 'meta_id'
    ) THEN
        ALTER TABLE conjuntos_anuncio ADD COLUMN meta_id TEXT;
        CREATE INDEX idx_conjuntos_meta_id ON conjuntos_anuncio(meta_id);
    END IF;
END $$;

-- Anúncios
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'anuncios' AND column_name = 'meta_id'
    ) THEN
        ALTER TABLE anuncios ADD COLUMN meta_id TEXT;
        CREATE INDEX idx_anuncios_meta_id ON anuncios(meta_id);
    END IF;
END $$;

-- ======================================
-- 3. Tabela: sync_logs_meta
-- Log de sincronizações para debug
-- ======================================
CREATE TABLE IF NOT EXISTS sync_logs_meta (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL,                     -- 'campanhas', 'conjuntos', 'anuncios', 'metricas'
    status TEXT NOT NULL,                   -- 'sucesso', 'erro', 'parcial'
    registros_processados INTEGER DEFAULT 0,
    registros_criados INTEGER DEFAULT 0,
    registros_atualizados INTEGER DEFAULT 0,
    erro_detalhe TEXT,
    iniciado_em TIMESTAMP WITH TIME ZONE DEFAULT now(),
    finalizado_em TIMESTAMP WITH TIME ZONE
);

ALTER TABLE sync_logs_meta ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all access for sync_logs_meta" ON sync_logs_meta;
CREATE POLICY "Enable all access for sync_logs_meta" ON sync_logs_meta
    FOR ALL USING (true);

COMMENT ON TABLE sync_logs_meta IS 'Log de sincronizações com Meta Marketing API';

-- ======================================
-- 4. Índices para performance
-- ======================================
CREATE INDEX IF NOT EXISTS idx_integracoes_empresa ON integracoes_meta(empresa_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_empresa ON sync_logs_meta(empresa_id, iniciado_em DESC);

-- ======================================
-- Pronto! Execute este script no Supabase SQL Editor
-- ======================================
