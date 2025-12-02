-- ============================================
-- SCRIPT DEFINITIVO - CRIAR ADMIN E FAZER LOGIN
-- ============================================

-- PASSO 1: Desabilitar RLS (para não dar erro de recursão)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- PASSO 2: Verificar se o usuário existe no auth.users
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'lidiacabralconsultoria@gmail.com';

-- Se NÃO aparecer nada acima, o usuário não foi criado no Authentication
-- Vá em: Authentication > Users > Add User
-- Email: lidiacabralconsultoria@gmail.com
-- Password: Amazing123 (ou a senha que quiser)
-- Marque: Auto Confirm User
-- Clique: Create User
-- Depois volte aqui e execute novamente o SELECT acima para pegar o UUID

-- PASSO 3: Inserir na tabela users (use o UUID retornado acima)
-- SUBSTITUA '6cdf67a1-1ce0-40f6-8c40-440119343f0f' pelo UUID correto se for diferente
DELETE FROM users WHERE email = 'lidiacabralconsultoria@gmail.com';

INSERT INTO users (id, nome, email, role, ativo)
VALUES (
  '6cdf67a1-1ce0-40f6-8c40-440119343f0f', -- UUID do auth.users
  'Lídia Cabral',
  'lidiacabralconsultoria@gmail.com',
  'admin',
  true
);

-- PASSO 4: Confirmar que foi criado
SELECT * FROM users WHERE email = 'lidiacabralconsultoria@gmail.com';

-- Deve aparecer:
-- id: 6cdf67a1-1ce0-40f6-8c40-440119343f0f
-- nome: Lídia Cabral
-- email: lidiacabralconsultoria@gmail.com
-- role: admin
-- ativo: true

-- ============================================
-- AGORA PODE FAZER LOGIN:
-- Email: lidiacabralconsultoria@gmail.com
-- Senha: A que você definiu no Supabase Auth
-- Role: Selecione "Administrador"
-- ============================================
