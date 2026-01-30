-- =============================================
-- Mostrar como está agrupando ERRADO
-- =============================================

-- 1. Agrupar por REFERENCIA_ID (jeito errado - atual)
SELECT 
  referencia_id,
  COUNT(*) as registros,
  TO_CHAR(SUM(investimento), 'R$ 9,999.99') as investimento_total
FROM metricas
WHERE periodo_inicio >= '2026-01-01'
  AND periodo_inicio <= '2026-01-30'
  AND tipo = 'criativo'
GROUP BY referencia_id
ORDER BY SUM(investimento) DESC;

-- 2. Mostrar TOTAL agrupando por referencia_id
SELECT 
  'TOTAL (agrupado por referencia_id)' as metodo,
  COUNT(DISTINCT referencia_id) as grupos,
  TO_CHAR(SUM(investimento), 'R$ 9,999.99') as investimento_total
FROM metricas
WHERE periodo_inicio >= '2026-01-01'
  AND periodo_inicio <= '2026-01-30'
  AND tipo = 'criativo';

-- 3. Mostrar TOTAL direto (jeito certo)
SELECT 
  'TOTAL (soma direta - CORRETO)' as metodo,
  COUNT(*) as registros,
  TO_CHAR(SUM(investimento), 'R$ 9,999.99') as investimento_total
FROM metricas
WHERE periodo_inicio >= '2026-01-01'
  AND periodo_inicio <= '2026-01-30'
  AND tipo = 'criativo';
