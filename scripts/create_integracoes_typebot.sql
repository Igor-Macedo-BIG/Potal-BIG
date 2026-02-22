-- =============================================
-- Integração Typebot - Schema
-- Executar no Supabase SQL Editor
-- =============================================

-- Remover tabela antiga de webhooks se existir
DROP TABLE IF EXISTS typebot_webhook_logs CASCADE;

-- Tabela de configuração da integração Typebot por empresa
CREATE TABLE IF NOT EXISTS integracoes_typebot (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    nome TEXT NOT NULL DEFAULT 'Typebot Principal',
    typebot_id TEXT NOT NULL,           -- ID do typebot (publicId ou typebotId)
    api_token TEXT NOT NULL,            -- Token de API do Typebot.io (Settings > API tokens)
    ativo BOOLEAN DEFAULT true,
    variavel_nome TEXT DEFAULT 'Nome',  -- Nome da variável do Typebot que contém o nome do lead
    variavel_email TEXT DEFAULT 'Email',
    ultima_sincronizacao TIMESTAMP WITH TIME ZONE,
    erro_sincronizacao TEXT,
    total_sincronizados INTEGER DEFAULT 0,
    base_url TEXT,                      -- URL do Typebot self-hosted (NULL = app.typebot.io)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Migrar schema caso a tabela já existia com colunas antigas (webhook_secret, etc.)
ALTER TABLE integracoes_typebot ADD COLUMN IF NOT EXISTS api_token TEXT DEFAULT '';
ALTER TABLE integracoes_typebot ADD COLUMN IF NOT EXISTS variavel_nome TEXT DEFAULT 'Nome';
ALTER TABLE integracoes_typebot ADD COLUMN IF NOT EXISTS variavel_email TEXT DEFAULT 'Email';
ALTER TABLE integracoes_typebot ADD COLUMN IF NOT EXISTS ultima_sincronizacao TIMESTAMP WITH TIME ZONE;
ALTER TABLE integracoes_typebot ADD COLUMN IF NOT EXISTS erro_sincronizacao TEXT;
ALTER TABLE integracoes_typebot ADD COLUMN IF NOT EXISTS total_sincronizados INTEGER DEFAULT 0;
ALTER TABLE integracoes_typebot ADD COLUMN IF NOT EXISTS base_url TEXT;  -- URL do Typebot self-hosted (ex: https://typeboot.meudominio.com). NULL = app.typebot.io
ALTER TABLE integracoes_typebot ADD COLUMN IF NOT EXISTS funil_id UUID REFERENCES funis(id) ON DELETE SET NULL;  -- Funil ao qual esta integracao esta vinculada
-- Remover colunas antigas se existirem
ALTER TABLE integracoes_typebot DROP COLUMN IF EXISTS webhook_secret;
ALTER TABLE integracoes_typebot DROP COLUMN IF EXISTS evento_inicio;
ALTER TABLE integracoes_typebot DROP COLUMN IF EXISTS evento_conclusao;
ALTER TABLE integracoes_typebot DROP COLUMN IF EXISTS campo_nome;
ALTER TABLE integracoes_typebot DROP COLUMN IF EXISTS campo_email;
ALTER TABLE integracoes_typebot DROP COLUMN IF EXISTS campo_telefone;
ALTER TABLE integracoes_typebot DROP COLUMN IF EXISTS total_iniciados;
ALTER TABLE integracoes_typebot DROP COLUMN IF EXISTS total_concluidos;
ALTER TABLE integracoes_typebot DROP COLUMN IF EXISTS ultima_atividade;
-- Tornar typebot_id NOT NULL apenas se ainda não for (pode falhar em ALTER, ignorar se necessário)
-- ALTER TABLE integracoes_typebot ALTER COLUMN typebot_id SET NOT NULL;

-- Tabela de logs de sincronizações (igual sync_logs_meta)
CREATE TABLE IF NOT EXISTS sync_logs_typebot (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    integracao_id UUID REFERENCES integracoes_typebot(id) ON DELETE SET NULL,
    status TEXT NOT NULL,              -- 'success' | 'error' | 'partial'
    periodo_inicio DATE,
    periodo_fim DATE,
    total_resultados INTEGER DEFAULT 0,
    iniciados INTEGER DEFAULT 0,
    concluidos INTEGER DEFAULT 0,
    erro_detalhe TEXT,
    detalhes JSONB,
    iniciado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    finalizado_em TIMESTAMP WITH TIME ZONE
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_integracoes_typebot_empresa ON integracoes_typebot(empresa_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_typebot_empresa ON sync_logs_typebot(empresa_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_typebot_integracao ON sync_logs_typebot(integracao_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_typebot_iniciado ON sync_logs_typebot(iniciado_em DESC);

-- RLS
ALTER TABLE integracoes_typebot ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_logs_typebot ENABLE ROW LEVEL SECURITY;

-- Políticas - integracoes_typebot
DROP POLICY IF EXISTS "Empresas veem suas integracoes typebot" ON integracoes_typebot;
DROP POLICY IF EXISTS "Empresas gerenciam suas integracoes typebot" ON integracoes_typebot;
DROP POLICY IF EXISTS "Empresa ve seus sync logs typebot" ON sync_logs_typebot;

CREATE POLICY "Empresas veem suas integracoes typebot" ON integracoes_typebot
    FOR SELECT USING (
        empresa_id IN (SELECT empresa_id FROM usuarios WHERE id = auth.uid())
    );

CREATE POLICY "Empresas gerenciam suas integracoes typebot" ON integracoes_typebot
    FOR ALL USING (
        empresa_id IN (SELECT empresa_id FROM usuarios WHERE id = auth.uid())
    );

-- Políticas - sync_logs_typebot
CREATE POLICY "Empresa ve seus sync logs typebot" ON sync_logs_typebot
    FOR ALL USING (
        empresa_id IN (SELECT empresa_id FROM usuarios WHERE id = auth.uid())
    );

COMMENT ON TABLE integracoes_typebot IS 'Configurações de integração com Typebot por empresa';
COMMENT ON TABLE sync_logs_typebot IS 'Histórico de sincronizações com a API do Typebot';
