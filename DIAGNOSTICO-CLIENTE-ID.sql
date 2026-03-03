-- ================================================
-- DIAGNÓSTICO: Verificar dados de cliente_id
-- ================================================

-- 1. Verificar se a coluna existe
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'metricas' 
  AND column_name = 'cliente_id';

-- 2. Verificar quantas métricas têm cliente_id
SELECT 
  COUNT(*) as total_metricas,
  COUNT(cliente_id) as com_cliente_id,
  COUNT(*) - COUNT(cliente_id) as sem_cliente_id
FROM metricas;

-- 3. Ver distribuição por tipo
SELECT 
  tipo,
  COUNT(*) as total,
  COUNT(cliente_id) as com_cliente,
  COUNT(*) - COUNT(cliente_id) as sem_cliente
FROM metricas
GROUP BY tipo
ORDER BY tipo;

-- 4. Ver clientes e suas métricas
SELECT 
  c.id as cliente_id,
  c.nome as cliente_nome,
  COUNT(m.id) as total_metricas
FROM clientes c
LEFT JOIN metricas m ON m.cliente_id = c.id
GROUP BY c.id, c.nome
ORDER BY c.nome;

-- 5. Ver métricas recentes de cada cliente
SELECT 
  c.nome as cliente,
  m.tipo,
  m.periodo_inicio,
  m.investimento,
  m.leads
FROM metricas m
JOIN clientes c ON c.id = m.cliente_id
WHERE m.periodo_inicio >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY c.nome, m.periodo_inicio DESC
LIMIT 20;

-- 6. Verificar métricas SEM cliente_id
SELECT 
  tipo,
  referencia_id,
  periodo_inicio,
  investimento
FROM metricas
WHERE cliente_id IS NULL
LIMIT 10;
