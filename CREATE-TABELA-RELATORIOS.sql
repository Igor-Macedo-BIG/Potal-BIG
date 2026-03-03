-- Criar tabela de relatórios/observações por período
CREATE TABLE IF NOT EXISTS relatorios_periodo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  tipo_periodo TEXT NOT NULL CHECK (tipo_periodo IN ('semanal', 'mensal')),
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  observacao TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Garantir que não haja duplicatas para o mesmo período
  UNIQUE(cliente_id, tipo_periodo, data_inicio, data_fim)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_relatorios_cliente ON relatorios_periodo(cliente_id);
CREATE INDEX IF NOT EXISTS idx_relatorios_periodo ON relatorios_periodo(tipo_periodo, data_inicio, data_fim);
CREATE INDEX IF NOT EXISTS idx_relatorios_datas ON relatorios_periodo(data_inicio, data_fim);

-- Comentários
COMMENT ON TABLE relatorios_periodo IS 'Relatórios e observações semanais/mensais para clientes';
COMMENT ON COLUMN relatorios_periodo.tipo_periodo IS 'Tipo do período: semanal ou mensal';
COMMENT ON COLUMN relatorios_periodo.data_inicio IS 'Data de início do período (primeira segunda-feira da semana ou primeiro dia do mês)';
COMMENT ON COLUMN relatorios_periodo.data_fim IS 'Data de fim do período (domingo da semana ou último dia do mês)';
COMMENT ON COLUMN relatorios_periodo.observacao IS 'Texto do relatório/observação para o cliente';

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_relatorios_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_relatorios_updated_at
  BEFORE UPDATE ON relatorios_periodo
  FOR EACH ROW
  EXECUTE FUNCTION update_relatorios_updated_at();

-- RLS (Row Level Security) - apenas para referência, ajuste conforme sua política
ALTER TABLE relatorios_periodo ENABLE ROW LEVEL SECURITY;

-- Exemplo de política (ajustar conforme necessário)
CREATE POLICY "Usuários podem ver relatórios de seus clientes"
  ON relatorios_periodo
  FOR SELECT
  USING (true); -- Ajustar conforme sua lógica de autenticação

CREATE POLICY "Usuários podem inserir relatórios"
  ON relatorios_periodo
  FOR INSERT
  WITH CHECK (true); -- Ajustar conforme sua lógica de autenticação

CREATE POLICY "Usuários podem atualizar relatórios"
  ON relatorios_periodo
  FOR UPDATE
  USING (true); -- Ajustar conforme sua lógica de autenticação

CREATE POLICY "Usuários podem deletar relatórios"
  ON relatorios_periodo
  FOR DELETE
  USING (true); -- Ajustar conforme sua lógica de autenticação
