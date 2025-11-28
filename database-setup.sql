-- Script SQL para configurar o banco de dados do Painel de Tráfego Pago
-- Execute este script no Editor SQL do Supabase

-- 1. Tabela de empresas
CREATE TABLE IF NOT EXISTS empresas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR NOT NULL,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir empresa padrão se não existir
INSERT INTO empresas (id, nome) 
VALUES ('550e8400-e29b-41d4-a716-446655440000', 'Lídia Cabral Consultoria')
ON CONFLICT (id) DO NOTHING;

-- 2. Tabela de usuários (conectada com auth.users do Supabase)
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  nome VARCHAR NOT NULL,
  email VARCHAR UNIQUE NOT NULL,
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabela de campanhas
CREATE TABLE IF NOT EXISTS campanhas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR NOT NULL,
  plataforma VARCHAR NOT NULL CHECK (plataforma IN ('Meta Ads', 'Google Ads', 'LinkedIn Ads', 'TikTok Ads', 'Outros')),
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
  ativa BOOLEAN DEFAULT true,
  objetivo TEXT,
  orcamento_diario DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabela de métricas
CREATE TABLE IF NOT EXISTS metricas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campanha_id UUID REFERENCES campanhas(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  investido DECIMAL(10,2) NOT NULL DEFAULT 0,
  impressoes INTEGER NOT NULL DEFAULT 0,
  cliques INTEGER NOT NULL DEFAULT 0,
  leads INTEGER NOT NULL DEFAULT 0,
  conversoes INTEGER NOT NULL DEFAULT 0,
  ctr DECIMAL(5,2) NOT NULL DEFAULT 0,
  cpm DECIMAL(10,2) DEFAULT 0,
  cpc DECIMAL(10,2) DEFAULT 0,
  cpl DECIMAL(10,2) DEFAULT 0,
  conversao DECIMAL(5,2) NOT NULL DEFAULT 0,
  faturamento DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(campanha_id, data)
);

-- 5. Tabela de criativos
CREATE TABLE IF NOT EXISTS criativos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campanha_id UUID REFERENCES campanhas(id) ON DELETE CASCADE,
  titulo VARCHAR NOT NULL,
  descricao TEXT,
  imagem_url TEXT,
  video_url TEXT,
  tipo VARCHAR NOT NULL CHECK (tipo IN ('imagem', 'video', 'carrossel', 'texto')),
  desempenho DECIMAL(5,2) DEFAULT 0,
  impressoes INTEGER DEFAULT 0,
  cliques INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_usuarios_empresa_id ON usuarios(empresa_id);
CREATE INDEX IF NOT EXISTS idx_campanhas_empresa_id ON campanhas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_metricas_campanha_id ON metricas(campanha_id);
CREATE INDEX IF NOT EXISTS idx_metricas_data ON metricas(data);
CREATE INDEX IF NOT EXISTS idx_criativos_campanha_id ON criativos(campanha_id);

-- 7. Row Level Security (RLS) - Segurança por linha
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE campanhas ENABLE ROW LEVEL SECURITY;
ALTER TABLE metricas ENABLE ROW LEVEL SECURITY;
ALTER TABLE criativos ENABLE ROW LEVEL SECURITY;

-- 8. Políticas de segurança
-- Usuários só podem ver dados da própria empresa
CREATE POLICY "Users can view own company data" ON empresas
  FOR ALL USING (
    id IN (
      SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can view own profile" ON usuarios
  FOR ALL USING (id = auth.uid());

CREATE POLICY "Users can view company campaigns" ON campanhas
  FOR ALL USING (
    empresa_id IN (
      SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can view company metrics" ON metricas
  FOR ALL USING (
    campanha_id IN (
      SELECT c.id FROM campanhas c
      JOIN usuarios u ON c.empresa_id = u.empresa_id
      WHERE u.id = auth.uid()
    )
  );

CREATE POLICY "Users can view company creatives" ON criativos
  FOR ALL USING (
    campanha_id IN (
      SELECT c.id FROM campanhas c
      JOIN usuarios u ON c.empresa_id = u.empresa_id
      WHERE u.id = auth.uid()
    )
  );

-- 9. Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 10. Triggers para updated_at
CREATE TRIGGER update_empresas_updated_at BEFORE UPDATE ON empresas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campanhas_updated_at BEFORE UPDATE ON campanhas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_criativos_updated_at BEFORE UPDATE ON criativos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 11. Inserir dados de exemplo
-- Empresa de exemplo
INSERT INTO empresas (id, nome) 
VALUES ('550e8400-e29b-41d4-a716-446655440000', 'Lídia Cabral Consultoria')
ON CONFLICT (id) DO NOTHING;

-- Campanhas de exemplo
INSERT INTO campanhas (id, nome, plataforma, empresa_id, ativa, objetivo, orcamento_diario) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Masterclass Vendas', 'Meta Ads', '550e8400-e29b-41d4-a716-446655440000', true, 'Captação de Leads', 150.00),
  ('550e8400-e29b-41d4-a716-446655440002', 'Funil de Aplicação', 'Google Ads', '550e8400-e29b-41d4-a716-446655440000', true, 'Conversões', 200.00),
  ('550e8400-e29b-41d4-a716-446655440003', 'Captação Leads', 'Meta Ads', '550e8400-e29b-41d4-a716-446655440000', false, 'Awareness', 100.00)
ON CONFLICT (id) DO NOTHING;

-- Métricas de exemplo (últimos 7 dias)
INSERT INTO metricas (campanha_id, data, investido, impressoes, cliques, leads, conversoes, ctr, cpm, cpc, cpl, conversao) VALUES
  -- Masterclass Vendas
  ('550e8400-e29b-41d4-a716-446655440001', CURRENT_DATE - INTERVAL '6 days', 120.50, 15420, 385, 48, 8, 2.5, 7.82, 0.31, 2.51, 16.67),
  ('550e8400-e29b-41d4-a716-446655440001', CURRENT_DATE - INTERVAL '5 days', 135.75, 17200, 421, 52, 9, 2.45, 7.89, 0.32, 2.61, 17.31),
  ('550e8400-e29b-41d4-a716-446655440001', CURRENT_DATE - INTERVAL '4 days', 98.20, 12850, 315, 39, 6, 2.45, 7.64, 0.31, 2.52, 15.38),
  ('550e8400-e29b-41d4-a716-446655440001', CURRENT_DATE - INTERVAL '3 days', 142.30, 18100, 445, 55, 10, 2.46, 7.86, 0.32, 2.59, 18.18),
  ('550e8400-e29b-41d4-a716-446655440001', CURRENT_DATE - INTERVAL '2 days', 156.80, 19800, 485, 61, 12, 2.45, 7.92, 0.32, 2.57, 19.67),
  ('550e8400-e29b-41d4-a716-446655440001', CURRENT_DATE - INTERVAL '1 day', 167.45, 21200, 522, 65, 13, 2.46, 7.90, 0.32, 2.58, 20.00),
  ('550e8400-e29b-41d4-a716-446655440001', CURRENT_DATE, 189.75, 24100, 595, 74, 15, 2.47, 7.87, 0.32, 2.56, 20.27),
  
  -- Funil de Aplicação  
  ('550e8400-e29b-41d4-a716-446655440002', CURRENT_DATE - INTERVAL '6 days', 185.30, 12450, 498, 62, 15, 4.00, 14.88, 0.37, 2.99, 24.19),
  ('550e8400-e29b-41d4-a716-446655440002', CURRENT_DATE - INTERVAL '5 days', 192.85, 13100, 524, 68, 17, 4.00, 14.72, 0.37, 2.84, 25.00),
  ('550e8400-e29b-41d4-a716-446655440002', CURRENT_DATE - INTERVAL '4 days', 175.60, 11800, 472, 59, 14, 4.00, 14.88, 0.37, 2.98, 23.73),
  ('550e8400-e29b-41d4-a716-446655440002', CURRENT_DATE - INTERVAL '3 days', 201.40, 13550, 542, 70, 18, 4.00, 14.86, 0.37, 2.88, 25.71),
  ('550e8400-e29b-41d4-a716-446655440002', CURRENT_DATE - INTERVAL '2 days', 198.20, 13300, 532, 68, 17, 4.00, 14.90, 0.37, 2.91, 25.00),
  ('550e8400-e29b-41d4-a716-446655440002', CURRENT_DATE - INTERVAL '1 day', 205.75, 13800, 552, 71, 19, 4.00, 14.91, 0.37, 2.90, 26.76),
  ('550e8400-e29b-41d4-a716-446655440002', CURRENT_DATE, 218.90, 14650, 586, 76, 21, 4.00, 14.94, 0.37, 2.88, 27.63)
ON CONFLICT (campanha_id, data) DO NOTHING;

-- Criativos de exemplo
INSERT INTO criativos (campanha_id, titulo, descricao, tipo, desempenho, impressoes, cliques, ativo) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Criativo Principal - Masterclass', 'Anúncio principal da masterclass com call-to-action forte', 'imagem', 85.5, 45200, 1125, true),
  ('550e8400-e29b-41d4-a716-446655440001', 'Variação A - Texto Diferente', 'Teste A/B com copy alternativo', 'imagem', 72.3, 28900, 721, true),
  ('550e8400-e29b-41d4-a716-446655440002', 'Video Explicativo', 'Vídeo de 30 segundos explicando o processo', 'video', 91.2, 52100, 1305, true),
  ('550e8400-e29b-41d4-a716-446655440002', 'Carrossel Benefícios', 'Carrossel mostrando os principais benefícios', 'carrossel', 78.9, 34200, 855, true)
ON CONFLICT (id) DO NOTHING;

-- Mensagem de sucesso
SELECT 'Banco de dados configurado com sucesso! 🎉' as status;