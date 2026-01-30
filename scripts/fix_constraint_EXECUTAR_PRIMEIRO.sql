-- =============================================
-- EXECUTAR PRIMEIRO: Corrigir constraint do banco
-- =============================================
-- Este script permite que a tabela metricas aceite
-- tipo = 'publico' e tipo = 'criativo'
-- =============================================

-- PASSO 1: Ver constraint atual
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'metricas'::regclass
  AND conname = 'metricas_tipo_check';

-- PASSO 2: Remover constraint antiga (que só permite 'funil' e 'campanha')
ALTER TABLE metricas DROP CONSTRAINT IF EXISTS metricas_tipo_check;

-- PASSO 3: Criar nova constraint que aceita TODOS os tipos
ALTER TABLE metricas ADD CONSTRAINT metricas_tipo_check 
CHECK (tipo IN ('funil', 'campanha', 'publico', 'criativo'));

-- PASSO 4: Verificar se funcionou
SELECT 
    '✅ CONSTRAINT ATUALIZADA!' as status,
    conname as constraint_name,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'metricas'::regclass
  AND conname = 'metricas_tipo_check';

-- Você deve ver:
-- CHECK (tipo = ANY (ARRAY['funil'::text, 'campanha'::text, 'publico'::text, 'criativo'::text]))
