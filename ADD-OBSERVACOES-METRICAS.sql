-- Adicionar campo de observações na tabela metricas
ALTER TABLE metricas 
ADD COLUMN IF NOT EXISTS observacoes TEXT;

COMMENT ON COLUMN metricas.observacoes IS 'Observações e alertas importantes do período para o cliente';
