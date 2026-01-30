-- Script para popular TODAS as campanhas com dados de Dezembro/2025
-- Este script busca automaticamente todas as campanhas e insere dados para cada uma

-- ====================================================================
-- SCRIPT DINÂMICO - GERA DADOS PARA TODAS AS CAMPANHAS
-- ====================================================================

DO $$
DECLARE
    campanha_record RECORD;
    dia_mes DATE;
    dia_semana INTEGER;
    alcance_base INTEGER;
    impressoes_base INTEGER;
    cliques_base INTEGER;
    visualizacoes_base INTEGER;
    leads_base INTEGER;
    checkouts_base INTEGER;
    vendas_base INTEGER;
    investimento_base NUMERIC;
    faturamento_base NUMERIC;
    multiplicador NUMERIC;
    comecou_diag INTEGER;
    chegaram_crm INTEGER;
    qualificados INTEGER;
    downsell INTEGER;
    agend_diag INTEGER;
    agend_ment INTEGER;
BEGIN
    -- Loop por todas as campanhas
    FOR campanha_record IN 
        SELECT id, nome FROM campanhas ORDER BY created_at
    LOOP
        RAISE NOTICE 'Gerando dados para campanha: %', campanha_record.nome;
        
        -- Loop por todos os dias de dezembro
        FOR dia_mes IN 
            SELECT generate_series('2025-12-01'::date, '2025-12-31'::date, '1 day'::interval)::date
        LOOP
            -- Pegar dia da semana (0=domingo, 6=sábado)
            dia_semana := EXTRACT(DOW FROM dia_mes);
            
            -- Definir multiplicador baseado no dia da semana
            -- Sábado e domingo têm menos tráfego
            -- Natal (25) e Ano Novo (31) têm redução significativa
            IF dia_mes = '2025-12-25' THEN
                multiplicador := 0.4;
            ELSIF dia_mes = '2025-12-31' THEN
                multiplicador := 0.5;
            ELSIF dia_mes = '2025-12-24' THEN
                multiplicador := 0.6;
            ELSIF dia_semana = 0 THEN -- Domingo
                multiplicador := 0.7;
            ELSIF dia_semana = 6 THEN -- Sábado
                multiplicador := 0.8;
            ELSE -- Dias úteis
                multiplicador := 1.0 + (RANDOM() * 0.2); -- 1.0 a 1.2
            END IF;
            
            -- Valores base diários (variam aleatoriamente)
            alcance_base := (12000 + (RANDOM() * 4000))::INTEGER;
            impressoes_base := alcance_base * 3 + (RANDOM() * 5000)::INTEGER;
            cliques_base := (impressoes_base * 0.03)::INTEGER;
            visualizacoes_base := (cliques_base * 0.65)::INTEGER;
            leads_base := (cliques_base * 0.033)::INTEGER;
            checkouts_base := (leads_base * 0.85)::INTEGER;
            vendas_base := (leads_base * 0.18)::INTEGER;
            investimento_base := 400 + (RANDOM() * 200);
            faturamento_base := investimento_base * (6 + RANDOM() * 3);
            
            -- Aplicar multiplicador
            alcance_base := (alcance_base * multiplicador)::INTEGER;
            impressoes_base := (impressoes_base * multiplicador)::INTEGER;
            cliques_base := (cliques_base * multiplicador)::INTEGER;
            visualizacoes_base := (visualizacoes_base * multiplicador)::INTEGER;
            leads_base := GREATEST((leads_base * multiplicador)::INTEGER, 20);
            checkouts_base := (checkouts_base * multiplicador)::INTEGER;
            vendas_base := GREATEST((vendas_base * multiplicador)::INTEGER, 3);
            investimento_base := (investimento_base * multiplicador);
            faturamento_base := (faturamento_base * multiplicador);
            
            -- Dados SDR baseados nos leads
            comecou_diag := GREATEST((leads_base * 0.3)::INTEGER, 5);
            chegaram_crm := GREATEST((comecou_diag * 0.8)::INTEGER, 4);
            qualificados := GREATEST((chegaram_crm * 0.65)::INTEGER, 3);
            downsell := GREATEST((chegaram_crm * 0.25)::INTEGER, 1);
            agend_diag := GREATEST((qualificados * 0.7)::INTEGER, 2);
            agend_ment := GREATEST((qualificados * 0.6)::INTEGER, 2);
            
            -- Inserir ou atualizar métrica
            INSERT INTO metricas (
                tipo, referencia_id, periodo_inicio, periodo_fim,
                alcance, impressoes, cliques, visualizacoes_pagina,
                leads, checkouts, vendas, investimento, faturamento,
                roas, ctr, cpm, cpc, cpl, taxa_conversao,
                detalhe_sdr
            ) VALUES (
                'campanha',
                campanha_record.id,
                dia_mes,
                dia_mes,
                alcance_base,
                impressoes_base,
                cliques_base,
                visualizacoes_base,
                leads_base,
                checkouts_base,
                vendas_base,
                ROUND(investimento_base::NUMERIC, 2),
                ROUND(faturamento_base::NUMERIC, 2),
                ROUND((faturamento_base / NULLIF(investimento_base, 0))::NUMERIC, 2),
                ROUND((cliques_base::NUMERIC / NULLIF(impressoes_base, 1) * 100)::NUMERIC, 2),
                ROUND((investimento_base / NULLIF(impressoes_base, 1) * 1000)::NUMERIC, 2),
                ROUND((investimento_base / NULLIF(cliques_base, 1))::NUMERIC, 2),
                ROUND((investimento_base / NULLIF(leads_base, 1))::NUMERIC, 2),
                ROUND((vendas_base::NUMERIC / NULLIF(leads_base, 1) * 100)::NUMERIC, 2),
                jsonb_build_object(
                    'comecou_diagnostico', comecou_diag,
                    'chegaram_crm_kommo', chegaram_crm,
                    'qualificados_para_mentoria', qualificados,
                    'para_downsell', downsell,
                    'agendados_diagnostico', agend_diag,
                    'agendados_mentoria', agend_ment,
                    'nomes_qualificados', 
                        CASE 
                            WHEN qualificados >= 1 THEN 'Maria Silva'
                            ELSE ''
                        END ||
                        CASE 
                            WHEN qualificados >= 2 THEN E'\nJoão Santos'
                            ELSE ''
                        END ||
                        CASE 
                            WHEN qualificados >= 3 THEN E'\nAna Costa'
                            ELSE ''
                        END ||
                        CASE 
                            WHEN qualificados >= 4 THEN E'\nPedro Oliveira'
                            ELSE ''
                        END ||
                        CASE 
                            WHEN qualificados >= 5 THEN E'\nCarla Souza'
                            ELSE ''
                        END ||
                        CASE 
                            WHEN qualificados >= 6 THEN E'\nLucas Almeida'
                            ELSE ''
                        END ||
                        CASE 
                            WHEN qualificados >= 7 THEN E'\nFernanda Lima'
                            ELSE ''
                        END ||
                        CASE 
                            WHEN qualificados >= 8 THEN E'\nRicardo Pereira'
                            ELSE ''
                        END ||
                        CASE 
                            WHEN qualificados >= 9 THEN E'\nJuliana Rocha'
                            ELSE ''
                        END ||
                        CASE 
                            WHEN qualificados >= 10 THEN E'\nGabriel Martins'
                            ELSE ''
                        END
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
                detalhe_sdr = EXCLUDED.detalhe_sdr;
                
        END LOOP;
        
        RAISE NOTICE 'Concluído para campanha: %', campanha_record.nome;
        
    END LOOP;
    
    RAISE NOTICE '==================================================';
    RAISE NOTICE 'SCRIPT CONCLUÍDO COM SUCESSO!';
    RAISE NOTICE '==================================================';
    
END $$;

-- ====================================================================
-- VERIFICAR DADOS INSERIDOS
-- ====================================================================
SELECT 
    c.nome as campanha,
    COUNT(m.*) as total_dias,
    SUM(m.investimento)::NUMERIC(10,2) as investimento_total,
    SUM(m.leads) as leads_total,
    SUM(m.vendas) as vendas_total,
    ROUND(AVG(m.roas)::NUMERIC, 2) as roas_medio,
    ROUND(AVG(m.taxa_conversao)::NUMERIC, 2) as taxa_conversao_media,
    SUM((m.detalhe_sdr->>'comecou_diagnostico')::INTEGER) as total_comecou_diag,
    SUM((m.detalhe_sdr->>'chegaram_crm_kommo')::INTEGER) as total_chegaram_crm,
    SUM((m.detalhe_sdr->>'qualificados_para_mentoria')::INTEGER) as total_qualificados
FROM metricas m
JOIN campanhas c ON c.id = m.referencia_id
WHERE m.periodo_inicio >= '2025-12-01' 
  AND m.periodo_fim <= '2025-12-31'
  AND m.tipo = 'campanha'
GROUP BY c.nome
ORDER BY c.nome;

-- ====================================================================
-- RESUMO GERAL DO MÊS
-- ====================================================================
SELECT 
    COUNT(DISTINCT referencia_id) as total_campanhas,
    COUNT(*) as total_registros,
    SUM(investimento)::NUMERIC(10,2) as investimento_total,
    SUM(leads) as leads_total,
    SUM(vendas) as vendas_total,
    ROUND(AVG(roas)::NUMERIC, 2) as roas_medio,
    ROUND(AVG(taxa_conversao)::NUMERIC, 2) as taxa_conversao_media
FROM metricas
WHERE periodo_inicio >= '2025-12-01' 
  AND periodo_fim <= '2025-12-31'
  AND tipo = 'campanha';

-- ====================================================================
-- LIMPAR DADOS DE DEZEMBRO (SE NECESSÁRIO)
-- ====================================================================
-- DELETE FROM metricas 
-- WHERE periodo_inicio >= '2025-12-01' 
--   AND periodo_fim <= '2025-12-31'
--   AND tipo = 'campanha';
