-- ============================================
-- Kommo CRM Integration — Setup Completo
-- Executar no Supabase SQL Editor
-- ============================================

-- 1. Tabela de integrações Kommo
CREATE TABLE IF NOT EXISTS integracoes_kommo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL DEFAULT 'Kommo CRM',
  subdominio VARCHAR(255) NOT NULL, -- ex: 'lidiacabralconsultoria'
  access_token TEXT NOT NULL,        -- long-lived token
  ativo BOOLEAN DEFAULT true,
  funil_id UUID REFERENCES funis(id) ON DELETE SET NULL, -- vincula ao funil interno
  ultima_sincronizacao TIMESTAMPTZ,
  erro_sincronizacao TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(empresa_id, subdominio)
);

-- 2. Tabela de pipelines Kommo (cache de metadados)
CREATE TABLE IF NOT EXISTS kommo_pipelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integracao_id UUID NOT NULL REFERENCES integracoes_kommo(id) ON DELETE CASCADE,
  pipeline_id_kommo INTEGER NOT NULL,       -- ID da pipeline na Kommo
  nome VARCHAR(255) NOT NULL,
  stages JSONB DEFAULT '[]'::jsonb,          -- [{id, name, sort, color, type}]
  mapeamento_departamentos JSONB DEFAULT '{}'::jsonb, -- {sdr: [stage_ids], closer: [stage_ids]}
  funil_id UUID REFERENCES funis(id) ON DELETE SET NULL, -- vincula pipeline a funil interno
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(integracao_id, pipeline_id_kommo)
);

-- 3. Tabela de snapshots diários (leads por estágio)
CREATE TABLE IF NOT EXISTS kommo_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_ref_id UUID NOT NULL REFERENCES kommo_pipelines(id) ON DELETE CASCADE,
  data_referencia DATE NOT NULL,
  stage_id_kommo INTEGER NOT NULL,
  stage_nome VARCHAR(255) NOT NULL,
  quantidade_leads INTEGER DEFAULT 0,
  valor_total NUMERIC(12,2) DEFAULT 0,
  nomes_leads TEXT DEFAULT '',  -- nomes separados por \n
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(pipeline_ref_id, data_referencia, stage_id_kommo)
);

-- 4. Tabela de logs de sincronização Kommo
CREATE TABLE IF NOT EXISTS sync_logs_kommo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  integracao_id UUID NOT NULL REFERENCES integracoes_kommo(id) ON DELETE CASCADE,
  pipeline_id_kommo INTEGER,
  status VARCHAR(20) DEFAULT 'running', -- running, success, partial, error
  periodo_inicio DATE,
  periodo_fim DATE,
  total_leads INTEGER DEFAULT 0,
  leads_por_estagio JSONB DEFAULT '[]'::jsonb, -- [{stage_id, stage_nome, quantidade, valor}]
  erro_detalhe TEXT,
  detalhes JSONB DEFAULT '{}'::jsonb,
  iniciado_em TIMESTAMPTZ DEFAULT now(),
  finalizado_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Adicionar detalhe_closer à tabela metricas (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'metricas' AND column_name = 'detalhe_closer'
  ) THEN
    ALTER TABLE metricas ADD COLUMN detalhe_closer JSONB;
  END IF;
END $$;

-- 6. Índices para performance
CREATE INDEX IF NOT EXISTS idx_kommo_snapshots_pipeline_data 
  ON kommo_snapshots(pipeline_ref_id, data_referencia);

CREATE INDEX IF NOT EXISTS idx_kommo_snapshots_stage 
  ON kommo_snapshots(stage_id_kommo);

CREATE INDEX IF NOT EXISTS idx_integracoes_kommo_empresa 
  ON integracoes_kommo(empresa_id);

CREATE INDEX IF NOT EXISTS idx_kommo_pipelines_integracao 
  ON kommo_pipelines(integracao_id);

CREATE INDEX IF NOT EXISTS idx_sync_logs_kommo_empresa 
  ON sync_logs_kommo(empresa_id, iniciado_em DESC);

CREATE INDEX IF NOT EXISTS idx_metricas_detalhe_closer 
  ON metricas USING gin(detalhe_closer) WHERE detalhe_closer IS NOT NULL;

-- 7. RLS (Row Level Security) 
ALTER TABLE integracoes_kommo ENABLE ROW LEVEL SECURITY;
ALTER TABLE kommo_pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE kommo_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_logs_kommo ENABLE ROW LEVEL SECURITY;

-- Policies para authenticated users (permissivo para admin)
DO $$
BEGIN
  -- integracoes_kommo
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'integracoes_kommo_all' AND tablename = 'integracoes_kommo') THEN
    CREATE POLICY integracoes_kommo_all ON integracoes_kommo FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
  
  -- kommo_pipelines
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'kommo_pipelines_all' AND tablename = 'kommo_pipelines') THEN
    CREATE POLICY kommo_pipelines_all ON kommo_pipelines FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
  
  -- kommo_snapshots
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'kommo_snapshots_all' AND tablename = 'kommo_snapshots') THEN
    CREATE POLICY kommo_snapshots_all ON kommo_snapshots FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
  
  -- sync_logs_kommo
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'sync_logs_kommo_all' AND tablename = 'sync_logs_kommo') THEN
    CREATE POLICY sync_logs_kommo_all ON sync_logs_kommo FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

SELECT 'Kommo CRM setup concluído com sucesso!' AS resultado;
