-- =============================================
-- Script: Investimento por Funil
-- Mostra quanto cada funil tem de investimento
-- =============================================

-- Investimento TOTAL (sem filtro de funil)
SELECT 
  'TOTAL GERAL (sem filtro)' as categoria,
  TO_CHAR(SUM(m.investimento), 'R$ 999,999.99') as investimento,
  SUM(m.leads) as leads
FROM metricas m
WHERE m.periodo_inicio >= '2026-01-01'
  AND m.periodo_fim <= '2026-01-31';

-- Investimento por FUNIL (agregando campanha + público + criativo)
SELECT 
  f.nome as funil,
  TO_CHAR(SUM(m.investimento), 'R$ 999,999.99') as investimento,
  SUM(m.leads) as leads,
  COUNT(DISTINCT m.referencia_id) as total_entidades
FROM funis f
LEFT JOIN campanhas c ON c.funil_id = f.id
LEFT JOIN metricas m ON (
  (m.tipo = 'campanha' AND m.referencia_id = c.id)
  OR (m.tipo = 'publico' AND m.referencia_id IN (
    SELECT ca.id FROM conjuntos_anuncio ca WHERE ca.campanha_id = c.id
  ))
  OR (m.tipo = 'criativo' AND m.referencia_id IN (
    SELECT a.id FROM anuncios a 
    JOIN conjuntos_anuncio ca ON ca.id = a.conjunto_anuncio_id
    WHERE ca.campanha_id = c.id
  ))
)
WHERE m.periodo_inicio >= '2026-01-01'
  AND m.periodo_fim <= '2026-01-31'
GROUP BY f.id, f.nome
ORDER BY SUM(m.investimento) DESC;

-- Métricas de CAMPANHA por funil
SELECT 
  'Campanhas por funil' as tipo,
  f.nome as funil,
  TO_CHAR(SUM(m.investimento), 'R$ 999,999.99') as investimento,
  SUM(m.leads) as leads
FROM metricas m
JOIN campanhas c ON c.id = m.referencia_id
JOIN funis f ON f.id = c.funil_id
WHERE m.tipo = 'campanha'
  AND m.periodo_inicio >= '2026-01-01'
  AND m.periodo_fim <= '2026-01-31'
GROUP BY f.id, f.nome
ORDER BY SUM(m.investimento) DESC;

-- Métricas de CRIATIVO por funil
SELECT 
  'Criativos por funil' as tipo,
  f.nome as funil,
  TO_CHAR(SUM(m.investimento), 'R$ 999,999.99') as investimento,
  SUM(m.leads) as leads
FROM metricas m
JOIN anuncios a ON a.id = m.referencia_id
JOIN conjuntos_anuncio ca ON ca.id = a.conjunto_anuncio_id
JOIN campanhas c ON c.id = ca.campanha_id
JOIN funis f ON f.id = c.funil_id
WHERE m.tipo = 'criativo'
  AND m.periodo_inicio >= '2026-01-01'
  AND m.periodo_fim <= '2026-01-31'
GROUP BY f.id, f.nome
ORDER BY SUM(m.investimento) DESC;
