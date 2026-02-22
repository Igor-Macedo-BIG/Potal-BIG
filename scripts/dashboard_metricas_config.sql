-- ============================================
-- Dashboard Métricas Config — Personalização
-- Executar no Supabase SQL Editor APÓS kommo_setup.sql
-- ============================================

-- Tabela de configuração de métricas do dashboard
-- Permite renomear métricas, adicionar descrição, ocultar/mostrar e reordenar
CREATE TABLE IF NOT EXISTS dashboard_metricas_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  departamento VARCHAR(20) NOT NULL CHECK (departamento IN ('sdr', 'closer')),
  metrica_key VARCHAR(100) NOT NULL, -- Nome técnico backend: ex: 'comecou_diagnostico', 'qualificados_para_mentoria'
  nome_original VARCHAR(255) NOT NULL, -- Nome padrão/original (read-only no front)
  nome_display VARCHAR(255) NOT NULL, -- Nome editavel pelo usuario (aparece no dashboard)
  descricao TEXT DEFAULT '', -- Observação explicativa da métrica
  visivel BOOLEAN DEFAULT true, -- Se aparece no dashboard
  ordem INTEGER DEFAULT 0, -- Ordem de exibição (menor = primeiro)
  icone VARCHAR(50) DEFAULT 'BarChart3', -- Nome do ícone Lucide
  cor VARCHAR(50) DEFAULT 'text-blue-400', -- Classe CSS de cor
  gradiente VARCHAR(100) DEFAULT 'from-blue-500/20 to-cyan-500/20', -- Gradiente do card
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(empresa_id, departamento, metrica_key)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_metricas_config_empresa_dept
  ON dashboard_metricas_config(empresa_id, departamento);

CREATE INDEX IF NOT EXISTS idx_metricas_config_visivel
  ON dashboard_metricas_config(empresa_id, departamento, visivel) WHERE visivel = true;

-- RLS
ALTER TABLE dashboard_metricas_config ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'dashboard_metricas_config_all' AND tablename = 'dashboard_metricas_config') THEN
    CREATE POLICY dashboard_metricas_config_all ON dashboard_metricas_config FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

SELECT 'Dashboard metricas config criada com sucesso!' AS resultado;
