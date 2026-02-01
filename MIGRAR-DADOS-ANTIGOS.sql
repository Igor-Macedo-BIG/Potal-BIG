-- ============================================================
-- SCRIPT PARA MIGRAR DADOS ANTIGOS PARA O CLIENTE CORRETO
-- Execute PASSO A PASSO no Supabase SQL Editor
-- ============================================================

-- PASSO 1: Verificar clientes cadastrados
SELECT id, nome, created_at FROM clientes ORDER BY nome;

-- RESULTADO ESPERADO:
-- Você verá algo como:
-- id: 265b7609-5310-4b3b-8806-157eb86a48bd | nome: Dr. Leonardo
-- id: outro-uuid-aqui                      | nome: Guezzo Imóveis


-- ============================================================
-- PASSO 2: Copie o UUID do Dr. Leonardo e substitua abaixo
-- ============================================================

-- ATENÇÃO: Substitua 'COLE-O-UUID-DO-DR-LEONARDO-AQUI' pelo UUID real
-- Exemplo: '265b7609-5310-4b3b-8806-157eb86a48bd'

-- Atribuir FUNIS antigos (com cliente_id NULL) ao Dr. Leonardo
UPDATE funis 
SET cliente_id = 'COLE-O-UUID-DO-DR-LEONARDO-AQUI' 
WHERE cliente_id IS NULL;

-- Atribuir CAMPANHAS antigas ao Dr. Leonardo
UPDATE campanhas 
SET cliente_id = 'COLE-O-UUID-DO-DR-LEONARDO-AQUI' 
WHERE cliente_id IS NULL;

-- Atribuir CONJUNTOS DE ANÚNCIO antigos ao Dr. Leonardo
UPDATE conjuntos_anuncio 
SET cliente_id = 'COLE-O-UUID-DO-DR-LEONARDO-AQUI' 
WHERE cliente_id IS NULL;

-- Atribuir ANÚNCIOS antigos ao Dr. Leonardo
UPDATE anuncios 
SET cliente_id = 'COLE-O-UUID-DO-DR-LEONARDO-AQUI' 
WHERE cliente_id IS NULL;

-- Atribuir MÉTRICAS antigas ao Dr. Leonardo
UPDATE metricas 
SET cliente_id = 'COLE-O-UUID-DO-DR-LEONARDO-AQUI' 
WHERE cliente_id IS NULL;


-- ============================================================
-- PASSO 3: Verificar resultados
-- ============================================================

-- Ver funis por cliente
SELECT c.nome as cliente, COUNT(f.id) as total_funis
FROM clientes c
LEFT JOIN funis f ON f.cliente_id = c.id
GROUP BY c.nome
ORDER BY c.nome;

-- Ver campanhas por cliente
SELECT c.nome as cliente, COUNT(ca.id) as total_campanhas
FROM clientes c
LEFT JOIN campanhas ca ON ca.cliente_id = c.id
GROUP BY c.nome
ORDER BY c.nome;

-- Ver métricas por cliente
SELECT c.nome as cliente, COUNT(m.id) as total_metricas, SUM(m.investimento) as total_investimento
FROM clientes c
LEFT JOIN metricas m ON m.cliente_id = c.id
GROUP BY c.nome
ORDER BY c.nome;

-- Verificar se ainda existem dados sem cliente
SELECT 
  'funis' as tabela,
  COUNT(*) as sem_cliente
FROM funis WHERE cliente_id IS NULL
UNION ALL
SELECT 
  'campanhas',
  COUNT(*) 
FROM campanhas WHERE cliente_id IS NULL
UNION ALL
SELECT 
  'metricas',
  COUNT(*) 
FROM metricas WHERE cliente_id IS NULL;


-- ============================================================
-- RESULTADO ESPERADO:
-- ============================================================
-- Guezzo Imóveis: 0 funis, 0 campanhas, 0 métricas
-- Dr. Leonardo: X funis, Y campanhas, Z métricas (todos os dados antigos)
-- Sem cliente: 0 em todas as tabelas
