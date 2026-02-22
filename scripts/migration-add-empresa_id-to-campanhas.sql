-- ============================================================
-- Migration: Adicionar meta_id e empresa_id à tabela campanhas
-- ============================================================
-- Problema: meta-sync.ts tenta inserir meta_id e empresa_id em campanhas,
-- mas essas colunas não existem na tabela, causando falha na sincronização

-- 1. Adicionar coluna meta_id (ID da campanha na Meta)
ALTER TABLE campanhas 
ADD COLUMN IF NOT EXISTS meta_id VARCHAR UNIQUE;

-- 2. Adicionar coluna empresa_id (para isolamento de dados por empresa)
ALTER TABLE campanhas 
ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE;

-- 3. Indexar para performance
CREATE INDEX IF NOT EXISTS idx_campanhas_meta_id ON campanhas(meta_id);
CREATE INDEX IF NOT EXISTS idx_campanhas_empresa_id ON campanhas(empresa_id);

-- 4. Verificar resultado
SELECT 
  column_name, 
  data_type, 
  is_nullable 
FROM information_schema.columns 
WHERE table_name = 'campanhas' 
ORDER BY ordinal_position;

-- ============================================================
-- BACKFILL: Atualizar campanhas antigas que ficaram com empresa_id NULL
-- (campanhas criadas antes desta migration)
-- ============================================================
UPDATE campanhas
SET empresa_id = (
  SELECT id FROM empresas ORDER BY created_at LIMIT 1
)
WHERE empresa_id IS NULL
  AND meta_id IS NOT NULL;

-- Verificar resultado final
SELECT 
  count(*) as total_campanhas,
  count(empresa_id) as com_empresa_id,
  count(*) - count(empresa_id) as sem_empresa_id
FROM campanhas;

-- ✅ Feito - agora campanhas podem ser criadas com meta_id e empresa_id
