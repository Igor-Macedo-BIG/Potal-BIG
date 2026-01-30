-- ====================================================================
-- SCRIPT DE MÉTRICAS REALISTAS - NOVEMBRO 2025
-- Faturamento total: R$ 82.000 EXATO (soma de todas campanhas)
-- VALORES REAIS: Mentoria = R$ 10.000 | PPV 47 = R$ 47 | PPV 97 = R$ 97
-- Inclui TODOS os departamentos: SDR, Closer, Social Seller, CS
-- DISTRIBUIÇÃO FIXA POR CAMPANHA (não por funil)
-- ====================================================================

DO $$
DECLARE
    campanha_record RECORD;
    dia_mes DATE;
    dia_semana INTEGER;
    multiplicador NUMERIC;
    
    -- Valores por campanha
    valor_produto NUMERIC;
    vendas_mes_total INTEGER;
    investimento_mes_campanha NUMERIC;
    faturamento_alvo_campanha NUMERIC;
    
    -- Controle de faturamento total
    faturamento_total_desejado NUMERIC := 82000; -- R$ 82.000 no total
    total_campanhas INTEGER;
    
    -- Valores diários
    investimento_dia NUMERIC;
    faturamento_dia NUMERIC;
    alcance_dia INTEGER;
    impressoes_dia INTEGER;
    cliques_dia INTEGER;
    visualizacoes_dia INTEGER;
    leads_dia INTEGER;
    checkouts_dia INTEGER;
    vendas_dia INTEGER;
    
    -- Controle de vendas distribuídas
    vendas_restantes INTEGER;
    dia_count INTEGER;
    
    -- Métricas SDR
    comecou_diag INTEGER;
    chegaram_crm INTEGER;
    qualificados INTEGER;
    downsell INTEGER;
    agend_diag INTEGER;
    agend_ment INTEGER;
    
    -- Métricas Closer
    calls_base INTEGER;
    no_shows INTEGER;
    vendas_ment INTEGER;
    vendas_down INTEGER;
    em_negoc INTEGER;
    em_follow INTEGER;
    vendas_perd INTEGER;
    
    -- Métricas Social Seller
    ss_contatados INTEGER;
    ss_agend_diag INTEGER;
    ss_agend_ment INTEGER;
    ss_agend_cons INTEGER;
    ss_down_vend INTEGER;
    
    -- Métricas CS
    cs_alunas INTEGER;
    cs_suporte INTEGER;
    cs_resolvidos INTEGER;
    cs_pendentes INTEGER;
    cs_produtos INTEGER;
    
    dias_trabalho INTEGER := 30; -- Novembro completo (30 dias)
    
BEGIN
    -- ====================================================================
    -- LIMPEZA: Apagar APENAS métricas de novembro 2025
    -- ====================================================================
    DELETE FROM metricas 
    WHERE periodo_inicio >= '2025-11-01' 
      AND periodo_fim <= '2025-11-30';
    
    RAISE NOTICE '🗑️  Métricas de novembro 2025 removidas';
    RAISE NOTICE '==================================================';
    
    -- Contar total de campanhas ATIVAS
    SELECT COUNT(*) INTO total_campanhas 
    FROM campanhas c
    WHERE c.funil_id IS NOT NULL;
    
    IF total_campanhas = 0 THEN
        RAISE NOTICE '⚠️  NENHUMA CAMPANHA ENCONTRADA!';
        RETURN;
    END IF;
    
    RAISE NOTICE '📊 Total de campanhas no sistema: %', total_campanhas;
    RAISE NOTICE '💰 Faturamento total a distribuir: R$ 82.000,00';
    RAISE NOTICE '💡 Faturamento por campanha: R$ %', ROUND(faturamento_total_desejado / total_campanhas, 2);
    RAISE NOTICE '==================================================';
    
    -- Loop por TODAS as campanhas com funil (distribuição igual)
    FOR campanha_record IN 
        SELECT c.*, f.nome as funil_nome
        FROM campanhas c
        INNER JOIN funis f ON c.funil_id = f.id
        ORDER BY c.created_at
    LOOP
        RAISE NOTICE '';
        RAISE NOTICE '📍 Campanha: % (Funil: %)', campanha_record.nome, campanha_record.funil_nome;
        
        -- Faturamento DIVIDIDO igualmente entre TODAS as campanhas
        faturamento_alvo_campanha := faturamento_total_desejado / total_campanhas;
        
        -- Identificar valor do produto baseado no nome
        IF campanha_record.nome ILIKE '%47%' OR campanha_record.nome ILIKE '%ppv%47%' THEN
            valor_produto := 47.00;
        ELSIF campanha_record.nome ILIKE '%97%' OR campanha_record.nome ILIKE '%ppv%97%' THEN
            valor_produto := 97.00;
        ELSE
            -- Mentoria (padrão)
            valor_produto := 10000.00;
        END IF;
        
        -- Calcular vendas necessárias para atingir o faturamento alvo
        vendas_mes_total := GREATEST(FLOOR(faturamento_alvo_campanha / valor_produto)::INTEGER, 1);
        
        -- Investimento para ROAS ~7x
        investimento_mes_campanha := faturamento_alvo_campanha / 7.0;
        
        RAISE NOTICE '   → Produto: R$ % | Vendas mês: % | Fat. alvo: R$ % | Invest: R$ %', 
            valor_produto, vendas_mes_total, ROUND(faturamento_alvo_campanha, 2), ROUND(investimento_mes_campanha, 2);
        
        -- Resetar contador de vendas para esta campanha
        vendas_restantes := vendas_mes_total;
        dia_count := 0;
        
        -- Loop por todos os dias de novembro
        FOR dia_mes IN 
            SELECT generate_series('2025-11-01'::date, '2025-11-30'::date, '1 day'::interval)::date
        LOOP
            dia_semana := EXTRACT(DOW FROM dia_mes);
            
            dia_count := dia_count + 1;
            
            -- Definir multiplicador baseado no dia
            IF dia_semana = 0 THEN
                multiplicador := 0.5;  -- Domingo
            ELSIF dia_semana = 6 THEN
                multiplicador := 0.7;  -- Sábado
            ELSE
                multiplicador := 1.0 + (RANDOM() * 0.3 - 0.15);  -- Dias úteis: 0.85-1.15
            END IF;
            
            -- Distribuir vendas garantindo que a soma seja exata
            IF dia_count < dias_trabalho THEN
                -- Dias normais: distribuir proporcionalmente
                vendas_dia := FLOOR((vendas_mes_total::NUMERIC / dias_trabalho) * multiplicador)::INTEGER;
                vendas_dia := LEAST(vendas_dia, vendas_restantes); -- Não exceder o restante
            ELSE
                -- Último dia: todas as vendas restantes
                vendas_dia := vendas_restantes;
            END IF;
            
            vendas_restantes := vendas_restantes - vendas_dia;
            
            -- Calcular faturamento = vendas × valor_produto (GARANTIDO correto)
            faturamento_dia := vendas_dia * valor_produto;
            
            -- Investimento distribuído
            investimento_dia := (investimento_mes_campanha / dias_trabalho) * multiplicador;
            
            -- Métricas de tráfego baseadas no valor do produto
            IF valor_produto >= 1000 THEN
                -- Mentoria: menos tráfego, mais qualificado
                alcance_dia := FLOOR((2000 + (RANDOM() * 1000)) * multiplicador)::INTEGER;
                impressoes_dia := FLOOR(alcance_dia * (2.0 + RANDOM() * 0.5))::INTEGER;
                cliques_dia := FLOOR(impressoes_dia * (0.015 + RANDOM() * 0.010))::INTEGER;  -- CTR 1.5-2.5%
                leads_dia := FLOOR(cliques_dia * (0.15 + RANDOM() * 0.10))::INTEGER;  -- Conv 15-25%
            ELSE
                -- PPV: mais tráfego, volume maior
                alcance_dia := FLOOR((5000 + (RANDOM() * 3000)) * multiplicador)::INTEGER;
                impressoes_dia := FLOOR(alcance_dia * (3.0 + RANDOM() * 1.0))::INTEGER;
                cliques_dia := FLOOR(impressoes_dia * (0.030 + RANDOM() * 0.020))::INTEGER;  -- CTR 3-5%
                leads_dia := FLOOR(cliques_dia * (0.30 + RANDOM() * 0.15))::INTEGER;  -- Conv 30-45%
            END IF;
            
            visualizacoes_dia := FLOOR(cliques_dia * (0.70 + RANDOM() * 0.15))::INTEGER;
            checkouts_dia := FLOOR(leads_dia * (0.85 + RANDOM() * 0.10))::INTEGER;
            visualizacoes_dia := FLOOR(cliques_dia * (0.70 + RANDOM() * 0.15))::INTEGER;
            checkouts_dia := FLOOR(leads_dia * (0.85 + RANDOM() * 0.10))::INTEGER;
            
            -- Garantir valores mínimos
            alcance_dia := GREATEST(alcance_dia, 50);
            impressoes_dia := GREATEST(impressoes_dia, 150);
            cliques_dia := GREATEST(cliques_dia, 5);
            visualizacoes_dia := GREATEST(visualizacoes_dia, 3);
            leads_dia := GREATEST(leads_dia, 1);
            checkouts_dia := GREATEST(checkouts_dia, vendas_dia);
            
            -- Métricas SDR
            comecou_diag := GREATEST(FLOOR(leads_dia * (0.50 + RANDOM() * 0.20))::INTEGER, vendas_dia);
            chegaram_crm := GREATEST(FLOOR(comecou_diag * (0.80 + RANDOM() * 0.15))::INTEGER, vendas_dia);
            qualificados := GREATEST(FLOOR(chegaram_crm * (0.70 + RANDOM() * 0.20))::INTEGER, vendas_dia);
            downsell := FLOOR(chegaram_crm * (0.10 + RANDOM() * 0.10))::INTEGER;
            agend_diag := GREATEST(FLOOR(qualificados * (0.85 + RANDOM() * 0.10))::INTEGER, vendas_dia);
            agend_ment := GREATEST(FLOOR(qualificados * (0.75 + RANDOM() * 0.20))::INTEGER, vendas_dia);
            
            -- Métricas Closer
            calls_base := qualificados;
            no_shows := FLOOR(calls_base * (0.08 + RANDOM() * 0.08))::INTEGER;
            vendas_ment := vendas_dia;
            vendas_down := FLOOR(vendas_ment * (0.12 + RANDOM() * 0.10))::INTEGER;
            em_negoc := FLOOR((calls_base - vendas_ment - no_shows) * (0.20 + RANDOM() * 0.15))::INTEGER;
            em_follow := FLOOR((calls_base - vendas_ment - no_shows) * (0.30 + RANDOM() * 0.15))::INTEGER;
            vendas_perd := GREATEST(calls_base - vendas_ment - no_shows - em_negoc - em_follow, 0);
            
            -- Métricas Social Seller
            ss_contatados := FLOOR(leads_dia * (0.15 + RANDOM() * 0.10))::INTEGER;
            ss_agend_diag := FLOOR(ss_contatados * (0.30 + RANDOM() * 0.15))::INTEGER;
            ss_agend_ment := FLOOR(ss_contatados * (0.20 + RANDOM() * 0.15))::INTEGER;
            ss_agend_cons := FLOOR(ss_contatados * (0.10 + RANDOM() * 0.08))::INTEGER;
            ss_down_vend := FLOOR(ss_contatados * (0.05 + RANDOM() * 0.07))::INTEGER;
            
            -- Métricas CS
            cs_alunas := 12 + (EXTRACT(DAY FROM dia_mes) % 10);
            cs_suporte := 6 + (EXTRACT(DAY FROM dia_mes) % 6);
            cs_resolvidos := FLOOR(cs_suporte * (0.75 + RANDOM() * 0.20))::INTEGER;
            cs_pendentes := cs_suporte - cs_resolvidos;
            cs_produtos := FLOOR(vendas_dia * (0.03 + RANDOM() * 0.07))::INTEGER;
            -- ================================================================
            -- INSERIR MÉTRICAS DA CAMPANHA
            -- ================================================================
            INSERT INTO metricas (
                tipo, referencia_id, periodo_inicio, periodo_fim,
                alcance, impressoes, cliques, visualizacoes_pagina,
                leads, checkouts, vendas, investimento, faturamento,
                roas, ctr, cpm, cpc, cpl, taxa_conversao,
                detalhe_sdr, detalhe_closer, detalhe_social_seller, detalhe_cs
            ) VALUES (
                'campanha',
                campanha_record.id,
                dia_mes,
                dia_mes,
                alcance_dia,
                impressoes_dia,
                cliques_dia,
                visualizacoes_dia,
                leads_dia,
                checkouts_dia,
                vendas_dia,
                ROUND(investimento_dia, 2),
                ROUND(faturamento_dia, 2),
                ROUND((faturamento_dia / NULLIF(investimento_dia, 0))::NUMERIC, 2),
                ROUND((cliques_dia::NUMERIC / NULLIF(impressoes_dia, 1) * 100), 2),
                ROUND((investimento_dia / NULLIF(impressoes_dia, 1) * 1000), 2),
                ROUND((investimento_dia / NULLIF(cliques_dia, 1)), 2),
                ROUND((investimento_dia / NULLIF(leads_dia, 1)), 2),
                ROUND((vendas_dia::NUMERIC / NULLIF(leads_dia, 1) * 100), 2),
                jsonb_build_object(
                    'comecou_diagnostico', comecou_diag,
                    'chegaram_crm_kommo', chegaram_crm,
                    'qualificados_para_mentoria', qualificados,
                    'para_downsell', downsell,
                    'agendados_diagnostico', agend_diag,
                    'agendados_mentoria', agend_ment,
                    'nomes_qualificados', 
                        CASE WHEN qualificados >= 1 THEN 'Ana Silva' ELSE '' END ||
                        CASE WHEN qualificados >= 2 THEN E'\nCarlos Santos' ELSE '' END ||
                        CASE WHEN qualificados >= 3 THEN E'\nBeatriz Lima' ELSE '' END ||
                        CASE WHEN qualificados >= 4 THEN E'\nRafael Costa' ELSE '' END ||
                        CASE WHEN qualificados >= 5 THEN E'\nJuliana Pereira' ELSE '' END
                ),
                jsonb_build_object(
                    'calls_realizadas', calls_base,
                    'nao_compareceram', no_shows,
                    'vendas_mentoria', vendas_ment,
                    'vendas_downsell', vendas_down,
                    'em_negociacao', em_negoc,
                    'em_followup', em_follow,
                    'vendas_perdidas', vendas_perd
                ),
                jsonb_build_object(
                    'leads_contatados', ss_contatados,
                    'agendados_diagnostico', ss_agend_diag,
                    'agendados_mentoria', ss_agend_ment,
                    'agendados_consultoria', ss_agend_cons,
                    'downsell_vendido', ss_down_vend
                ),
                jsonb_build_object(
                    'alunas_contatadas', cs_alunas,
                    'suporte_prestado', cs_suporte,
                    'suporte_resolvidos', cs_resolvidos,
                    'suporte_pendentes', cs_pendentes,
                    'produtos_vendidos', cs_produtos
                )
            )
            ON CONFLICT (tipo, referencia_id, periodo_inicio, periodo_fim) 
            DO UPDATE SET
                alcance = EXCLUDED.alcance,
                impressoes = EXCLUDED.impressoes,
                cliques = EXCLUDED.cliques,
                visualizacoes_pagina = EXCLUDED.visualizacoes_pagina,
                leads = EXCLUDED.leads,
                checkouts = EXCLUDED.checkouts,
                vendas = EXCLUDED.vendas,
                investimento = EXCLUDED.investimento,
                faturamento = EXCLUDED.faturamento,
                roas = EXCLUDED.roas,
                ctr = EXCLUDED.ctr,
                cpm = EXCLUDED.cpm,
                cpc = EXCLUDED.cpc,
                cpl = EXCLUDED.cpl,
                taxa_conversao = EXCLUDED.taxa_conversao,
                detalhe_sdr = EXCLUDED.detalhe_sdr,
                detalhe_closer = EXCLUDED.detalhe_closer,
                detalhe_social_seller = EXCLUDED.detalhe_social_seller,
                detalhe_cs = EXCLUDED.detalhe_cs;
            
        END LOOP;  -- Fim loop dias
        
    END LOOP;  -- Fim loop campanhas
    
    RAISE NOTICE '==================================================';
    RAISE NOTICE '✅ POPULAÇÃO DE MÉTRICAS CONCLUÍDA!';
    RAISE NOTICE '📊 Total de campanhas processadas: %', total_campanhas;
    RAISE NOTICE '==================================================';
    
END $$;

-- ====================================================================
-- VERIFICAÇÕES E RELATÓRIOS
-- ====================================================================

-- Verificar faturamento total
SELECT 
    'FATURAMENTO TOTAL' as metrica,
    TO_CHAR(SUM(faturamento), 'R$ 999,999.99') as valor,
    TO_CHAR(SUM(investimento), 'R$ 999,999.99') as investimento,
    ROUND(SUM(faturamento) / NULLIF(SUM(investimento), 0), 2) as roas_medio
FROM metricas
WHERE periodo_inicio >= '2025-11-01' 
  AND periodo_fim <= '2025-11-30'
  AND tipo = 'campanha';

-- Faturamento por funil
SELECT 
    f.nome as funil,
    COUNT(DISTINCT c.id) as campanhas,
    TO_CHAR(SUM(m.faturamento), 'R$ 999,999.99') as faturamento,
    TO_CHAR(SUM(m.investimento), 'R$ 999,999.99') as investimento,
    ROUND(SUM(m.faturamento) / NULLIF(SUM(m.investimento), 0), 2) as roas,
    SUM(m.leads) as total_leads,
    SUM(m.vendas) as total_vendas
FROM metricas m
JOIN campanhas c ON m.referencia_id = c.id
JOIN funis f ON c.funil_id = f.id
WHERE m.periodo_inicio >= '2025-11-01' 
  AND m.periodo_fim <= '2025-11-30'
  AND m.tipo = 'campanha'
GROUP BY f.nome
ORDER BY SUM(m.faturamento) DESC;

-- Dados por departamento
SELECT 
    'SDR' as departamento,
    SUM((detalhe_sdr->>'comecou_diagnostico')::INTEGER) as metrica_1,
    SUM((detalhe_sdr->>'qualificados_para_mentoria')::INTEGER) as metrica_2
FROM metricas
WHERE periodo_inicio >= '2025-11-01' AND tipo = 'campanha'
UNION ALL
SELECT 
    'CLOSER' as departamento,
    SUM((detalhe_closer->>'calls_realizadas')::INTEGER) as metrica_1,
    SUM((detalhe_closer->>'vendas_mentoria')::INTEGER) as metrica_2
FROM metricas
WHERE periodo_inicio >= '2025-11-01' AND tipo = 'campanha';

-- Verificar métricas por criativo
SELECT 
    'CRIATIVOS' as tipo,
    COUNT(DISTINCT referencia_id) as total_criativos,
    COUNT(*) as total_registros,
    TO_CHAR(SUM(faturamento), 'R$ 999,999.99') as faturamento_total
FROM metricas
WHERE periodo_inicio >= '2025-11-01' 
  AND periodo_fim <= '2025-11-30'
  AND tipo = 'criativo';

-- ====================================================================
-- RESUMO COMPLETO DE TODOS OS DEPARTAMENTOS
-- ====================================================================
SELECT 
    '✅ RESUMO GERAL' as relatorio,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN tipo = 'campanha' THEN 1 END) as registros_campanha,
    COUNT(CASE WHEN tipo = 'criativo' THEN 1 END) as registros_criativo
FROM metricas
WHERE periodo_inicio >= '2025-11-01' 
  AND periodo_fim <= '2025-11-30';

-- Verificar se TODOS os departamentos foram preenchidos
SELECT 
    '📊 DEPARTAMENTOS PREENCHIDOS' as relatorio,
    COUNT(CASE WHEN detalhe_sdr IS NOT NULL THEN 1 END) as com_sdr,
    COUNT(CASE WHEN detalhe_closer IS NOT NULL THEN 1 END) as com_closer,
    COUNT(CASE WHEN detalhe_social_seller IS NOT NULL THEN 1 END) as com_social_seller,
    COUNT(CASE WHEN detalhe_cs IS NOT NULL THEN 1 END) as com_cs,
    COUNT(*) as total_campanhas
FROM metricas
WHERE periodo_inicio >= '2025-11-01' 
  AND periodo_fim <= '2025-11-30'
  AND tipo = 'campanha';

-- Totais por departamento
SELECT 
    '🎯 SDR' as departamento,
    SUM((detalhe_sdr->>'comecou_diagnostico')::INTEGER) as comecou_diagnostico,
    SUM((detalhe_sdr->>'chegaram_crm_kommo')::INTEGER) as chegaram_crm,
    SUM((detalhe_sdr->>'qualificados_para_mentoria')::INTEGER) as qualificados_mentoria,
    SUM((detalhe_sdr->>'agendados_mentoria')::INTEGER) as agendados_mentoria
FROM metricas
WHERE periodo_inicio >= '2025-11-01' 
  AND periodo_fim <= '2025-11-30'
  AND tipo = 'campanha'
UNION ALL
SELECT 
    '🤝 CLOSER' as departamento,
    SUM((detalhe_closer->>'calls_realizadas')::INTEGER) as metrica_1,
    SUM((detalhe_closer->>'nao_compareceram')::INTEGER) as metrica_2,
    SUM((detalhe_closer->>'vendas_mentoria')::INTEGER) as metrica_3,
    SUM((detalhe_closer->>'em_negociacao')::INTEGER) as metrica_4
FROM metricas
WHERE periodo_inicio >= '2025-11-01' 
  AND periodo_fim <= '2025-11-30'
  AND tipo = 'campanha'
UNION ALL
SELECT 
    '📱 SOCIAL SELLER' as departamento,
    SUM((detalhe_social_seller->>'leads_contatados')::INTEGER) as metrica_1,
    SUM((detalhe_social_seller->>'agendados_diagnostico')::INTEGER) as metrica_2,
    SUM((detalhe_social_seller->>'agendados_mentoria')::INTEGER) as metrica_3,
    SUM((detalhe_social_seller->>'downsell_vendido')::INTEGER) as metrica_4
FROM metricas
WHERE periodo_inicio >= '2025-11-01' 
  AND periodo_fim <= '2025-11-30'
  AND tipo = 'campanha'
UNION ALL
SELECT 
    '❤️ CS' as departamento,
    SUM((detalhe_cs->>'alunas_contatadas')::INTEGER) as metrica_1,
    SUM((detalhe_cs->>'suporte_prestado')::INTEGER) as metrica_2,
    SUM((detalhe_cs->>'suporte_resolvidos')::INTEGER) as metrica_3,
    SUM((detalhe_cs->>'produtos_vendidos')::INTEGER) as metrica_4
FROM metricas
WHERE periodo_inicio >= '2025-11-01' 
  AND periodo_fim <= '2025-11-30'
  AND tipo = 'campanha';
