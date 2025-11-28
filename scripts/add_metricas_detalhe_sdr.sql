-- Migration: adicionar coluna JSONB 'detalhe_sdr' à tabela 'metricas'
-- Execute este SQL no Supabase SQL Editor ou via psql conectado ao seu banco.

ALTER TABLE IF EXISTS metricas
ADD COLUMN IF NOT EXISTS detalhe_sdr JSONB;

-- Opcional: criar índice GIN para consultas por chaves internas
CREATE INDEX IF NOT EXISTS idx_metricas_detalhe_sdr_gin ON metricas USING GIN (detalhe_sdr);
