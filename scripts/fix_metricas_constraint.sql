-- =============================================
-- PASSO 1: Verificar e ajustar constraint de tipos
-- =============================================

-- Ver constraint atual
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'metricas'::regclass
  AND conname = 'metricas_tipo_check';

-- Remover constraint antiga
ALTER TABLE metricas DROP CONSTRAINT IF EXISTS metricas_tipo_check;

-- Criar nova constraint que aceita todos os tipos
ALTER TABLE metricas ADD CONSTRAINT metricas_tipo_check 
CHECK (tipo IN ('funil', 'campanha', 'publico', 'criativo'));

-- Verificar
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'metricas'::regclass
  AND conname = 'metricas_tipo_check';

-- Testar se funciona
SELECT '✅ Constraint atualizada! Agora aceita: funil, campanha, publico, criativo' as status;
