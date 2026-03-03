-- ============================================================
-- SETUP COMPLETO - PORTAL BIG (Agência Multi-Cliente)
-- Execute este script inteiro no SQL Editor do Supabase
-- Projeto: azumehnucufvhczmazoe
--
-- CONCEITO: Igor (admin da agência) gerencia múltiplos clientes.
-- Cada cliente = 1 empresa com sua própria conta de anúncio.
-- Dados reais vêm da sincronização com Meta Ads / Facebook.
-- NENHUM dado fake — tudo é puxado das contas reais.
-- ============================================================

-- ======================================
-- LIMPAR TABELAS EXISTENTES (ordem reversa por dependência)
-- ======================================
DROP TABLE IF EXISTS public.dashboard_metricas_config CASCADE;
DROP TABLE IF EXISTS public.sync_logs_kommo CASCADE;
DROP TABLE IF EXISTS public.kommo_snapshots CASCADE;
DROP TABLE IF EXISTS public.kommo_pipelines CASCADE;
DROP TABLE IF EXISTS public.integracoes_kommo CASCADE;
DROP TABLE IF EXISTS public.sync_logs_typebot CASCADE;
DROP TABLE IF EXISTS public.integracoes_typebot CASCADE;
DROP TABLE IF EXISTS public.sync_logs_meta CASCADE;
DROP TABLE IF EXISTS public.integracoes_meta CASCADE;
DROP TABLE IF EXISTS public.metricas CASCADE;
DROP TABLE IF EXISTS public.criativos CASCADE;
DROP TABLE IF EXISTS public.anuncios CASCADE;
DROP TABLE IF EXISTS public.conjuntos_anuncio CASCADE;
DROP TABLE IF EXISTS public.campanhas CASCADE;
DROP TABLE IF EXISTS public.funis CASCADE;
DROP TABLE IF EXISTS public.usuarios CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.empresas CASCADE;

-- ======================================
-- 1. TABELA: empresas (cada empresa = 1 cliente da agência)
-- ======================================
CREATE TABLE IF NOT EXISTS public.empresas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR NOT NULL,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "acesso_total_empresas" ON public.empresas;
CREATE POLICY "acesso_total_empresas" ON public.empresas FOR ALL USING (true);

-- ======================================
-- 2. TABELA: users (usada no login/middleware/sidebar - lado client)
-- ======================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  ativo BOOLEAN NOT NULL DEFAULT true,
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "acesso_total_users" ON public.users;
CREATE POLICY "acesso_total_users" ON public.users FOR ALL USING (true);

-- ======================================
-- 3. TABELA: usuarios (usada nas API routes server-side)
-- ======================================
CREATE TABLE IF NOT EXISTS public.usuarios (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  nome VARCHAR NOT NULL,
  email VARCHAR UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  ativo BOOLEAN NOT NULL DEFAULT true,
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "acesso_total_usuarios" ON public.usuarios;
CREATE POLICY "acesso_total_usuarios" ON public.usuarios FOR ALL USING (true);

-- ======================================
-- 4. TABELA: funis
-- ======================================
CREATE TABLE IF NOT EXISTS public.funis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR NOT NULL,
  descricao TEXT,
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.funis ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "acesso_total_funis" ON public.funis;
CREATE POLICY "acesso_total_funis" ON public.funis FOR ALL USING (true);

-- ======================================
-- 5. TABELA: campanhas
-- ======================================
CREATE TABLE IF NOT EXISTS public.campanhas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR NOT NULL,
  tipo VARCHAR CHECK (tipo IN ('vendas', 'leads', 'awareness')) DEFAULT 'leads',
  funil_id UUID REFERENCES public.funis(id) ON DELETE CASCADE,
  plataforma VARCHAR NOT NULL DEFAULT 'Meta Ads',
  ativo BOOLEAN DEFAULT true,
  meta_id TEXT,
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.campanhas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "acesso_total_campanhas" ON public.campanhas;
CREATE POLICY "acesso_total_campanhas" ON public.campanhas FOR ALL USING (true);

-- ======================================
-- 6. TABELA: conjuntos_anuncio
-- ======================================
CREATE TABLE IF NOT EXISTS public.conjuntos_anuncio (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR NOT NULL,
  campanha_id UUID REFERENCES public.campanhas(id) ON DELETE CASCADE,
  publico TEXT NOT NULL DEFAULT '',
  idade_min INTEGER DEFAULT 18,
  idade_max INTEGER DEFAULT 65,
  localizacao TEXT DEFAULT 'Brasil',
  ativo BOOLEAN DEFAULT true,
  meta_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.conjuntos_anuncio ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "acesso_total_conjuntos" ON public.conjuntos_anuncio;
CREATE POLICY "acesso_total_conjuntos" ON public.conjuntos_anuncio FOR ALL USING (true);

-- ======================================
-- 7. TABELA: anuncios
-- ======================================
CREATE TABLE IF NOT EXISTS public.anuncios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  tipo TEXT,
  conjunto_anuncio_id UUID REFERENCES public.conjuntos_anuncio(id) ON DELETE CASCADE,
  meta_id TEXT,
  thumbnail_url TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.anuncios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "acesso_total_anuncios" ON public.anuncios;
CREATE POLICY "acesso_total_anuncios" ON public.anuncios FOR ALL USING (true);

-- ======================================
-- 8. TABELA: criativos
-- ======================================
CREATE TABLE IF NOT EXISTS public.criativos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conjunto_id UUID REFERENCES public.conjuntos_anuncio(id) ON DELETE CASCADE,
  nome VARCHAR NOT NULL,
  tipo VARCHAR CHECK (tipo IN ('imagem', 'video', 'carrossel', 'texto')) NOT NULL,
  url_midia TEXT,
  descricao TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.criativos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "acesso_total_criativos" ON public.criativos;
CREATE POLICY "acesso_total_criativos" ON public.criativos FOR ALL USING (true);

-- ======================================
-- 9. TABELA: metricas (dados reais vindos do Meta Ads)
-- ======================================
CREATE TABLE IF NOT EXISTS public.metricas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo VARCHAR CHECK (tipo IN ('funil', 'campanha', 'conjunto', 'criativo', 'anuncio')) NOT NULL,
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
    CASE WHEN investimento > 0 THEN faturamento / investimento ELSE 0 END
  ) STORED,
  ctr DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE WHEN impressoes > 0 THEN (cliques::DECIMAL / impressoes::DECIMAL) * 100 ELSE 0 END
  ) STORED,
  cpm DECIMAL(10,2) GENERATED ALWAYS AS (
    CASE WHEN impressoes > 0 THEN (investimento / impressoes::DECIMAL) * 1000 ELSE 0 END
  ) STORED,
  cpc DECIMAL(10,2) GENERATED ALWAYS AS (
    CASE WHEN cliques > 0 THEN investimento / cliques::DECIMAL ELSE 0 END
  ) STORED,
  cpl DECIMAL(10,2) GENERATED ALWAYS AS (
    CASE WHEN leads > 0 THEN investimento / leads::DECIMAL ELSE 0 END
  ) STORED,
  taxa_conversao DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE WHEN leads > 0 THEN (vendas::DECIMAL / leads::DECIMAL) * 100 ELSE 0 END
  ) STORED,
  detalhe_sdr JSONB,
  detalhe_closer JSONB,
  detalhe_social_seller JSONB,
  detalhe_cs JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tipo, referencia_id, periodo_inicio, periodo_fim)
);

ALTER TABLE public.metricas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "acesso_total_metricas" ON public.metricas;
CREATE POLICY "acesso_total_metricas" ON public.metricas FOR ALL USING (true);

-- ======================================
-- 10. TABELA: integracoes_meta (1 integração por cliente/empresa)
-- ======================================
CREATE TABLE IF NOT EXISTS public.integracoes_meta (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
  access_token TEXT,
  ad_account_id TEXT,
  business_id TEXT,
  ativo BOOLEAN DEFAULT true,
  ultima_sincronizacao TIMESTAMP WITH TIME ZONE,
  erro_sincronizacao TEXT,
  sincronizar_automaticamente BOOLEAN DEFAULT false,
  intervalo_sincronizacao INTEGER DEFAULT 60,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.integracoes_meta ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "acesso_total_integracoes_meta" ON public.integracoes_meta;
CREATE POLICY "acesso_total_integracoes_meta" ON public.integracoes_meta FOR ALL USING (true);

-- ======================================
-- 11. TABELA: sync_logs_meta
-- ======================================
CREATE TABLE IF NOT EXISTS public.sync_logs_meta (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
  integracao_id UUID REFERENCES public.integracoes_meta(id) ON DELETE CASCADE,
  tipo TEXT,
  status TEXT CHECK (status IN ('running', 'success', 'partial', 'error')) DEFAULT 'running',
  registros_processados INTEGER DEFAULT 0,
  registros_criados INTEGER DEFAULT 0,
  registros_atualizados INTEGER DEFAULT 0,
  erro_detalhe TEXT,
  iniciado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  finalizado_em TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.sync_logs_meta ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "acesso_total_sync_logs_meta" ON public.sync_logs_meta;
CREATE POLICY "acesso_total_sync_logs_meta" ON public.sync_logs_meta FOR ALL USING (true);

-- ======================================
-- 12. TABELA: integracoes_typebot
-- ======================================
CREATE TABLE IF NOT EXISTS public.integracoes_typebot (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
  nome TEXT,
  typebot_id TEXT,
  api_token TEXT,
  base_url TEXT,
  ativo BOOLEAN DEFAULT true,
  variavel_nome TEXT,
  variavel_email TEXT,
  funil_id UUID REFERENCES public.funis(id) ON DELETE SET NULL,
  ultima_sincronizacao TIMESTAMP WITH TIME ZONE,
  erro_sincronizacao TEXT,
  total_sincronizados INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.integracoes_typebot ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "acesso_total_integracoes_typebot" ON public.integracoes_typebot;
CREATE POLICY "acesso_total_integracoes_typebot" ON public.integracoes_typebot FOR ALL USING (true);

-- ======================================
-- 13. TABELA: sync_logs_typebot
-- ======================================
CREATE TABLE IF NOT EXISTS public.sync_logs_typebot (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
  integracao_id UUID REFERENCES public.integracoes_typebot(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('running', 'success', 'partial', 'error')) DEFAULT 'running',
  periodo_inicio DATE,
  periodo_fim DATE,
  total_resultados INTEGER DEFAULT 0,
  iniciados INTEGER DEFAULT 0,
  concluidos INTEGER DEFAULT 0,
  erro_detalhe TEXT,
  detalhes JSONB,
  iniciado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  finalizado_em TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.sync_logs_typebot ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "acesso_total_sync_logs_typebot" ON public.sync_logs_typebot;
CREATE POLICY "acesso_total_sync_logs_typebot" ON public.sync_logs_typebot FOR ALL USING (true);

-- ======================================
-- 14. TABELA: integracoes_kommo
-- ======================================
CREATE TABLE IF NOT EXISTS public.integracoes_kommo (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
  nome TEXT,
  subdominio TEXT,
  access_token TEXT,
  ativo BOOLEAN DEFAULT true,
  funil_id UUID REFERENCES public.funis(id) ON DELETE SET NULL,
  ultima_sincronizacao TIMESTAMP WITH TIME ZONE,
  erro_sincronizacao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.integracoes_kommo ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "acesso_total_integracoes_kommo" ON public.integracoes_kommo;
CREATE POLICY "acesso_total_integracoes_kommo" ON public.integracoes_kommo FOR ALL USING (true);

-- ======================================
-- 15. TABELA: kommo_pipelines
-- ======================================
CREATE TABLE IF NOT EXISTS public.kommo_pipelines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  integracao_id UUID REFERENCES public.integracoes_kommo(id) ON DELETE CASCADE,
  pipeline_id_kommo BIGINT NOT NULL,
  nome TEXT,
  stages JSONB,
  mapeamento_departamentos JSONB,
  funil_id UUID REFERENCES public.funis(id) ON DELETE SET NULL,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(integracao_id, pipeline_id_kommo)
);

ALTER TABLE public.kommo_pipelines ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "acesso_total_kommo_pipelines" ON public.kommo_pipelines;
CREATE POLICY "acesso_total_kommo_pipelines" ON public.kommo_pipelines FOR ALL USING (true);

-- ======================================
-- 16. TABELA: kommo_snapshots
-- ======================================
CREATE TABLE IF NOT EXISTS public.kommo_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pipeline_ref_id UUID REFERENCES public.kommo_pipelines(id) ON DELETE CASCADE,
  data_referencia DATE NOT NULL,
  stage_id_kommo BIGINT,
  stage_nome TEXT,
  quantidade_leads INTEGER DEFAULT 0,
  valor_total DECIMAL(12,2) DEFAULT 0,
  nomes_leads TEXT,
  sincronizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.kommo_snapshots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "acesso_total_kommo_snapshots" ON public.kommo_snapshots;
CREATE POLICY "acesso_total_kommo_snapshots" ON public.kommo_snapshots FOR ALL USING (true);

-- ======================================
-- 17. TABELA: sync_logs_kommo
-- ======================================
CREATE TABLE IF NOT EXISTS public.sync_logs_kommo (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
  integracao_id UUID REFERENCES public.integracoes_kommo(id) ON DELETE CASCADE,
  pipeline_id_kommo BIGINT,
  status TEXT CHECK (status IN ('running', 'success', 'partial', 'error')) DEFAULT 'running',
  periodo_inicio DATE,
  periodo_fim DATE,
  iniciado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_leads INTEGER DEFAULT 0,
  leads_por_estagio JSONB,
  erro_detalhe TEXT,
  detalhes JSONB,
  finalizado_em TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.sync_logs_kommo ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "acesso_total_sync_logs_kommo" ON public.sync_logs_kommo;
CREATE POLICY "acesso_total_sync_logs_kommo" ON public.sync_logs_kommo FOR ALL USING (true);

-- ======================================
-- 18. TABELA: dashboard_metricas_config
-- ======================================
CREATE TABLE IF NOT EXISTS public.dashboard_metricas_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
  departamento TEXT CHECK (departamento IN ('sdr', 'closer')) NOT NULL,
  metrica_key TEXT NOT NULL,
  nome_original TEXT,
  nome_display TEXT,
  descricao TEXT,
  visivel BOOLEAN DEFAULT true,
  ordem INTEGER DEFAULT 0,
  icone TEXT,
  cor TEXT,
  gradiente TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(empresa_id, departamento, metrica_key)
);

ALTER TABLE public.dashboard_metricas_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "acesso_total_dashboard_config" ON public.dashboard_metricas_config;
CREATE POLICY "acesso_total_dashboard_config" ON public.dashboard_metricas_config FOR ALL USING (true);

-- ======================================
-- ÍNDICES PARA PERFORMANCE
-- ======================================
CREATE INDEX IF NOT EXISTS idx_users_empresa_id ON public.users(empresa_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_empresa_id ON public.usuarios(empresa_id);
CREATE INDEX IF NOT EXISTS idx_funis_empresa_id ON public.funis(empresa_id);
CREATE INDEX IF NOT EXISTS idx_campanhas_funil_id ON public.campanhas(funil_id);
CREATE INDEX IF NOT EXISTS idx_campanhas_empresa_id ON public.campanhas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_campanhas_meta_id ON public.campanhas(meta_id);
CREATE INDEX IF NOT EXISTS idx_conjuntos_campanha_id ON public.conjuntos_anuncio(campanha_id);
CREATE INDEX IF NOT EXISTS idx_conjuntos_meta_id ON public.conjuntos_anuncio(meta_id);
CREATE INDEX IF NOT EXISTS idx_anuncios_conjunto_id ON public.anuncios(conjunto_anuncio_id);
CREATE INDEX IF NOT EXISTS idx_anuncios_meta_id ON public.anuncios(meta_id);
CREATE INDEX IF NOT EXISTS idx_criativos_conjunto_id ON public.criativos(conjunto_id);
CREATE INDEX IF NOT EXISTS idx_metricas_tipo_ref ON public.metricas(tipo, referencia_id);
CREATE INDEX IF NOT EXISTS idx_metricas_periodo ON public.metricas(periodo_inicio, periodo_fim);
CREATE INDEX IF NOT EXISTS idx_integracoes_meta_empresa ON public.integracoes_meta(empresa_id);
CREATE INDEX IF NOT EXISTS idx_integracoes_typebot_empresa ON public.integracoes_typebot(empresa_id);
CREATE INDEX IF NOT EXISTS idx_integracoes_kommo_empresa ON public.integracoes_kommo(empresa_id);
CREATE INDEX IF NOT EXISTS idx_kommo_pipelines_integracao ON public.kommo_pipelines(integracao_id);
CREATE INDEX IF NOT EXISTS idx_kommo_snapshots_pipeline ON public.kommo_snapshots(pipeline_ref_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_config_empresa ON public.dashboard_metricas_config(empresa_id);

-- ======================================
-- FUNÇÃO: update_updated_at automático
-- ======================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'empresas', 'usuarios', 'funis', 'campanhas',
    'conjuntos_anuncio', 'anuncios', 'criativos',
    'integracoes_meta', 'integracoes_typebot', 'integracoes_kommo',
    'kommo_pipelines', 'kommo_snapshots', 'dashboard_metricas_config'
  ]) LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS update_%I_updated_at ON public.%I;
      CREATE TRIGGER update_%I_updated_at
        BEFORE UPDATE ON public.%I
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    ', tbl, tbl, tbl, tbl);
  END LOOP;
END $$;

-- ======================================
-- VERIFICAÇÃO FINAL
-- ======================================
SELECT 
  'SETUP COMPLETO! Schema limpo pronto para dados reais.' as status,
  (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE') as total_tabelas;

-- ============================================================
-- PRÓXIMOS PASSOS:
--
-- 1. Vá em Authentication > Users > Add user
--    Email: seu-email@gmail.com | Senha: sua-senha | Auto Confirm: ON
--
-- 2. Copie o UUID gerado e execute:
--
--    INSERT INTO public.users (id, nome, email, role, ativo)
--    VALUES ('SEU-UUID-AQUI', 'Igor Macedo', 'seu-email@gmail.com', 'admin', true);
--
--    INSERT INTO public.usuarios (id, nome, email, role, ativo)
--    VALUES ('SEU-UUID-AQUI', 'Igor Macedo', 'seu-email@gmail.com', 'admin', true);
--
-- 3. Faça login no portal
-- 4. Na aba Admin, crie seus clientes (empresas)
-- 5. Para cada cliente, vincule a conta de anúncio em Configurações
-- 6. Sincronize os dados reais do Meta Ads
-- ============================================================
