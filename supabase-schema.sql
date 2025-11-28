-- Script SQL para criar TODAS as tabelas necessárias no Supabase
-- Execute este script no SQL Editor do Supabase

-- ======================================
-- 1. Tabela: funis (se não existir)
-- ======================================
CREATE TABLE IF NOT EXISTS public.funis (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome TEXT NOT NULL,
    descricao TEXT,
    empresa_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.funis ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all access for funis" ON public.funis;
CREATE POLICY "Enable all access for funis" ON public.funis
    FOR ALL USING (true);

-- ======================================
-- 2. Tabela: campanhas (se não existir)
-- ======================================
CREATE TABLE IF NOT EXISTS public.campanhas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome TEXT NOT NULL,
    tipo TEXT,
    funil_id UUID NOT NULL REFERENCES public.funis(id) ON DELETE CASCADE,
    plataforma TEXT,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.campanhas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all access for campanhas" ON public.campanhas;
CREATE POLICY "Enable all access for campanhas" ON public.campanhas
    FOR ALL USING (true);

-- ======================================
-- 3. Tabela: conjuntos_anuncio
-- ======================================
CREATE TABLE IF NOT EXISTS public.conjuntos_anuncio (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome TEXT NOT NULL,
    publico TEXT,
    ativo BOOLEAN DEFAULT true,
    campanha_id UUID NOT NULL REFERENCES public.campanhas(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.conjuntos_anuncio ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all access for conjuntos_anuncio" ON public.conjuntos_anuncio;
CREATE POLICY "Enable all access for conjuntos_anuncio" ON public.conjuntos_anuncio
    FOR ALL USING (true);

-- ======================================
-- 4. Tabela: anuncios
-- ======================================
CREATE TABLE IF NOT EXISTS public.anuncios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome TEXT NOT NULL,
    tipo TEXT,
    conjunto_anuncio_id UUID NOT NULL REFERENCES public.conjuntos_anuncio(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.anuncios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all access for anuncios" ON public.anuncios;
CREATE POLICY "Enable all access for anuncios" ON public.anuncios
    FOR ALL USING (true);

-- ======================================
-- Comentários
-- ======================================
COMMENT ON TABLE public.funis IS 'Funis de vendas da empresa';
COMMENT ON TABLE public.campanhas IS 'Campanhas de tráfego pago vinculadas a funis';
COMMENT ON TABLE public.conjuntos_anuncio IS 'Conjuntos de anúncios vinculados a campanhas';
COMMENT ON TABLE public.anuncios IS 'Anúncios vinculados a conjuntos de anúncio';
