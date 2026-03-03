-- Adicionar coluna slug para URLs amigáveis
ALTER TABLE clientes 
ADD COLUMN slug TEXT UNIQUE;

-- Gerar slugs para clientes existentes (nome-4digitos)
-- Dr. Leonardo vira "dr-leonardo-1234"
UPDATE clientes 
SET slug = LOWER(
  REGEXP_REPLACE(
    REGEXP_REPLACE(nome, '[^a-zA-Z0-9\s-]', '', 'g'),
    '\s+', '-', 'g'
  ) || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0')
)
WHERE slug IS NULL;

-- Criar índice para performance
CREATE INDEX idx_clientes_slug ON clientes(slug);

-- Comentário
COMMENT ON COLUMN clientes.slug IS 'URL amigável para acesso público (ex: dr-leonardo-1234)';
