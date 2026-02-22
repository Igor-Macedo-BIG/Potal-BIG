-- ============================================================
-- MIGRATION: Adicionar empresa_id na tabela campanhas
-- Execute este script no Supabase SQL Editor
-- ============================================================

-- 1. Adicionar coluna empresa_id em campanhas
ALTER TABLE campanhas ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE;

-- 2. Preencher empresa_id nos registros existentes via funil
UPDATE campanhas c
SET empresa_id = f.empresa_id
FROM funis f
WHERE c.funil_id = f.id
  AND c.empresa_id IS NULL;

-- 3. Para campanhas sem funil (orphans do Meta sync), tentar preencher via integracoes_meta
-- (join por ad_account buscando a empresa da integração)
-- Este UPDATE só funciona se já existe empresa_id em integracoes_meta
UPDATE campanhas c
SET empresa_id = im.empresa_id
FROM integracoes_meta im
WHERE c.empresa_id IS NULL
  AND c.meta_id IS NOT NULL
  -- Pega a primeira integração ativa (a maioria tem apenas 1)
  AND im.id = (
    SELECT id FROM integracoes_meta WHERE ativo = true LIMIT 1
  );

-- 4. Conferir resultado
SELECT 
  count(*) as total_campanhas,
  count(empresa_id) as com_empresa_id,
  count(*) - count(empresa_id) as sem_empresa_id,
  count(funil_id) as com_funil,
  count(*) - count(funil_id) as sem_funil
FROM campanhas;

-- 5. Remover UNIQUE constraint antigua em integracoes_meta se ainda existir
ALTER TABLE integracoes_meta DROP CONSTRAINT IF EXISTS integracoes_meta_empresa_id_key;

-- 6. Garantir unique composto (empresa + ad_account)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'integracoes_meta_empresa_account_unique'
  ) THEN
    ALTER TABLE integracoes_meta 
      ADD CONSTRAINT integracoes_meta_empresa_account_unique 
      UNIQUE (empresa_id, ad_account_id);
  END IF;
END $$;

-- 7. Adicionar integracao_id em sync_logs_meta (para rastrear qual conta sincronizou)
ALTER TABLE sync_logs_meta ADD COLUMN IF NOT EXISTS integracao_id UUID REFERENCES integracoes_meta(id) ON DELETE SET NULL;

-- 8. Índices para performance
CREATE INDEX IF NOT EXISTS idx_campanhas_empresa_id ON campanhas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_campanhas_meta_funil ON campanhas(meta_id, funil_id);

-- Resultado final
SELECT 'Migração concluída com sucesso!' as status;
