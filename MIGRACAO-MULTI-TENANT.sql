-- ============================================
-- MIGRAÇÃO: Sistema Multi-Tenant por Cliente
-- ============================================

-- 1. Adicionar cliente_id nas tabelas principais
ALTER TABLE funis 
ADD COLUMN IF NOT EXISTS cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL;

ALTER TABLE campanhas 
ADD COLUMN IF NOT EXISTS cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL;

-- 2. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_funis_cliente_id ON funis(cliente_id);
CREATE INDEX IF NOT EXISTS idx_campanhas_cliente_id ON campanhas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_clientes_empresa_id ON clientes(empresa_id);

-- 3. Atualizar registros existentes (vincular ao primeiro cliente ou NULL)
-- IMPORTANTE: Execute isso apenas se já tiver clientes cadastrados
-- DO $$
-- DECLARE
--   primeiro_cliente_id UUID;
-- BEGIN
--   SELECT id INTO primeiro_cliente_id FROM clientes LIMIT 1;
--   
--   IF primeiro_cliente_id IS NOT NULL THEN
--     UPDATE funis SET cliente_id = primeiro_cliente_id WHERE cliente_id IS NULL;
--     UPDATE campanhas SET cliente_id = primeiro_cliente_id WHERE cliente_id IS NULL;
--   END IF;
-- END $$;

-- 4. Adicionar constraint NOT NULL após migração (opcional, apenas após vincular todos os registros)
-- ALTER TABLE funis ALTER COLUMN cliente_id SET NOT NULL;
-- ALTER TABLE campanhas ALTER COLUMN cliente_id SET NOT NULL;

-- 5. Função helper para buscar dados por cliente
CREATE OR REPLACE FUNCTION get_metricas_by_cliente(p_cliente_id UUID, p_periodo_dias INTEGER DEFAULT 30)
RETURNS TABLE (
  total_impressoes BIGINT,
  total_cliques BIGINT,
  total_leads BIGINT,
  total_investimento DECIMAL,
  ctr DECIMAL,
  cpl DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(m.impressoes), 0)::BIGINT as total_impressoes,
    COALESCE(SUM(m.cliques), 0)::BIGINT as total_cliques,
    COALESCE(SUM(m.leads), 0)::BIGINT as total_leads,
    COALESCE(SUM(m.investimento), 0)::DECIMAL as total_investimento,
    CASE 
      WHEN SUM(m.impressoes) > 0 THEN (SUM(m.cliques)::DECIMAL / SUM(m.impressoes) * 100)
      ELSE 0 
    END as ctr,
    CASE 
      WHEN SUM(m.leads) > 0 THEN (SUM(m.investimento)::DECIMAL / SUM(m.leads))
      ELSE 0 
    END as cpl
  FROM metricas m
  INNER JOIN campanhas c ON m.referencia_id = c.id AND m.tipo = 'campanha'
  WHERE c.cliente_id = p_cliente_id
    AND m.periodo_inicio >= CURRENT_DATE - (p_periodo_dias || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_metricas_by_cliente IS 'Retorna métricas agregadas por cliente em um período específico';
