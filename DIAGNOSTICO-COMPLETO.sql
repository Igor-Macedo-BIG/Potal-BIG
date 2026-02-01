-- DIAGNÓSTICO COMPLETO - Multi-Tenant Métricas
-- Execute este SQL no Supabase SQL Editor para diagnosticar problemas

-- 1. Verificar se a coluna cliente_id existe na tabela metricas
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'metricas' AND column_name = 'cliente_id';

-- 2. Contar total de métricas e quantas têm cliente_id
SELECT 
    COUNT(*) as total_metricas,
    COUNT(cliente_id) as com_cliente_id,
    COUNT(*) - COUNT(cliente_id) as sem_cliente_id
FROM metricas;

-- 3. Ver distribuição de métricas por cliente
SELECT 
    c.nome as cliente_nome,
    m.tipo,
    COUNT(*) as quantidade_metricas,
    SUM(CAST(m.investimento AS DECIMAL)) as investimento_total,
    SUM(m.leads) as leads_total
FROM metricas m
LEFT JOIN clientes c ON c.id = m.cliente_id
GROUP BY c.nome, m.tipo
ORDER BY c.nome, m.tipo;

-- 4. Ver métricas SEM cliente_id (problemas)
SELECT 
    tipo,
    referencia_id,
    periodo_inicio,
    periodo_fim,
    investimento,
    leads
FROM metricas
WHERE cliente_id IS NULL
LIMIT 20;

-- 5. Ver métricas COM cliente_id (sucesso)
SELECT 
    c.nome as cliente,
    m.tipo,
    m.referencia_id,
    m.periodo_inicio,
    m.periodo_fim,
    m.investimento,
    m.leads
FROM metricas m
JOIN clientes c ON c.id = m.cliente_id
ORDER BY m.periodo_inicio DESC
LIMIT 20;

-- 6. Verificar relação entre funis e clientes
SELECT 
    c.nome as cliente_nome,
    f.nome as funil_nome,
    f.id as funil_id,
    f.cliente_id
FROM funis f
JOIN clientes c ON c.id = f.cliente_id
ORDER BY c.nome;

-- 7. Verificar métricas de funil que deveriam ter cliente_id
SELECT 
    m.id as metrica_id,
    m.tipo,
    m.referencia_id,
    m.cliente_id as metrica_cliente_id,
    f.nome as funil_nome,
    f.cliente_id as funil_cliente_id,
    c.nome as cliente_nome,
    CASE 
        WHEN m.cliente_id IS NULL THEN 'PROBLEMA: Métrica sem cliente_id'
        WHEN m.cliente_id != f.cliente_id THEN 'PROBLEMA: cliente_id diferente'
        ELSE 'OK'
    END as status
FROM metricas m
LEFT JOIN funis f ON CAST(m.referencia_id AS UUID) = f.id AND m.tipo = 'funil'
LEFT JOIN clientes c ON c.id = f.cliente_id
WHERE m.tipo = 'funil'
LIMIT 50;

-- 8. Ver campanhas e seus clientes
SELECT 
    c.nome as cliente_nome,
    ca.nome as campanha_nome,
    ca.id as campanha_id,
    ca.cliente_id
FROM campanhas ca
JOIN clientes c ON c.id = ca.cliente_id
ORDER BY c.nome;

-- 9. Verificar se há métricas de campanha sem cliente_id
SELECT 
    m.id as metrica_id,
    m.tipo,
    m.referencia_id,
    m.cliente_id as metrica_cliente_id,
    ca.nome as campanha_nome,
    ca.cliente_id as campanha_cliente_id,
    c.nome as cliente_nome,
    CASE 
        WHEN m.cliente_id IS NULL THEN 'PROBLEMA: Métrica sem cliente_id'
        WHEN m.cliente_id != ca.cliente_id THEN 'PROBLEMA: cliente_id diferente'
        ELSE 'OK'
    END as status
FROM metricas m
LEFT JOIN campanhas ca ON CAST(m.referencia_id AS UUID) = ca.id AND m.tipo = 'campanha'
LEFT JOIN clientes c ON c.id = ca.cliente_id
WHERE m.tipo = 'campanha'
LIMIT 50;

-- 10. Buscar métricas do cliente "Dr. Leonardo" especificamente
SELECT 
    c.nome as cliente,
    m.tipo,
    m.investimento,
    m.leads,
    m.impressoes,
    m.cliques,
    m.periodo_inicio,
    m.periodo_fim
FROM metricas m
JOIN clientes c ON c.id = m.cliente_id
WHERE c.nome LIKE '%Leonardo%'
ORDER BY m.periodo_inicio DESC;
