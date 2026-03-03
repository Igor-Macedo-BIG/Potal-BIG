-- ========================================
-- DELETAR APENAS AS MÉTRICAS DO GUEZZO
-- ========================================

-- Guezzo Imóveis ID: 785805f4-44f3-4a5a-96fc-78dab21ac435

DELETE FROM metricas 
WHERE cliente_id = '785805f4-44f3-4a5a-96fc-78dab21ac435';

-- Verificar resultado
SELECT c.nome as cliente, COUNT(m.id) as total_metricas
FROM clientes c
LEFT JOIN metricas m ON m.cliente_id = c.id
GROUP BY c.id, c.nome
ORDER BY c.nome;
