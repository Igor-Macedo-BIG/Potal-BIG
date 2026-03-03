-- MIGRAÇÃO COMPLETA MULTI-TENANT - TODAS AS TABELAS
-- Execute TUDO de uma vez no Supabase

-- ==============================================================
-- PASSO 1: ADICIONAR COLUNA cliente_id EM TODAS AS TABELAS
-- ==============================================================

-- Adicionar em campanhas
ALTER TABLE campanhas ADD COLUMN IF NOT EXISTS cliente_id UUID REFERENCES clientes(id);

-- Adicionar em funis
ALTER TABLE funis ADD COLUMN IF NOT EXISTS cliente_id UUID REFERENCES clientes(id);

-- Adicionar em conjuntos_anuncio
ALTER TABLE conjuntos_anuncio ADD COLUMN IF NOT EXISTS cliente_id UUID REFERENCES clientes(id);

-- Adicionar em anuncios
ALTER TABLE anuncios ADD COLUMN IF NOT EXISTS cliente_id UUID REFERENCES clientes(id);

-- Já existe em metricas (verificamos anteriormente)

-- ==============================================================
-- PASSO 2: CRIAR ÍNDICES PARA PERFORMANCE
-- ==============================================================

CREATE INDEX IF NOT EXISTS idx_campanhas_cliente_id ON campanhas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_funis_cliente_id ON funis(cliente_id);
CREATE INDEX IF NOT EXISTS idx_conjuntos_anuncio_cliente_id ON conjuntos_anuncio(cliente_id);
CREATE INDEX IF NOT EXISTS idx_anuncios_cliente_id ON anuncios(cliente_id);
CREATE INDEX IF NOT EXISTS idx_metricas_cliente_id ON metricas(cliente_id);

-- ==============================================================
-- PASSO 3: VERIFICAR CLIENTES DISPONÍVEIS
-- ==============================================================

SELECT id, nome FROM clientes ORDER BY nome;

-- ==============================================================
-- PASSO 4: POPULAR cliente_id NAS TABELAS
-- ATENÇÃO: Descomente e substitua o UUID abaixo pelo cliente correto
-- Pegue o ID da query acima (query 3)
-- ==============================================================

-- Exemplo: Se o cliente for "Dr. Leonardo" com ID = 'abc123...'
-- Descomente e substitua TODAS as linhas abaixo:

-- UPDATE campanhas SET cliente_id = 'SEU-UUID-AQUI' WHERE cliente_id IS NULL;
-- UPDATE funis SET cliente_id = 'SEU-UUID-AQUI' WHERE cliente_id IS NULL;
-- UPDATE conjuntos_anuncio SET cliente_id = 'SEU-UUID-AQUI' WHERE cliente_id IS NULL;
-- UPDATE anuncios SET cliente_id = 'SEU-UUID-AQUI' WHERE cliente_id IS NULL;

-- ==============================================================
-- PASSO 5: POPULAR cliente_id NAS MÉTRICAS (AUTOMÁTICO)
-- Execute DEPOIS de popular as tabelas acima
-- ==============================================================

-- Atualizar métricas de campanha
UPDATE metricas m
SET cliente_id = c.cliente_id
FROM campanhas c
WHERE m.tipo = 'campanha' 
  AND m.referencia_id::uuid = c.id
  AND m.cliente_id IS NULL
  AND c.cliente_id IS NOT NULL;

-- Atualizar métricas de funil
UPDATE metricas m
SET cliente_id = f.cliente_id
FROM funis f
WHERE m.tipo = 'funil' 
  AND m.referencia_id::uuid = f.id
  AND m.cliente_id IS NULL
  AND f.cliente_id IS NOT NULL;

-- Atualizar métricas de público (conjunto de anúncio)
UPDATE metricas m
SET cliente_id = ca.cliente_id
FROM conjuntos_anuncio ca
WHERE m.tipo = 'publico' 
  AND m.referencia_id::uuid = ca.id
  AND m.cliente_id IS NULL
  AND ca.cliente_id IS NOT NULL;

-- Atualizar métricas de criativo (anúncio)
UPDATE metricas m
SET cliente_id = a.cliente_id
FROM anuncios a
WHERE m.tipo = 'criativo' 
  AND m.referencia_id::uuid = a.id
  AND m.cliente_id IS NULL
  AND a.cliente_id IS NOT NULL;

-- ==============================================================
-- PASSO 6: VERIFICAR RESULTADOS
-- ==============================================================

-- Ver campanhas
SELECT 
    COUNT(*) as total,
    COUNT(cliente_id) as com_cliente_id,
    COUNT(*) - COUNT(cliente_id) as sem_cliente_id
FROM campanhas;

-- Ver funis
SELECT 
    COUNT(*) as total,
    COUNT(cliente_id) as com_cliente_id,
    COUNT(*) - COUNT(cliente_id) as sem_cliente_id
FROM funis;

-- Ver conjuntos_anuncio
SELECT 
    COUNT(*) as total,
    COUNT(cliente_id) as com_cliente_id,
    COUNT(*) - COUNT(cliente_id) as sem_cliente_id
FROM conjuntos_anuncio;

-- Ver anuncios
SELECT 
    COUNT(*) as total,
    COUNT(cliente_id) as com_cliente_id,
    COUNT(*) - COUNT(cliente_id) as sem_cliente_id
FROM anuncios;

-- Ver métricas por tipo
SELECT 
    tipo,
    COUNT(*) as total,
    COUNT(cliente_id) as com_cliente_id,
    COUNT(*) - COUNT(cliente_id) as sem_cliente_id
FROM metricas
GROUP BY tipo;
