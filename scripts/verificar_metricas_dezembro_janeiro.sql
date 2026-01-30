-- =============================================
-- Verificar métricas de DEZEMBRO que terminam em JANEIRO
-- =============================================

-- 1. Contar métricas que começam em dezembro mas terminam em janeiro
SELECT 
  'Métricas dez→jan' as descricao,
  COUNT(*) as total,
  TO_CHAR(SUM(investimento), 'R$ 999,999.99') as investimento_total
FROM metricas
WHERE periodo_inicio < '2026-01-01'
  AND periodo_fim >= '2026-01-01';

-- 2. Detalhar essas métricas
SELECT 
  tipo,
  periodo_inicio,
  periodo_fim,
  TO_CHAR(investimento, 'R$ 999.99') as investimento,
  leads,
  SUBSTRING(referencia_id, 1, 8) as ref_id
FROM metricas
WHERE periodo_inicio < '2026-01-01'
  AND periodo_fim >= '2026-01-01'
ORDER BY investimento DESC
LIMIT 20;

-- 3. Comparação: Métricas que passam pelo filtro ERRADO vs CORRETO
SELECT 
  'FILTRO ERRADO (periodo_fim <= 2026-01-30)' as tipo_filtro,
  COUNT(*) as total,
  TO_CHAR(SUM(investimento), 'R$ 999,999.99') as investimento
FROM metricas
WHERE periodo_inicio >= '2026-01-01'
  AND periodo_fim <= '2026-01-30'

UNION ALL

SELECT 
  'FILTRO CORRETO (periodo_inicio <= 2026-01-30)' as tipo_filtro,
  COUNT(*) as total,
  TO_CHAR(SUM(investimento), 'R$ 999,999.99') as investimento
FROM metricas
WHERE periodo_inicio >= '2026-01-01'
  AND periodo_inicio <= '2026-01-30';
