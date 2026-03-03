-- VERIFICAR ESTRUTURA DAS TABELAS
-- Execute no Supabase para ver quais colunas existem

-- Ver colunas da tabela campanhas
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'campanhas' 
ORDER BY ordinal_position;

-- Ver colunas da tabela conjuntos_anuncio
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'conjuntos_anuncio' 
ORDER BY ordinal_position;

-- Ver colunas da tabela anuncios
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'anuncios' 
ORDER BY ordinal_position;

-- Ver colunas da tabela funis
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'funis' 
ORDER BY ordinal_position;

-- Ver colunas da tabela metricas
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'metricas' 
ORDER BY ordinal_position;
