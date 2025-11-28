-- EXECUTE ESTE SCRIPT NO SUPABASE SQL EDITOR
-- Copie e cole tudo de uma vez e clique em RUN

-- 1. Criar tabela de empresas
CREATE TABLE IF NOT EXISTS empresas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR NOT NULL,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Criar tabela de usuarios (conectada com auth.users)
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  nome VARCHAR NOT NULL,
  email VARCHAR UNIQUE NOT NULL,
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Inserir empresa padrão
INSERT INTO empresas (id, nome) 
VALUES ('550e8400-e29b-41d4-a716-446655440000', 'Lídia Cabral Consultoria')
ON CONFLICT (id) DO NOTHING;

-- 4. Habilitar RLS (Row Level Security)
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- 5. Políticas básicas de segurança
CREATE POLICY "Usuarios podem ver própria empresa" ON empresas
  FOR ALL USING (
    id IN (
      SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    )
  );

CREATE POLICY "Usuarios podem ver próprio perfil" ON usuarios
  FOR ALL USING (id = auth.uid());

-- 6. Permitir inserção de novos usuários
CREATE POLICY "Permitir inserção de usuários" ON usuarios
  FOR INSERT WITH CHECK (true);

-- Confirmar que foi executado com sucesso
SELECT 'Banco de dados configurado com sucesso! 🎉' as status;