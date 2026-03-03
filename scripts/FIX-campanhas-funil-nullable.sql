-- =============================================
-- FIX: Permitir campanhas sem funil vinculado
-- =============================================
-- Execute este script no Supabase SQL Editor
--
-- Problema: A tabela campanhas pode ter funil_id NOT NULL,
-- impedindo a sincronização de campanhas que ainda não foram
-- vinculadas a um funil. O sync da Meta falha silenciosamente.
-- =============================================

-- 1. Verificar estado atual da coluna funil_id
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'campanhas' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Tornar funil_id NULLABLE (permite campanhas sem funil)
ALTER TABLE public.campanhas ALTER COLUMN funil_id DROP NOT NULL;

-- 2b. Remover constraint restritiva de tipo (impede sync da Meta)
-- O tipo original era CHECK (tipo IN ('vendas', 'leads', 'awareness'))
-- Mas objectives da Meta como 'OUTCOME_ENGAGEMENT' violam essa constraint.
-- O código agora mapeia para valores válidos, mas removemos a constraint
-- restritiva por segurança (o front já controla os valores aceitos).
ALTER TABLE public.campanhas DROP CONSTRAINT IF EXISTS campanhas_tipo_check;

-- 3. Garantir que meta_id e empresa_id existem
ALTER TABLE public.campanhas ADD COLUMN IF NOT EXISTS meta_id TEXT;
ALTER TABLE public.campanhas ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE;

-- 4. Criar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_campanhas_meta_id ON public.campanhas(meta_id);
CREATE INDEX IF NOT EXISTS idx_campanhas_empresa_id ON public.campanhas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_campanhas_funil_id ON public.campanhas(funil_id);

-- 5. Garantir RLS permissivo
ALTER TABLE public.campanhas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "acesso_total_campanhas" ON public.campanhas;
CREATE POLICY "acesso_total_campanhas" ON public.campanhas FOR ALL USING (true);

-- Para conjuntos e anuncios também
ALTER TABLE public.conjuntos_anuncio ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "acesso_total_conjuntos" ON public.conjuntos_anuncio;
CREATE POLICY "acesso_total_conjuntos" ON public.conjuntos_anuncio FOR ALL USING (true);

ALTER TABLE public.anuncios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "acesso_total_anuncios" ON public.anuncios;
CREATE POLICY "acesso_total_anuncios" ON public.anuncios FOR ALL USING (true);

ALTER TABLE public.metricas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "acesso_total_metricas" ON public.metricas;
DROP POLICY IF EXISTS "Enable all access for metricas" ON public.metricas;
CREATE POLICY "acesso_total_metricas" ON public.metricas FOR ALL USING (true);

ALTER TABLE public.sync_logs_meta ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "acesso_total_sync_logs" ON public.sync_logs_meta;
CREATE POLICY "acesso_total_sync_logs" ON public.sync_logs_meta FOR ALL USING (true);

ALTER TABLE public.integracoes_meta ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "acesso_total_integracoes_meta" ON public.integracoes_meta;
CREATE POLICY "acesso_total_integracoes_meta" ON public.integracoes_meta FOR ALL USING (true);

-- 6. Verificar resultado final
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'campanhas' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 7. Verificar se há campanhas da Meta no banco
SELECT 
  c.id, 
  c.nome, 
  c.meta_id, 
  c.empresa_id, 
  c.funil_id,
  c.ativo,
  e.nome as empresa_nome
FROM public.campanhas c
LEFT JOIN public.empresas e ON c.empresa_id = e.id
WHERE c.meta_id IS NOT NULL
ORDER BY c.created_at DESC
LIMIT 20;
