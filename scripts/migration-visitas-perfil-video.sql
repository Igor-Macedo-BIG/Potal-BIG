-- ================================================
-- Migration: Visitas ao Perfil + Reproduções de Vídeo
-- Novos campos na tabela metricas
-- ================================================

-- Adicionar coluna visitas_perfil
ALTER TABLE metricas ADD COLUMN IF NOT EXISTS visitas_perfil INTEGER DEFAULT 0;

-- Adicionar coluna video_views (reproduções de vídeo)
ALTER TABLE metricas ADD COLUMN IF NOT EXISTS video_views INTEGER DEFAULT 0;

-- Comentários
COMMENT ON COLUMN metricas.visitas_perfil IS 'Visitas ao perfil do Instagram/Facebook vindas dos anúncios';
COMMENT ON COLUMN metricas.video_views IS 'Reproduções de vídeo (3s+ views) vindas dos anúncios';
