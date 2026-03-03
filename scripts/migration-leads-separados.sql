-- =========================================================
-- Migration: Separar leads por plataforma (WhatsApp / Messenger/Instagram / Páginas)
-- Executar no Supabase SQL Editor
-- =========================================================

-- 1. Novas colunas na tabela metricas
ALTER TABLE metricas ADD COLUMN IF NOT EXISTS leads_whatsapp INTEGER DEFAULT 0;
ALTER TABLE metricas ADD COLUMN IF NOT EXISTS leads_messenger INTEGER DEFAULT 0;

-- 2. Índices para performance
CREATE INDEX IF NOT EXISTS idx_metricas_leads_whatsapp ON metricas(leads_whatsapp);
CREATE INDEX IF NOT EXISTS idx_metricas_leads_messenger ON metricas(leads_messenger);

-- 3. Atualizar relatorio_config: renomear 'leads' e 'mensagens', adicionar novas métricas
-- Renomear 'leads' → 'Leads de Páginas'
UPDATE relatorio_config SET nome_display = 'Leads de Páginas' WHERE metrica_key = 'leads';

-- Renomear 'mensagens' → 'Mensagens (Total)'
UPDATE relatorio_config SET nome_display = 'Mensagens (Total)' WHERE metrica_key = 'mensagens';

-- 4. Inserir novas métricas para todas as empresas existentes
DO $$
DECLARE
  emp RECORD;
BEGIN
  FOR emp IN SELECT id FROM empresas LOOP
    -- Leads WhatsApp
    INSERT INTO relatorio_config (empresa_id, metrica_key, nome_display, visivel, ordem)
    VALUES (emp.id, 'leads_whatsapp', 'Leads WhatsApp', true, 25)
    ON CONFLICT (empresa_id, metrica_key) DO NOTHING;

    -- Leads Messenger/Instagram  
    INSERT INTO relatorio_config (empresa_id, metrica_key, nome_display, visivel, ordem)
    VALUES (emp.id, 'leads_messenger', 'Leads Messenger/Instagram', true, 26)
    ON CONFLICT (empresa_id, metrica_key) DO NOTHING;

    -- Custo por Mensagem
    INSERT INTO relatorio_config (empresa_id, metrica_key, nome_display, visivel, ordem)
    VALUES (emp.id, 'custo_por_mensagem', 'Custo por Mensagem', true, 35)
    ON CONFLICT (empresa_id, metrica_key) DO NOTHING;

    -- Média Diária de Mensagens
    INSERT INTO relatorio_config (empresa_id, metrica_key, nome_display, visivel, ordem)
    VALUES (emp.id, 'media_diaria_mensagens', 'Média Diária de Mensagens', true, 36)
    ON CONFLICT (empresa_id, metrica_key) DO NOTHING;
  END LOOP;
END $$;

-- 5. Verificação
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'metricas' 
  AND column_name IN ('leads_whatsapp', 'leads_messenger')
ORDER BY column_name;

SELECT DISTINCT metrica_key, nome_display, ordem
FROM relatorio_config
ORDER BY ordem;
