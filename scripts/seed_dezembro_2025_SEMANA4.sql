-- =============================================
-- Script: Métricas da SEMANA ANTERIOR para comparação
-- Dezembro 2025 - Semana 4 (25/12 a 31/12)
-- Público: Público Quente (Assistiu 50% + Perfil 60D)
-- DADOS FICTÍCIOS para permitir comparação
-- =============================================

DO $$
DECLARE
  v_funil_id UUID;
  v_campanha_id UUID;
  v_publico_id UUID;
  v_data DATE;
  
  -- Totais da semana anterior (valores menores que janeiro para mostrar crescimento)
  v_impressoes_total INT := 12500;
  v_alcance_total INT := 5200;
  v_cliques_total INT := 120;
  v_visualizacoes_total INT := 90;
  v_leads_total INT := 38;
  v_investimento_total NUMERIC := 450.00;
  
  -- Valores por dia
  v_impressoes_dia INT;
  v_alcance_dia INT;
  v_cliques_dia INT;
  v_visualizacoes_dia INT;
  v_leads_dia INT;
  v_checkouts_dia INT;
  v_investimento_dia NUMERIC;
  
  v_dia_count INT := 0;
  v_dias_total INT := 7;
  
BEGIN
  RAISE NOTICE '🚀 Iniciando inserção de métricas da SEMANA ANTERIOR';
  RAISE NOTICE '📅 Período: 25/12/2025 a 31/12/2025 (7 dias)';
  RAISE NOTICE '💡 Dados fictícios para permitir comparação com Janeiro 2026';
  
  -- Buscar Funil "Aplicação"
  SELECT id INTO v_funil_id FROM funis WHERE nome ILIKE '%aplicação%' OR nome ILIKE '%aplicacao%' LIMIT 1;
  
  IF v_funil_id IS NOT NULL THEN
    RAISE NOTICE '✅ Funil encontrado: %', v_funil_id;
    
    -- Buscar Campanha "Aplicação Direta"
    SELECT id INTO v_campanha_id FROM campanhas 
    WHERE funil_id = v_funil_id 
      AND (nome ILIKE '%direta%' OR nome ILIKE '%aplicação%direta%')
    LIMIT 1;
    
    IF v_campanha_id IS NULL THEN
      SELECT id INTO v_campanha_id FROM campanhas WHERE funil_id = v_funil_id LIMIT 1;
    END IF;
  END IF;
  
  IF v_campanha_id IS NULL THEN
    SELECT id INTO v_campanha_id FROM campanhas LIMIT 1;
  END IF;
  
  IF v_campanha_id IS NULL THEN
    RAISE EXCEPTION '❌ NENHUMA CAMPANHA ENCONTRADA!';
  END IF;
  
  RAISE NOTICE '✅ Campanha encontrada: %', v_campanha_id;
  
  -- Buscar Público "Público Quente"
  SELECT id INTO v_publico_id FROM conjuntos_anuncio 
  WHERE campanha_id = v_campanha_id 
    AND (nome ILIKE '%quente%' OR nome ILIKE '%assistiu%50%' OR nome ILIKE '%perfil%60%')
  LIMIT 1;
  
  IF v_publico_id IS NULL THEN
    SELECT id INTO v_publico_id FROM conjuntos_anuncio WHERE campanha_id = v_campanha_id LIMIT 1;
  END IF;
  
  IF v_publico_id IS NULL THEN
    RAISE EXCEPTION '❌ NENHUM PÚBLICO ENCONTRADO!';
  END IF;
  
  RAISE NOTICE '✅ Público encontrado: %', v_publico_id;
  RAISE NOTICE '';
  
  -- Inserir 7 dias de métricas a nível de PÚBLICO
  FOR v_data IN 
    SELECT generate_series('2025-12-25'::date, '2025-12-31'::date, '1 day'::interval)::date
  LOOP
    v_dia_count := v_dia_count + 1;
    
    -- Distribuir valores pelos 7 dias
    IF v_dia_count < v_dias_total THEN
      v_impressoes_dia := FLOOR(v_impressoes_total::NUMERIC / v_dias_total);
      v_alcance_dia := FLOOR(v_alcance_total::NUMERIC / v_dias_total);
      v_cliques_dia := FLOOR(v_cliques_total::NUMERIC / v_dias_total);
      v_visualizacoes_dia := FLOOR(v_visualizacoes_total::NUMERIC / v_dias_total);
      v_leads_dia := FLOOR(v_leads_total::NUMERIC / v_dias_total);
      v_investimento_dia := ROUND((v_investimento_total / v_dias_total)::NUMERIC, 2);
    ELSE
      v_impressoes_dia := v_impressoes_total - (FLOOR(v_impressoes_total::NUMERIC / v_dias_total) * 6);
      v_alcance_dia := v_alcance_total - (FLOOR(v_alcance_total::NUMERIC / v_dias_total) * 6);
      v_cliques_dia := v_cliques_total - (FLOOR(v_cliques_total::NUMERIC / v_dias_total) * 6);
      v_visualizacoes_dia := v_visualizacoes_total - (FLOOR(v_visualizacoes_total::NUMERIC / v_dias_total) * 6);
      v_leads_dia := v_leads_total - (FLOOR(v_leads_total::NUMERIC / v_dias_total) * 6);
      v_investimento_dia := ROUND((v_investimento_total - (ROUND((v_investimento_total / v_dias_total)::NUMERIC, 2) * 6))::NUMERIC, 2);
    END IF;
    
    v_checkouts_dia := v_visualizacoes_dia;
    
    RAISE NOTICE '📅 % | Invest: R$ % | Leads: % | Tipo: publico', 
      v_data, v_investimento_dia, v_leads_dia;
    
    INSERT INTO metricas (
      tipo, referencia_id, periodo_inicio, periodo_fim,
      alcance, impressoes, cliques, visualizacoes_pagina,
      leads, checkouts, vendas, investimento, faturamento,
      roas, ctr, cpm, cpc, cpl, taxa_conversao
    ) VALUES (
      'publico',
      v_publico_id,
      v_data,
      v_data,
      v_alcance_dia,
      v_impressoes_dia,
      v_cliques_dia,
      v_visualizacoes_dia,
      v_leads_dia,
      v_checkouts_dia,
      0,
      v_investimento_dia,
      0,
      0,
      CASE WHEN v_impressoes_dia > 0 THEN ROUND((v_cliques_dia::NUMERIC / v_impressoes_dia * 100), 2) ELSE 0 END,
      CASE WHEN v_impressoes_dia > 0 THEN ROUND((v_investimento_dia / v_impressoes_dia * 1000), 2) ELSE 0 END,
      CASE WHEN v_cliques_dia > 0 THEN ROUND((v_investimento_dia / v_cliques_dia), 2) ELSE 0 END,
      CASE WHEN v_leads_dia > 0 THEN ROUND((v_investimento_dia / v_leads_dia), 2) ELSE 0 END,
      0
    )
    ON CONFLICT (tipo, referencia_id, periodo_inicio, periodo_fim) 
    DO UPDATE SET
      alcance = EXCLUDED.alcance,
      impressoes = EXCLUDED.impressoes,
      cliques = EXCLUDED.cliques,
      visualizacoes_pagina = EXCLUDED.visualizacoes_pagina,
      leads = EXCLUDED.leads,
      checkouts = EXCLUDED.checkouts,
      investimento = EXCLUDED.investimento,
      ctr = EXCLUDED.ctr,
      cpm = EXCLUDED.cpm,
      cpc = EXCLUDED.cpc,
      cpl = EXCLUDED.cpl;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '✅ ============================================';
  RAISE NOTICE '✅ CONCLUÍDO! Métricas da SEMANA ANTERIOR inseridas';
  RAISE NOTICE '✅ Público ID: %', v_publico_id;
  RAISE NOTICE '✅ Período: 25/12/2025 a 31/12/2025';
  RAISE NOTICE '✅ Total investido: R$ 450,00 | Total leads: 38';
  RAISE NOTICE '✅ ============================================';
  RAISE NOTICE '';
  RAISE NOTICE '📊 COMPARAÇÃO ESPERADA:';
  RAISE NOTICE '   Semana Anterior (25-31/12): R$ 450 | 38 leads';
  RAISE NOTICE '   Semana Atual (01-07/01):    R$ 534 | 49 leads';
  RAISE NOTICE '   Crescimento: +18.7%% invest | +28.9%% leads ⬆️';
  
END $$;

-- Verificar as métricas inseridas
SELECT 
  '✅ DEZ/2025 - SEMANA 4' as periodo,
  COUNT(*) as total_dias,
  TO_CHAR(SUM(investimento), 'R$ 999.99') as investimento,
  SUM(leads) as leads,
  SUM(impressoes) as impressoes,
  SUM(alcance) as alcance
FROM metricas
WHERE tipo = 'publico'
  AND periodo_inicio >= '2025-12-25'
  AND periodo_fim <= '2025-12-31';
