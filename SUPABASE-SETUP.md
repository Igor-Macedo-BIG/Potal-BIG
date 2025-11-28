# Instruções para Configurar o Supabase

## Problema
A tabela `anuncios` não existe no banco de dados Supabase.

## Solução

### Opção 1: Executar SQL no Supabase Dashboard

1. Acesse o [Supabase Dashboard](https://supabase.com)
2. Vá em **SQL Editor**
3. Copie e cole o conteúdo do arquivo `supabase-schema.sql`
4. Clique em **Run** para executar o script

### Opção 2: Verificar se as tabelas existem

Execute este SQL para ver todas as tabelas:

```sql
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public';
```

### Estrutura Esperada

As tabelas devem existir nesta ordem (hierarquia):

1. **funis** - Já existe ✓
2. **campanhas** - Já existe ✓
3. **conjuntos_anuncio** - Já existe ✓
4. **anuncios** - PRECISA SER CRIADA ✗

### Verificar estrutura das tabelas existentes

```sql
-- Ver estrutura da tabela conjuntos_anuncio
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'conjuntos_anuncio';
```

## Campos esperados

### conjuntos_anuncio
- id (UUID)
- nome (TEXT)
- ativo (BOOLEAN)
- campanha_id (UUID)
- created_at (TIMESTAMP)

### anuncios
- id (UUID)
- nome (TEXT)
- tipo (TEXT)
- conjunto_anuncio_id (UUID)
- created_at (TIMESTAMP)
