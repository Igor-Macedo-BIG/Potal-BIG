-- ========================================
-- LIMPAR MÉTRICAS ÓRFÃS
-- ========================================

-- PASSO 1: VERIFICAR MÉTRICAS ÓRFÃS (executar primeiro para conferir)
-- ========================================

-- 1.1 Métricas sem cliente_id
SELECT 'SEM CLIENTE_ID' as problema, COUNT(*) as total, tipo
FROM metricas
WHERE cliente_id IS NULL
GROUP BY tipo;

-- 1.2 Métricas com cliente_id inexistente
SELECT 'CLIENTE_ID INVÁLIDO' as problema, COUNT(*) as total, m.cliente_id
FROM metricas m
LEFT JOIN clientes c ON c.id = m.cliente_id
WHERE c.id IS NULL AND m.cliente_id IS NOT NULL
GROUP BY m.cliente_id;

-- 1.3 Métricas de campanhas com referencia_id inexistente
SELECT 'CAMPANHA INEXISTENTE' as problema, COUNT(*) as total
FROM metricas m
LEFT JOIN campanhas c ON c.id = m.referencia_id
WHERE m.tipo = 'campanha' 
  AND c.id IS NULL;

-- 1.4 Métricas de funis com referencia_id inexistente
SELECT 'FUNIL INEXISTENTE' as problema, COUNT(*) as total
FROM metricas m
LEFT JOIN funis f ON f.id = m.referencia_id
WHERE m.tipo = 'funil' 
  AND f.id IS NULL;

-- 1.5 Métricas de anúncios com referencia_id inexistente
SELECT 'ANUNCIO INEXISTENTE' as problema, COUNT(*) as total
FROM metricas m
LEFT JOIN anuncios a ON a.id = m.referencia_id
WHERE m.tipo = 'criativo' 
  AND a.id IS NULL;

-- ========================================
-- PASSO 2: EXCLUIR MÉTRICAS ÓRFÃS
-- Descomente apenas DEPOIS de verificar os dados acima!
-- ========================================

-- 2.1 Excluir métricas sem cliente_id
-- DELETE FROM metricas WHERE cliente_id IS NULL;

-- 2.2 Excluir métricas com cliente_id inexistente
-- DELETE FROM metricas m
-- WHERE NOT EXISTS (
--     SELECT 1 FROM clientes c WHERE c.id = m.cliente_id
-- );

-- 2.3 Excluir métricas de campanhas com referencia_id inexistente
-- DELETE FROM metricas m
-- WHERE m.tipo = 'campanha' 
--   AND NOT EXISTS (
--       SELECT 1 FROM campanhas c WHERE c.id = m.referencia_id
--   );

-- 2.4 Excluir métricas de funis com referencia_id inexistente
-- DELETE FROM metricas m
-- WHERE m.tipo = 'funil' 
--   AND NOT EXISTS (
--       SELECT 1 FROM funis f WHERE f.id = m.referencia_id
--   );

-- 2.5 Excluir métricas de anúncios com referencia_id inexistente
-- DELETE FROM metricas m
-- WHERE m.tipo = 'criativo' 
--   AND NOT EXISTS (
--       SELECT 1 FROM anuncios a WHERE a.id = m.referencia_id
--   );

-- ========================================
-- PASSO 3: VERIFICAR RESULTADO
-- ========================================

-- Contar métricas restantes por cliente
SELECT c.nome as cliente, COUNT(m.id) as total_metricas
FROM clientes c
LEFT JOIN metricas m ON m.cliente_id = c.id
GROUP BY c.id, c.nome
ORDER BY c.nome;
