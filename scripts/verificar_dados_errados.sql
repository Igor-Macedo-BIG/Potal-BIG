-- =============================================
-- IMPORTANTE: Verificar dados antes de corrigir
-- NÃO EXECUTE sem ver o resultado primeiro!
-- =============================================

-- 1. Ver métricas de criativo com referencia_id ERRADO
SELECT 
  m.id as metrica_id,
  m.tipo,
  m.referencia_id,
  m.periodo_inicio,
  m.investimento,
  m.leads,
  -- Verificar se referencia_id existe na tabela anuncios
  CASE 
    WHEN EXISTS (SELECT 1 FROM anuncios WHERE id = m.referencia_id) THEN '✅ É um criativo válido'
    WHEN EXISTS (SELECT 1 FROM campanhas WHERE id = m.referencia_id) THEN '❌ É uma CAMPANHA (ERRADO!)'
    WHEN EXISTS (SELECT 1 FROM conjuntos_anuncio WHERE id = m.referencia_id) THEN '❌ É um PÚBLICO (ERRADO!)'
    ELSE '❌ ID não existe em lugar nenhum'
  END as status
FROM metricas m
WHERE m.tipo = 'criativo'
  AND m.periodo_inicio >= '2026-01-01'
  AND m.periodo_fim <= '2026-01-31'
ORDER BY m.periodo_inicio
LIMIT 20;

-- 2. Contar quantos estão errados
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM anuncios WHERE id = m.referencia_id) THEN 'Correto - ID de anuncio'
    WHEN EXISTS (SELECT 1 FROM campanhas WHERE id = m.referencia_id) THEN 'ERRADO - ID de campanha'
    WHEN EXISTS (SELECT 1 FROM conjuntos_anuncio WHERE id = m.referencia_id) THEN 'ERRADO - ID de público'
    ELSE 'ERRADO - ID inexistente'
  END as status,
  COUNT(*) as total,
  TO_CHAR(SUM(investimento), 'R$ 999,999.99') as investimento_total
FROM metricas m
WHERE m.tipo = 'criativo'
  AND m.periodo_inicio >= '2026-01-01'
  AND m.periodo_fim <= '2026-01-31'
GROUP BY 
  CASE 
    WHEN EXISTS (SELECT 1 FROM anuncios WHERE id = m.referencia_id) THEN 'Correto - ID de anuncio'
    WHEN EXISTS (SELECT 1 FROM campanhas WHERE id = m.referencia_id) THEN 'ERRADO - ID de campanha'
    WHEN EXISTS (SELECT 1 FROM conjuntos_anuncio WHERE id = m.referencia_id) THEN 'ERRADO - ID de público'
    ELSE 'ERRADO - ID inexistente'
  END;
