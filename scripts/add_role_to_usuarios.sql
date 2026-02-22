-- Script para adicionar coluna 'role' na tabela usuarios
-- Execute no Supabase SQL Editor

ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'admin';

-- Comentário
COMMENT ON COLUMN usuarios.role IS 'Função do usuário: admin, gestor, sdr, closer, social-seller, cs, trafego';

-- Criar constraint para validar valores
ALTER TABLE usuarios ADD CONSTRAINT check_role CHECK (role IN ('admin', 'gestor', 'sdr', 'closer', 'social-seller', 'cs', 'trafego'));
