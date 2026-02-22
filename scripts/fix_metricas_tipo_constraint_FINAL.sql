-- ============================================================
-- EXECUTAR NO SUPABASE: Corrigir tabela metricas para Meta sync
-- ============================================================

-- 1. Remover constraint antiga de tipo
ALTER TABLE metricas DROP CONSTRAINT IF EXISTS metricas_tipo_check;

-- 2. Criar constraint nova que aceita TODOS os valores usados no sistema
ALTER TABLE metricas ADD CONSTRAINT metricas_tipo_check 
CHECK (tipo IN (
  'funil',        -- nível funil (dados manuais legados)
  'campanha',     -- nível campanha (Meta sync + manual)
  'conjunto',     -- nível conjunto de anúncios (Meta sync)
  'anuncio',      -- nível anúncio individual (Meta sync)
  'publico',      -- alias legado para conjunto
  'criativo'      -- alias legado para anuncio
));

-- 3. Garantir UNIQUE constraint para upsert funcionar (só adiciona se não existir)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conrelid = 'metricas'::regclass 
      AND contype = 'u'
      AND conname IN (
        'metricas_tipo_referencia_periodo_unique',
        'metricas_tipo_referencia_id_periodo_inicio_periodo_fim_key'
      )
  ) THEN
    ALTER TABLE metricas
      ADD CONSTRAINT metricas_tipo_referencia_periodo_unique
      UNIQUE (tipo, referencia_id, periodo_inicio, periodo_fim);
    RAISE NOTICE 'UNIQUE constraint criado!';
  ELSE
    RAISE NOTICE 'UNIQUE constraint já existia — pulado.';
  END IF;
END $$;

-- 4. Garantir que meta_id existe em conjuntos_anuncio e anuncios
ALTER TABLE conjuntos_anuncio ADD COLUMN IF NOT EXISTS meta_id TEXT;
CREATE INDEX IF NOT EXISTS idx_conjuntos_meta_id ON conjuntos_anuncio(meta_id);

ALTER TABLE anuncios ADD COLUMN IF NOT EXISTS meta_id TEXT;
CREATE INDEX IF NOT EXISTS idx_anuncios_meta_id ON anuncios(meta_id);

-- 5. Verificar resultado
SELECT 
  '✅ Migrações aplicadas!' AS status;

SELECT tipo, COUNT(*) as total
FROM metricas
GROUP BY tipo
ORDER BY tipo;
