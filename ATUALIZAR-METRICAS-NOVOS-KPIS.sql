-- Script para atualizar clientes existentes com os novos KPIs
-- Total de Leads e Média Diária de Leads

-- Atualizar clientes existentes adicionando as novas métricas
UPDATE clientes 
SET metricas_visiveis = jsonb_set(
  jsonb_set(
    metricas_visiveis,
    '{total_leads}',
    'true'::jsonb
  ),
  '{media_diaria_leads}',
  'true'::jsonb
)
WHERE metricas_visiveis IS NOT NULL;

-- Verificar resultado
SELECT 
  id,
  nome,
  metricas_visiveis
FROM clientes
LIMIT 5;
