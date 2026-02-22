-- ============================================================
-- LIMPEZA: Remove dados mistos (API + CSV + manuais)
-- Mantém apenas estrutura base (empresas, usuários, funis)
-- Execute com CUIDADO - faz DELETE em cascata
-- ============================================================

-- Desabilitar FK temporariamente para ter controle
SET session_replication_role = replica;

-- OPÇÃO 1: LIMPEZA COMPLETA (recomendado para começar do zero)
-- Deleta TODAS as campanhas, métricas, conjuntos, anúncios

-- 1. Deletar métricas (não referencia nada, seguro)
DELETE FROM metricas;

-- 2. Deletar anúncios (fk em conjuntos_anuncio)
DELETE FROM anuncios;

-- 3. Deletar conjuntos de anúncios (fk em campanhas)
DELETE FROM conjuntos_anuncio;

-- 4. Deletar campanhas (fk em funis) — AQUI VÃO OS DADOS MISTOS
DELETE FROM campanhas;

-- 5. Deletar logs de sync (fk em integracoes_meta)
DELETE FROM sync_logs_meta;

-- Reabilitar FK
SET session_replication_role = default;

-- Verificar resultado
SELECT 
  (SELECT count(*) FROM campanhas) as campanhas_restantes,
  (SELECT count(*) FROM conjuntos_anuncio) as conjuntos_restantes,
  (SELECT count(*) FROM anuncios) as anuncios_restantes,
  (SELECT count(*) FROM metricas) as metricas_restantes,
  (SELECT count(*) FROM sync_logs_meta) as logs_restantes,
  (SELECT count(*) FROM funis) as funis_mantidos,
  (SELECT count(*) FROM usuarios) as usuarios_mantidos,
  (SELECT count(*) FROM empresas) as empresas_mantidas;

-- ============================================================
-- ALTERNATIVA: Deletar APENAS campanhas com meta_id
-- (se quiser manter dados manuais/CSV)
-- ============================================================
-- DELETE FROM metricas 
-- WHERE referencia_id IN (
--   SELECT id FROM campanhas WHERE meta_id IS NOT NULL
-- );
-- DELETE FROM anuncios 
-- WHERE conjunto_anuncio_id IN (
--   SELECT id FROM conjuntos_anuncio 
--   WHERE campanha_id IN (SELECT id FROM campanhas WHERE meta_id IS NOT NULL)
-- );
-- DELETE FROM conjuntos_anuncio 
-- WHERE campanha_id IN (SELECT id FROM campanhas WHERE meta_id IS NOT NULL);
-- DELETE FROM campanhas WHERE meta_id IS NOT NULL;

-- ✅ Limpeza concluída - pronto para novo sync
