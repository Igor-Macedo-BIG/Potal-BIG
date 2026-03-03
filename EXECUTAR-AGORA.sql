-- EXECUTE ISSO AGORA NO SUPABASE SQL EDITOR
-- Copia tudo e cola lá, depois clica em RUN

-- Adicionar colunas cliente_id
ALTER TABLE funis ADD COLUMN IF NOT EXISTS cliente_id UUID REFERENCES clientes(id);
ALTER TABLE campanhas ADD COLUMN IF NOT EXISTS cliente_id UUID REFERENCES clientes(id);
ALTER TABLE conjuntos_anuncio ADD COLUMN IF NOT EXISTS cliente_id UUID REFERENCES clientes(id);
ALTER TABLE anuncios ADD COLUMN IF NOT EXISTS cliente_id UUID REFERENCES clientes(id);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_funis_cliente_id ON funis(cliente_id);
CREATE INDEX IF NOT EXISTS idx_campanhas_cliente_id ON campanhas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_conjuntos_anuncio_cliente_id ON conjuntos_anuncio(cliente_id);
CREATE INDEX IF NOT EXISTS idx_anuncios_cliente_id ON anuncios(cliente_id);
CREATE INDEX IF NOT EXISTS idx_metricas_cliente_id ON metricas(cliente_id);

-- Pronto! Agora você pode criar funis no sistema!
