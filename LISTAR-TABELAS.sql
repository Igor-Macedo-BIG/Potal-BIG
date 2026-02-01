-- LISTAR TODAS AS TABELAS DO BANCO
-- Execute no Supabase para ver quais tabelas existem

SELECT 
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
