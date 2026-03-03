-- Adicionar colunas faltantes na tabela portais_clientes

ALTER TABLE portais_clientes 
ADD COLUMN IF NOT EXISTS data_expiracao DATE,
ADD COLUMN IF NOT EXISTS cor_primaria VARCHAR(7) DEFAULT '#9333ea',
ADD COLUMN IF NOT EXISTS cor_secundaria VARCHAR(7) DEFAULT '#ec4899',
ADD COLUMN IF NOT EXISTS senha_hash TEXT,
ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS visualizacoes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS ultimo_acesso TIMESTAMP,
ADD COLUMN IF NOT EXISTS metricas_visiveis JSONB DEFAULT '["impressoes", "cliques", "ctr", "leads"]'::jsonb;

-- Atualizar valores padrão para registros existentes
UPDATE portais_clientes 
SET 
  cor_primaria = COALESCE(cor_primaria, '#9333ea'),
  cor_secundaria = COALESCE(cor_secundaria, '#ec4899'),
  ativo = COALESCE(ativo, true),
  visualizacoes = COALESCE(visualizacoes, 0)
WHERE cor_primaria IS NULL 
   OR cor_secundaria IS NULL 
   OR ativo IS NULL 
   OR visualizacoes IS NULL;
