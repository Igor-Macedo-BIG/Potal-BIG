-- =============================================
-- MIGRATION: Campo mensagens + Página de relatório externo
-- =============================================
-- Execute este script no Supabase SQL Editor
-- =============================================

-- 1. Adicionar campo mensagens na tabela metricas
ALTER TABLE public.metricas ADD COLUMN IF NOT EXISTS mensagens INTEGER DEFAULT 0;

-- 2. Adicionar slug_relatorio na tabela empresas (para URL pública)
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS slug_relatorio TEXT UNIQUE;

-- 3. Criar tabela de configuração de métricas do relatório externo
CREATE TABLE IF NOT EXISTS public.relatorio_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  metrica_key TEXT NOT NULL,
  nome_display TEXT,
  visivel BOOLEAN DEFAULT true,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(empresa_id, metrica_key)
);

-- 4. RLS para relatorio_config
ALTER TABLE public.relatorio_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "acesso_total_relatorio_config" ON public.relatorio_config;
CREATE POLICY "acesso_total_relatorio_config" ON public.relatorio_config FOR ALL USING (true);

-- 5. Índices
CREATE INDEX IF NOT EXISTS idx_relatorio_config_empresa ON public.relatorio_config(empresa_id);
CREATE INDEX IF NOT EXISTS idx_empresas_slug ON public.empresas(slug_relatorio);
CREATE INDEX IF NOT EXISTS idx_metricas_mensagens ON public.metricas(mensagens);

-- 6. Gerar slugs para empresas existentes que ainda não têm
DO $$
DECLARE
  emp RECORD;
  base_slug TEXT;
  final_slug TEXT;
  random_num INTEGER;
BEGIN
  FOR emp IN SELECT id, nome FROM public.empresas WHERE slug_relatorio IS NULL LOOP
    -- Gerar slug base: minúsculas, sem espaços, sem acentos
    base_slug := lower(emp.nome);
    base_slug := translate(base_slug, 'áàâãéèêíìîóòôõúùûçñ', 'aaaaeeeiiioooouuucn');
    base_slug := regexp_replace(base_slug, '[^a-z0-9]', '', 'g');
    -- Gerar número aleatório de 3 dígitos
    random_num := floor(random() * 900 + 100)::INTEGER;
    final_slug := base_slug || '-' || random_num;
    -- Atualizar a empresa
    UPDATE public.empresas SET slug_relatorio = final_slug WHERE id = emp.id;
  END LOOP;
END $$;

-- 7. Seed padrão de métricas visíveis para empresas existentes
DO $$
DECLARE
  emp RECORD;
  metricas_keys TEXT[] := ARRAY[
    'investimento', 'leads', 'mensagens', 'cpl', 'ctr', 'roas',
    'alcance', 'impressoes', 'cliques', 'vendas', 'faturamento', 'cpm', 'cpc'
  ];
  metricas_nomes TEXT[] := ARRAY[
    'Investimento', 'Leads', 'Mensagens', 'Custo por Lead', 'CTR', 'ROAS',
    'Alcance', 'Impressões', 'Cliques', 'Vendas', 'Faturamento', 'CPM', 'CPC'
  ];
  i INTEGER;
BEGIN
  FOR emp IN SELECT id FROM public.empresas LOOP
    FOR i IN 1..array_length(metricas_keys, 1) LOOP
      INSERT INTO public.relatorio_config (empresa_id, metrica_key, nome_display, visivel, ordem)
      VALUES (emp.id, metricas_keys[i], metricas_nomes[i], true, i * 10)
      ON CONFLICT (empresa_id, metrica_key) DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

-- 8. Verificar resultado
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'metricas' AND column_name = 'mensagens';

SELECT id, nome, slug_relatorio FROM public.empresas ORDER BY nome;

SELECT * FROM public.relatorio_config LIMIT 10;
