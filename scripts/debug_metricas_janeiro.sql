-- =============================================
-- Debug: Métricas de Janeiro 2026
-- Ver TUDO que existe sem filtros
-- =============================================

-- 1. TOTAL por tipo (sem JOIN)
SELECT 
  tipo,
  COUNT(*) as total_registros,
  TO_CHAR(SUM(investimento), 'R$ 999,999.99') as investimento,
  SUM(leads) as leads
FROM metricas
WHERE periodo_inicio >= '2026-01-01'
  AND periodo_fim <= '2026-01-31'
GROUP BY tipo;

-- 2. TOTAL GERAL de Janeiro
SELECT 
  'TOTAL JANEIRO' as info,
  COUNT(*) as registros,
  TO_CHAR(SUM(investimento), 'R$ 999,999.99') as investimento,
  SUM(leads) as leads
FROM metricas
WHERE periodo_inicio >= '2026-01-01'
  AND periodo_fim <= '2026-01-31';

-- 3. Métricas de PÚBLICO em Janeiro
SELECT 
  'PÚBLICO' as tipo,
  COUNT(*) as registros,
  TO_CHAR(SUM(investimento), 'R$ 999,999.99') as investimento,
  SUM(leads) as leads
FROM metricas
WHERE tipo = 'publico'
  AND periodo_inicio >= '2026-01-01'
  AND periodo_fim <= '2026-01-31';

-- 4. Detalhes dos primeiros 10 registros de Janeiro
SELECT 
  tipo,
  periodo_inicio,
  periodo_fim,
  investimento,
  leads,
  referencia_id
FROM metricas
WHERE periodo_inicio >= '2026-01-01'
  AND periodo_fim <= '2026-01-31'
ORDER BY tipo, periodo_inicio
LIMIT 10;
