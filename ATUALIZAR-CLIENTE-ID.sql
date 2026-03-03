-- Atualizar registros sem cliente_id com o ID do Dr. Leonardo
-- ID: 265b7609-5310-4b3b-8806-157eb86a48bd

-- Atualizar campanha sem cliente_id
UPDATE campanhas 
SET cliente_id = '265b7609-5310-4b3b-8806-157eb86a48bd'
WHERE cliente_id IS NULL;

-- Atualizar publico sem cliente_id
UPDATE publicos 
SET cliente_id = '265b7609-5310-4b3b-8806-157eb86a48bd'
WHERE cliente_id IS NULL;

-- Verificar resultados
SELECT 'campanhas' as tabela, COUNT(*) as total, 
       SUM(CASE WHEN cliente_id IS NOT NULL THEN 1 ELSE 0 END) as com_cliente_id,
       SUM(CASE WHEN cliente_id IS NULL THEN 1 ELSE 0 END) as sem_cliente_id
FROM campanhas
UNION ALL
SELECT 'publicos' as tabela, COUNT(*) as total,
       SUM(CASE WHEN cliente_id IS NOT NULL THEN 1 ELSE 0 END) as com_cliente_id,
       SUM(CASE WHEN cliente_id IS NULL THEN 1 ELSE 0 END) as sem_cliente_id
FROM publicos;
