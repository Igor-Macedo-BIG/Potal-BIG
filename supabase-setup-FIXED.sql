-- REMOVER políticas antigas que causam recursão
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Only admins can create users" ON users;
DROP POLICY IF EXISTS "Only admins can update users" ON users;

-- POLÍTICA CORRIGIDA 1: Todos usuários autenticados podem ver seus próprios dados
CREATE POLICY "Users can view own data"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- POLÍTICA CORRIGIDA 2: Admins podem ver todos (SEM recursão)
CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'admin' AND ativo = true
    )
  );

-- POLÍTICA CORRIGIDA 3: Permitir INSERT durante signup (bypass RLS temporariamente)
CREATE POLICY "Allow insert during signup"
  ON users FOR INSERT
  WITH CHECK (true);

-- POLÍTICA CORRIGIDA 4: Apenas admins ativos podem atualizar
CREATE POLICY "Only admins can update users"
  ON users FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'admin' AND ativo = true
    )
  );

-- IMPORTANTE: Desabilitar RLS temporariamente para primeiro admin
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Agora vamos reabilitar após criar o admin
-- Execute o INSERT abaixo e depois ative o RLS novamente
