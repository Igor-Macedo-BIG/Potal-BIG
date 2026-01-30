-- =============================================
-- Comparar investimento TOTAL vs por FUNIL
-- =============================================

-- 1. TOTAL de Janeiro (TODOS os funis)
SELECT 
  'TOTAL (todos funis)' as tipo,
  COUNT(*) as registros,
  TO_CHAR(SUM(investimento), 'R$ 9,999.99') as investimento_total,
  SUM(leads) as leads
FROM metricas
WHERE periodo_inicio >= '2026-01-01'
  AND periodo_inicio <= '2026-01-30';

-- 2. FUNIL "Aplicação" (df09e4f5-9c1e-4146-b19e-b1d66ddb0613)
WITH funil_campanhas AS (
  SELECT id FROM campanhas WHERE funil_id = 'df09e4f5-9c1e-4146-b19e-b1d66ddb0613'
),
funil_publicos AS (
  SELECT id FROM conjuntos_anuncio WHERE campanha_id IN (SELECT id FROM funil_campanhas)
),
funil_criativos AS (
  SELECT id FROM anuncios WHERE conjunto_anuncio_id IN (SELECT id FROM funil_publicos)
)
SELECT 
  'FUNIL Aplicação' as tipo,
  COUNT(*) as registros,
  TO_CHAR(SUM(investimento), 'R$ 9,999.99') as investimento_total,
  SUM(leads) as leads
FROM metricas
WHERE periodo_inicio >= '2026-01-01'
  AND periodo_inicio <= '2026-01-30'
  AND (
    referencia_id = 'df09e4f5-9c1e-4146-b19e-b1d66ddb0613' OR
    referencia_id IN (SELECT id FROM funil_campanhas) OR
    referencia_id IN (SELECT id FROM funil_publicos) OR
    referencia_id IN (SELECT id FROM funil_criativos)
  );

-- 3. DIFERENÇA (outros funis)
WITH total AS (
  SELECT SUM(investimento) as inv FROM metricas
  WHERE periodo_inicio >= '2026-01-01' AND periodo_inicio <= '2026-01-30'
),
funil_aplicacao AS (
  SELECT SUM(m.investimento) as inv
  FROM metricas m
  WHERE periodo_inicio >= '2026-01-01' AND periodo_inicio <= '2026-01-30'
  AND (
    referencia_id IN (
      SELECT id FROM campanhas WHERE funil_id = 'df09e4f5-9c1e-4146-b19e-b1d66ddb0613'
    ) OR
    referencia_id IN (
      SELECT a.id FROM anuncios a
      JOIN conjuntos_anuncio ca ON a.conjunto_anuncio_id = ca.id
      JOIN campanhas c ON ca.campanha_id = c.id
      WHERE c.funil_id = 'df09e4f5-9c1e-4146-b19e-b1d66ddb0613'
    )
  )
)
SELECT 
  'OUTROS FUNIS (diferença)' as tipo,
  TO_CHAR((SELECT inv FROM total) - (SELECT inv FROM funil_aplicacao), 'R$ 9,999.99') as investimento;
