-- Adicionar colunas de imagem na tabela anuncios
-- Executar no Supabase SQL Editor

ALTER TABLE anuncios ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE anuncios ADD COLUMN IF NOT EXISTS image_url TEXT;

COMMENT ON COLUMN anuncios.thumbnail_url IS 'URL da thumbnail do criativo (baixa resolução), sincronizada da Meta Ads API';
COMMENT ON COLUMN anuncios.image_url IS 'URL da imagem do criativo (alta resolução), sincronizada da Meta Ads API';
