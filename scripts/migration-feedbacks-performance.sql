-- ================================================
-- Migration: Feedbacks de Performance
-- Tabela para armazenar relatórios escritos (semanal/mensal)
-- que aparecem na página pública de relatório
-- ================================================

CREATE TABLE IF NOT EXISTS feedbacks_performance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('semanal', 'mensal')),
  titulo VARCHAR(255) NOT NULL,
  conteudo TEXT NOT NULL,
  periodo_inicio DATE NOT NULL,
  periodo_fim DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para busca por empresa e período
CREATE INDEX IF NOT EXISTS idx_feedbacks_empresa_periodo 
  ON feedbacks_performance(empresa_id, periodo_inicio, periodo_fim);

CREATE INDEX IF NOT EXISTS idx_feedbacks_empresa_tipo 
  ON feedbacks_performance(empresa_id, tipo);

-- RLS
ALTER TABLE feedbacks_performance ENABLE ROW LEVEL SECURITY;

-- Admins podem tudo
CREATE POLICY "admins_full_access_feedbacks" ON feedbacks_performance
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Leitura pública (para a página de relatório sem login)
CREATE POLICY "public_read_feedbacks" ON feedbacks_performance
  FOR SELECT
  TO anon
  USING (true);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_feedbacks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_feedbacks_updated_at
  BEFORE UPDATE ON feedbacks_performance
  FOR EACH ROW
  EXECUTE FUNCTION update_feedbacks_updated_at();
