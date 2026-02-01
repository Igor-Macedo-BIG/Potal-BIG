-- ============================================
-- CRIAR PRIMEIRO USUÁRIO ADMIN
-- Execute DEPOIS de criar o usuário via Supabase Auth
-- ============================================

-- PASSO 1: Vá em Authentication > Users no Supabase
-- PASSO 2: Clique em "Add user" e crie o usuário
-- PASSO 3: Copie o UUID do usuário criado
-- PASSO 4: Cole o UUID abaixo e execute este script

-- Inserir usuário na tabela usuarios
INSERT INTO usuarios (id, nome, email, empresa_id, papel)
VALUES (
  '8302efa6-b6f7-4f72-a055-14bd6f04ee5a',  -- UUID do auth.users
  'Admin BIG',                              -- Nome do usuário
  'bigdivulgacao@exemplo.com',             -- Email (mesmo do auth)
  '550e8400-e29b-41d4-a716-446655440000',  -- ID da empresa padrão
  'admin'                                  -- Papel: admin
)
ON CONFLICT (id) DO UPDATE SET
  nome = EXCLUDED.nome,
  papel = EXCLUDED.papel;

-- ============================================
-- VERIFICAR SE DEU CERTO
-- ============================================

SELECT * FROM usuarios;
SELECT * FROM empresas;
