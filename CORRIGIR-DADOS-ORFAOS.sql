-- CORRIGIR DADOS ÓRFÃOS (sem cliente_id)
-- Execute este SQL no Supabase para corrigir registros sem cliente

-- 1. Ver campanhas sem cliente_id
SELECT 
    id,
    nome,
    cliente_id
FROM campanhas
WHERE cliente_id IS NULL;

-- 2. Ver públicos sem cliente_id
SELECT 
    id,
    nome,
    cliente_id
FROM conjuntos_anuncio
WHERE cliente_id IS NULL;

-- 3. Ver funis sem cliente_id
SELECT 
    id,
    nome,
    cliente_id
FROM funis
WHERE cliente_id IS NULL;

-- 4. Ver todos os clientes disponíveis
SELECT id, nome FROM clientes ORDER BY nome;

-- ==============================================================
-- ATENÇÃO: ANTES DE EXECUTAR OS UPDATES ABAIXO
-- Identifique o ID do cliente correto (ex: Dr. Leonardo)
-- Substitua '00000000-0000-0000-0000-000000000000' pelo ID real
-- ==============================================================

-- 5. ATUALIZAR campanhas órfãs (substitua o UUID abaixo)
-- UPDATE campanhas 
-- SET cliente_id = '00000000-0000-0000-0000-000000000000'
-- WHERE cliente_id IS NULL;

-- 6. ATUALIZAR públicos órfãos (substitua o UUID abaixo)
-- UPDATE conjuntos_anuncio 
-- SET cliente_id = '00000000-0000-0000-0000-000000000000'
-- WHERE cliente_id IS NULL;

-- 7. ATUALIZAR funis órfãos (substitua o UUID abaixo)
-- UPDATE funis 
-- SET cliente_id = '00000000-0000-0000-0000-000000000000'
-- WHERE cliente_id IS NULL;

-- 8. DEPOIS, atualizar métricas com base nas campanhas
UPDATE metricas m
SET cliente_id = c.cliente_id
FROM campanhas c
WHERE m.tipo = 'campanha' 
  AND CAST(m.referencia_id AS UUID) = c.id
  AND m.cliente_id IS NULL
  AND c.cliente_id IS NOT NULL;

-- 9. Atualizar métricas com base nos conjuntos de anúncio (públicos)
UPDATE metricas m
SET cliente_id = ca.cliente_id
FROM conjuntos_anuncio ca
WHERE m.tipo = 'publico' 
  AND CAST(m.referencia_id AS UUID) = ca.id
  AND m.cliente_id IS NULL
  AND ca.cliente_id IS NOT NULL;

-- 10. Atualizar métricas com base nos funis
UPDATE metricas m
SET cliente_id = f.cliente_id
FROM funis f
WHERE m.tipo = 'funil' 
  AND CAST(m.referencia_id AS UUID) = f.id
  AND m.cliente_id IS NULL
  AND f.cliente_id IS NOT NULL;

-- 11. Atualizar métricas com base nos anúncios (criativos)
UPDATE metricas m
SET cliente_id = a.cliente_id
FROM anuncios a
WHERE m.tipo = 'criativo' 
  AND CAST(m.referencia_id AS UUID) = a.id
  AND m.cliente_id IS NULL
  AND a.cliente_id IS NOT NULL;

-- 12. VERIFICAR resultados após correção
SELECT 
    tipo,
    COUNT(*) as total,
    COUNT(cliente_id) as com_cliente,
    COUNT(*) - COUNT(cliente_id) as sem_cliente
FROM metricas
GROUP BY tipo;
