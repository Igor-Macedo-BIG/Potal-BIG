-- ============================================================
-- DIAGNÓSTICO: Verificar estado das campanhas e vínculos
-- Execute cada bloco separadamente no Supabase SQL Editor
-- ============================================================

-- BLOCO 1: Quantas campanhas existem e com que empresa_id?
SELECT 
  id,
  nome,
  meta_id,
  empresa_id,
  funil_id,
  ativo,
  created_at
FROM campanhas
ORDER BY created_at DESC
LIMIT 20;

-- ============================================================

-- BLOCO 2: Quais empresas existem?
SELECT id, nome FROM empresas;

-- ============================================================

-- BLOCO 3: Qual é o empresa_id do usuário logado?
SELECT id, email, empresa_id, role FROM usuarios;

-- ============================================================

-- BLOCO 4: Cruzamento - campanhas vs empresa do usuário
SELECT 
  c.nome as campanha,
  c.meta_id,
  c.empresa_id as campanha_empresa_id,
  e.nome as empresa_da_campanha,
  u.email as usuario,
  u.empresa_id as usuario_empresa_id,
  CASE 
    WHEN c.empresa_id = u.empresa_id THEN '✅ MATCH'
    ELSE '❌ NÃO BATE'
  END as status
FROM campanhas c
CROSS JOIN usuarios u
LEFT JOIN empresas e ON e.id = c.empresa_id
WHERE c.meta_id IS NOT NULL
LIMIT 20;

-- ============================================================

-- BLOCO 5: FIX - Alinhar empresa_id das campanhas com a empresa do usuário
-- (só execute se o BLOCO 4 mostrar "❌ NÃO BATE")
UPDATE campanhas
SET empresa_id = (SELECT empresa_id FROM usuarios LIMIT 1)
WHERE meta_id IS NOT NULL;

-- Verificar resultado
SELECT count(*) as campanhas_corrigidas FROM campanhas WHERE meta_id IS NOT NULL AND empresa_id IS NOT NULL;
