-- ================================================
-- ADICIONAR cliente_id à tabela metricas
-- ================================================

-- 1. Adicionar coluna cliente_id na tabela metricas
ALTER TABLE metricas 
ADD COLUMN IF NOT EXISTS cliente_id UUID REFERENCES clientes(id);

-- 2. Popular cliente_id baseado nas referências existentes

-- Para métricas de funis
UPDATE metricas m
SET cliente_id = f.cliente_id
FROM funis f
WHERE m.tipo = 'funil' 
  AND CAST(m.referencia_id AS UUID) = f.id
  AND m.cliente_id IS NULL;

-- Para métricas de campanhas
UPDATE metricas m
SET cliente_id = c.cliente_id
FROM campanhas c
WHERE m.tipo = 'campanha' 
  AND CAST(m.referencia_id AS UUID) = c.id
  AND m.cliente_id IS NULL;

-- Para métricas de públicos (conjuntos_anuncio)
UPDATE metricas m
SET cliente_id = c.cliente_id
FROM conjuntos_anuncio ca
JOIN campanhas c ON ca.campanha_id = c.id
WHERE m.tipo = 'publico' 
  AND CAST(m.referencia_id AS UUID) = ca.id
  AND m.cliente_id IS NULL;

-- Para métricas de criativos (anuncios)
UPDATE metricas m
SET cliente_id = c.cliente_id
FROM anuncios a
JOIN conjuntos_anuncio ca ON a.conjunto_anuncio_id = ca.id
JOIN campanhas c ON ca.campanha_id = c.id
WHERE m.tipo = 'criativo' 
  AND CAST(m.referencia_id AS UUID) = a.id
  AND m.cliente_id IS NULL;

-- 3. Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_metricas_cliente_id ON metricas(cliente_id);

-- 4. Criar índice composto para queries comuns
CREATE INDEX IF NOT EXISTS idx_metricas_cliente_tipo_periodo 
ON metricas(cliente_id, tipo, periodo_inicio, periodo_fim);

-- Verificar resultados
SELECT 
  tipo,
  COUNT(*) as total,
  COUNT(cliente_id) as com_cliente_id,
  COUNT(*) - COUNT(cliente_id) as sem_cliente_id
FROM metricas
GROUP BY tipo
ORDER BY tipo;
