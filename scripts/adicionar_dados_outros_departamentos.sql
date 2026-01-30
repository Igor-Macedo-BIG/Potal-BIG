-- Script complementar para adicionar dados de Closer, Social Seller e CS
-- aos registros já existentes de Dezembro/2025

-- ====================================================================
-- ATUALIZAR REGISTROS EXISTENTES COM DADOS DE TODOS DEPARTAMENTOS
-- ====================================================================

DO $$
DECLARE
    metrica_record RECORD;
    vendas_dia INTEGER;
    leads_dia INTEGER;
    -- Closer
    calls_base INTEGER;
    no_shows INTEGER;
    vendas_ment INTEGER;
    vendas_down INTEGER;
    em_negoc INTEGER;
    em_follow INTEGER;
    vendas_perd INTEGER;
    -- Social Seller
    ss_contatados INTEGER;
    ss_agend_diag INTEGER;
    ss_agend_ment INTEGER;
    ss_agend_cons INTEGER;
    ss_down_vend INTEGER;
    -- CS
    cs_alunas INTEGER;
    cs_suporte INTEGER;
    cs_resolvidos INTEGER;
    cs_pendentes INTEGER;
    cs_produtos INTEGER;
BEGIN
    -- Loop por todos os registros de métricas de dezembro
    FOR metrica_record IN 
        SELECT * FROM metricas 
        WHERE periodo_inicio >= '2025-12-01' 
          AND periodo_fim <= '2025-12-31'
          AND tipo = 'campanha'
        ORDER BY periodo_inicio
    LOOP
        vendas_dia := metrica_record.vendas;
        leads_dia := metrica_record.leads;
        
        -- ====================================================================
        -- DADOS CLOSER (baseados nas vendas do dia)
        -- ====================================================================
        -- Calls realizadas = ~70% dos qualificados SDR
        calls_base := GREATEST((metrica_record.detalhe_sdr->>'qualificados_para_mentoria')::INTEGER, 3);
        
        -- No-shows = ~15% das calls
        no_shows := GREATEST((calls_base * 0.15)::INTEGER, 0);
        
        -- Vendas Mentoria = vendas do dia
        vendas_ment := vendas_dia;
        
        -- Vendas Downsell = ~20% das vendas mentoria
        vendas_down := GREATEST((vendas_ment * 0.2)::INTEGER, 0);
        
        -- Em negociação = ~30% das calls que não viraram venda
        em_negoc := GREATEST(((calls_base - vendas_ment - no_shows) * 0.3)::INTEGER, 0);
        
        -- Em follow-up = ~40% das calls que não viraram venda
        em_follow := GREATEST(((calls_base - vendas_ment - no_shows) * 0.4)::INTEGER, 0);
        
        -- Vendas perdidas = restante
        vendas_perd := GREATEST((calls_base - vendas_ment - no_shows - em_negoc - em_follow), 0);
        
        -- ====================================================================
        -- DADOS SOCIAL SELLER (baseados nos leads do dia)
        -- ====================================================================
        -- Leads contatados = ~25% dos leads totais
        ss_contatados := GREATEST((leads_dia * 0.25)::INTEGER, 2);
        
        -- Agendados para diagnóstico = ~40% dos contatados
        ss_agend_diag := GREATEST((ss_contatados * 0.4)::INTEGER, 1);
        
        -- Agendados para mentoria = ~30% dos contatados
        ss_agend_ment := GREATEST((ss_contatados * 0.3)::INTEGER, 1);
        
        -- Agendados para consultoria = ~15% dos contatados
        ss_agend_cons := GREATEST((ss_contatados * 0.15)::INTEGER, 0);
        
        -- Downsell vendido = ~10% dos contatados
        ss_down_vend := GREATEST((ss_contatados * 0.1)::INTEGER, 0);
        
        -- ====================================================================
        -- DADOS CUSTOMER SUCCESS (valores mais estáveis)
        -- ====================================================================
        -- Alunas contatadas (base fixa + variação)
        cs_alunas := 15 + (EXTRACT(DAY FROM metrica_record.periodo_inicio) % 8);
        
        -- Suporte prestado
        cs_suporte := 8 + (EXTRACT(DAY FROM metrica_record.periodo_inicio) % 5);
        
        -- Suporte resolvidos = ~75% do suporte prestado
        cs_resolvidos := GREATEST((cs_suporte * 0.75)::INTEGER, 1);
        
        -- Suporte pendentes = restante
        cs_pendentes := cs_suporte - cs_resolvidos;
        
        -- Produtos vendidos (upsells)
        cs_produtos := GREATEST((vendas_dia * 0.1)::INTEGER, 0);
        
        -- ====================================================================
        -- ATUALIZAR REGISTRO
        -- ====================================================================
        UPDATE metricas
        SET 
            detalhe_closer = jsonb_build_object(
                'calls_realizadas', calls_base,
                'nao_compareceram', no_shows,
                'vendas_mentoria', vendas_ment,
                'vendas_downsell', vendas_down,
                'em_negociacao', em_negoc,
                'em_followup', em_follow,
                'vendas_perdidas', vendas_perd
            ),
            detalhe_social_seller = jsonb_build_object(
                'leads_contatados', ss_contatados,
                'agendados_diagnostico', ss_agend_diag,
                'agendados_mentoria', ss_agend_ment,
                'agendados_consultoria', ss_agend_cons,
                'downsell_vendido', ss_down_vend
            ),
            detalhe_cs = jsonb_build_object(
                'alunas_contatadas', cs_alunas,
                'suporte_prestado', cs_suporte,
                'suporte_resolvidos', cs_resolvidos,
                'suporte_pendentes', cs_pendentes,
                'produtos_vendidos', cs_produtos
            )
        WHERE id = metrica_record.id;
        
        RAISE NOTICE 'Atualizado: % - Closer: % calls, SS: % contatados, CS: % alunas', 
            metrica_record.periodo_inicio, 
            calls_base, 
            ss_contatados, 
            cs_alunas;
        
    END LOOP;
    
    RAISE NOTICE '==================================================';
    RAISE NOTICE 'ATUALIZAÇÃO CONCLUÍDA COM SUCESSO!';
    RAISE NOTICE '==================================================';
    
END $$;

-- ====================================================================
-- VERIFICAR DADOS ATUALIZADOS - CLOSER
-- ====================================================================
SELECT 
    'CLOSER' as departamento,
    SUM((detalhe_closer->>'calls_realizadas')::INTEGER) as total_calls,
    SUM((detalhe_closer->>'nao_compareceram')::INTEGER) as total_no_shows,
    SUM((detalhe_closer->>'vendas_mentoria')::INTEGER) as total_vendas_mentoria,
    SUM((detalhe_closer->>'vendas_downsell')::INTEGER) as total_vendas_downsell,
    SUM((detalhe_closer->>'em_negociacao')::INTEGER) as total_em_negociacao,
    SUM((detalhe_closer->>'em_followup')::INTEGER) as total_em_followup,
    SUM((detalhe_closer->>'vendas_perdidas')::INTEGER) as total_vendas_perdidas
FROM metricas
WHERE periodo_inicio >= '2025-12-01' 
  AND periodo_fim <= '2025-12-31'
  AND tipo = 'campanha';

-- ====================================================================
-- VERIFICAR DADOS ATUALIZADOS - SOCIAL SELLER
-- ====================================================================
SELECT 
    'SOCIAL SELLER' as departamento,
    SUM((detalhe_social_seller->>'leads_contatados')::INTEGER) as total_contatados,
    SUM((detalhe_social_seller->>'agendados_diagnostico')::INTEGER) as total_agend_diag,
    SUM((detalhe_social_seller->>'agendados_mentoria')::INTEGER) as total_agend_ment,
    SUM((detalhe_social_seller->>'agendados_consultoria')::INTEGER) as total_agend_cons,
    SUM((detalhe_social_seller->>'downsell_vendido')::INTEGER) as total_downsell
FROM metricas
WHERE periodo_inicio >= '2025-12-01' 
  AND periodo_fim <= '2025-12-31'
  AND tipo = 'campanha';

-- ====================================================================
-- VERIFICAR DADOS ATUALIZADOS - CUSTOMER SUCCESS
-- ====================================================================
SELECT 
    'CUSTOMER SUCCESS' as departamento,
    SUM((detalhe_cs->>'alunas_contatadas')::INTEGER) as total_alunas,
    SUM((detalhe_cs->>'suporte_prestado')::INTEGER) as total_suporte,
    SUM((detalhe_cs->>'suporte_resolvidos')::INTEGER) as total_resolvidos,
    SUM((detalhe_cs->>'suporte_pendentes')::INTEGER) as total_pendentes,
    SUM((detalhe_cs->>'produtos_vendidos')::INTEGER) as total_produtos
FROM metricas
WHERE periodo_inicio >= '2025-12-01' 
  AND periodo_fim <= '2025-12-31'
  AND tipo = 'campanha';

-- ====================================================================
-- RESUMO GERAL DE TODOS OS DEPARTAMENTOS
-- ====================================================================
SELECT 
    COUNT(*) as total_registros_atualizados,
    COUNT(CASE WHEN detalhe_sdr IS NOT NULL THEN 1 END) as com_dados_sdr,
    COUNT(CASE WHEN detalhe_closer IS NOT NULL THEN 1 END) as com_dados_closer,
    COUNT(CASE WHEN detalhe_social_seller IS NOT NULL THEN 1 END) as com_dados_social_seller,
    COUNT(CASE WHEN detalhe_cs IS NOT NULL THEN 1 END) as com_dados_cs
FROM metricas
WHERE periodo_inicio >= '2025-12-01' 
  AND periodo_fim <= '2025-12-31'
  AND tipo = 'campanha';
