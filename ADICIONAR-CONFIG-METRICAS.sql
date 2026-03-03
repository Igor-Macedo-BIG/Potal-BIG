-- Adicionar configuração de métricas visíveis por cliente
ALTER TABLE clientes 
ADD COLUMN metricas_visiveis JSONB DEFAULT '{
  "total_leads": true,
  "media_diaria_leads": true,
  "custo_por_lead": true,
  "investimento": true,
  "faturamento": true,
  "roas": true,
  "leads": true,
  "vendas": true,
  "alcance": true,
  "cliques": true,
  "impressoes": true,
  "visualizacoes": true,
  "checkouts": true
}'::jsonb;

-- Atualizar clientes existentes com todas as métricas ativas
UPDATE clientes 
SET metricas_visiveis = '{
  "total_leads": true,
  "media_diaria_leads": true,
  "custo_por_lead": true,
  "investimento": true,
  "faturamento": true,
  "roas": true,
  "leads": true,
  "vendas": true,
  "alcance": true,
  "cliques": true,
  "impressoes": true,
  "visualizacoes": true,
  "checkouts": true
}'::jsonb
WHERE metricas_visiveis IS NULL;

-- Comentário
COMMENT ON COLUMN clientes.metricas_visiveis IS 'Configuração de quais métricas aparecem no dashboard público do cliente';
