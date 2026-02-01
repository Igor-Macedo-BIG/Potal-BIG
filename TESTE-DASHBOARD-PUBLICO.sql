-- Script SQL para Testar Dashboard Público
-- Execute no Supabase SQL Editor

-- 1. Verificar clientes cadastrados
SELECT 
  id,
  nome,
  logo_url,
  cor_primaria,
  cor_secundaria,
  created_at
FROM clientes
ORDER BY nome;

-- 2. Verificar métricas do Dr. Leonardo
SELECT 
  m.id,
  m.data,
  m.impressoes,
  m.cliques,
  m.ctr,
  m.conversoes,
  m.custo,
  m.receita,
  m.roas,
  c.nome as campanha,
  f.nome as funil
FROM metricas m
JOIN campanhas c ON m.campanha_id = c.id
JOIN funis f ON c.funil_id = f.id
WHERE m.cliente_id = '265b7609-5310-4b3b-8806-157eb86a48bd'
  AND m.data >= DATE_TRUNC('month', CURRENT_DATE)
ORDER BY m.data DESC;

-- 3. Verificar métricas do Guezzo Imóveis
SELECT 
  m.id,
  m.data,
  m.impressoes,
  m.cliques,
  m.ctr,
  m.conversoes,
  m.custo,
  m.receita,
  m.roas,
  c.nome as campanha,
  f.nome as funil
FROM metricas m
JOIN campanhas c ON m.campanha_id = c.id
JOIN funis f ON c.funil_id = f.id
WHERE m.cliente_id = '785805f4-44f3-4a5a-96fc-78dab21ac435'
  AND m.data >= DATE_TRUNC('month', CURRENT_DATE)
ORDER BY m.data DESC;

-- 4. Totalizadores para Dr. Leonardo (deve corresponder ao dashboard)
SELECT 
  '265b7609-5310-4b3b-8806-157eb86a48bd' as cliente_id,
  'Dr. Leonardo' as cliente_nome,
  SUM(m.impressoes) as total_impressoes,
  SUM(m.cliques) as total_cliques,
  ROUND((SUM(m.cliques)::DECIMAL / NULLIF(SUM(m.impressoes), 0) * 100), 2) as ctr_medio,
  SUM(m.conversoes) as total_conversoes,
  SUM(m.custo) as total_investido,
  SUM(m.receita) as total_receita,
  ROUND((SUM(m.receita) / NULLIF(SUM(m.custo), 0)), 2) as roas_medio,
  SUM(m.receita) - SUM(m.custo) as lucro_liquido
FROM metricas m
WHERE m.cliente_id = '265b7609-5310-4b3b-8806-157eb86a48bd'
  AND m.data >= DATE_TRUNC('month', CURRENT_DATE);

-- 5. Totalizadores para Guezzo Imóveis
SELECT 
  '785805f4-44f3-4a5a-96fc-78dab21ac435' as cliente_id,
  'Guezzo Imóveis' as cliente_nome,
  SUM(m.impressoes) as total_impressoes,
  SUM(m.cliques) as total_cliques,
  ROUND((SUM(m.cliques)::DECIMAL / NULLIF(SUM(m.impressoes), 0) * 100), 2) as ctr_medio,
  SUM(m.conversoes) as total_conversoes,
  SUM(m.custo) as total_investido,
  SUM(m.receita) as total_receita,
  ROUND((SUM(m.receita) / NULLIF(SUM(m.custo), 0)), 2) as roas_medio,
  SUM(m.receita) - SUM(m.custo) as lucro_liquido
FROM metricas m
WHERE m.cliente_id = '785805f4-44f3-4a5a-96fc-78dab21ac435'
  AND m.data >= DATE_TRUNC('month', CURRENT_DATE);

-- 6. Verificar se há métricas sem cliente_id (deveria estar vazio agora)
SELECT COUNT(*) as metricas_sem_cliente
FROM metricas
WHERE cliente_id IS NULL;

-- 7. Contagem de métricas por cliente
SELECT 
  cl.nome as cliente,
  COUNT(m.id) as total_metricas,
  MIN(m.data) as primeira_metrica,
  MAX(m.data) as ultima_metrica
FROM clientes cl
LEFT JOIN metricas m ON m.cliente_id = cl.id
GROUP BY cl.id, cl.nome
ORDER BY total_metricas DESC;
