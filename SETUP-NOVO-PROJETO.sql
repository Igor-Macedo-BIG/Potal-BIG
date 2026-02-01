-- ============================================
-- SETUP COMPLETO PARA NOVO PROJETO SUPABASE
-- Cole este arquivo no SQL Editor do Supabase
-- ============================================

-- 1. Tabela de empresas
CREATE TABLE IF NOT EXISTS empresas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR NOT NULL,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir empresa padrão (ALTERE O NOME AQUI!)
INSERT INTO empresas (id, nome) 
VALUES ('550e8400-e29b-41d4-a716-446655440000', 'BIG DIVULGAÇÃO')
ON CONFLICT (id) DO NOTHING;

-- 2. Tabela de funis
CREATE TABLE IF NOT EXISTS funis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR NOT NULL,
  descricao TEXT,
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabela de campanhas
CREATE TABLE IF NOT EXISTS campanhas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR NOT NULL,
  tipo VARCHAR CHECK (tipo IN ('vendas', 'leads', 'awareness')) DEFAULT 'leads',
  funil_id UUID REFERENCES funis(id) ON DELETE CASCADE,
  plataforma VARCHAR NOT NULL DEFAULT 'Meta Ads',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabela de conjuntos_anuncio
CREATE TABLE IF NOT EXISTS conjuntos_anuncio (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR NOT NULL,
  campanha_id UUID REFERENCES campanhas(id) ON DELETE CASCADE,
  publico TEXT NOT NULL,
  idade_min INTEGER DEFAULT 18,
  idade_max INTEGER DEFAULT 65,
  localizacao TEXT DEFAULT 'Brasil',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tabela de criativos
CREATE TABLE IF NOT EXISTS criativos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR NOT NULL,
  conjunto_anuncio_id UUID REFERENCES conjuntos_anuncio(id) ON DELETE CASCADE,
  tipo VARCHAR CHECK (tipo IN ('imagem', 'video', 'carrossel')) DEFAULT 'imagem',
  url_preview TEXT,
  texto_anuncio TEXT,
  chamada_acao VARCHAR,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Tabela de métricas (tabela principal de dados)
CREATE TABLE IF NOT EXISTS metricas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  data DATE NOT NULL,
  funil_id UUID REFERENCES funis(id) ON DELETE CASCADE,
  campanha_id UUID REFERENCES campanhas(id) ON DELETE CASCADE,
  conjunto_anuncio_id UUID REFERENCES conjuntos_anuncio(id) ON DELETE CASCADE,
  criativo_id UUID REFERENCES criativos(id) ON DELETE CASCADE,
  
  -- Métricas de tráfego
  investido DECIMAL(10,2) NOT NULL DEFAULT 0,
  impressoes INTEGER NOT NULL DEFAULT 0,
  cliques INTEGER NOT NULL DEFAULT 0,
  cpc DECIMAL(10,2) GENERATED ALWAYS AS (
    CASE WHEN cliques > 0 THEN investido / cliques ELSE 0 END
  ) STORED,
  ctr DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE WHEN impressoes > 0 THEN (cliques::DECIMAL / impressoes * 100) ELSE 0 END
  ) STORED,
  
  -- Métricas de conversão
  leads INTEGER NOT NULL DEFAULT 0,
  cpl DECIMAL(10,2) GENERATED ALWAYS AS (
    CASE WHEN leads > 0 THEN investido / leads ELSE 0 END
  ) STORED,
  taxa_conversao DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE WHEN cliques > 0 THEN (leads::DECIMAL / cliques * 100) ELSE 0 END
  ) STORED,
  
  -- SDR Metrics (métricas de vendas)
  ligacoes INTEGER DEFAULT 0,
  contatos INTEGER DEFAULT 0,
  agendamentos INTEGER DEFAULT 0,
  comparecimentos INTEGER DEFAULT 0,
  vendas INTEGER DEFAULT 0,
  valor_vendas DECIMAL(10,2) DEFAULT 0,
  ticket_medio DECIMAL(10,2) GENERATED ALWAYS AS (
    CASE WHEN vendas > 0 THEN valor_vendas / vendas ELSE 0 END
  ) STORED,
  roi DECIMAL(10,2) GENERATED ALWAYS AS (
    CASE WHEN investido > 0 THEN ((valor_vendas - investido) / investido * 100) ELSE 0 END
  ) STORED,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(data, criativo_id)
);

-- 7. Tabela de usuários (integração com auth do Supabase)
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  nome VARCHAR NOT NULL,
  email VARCHAR UNIQUE NOT NULL,
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
  papel VARCHAR DEFAULT 'usuario' CHECK (papel IN ('admin', 'gestor', 'usuario')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- POLÍTICAS RLS (Row Level Security)
-- ============================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE funis ENABLE ROW LEVEL SECURITY;
ALTER TABLE campanhas ENABLE ROW LEVEL SECURITY;
ALTER TABLE conjuntos_anuncio ENABLE ROW LEVEL SECURITY;
ALTER TABLE criativos ENABLE ROW LEVEL SECURITY;
ALTER TABLE metricas ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- Políticas para empresas (todos podem ler, apenas admin pode modificar)
CREATE POLICY "Todos podem ver empresas" ON empresas FOR SELECT USING (true);
CREATE POLICY "Apenas admin pode inserir empresas" ON empresas FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND papel = 'admin')
);

-- Políticas para funis (usuários veem apenas da sua empresa)
CREATE POLICY "Usuários veem funis da sua empresa" ON funis FOR SELECT USING (
  EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND empresa_id = funis.empresa_id)
);
CREATE POLICY "Usuários podem criar funis" ON funis FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND empresa_id = funis.empresa_id)
);
CREATE POLICY "Usuários podem atualizar funis" ON funis FOR UPDATE USING (
  EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND empresa_id = funis.empresa_id)
);

-- Políticas para campanhas
CREATE POLICY "Usuários veem campanhas dos seus funis" ON campanhas FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM funis f 
    JOIN usuarios u ON u.empresa_id = f.empresa_id 
    WHERE f.id = campanhas.funil_id AND u.id = auth.uid()
  )
);
CREATE POLICY "Usuários podem criar campanhas" ON campanhas FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM funis f 
    JOIN usuarios u ON u.empresa_id = f.empresa_id 
    WHERE f.id = funil_id AND u.id = auth.uid()
  )
);
CREATE POLICY "Usuários podem atualizar campanhas" ON campanhas FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM funis f 
    JOIN usuarios u ON u.empresa_id = f.empresa_id 
    WHERE f.id = funil_id AND u.id = auth.uid()
  )
);

-- Políticas para conjuntos_anuncio
CREATE POLICY "Usuários veem conjuntos das suas campanhas" ON conjuntos_anuncio FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM campanhas c 
    JOIN funis f ON f.id = c.funil_id 
    JOIN usuarios u ON u.empresa_id = f.empresa_id 
    WHERE c.id = conjuntos_anuncio.campanha_id AND u.id = auth.uid()
  )
);
CREATE POLICY "Usuários podem criar conjuntos" ON conjuntos_anuncio FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM campanhas c 
    JOIN funis f ON f.id = c.funil_id 
    JOIN usuarios u ON u.empresa_id = f.empresa_id 
    WHERE c.id = campanha_id AND u.id = auth.uid()
  )
);

-- Políticas para criativos
CREATE POLICY "Usuários veem criativos dos seus conjuntos" ON criativos FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM conjuntos_anuncio ca
    JOIN campanhas c ON c.id = ca.campanha_id
    JOIN funis f ON f.id = c.funil_id 
    JOIN usuarios u ON u.empresa_id = f.empresa_id 
    WHERE ca.id = criativos.conjunto_anuncio_id AND u.id = auth.uid()
  )
);
CREATE POLICY "Usuários podem criar criativos" ON criativos FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM conjuntos_anuncio ca
    JOIN campanhas c ON c.id = ca.campanha_id
    JOIN funis f ON f.id = c.funil_id 
    JOIN usuarios u ON u.empresa_id = f.empresa_id 
    WHERE ca.id = conjunto_anuncio_id AND u.id = auth.uid()
  )
);

-- Políticas para métricas
CREATE POLICY "Usuários veem métricas da sua empresa" ON metricas FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM funis f 
    JOIN usuarios u ON u.empresa_id = f.empresa_id 
    WHERE f.id = metricas.funil_id AND u.id = auth.uid()
  )
);
CREATE POLICY "Usuários podem inserir métricas" ON metricas FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM funis f 
    JOIN usuarios u ON u.empresa_id = f.empresa_id 
    WHERE f.id = funil_id AND u.id = auth.uid()
  )
);
CREATE POLICY "Usuários podem atualizar métricas" ON metricas FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM funis f 
    JOIN usuarios u ON u.empresa_id = f.empresa_id 
    WHERE f.id = funil_id AND u.id = auth.uid()
  )
);

-- Políticas para usuários
CREATE POLICY "Usuários veem perfis da mesma empresa" ON usuarios FOR SELECT USING (
  EXISTS (SELECT 1 FROM usuarios u WHERE u.id = auth.uid() AND u.empresa_id = usuarios.empresa_id)
);
CREATE POLICY "Usuários podem atualizar próprio perfil" ON usuarios FOR UPDATE USING (id = auth.uid());

-- ============================================
-- TRIGGERS PARA UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_empresas_updated_at BEFORE UPDATE ON empresas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_funis_updated_at BEFORE UPDATE ON funis FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_campanhas_updated_at BEFORE UPDATE ON campanhas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_conjuntos_updated_at BEFORE UPDATE ON conjuntos_anuncio FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_criativos_updated_at BEFORE UPDATE ON criativos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_metricas_updated_at BEFORE UPDATE ON metricas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================

CREATE INDEX idx_funis_empresa ON funis(empresa_id);
CREATE INDEX idx_campanhas_funil ON campanhas(funil_id);
CREATE INDEX idx_conjuntos_campanha ON conjuntos_anuncio(campanha_id);
CREATE INDEX idx_criativos_conjunto ON criativos(conjunto_anuncio_id);
CREATE INDEX idx_metricas_data ON metricas(data);
CREATE INDEX idx_metricas_funil ON metricas(funil_id);
CREATE INDEX idx_metricas_campanha ON metricas(campanha_id);
CREATE INDEX idx_metricas_criativo ON metricas(criativo_id);
CREATE INDEX idx_usuarios_empresa ON usuarios(empresa_id);

-- ============================================
-- SCRIPT FINALIZADO!
-- Agora configure as credenciais no .env.local
-- ============================================
