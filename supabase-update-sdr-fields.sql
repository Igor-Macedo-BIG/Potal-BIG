-- ======================================
-- Atualização dos campos SDR no detalhe_sdr (JSONB)
-- ======================================
-- Este script atualiza a estrutura esperada do campo JSONB detalhe_sdr
-- para refletir as novas métricas do SDR

-- IMPORTANTE: O campo detalhe_sdr já existe como JSONB, então não precisa
-- criar nada novo. Este comentário apenas documenta a nova estrutura esperada.

-- ======================================
-- Nova estrutura JSONB esperada para detalhe_sdr:
-- ======================================
-- {
--   "comecou_diagnostico": 0,           // NOVO: Lead começou preencher diagnóstico
--   "chegaram_crm_kommo": 0,            // NOVO: Leads que chegaram ao CRM Kommo
--   "qualificados_para_mentoria": 0,    // EXISTENTE: Leads qualificados para Mentoria
--   "para_downsell": 0,                 // EXISTENTE: Leads Para Downsell
--   "agendados_diagnostico": 0,         // EXISTENTE: Leads agendados para Diagnóstico
--   "agendados_mentoria": 0,            // EXISTENTE: Leads Agendados para Mentoria
--   "nomes_qualificados": ""            // EXISTENTE: Nomes dos leads qualificados (um por linha)
-- }

-- ======================================
-- CAMPO REMOVIDO (não é mais usado):
-- ======================================
-- "preencheram_diagnostico" - REMOVIDO

-- ======================================
-- Verificação da estrutura atual da tabela metricas
-- ======================================
-- Execute esta query para confirmar que a tabela existe e tem a estrutura correta:

SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'metricas'
ORDER BY ordinal_position;

-- ======================================
-- Exemplo de query para inserir dados SDR com a nova estrutura
-- ======================================
/*
INSERT INTO public.metricas (
    tipo,
    referencia_id,
    periodo_inicio,
    periodo_fim,
    leads,
    vendas,
    detalhe_sdr
) VALUES (
    'campanha',
    'uuid-da-campanha-aqui',
    '2025-11-24',
    '2025-11-24',
    100,
    25,
    '{
        "comecou_diagnostico": 150,
        "chegaram_crm_kommo": 120,
        "qualificados_para_mentoria": 40,
        "para_downsell": 10,
        "agendados_diagnostico": 25,
        "agendados_mentoria": 12,
        "nomes_qualificados": "Maria Silva\nJoão Santos\nAna Oliveira"
    }'::jsonb
);
*/

-- ======================================
-- Query para verificar dados SDR existentes
-- ======================================
SELECT 
    id,
    tipo,
    periodo_inicio,
    periodo_fim,
    leads,
    vendas,
    detalhe_sdr,
    created_at,
    updated_at
FROM public.metricas
WHERE tipo = 'campanha'
  AND detalhe_sdr IS NOT NULL
ORDER BY periodo_inicio DESC
LIMIT 10;

-- ======================================
-- ATENÇÃO: Não há necessidade de executar ALTER TABLE
-- ======================================
-- A coluna detalhe_sdr já existe como JSONB na tabela metricas.
-- JSONB permite estruturas flexíveis, então você pode simplesmente
-- começar a usar os novos campos sem modificar o schema.
-- 
-- Se você tiver dados antigos com "preencheram_diagnostico",
-- eles continuarão funcionando. Os novos dados usarão
-- "comecou_diagnostico" e "chegaram_crm_kommo".

COMMENT ON COLUMN public.metricas.detalhe_sdr IS 'Detalhes específicos do departamento SDR (JSONB):
- comecou_diagnostico: Lead começou preencher diagnóstico
- chegaram_crm_kommo: Leads que chegaram ao CRM Kommo
- qualificados_para_mentoria: Leads qualificados para Mentoria
- para_downsell: Leads Para Downsell
- agendados_diagnostico: Leads agendados para Diagnóstico
- agendados_mentoria: Leads Agendados para Mentoria
- nomes_qualificados: Nomes dos leads qualificados (texto, um por linha)';
