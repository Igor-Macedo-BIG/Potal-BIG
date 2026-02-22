-- Script para criar um usuário de teste
-- Execute este script após correr SETUP_COMPLETO.sql

-- ======================================
-- OPÇÃO 1: Se você já criou um usuário no Supabase Auth
-- ======================================
-- Substitua os valores entre {} pelos seus dados:
-- {UUID_DO_USUARIO} = ID do usuário criado no Supabase Auth (Settings > Users)
-- {EMAIL} = Email que você usou para registrar

INSERT INTO usuarios (id, nome, email, empresa_id, role, ativo)
SELECT 
  auth.uid() as id,
  'Seu Nome' as nome,
  auth.email() as email,
  (SELECT id FROM empresas LIMIT 1) as empresa_id,
  'admin' as role,
  true as ativo
WHERE NOT EXISTS (
  SELECT 1 FROM usuarios WHERE id = auth.uid()
);

-- ======================================
-- OPÇÃO 2: Criar usuário de teste sem precisar do Auth primeiro
-- ======================================
-- Se isso não funcionar (erro de auth.uid()), use este UUID fixo para testes:

-- Primeiro, obter a empresa
WITH empresa AS (
  SELECT id FROM empresas LIMIT 1
)
INSERT INTO usuarios (id, nome, email, empresa_id, role, ativo)
VALUES (
  '550e8400-e29b-41d4-a716-446655440001'::uuid,
  'Usuário Teste',
  'teste@exemplo.com',
  (SELECT id FROM empresa),
  'admin',
  true
)
ON CONFLICT (id) DO NOTHING;

-- ======================================
-- Verificar se foi criado
-- ======================================
SELECT * FROM usuarios;
SELECT * FROM empresas;

-- Se vir dados, funcionou! 🎉
