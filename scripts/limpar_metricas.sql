-- =============================================
-- Script: Limpar Métricas do Banco
-- Use este script para deletar métricas específicas
-- =============================================

-- ⚠️ CUIDADO: Estas queries deletam dados permanentemente!

-- ==========================================
-- 1️⃣ LIMPAR MÉTRICAS POR TIPO
-- ==========================================

-- Deletar TODAS as métricas de CRIATIVOS
-- DELETE FROM metricas WHERE tipo = 'criativo';

-- Deletar TODAS as métricas de PÚBLICOS
-- DELETE FROM metricas WHERE tipo = 'publico';

-- Deletar TODAS as métricas de CAMPANHAS
-- DELETE FROM metricas WHERE tipo = 'campanha';

-- Deletar TODAS as métricas de FUNIS
-- DELETE FROM metricas WHERE tipo = 'funil';


-- ==========================================
-- 2️⃣ LIMPAR MÉTRICAS POR PERÍODO
-- ==========================================

-- Deletar métricas de Janeiro 2026
-- DELETE FROM metricas 
-- WHERE periodo_inicio >= '2026-01-01' 
--   AND periodo_fim <= '2026-01-31';

-- Deletar métricas da Semana 1 de Janeiro 2026
-- DELETE FROM metricas 
-- WHERE periodo_inicio >= '2026-01-01' 
--   AND periodo_fim <= '2026-01-07';


-- ==========================================
-- 3️⃣ LIMPAR MÉTRICAS POR TIPO + PERÍODO
-- ==========================================

-- Deletar métricas de CRIATIVOS da Semana 1 de Janeiro 2026
-- DELETE FROM metricas 
-- WHERE tipo = 'criativo'
--   AND periodo_inicio >= '2026-01-01' 
--   AND periodo_fim <= '2026-01-07';

-- Deletar métricas de PÚBLICOS de Janeiro 2026
-- DELETE FROM metricas 
-- WHERE tipo = 'publico'
--   AND periodo_inicio >= '2026-01-01' 
--   AND periodo_fim <= '2026-01-31';


-- ==========================================
-- 4️⃣ LIMPAR TUDO (⚠️ EXTREMO CUIDADO!)
-- ==========================================

-- Deletar TODAS as métricas do banco
-- DELETE FROM metricas;


-- ==========================================
-- 5️⃣ LIMPAR POR CAMPANHA ESPECÍFICA
-- ==========================================

-- Primeiro, encontre o ID da campanha:
-- SELECT id, nome FROM campanhas WHERE nome ILIKE '%aplicação%direta%';

-- Depois delete as métricas dessa campanha:
-- DELETE FROM metricas 
-- WHERE tipo = 'campanha' 
--   AND referencia_id = 'SEU_CAMPANHA_ID_AQUI';


-- ==========================================
-- 6️⃣ VERIFICAR O QUE SERÁ DELETADO (ANTES DE DELETAR)
-- ==========================================

-- Ver quantas métricas serão deletadas por tipo
SELECT 
  tipo,
  COUNT(*) as total_registros,
  TO_CHAR(MIN(periodo_inicio), 'DD/MM/YYYY') as data_inicial,
  TO_CHAR(MAX(periodo_fim), 'DD/MM/YYYY') as data_final
FROM metricas
GROUP BY tipo
ORDER BY tipo;

-- Ver métricas de Janeiro 2026
SELECT 
  tipo,
  COUNT(*) as total,
  TO_CHAR(SUM(investimento), 'R$ 9,999.99') as investimento_total,
  SUM(leads) as leads_total
FROM metricas
WHERE periodo_inicio >= '2026-01-01' 
  AND periodo_fim <= '2026-01-31'
GROUP BY tipo;


-- ==========================================
-- 💡 INSTRUÇÕES DE USO:
-- ==========================================
-- 1. Cole este script no Supabase SQL Editor
-- 2. DESCOMENTE (remova o --) da query que deseja executar
-- 3. Execute o script
-- 4. Verifique o resultado
--
-- ⚠️ DICA: Execute primeiro as queries de VERIFICAÇÃO (item 6)
--          para ver o que será deletado antes de deletar!
-- ==========================================
