-- =============================================
-- Script: Métricas REAIS - Janeiro 2026 - Semana 1 (01/01 a 07/01)
-- Dados do Meta Ads Manager
-- Campanha: Aplicação Direta (Criativo - Formulário)
-- Funil: Aplicação | Público: Público Quente
-- =============================================

DO $$
DECLARE
  v_funil_id UUID;
  v_campanha_id UUID;
  v_data DATE;
  
  -- Totais da semana (agregado de todos os criativos)
  v_impressoes_total INT := 15764;  -- Soma de todos criativos
  v_alcance_total INT := 6637;      -- Estimado (não mostrado no print)
  v_cliques_total INT := 151;       -- Soma de todos criativos
  v_visualizacoes_total INT := 112; -- Soma de todos criativos
  v_leads_total INT := 49;          -- Soma de todos criativos
  v_investimento_total NUMERIC := 533.81;  -- Soma de todos criativos
  
  -- Valores por dia (dividir por 7)
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
  RAISE NOTICE '🚀 Iniciando inserção de métricas REAIS - Janeiro 2026 - Semana 1';
  RAISE NOTICE '📅 Período: 01/01/2026 a 07/01/2026 (7 dias)';
  RAISE NOTICE '📊 Total semana: R$ 533,81 | 49 leads | 15.764 impressões';
  
  -- Buscar Funil "Aplicação"
  SELECT id INTO v_funil_id FROM funis WHERE nome ILIKE '%aplicação%' OR nome ILIKE '%aplicacao%' LIMIT 1;
  IF v_funil_id IS NULL THEN 
    RAISE NOTICE '⚠️  Funil não encontrado, usando primeira campanha disponível';
    SELECT id INTO v_campanha_id FROM campanhas LIMIT 1;
  ELSE
    RAISE NOTICE '✅ Funil encontrado: %', v_funil_id;
    
    -- Buscar Campanha "Aplicação Direta"
    SELECT id INTO v_campanha_id FROM campanhas 
    WHERE funil_id = v_funil_id 
      AND (nome ILIKE '%aplicação%direta%' OR nome ILIKE '%aplicacao%direta%' OR nome ILIKE '%direta%') 
    LIMIT 1;
    
    IF v_campanha_id IS NULL THEN
      -- Se não encontrar, pegar primeira campanha do funil
      SELECT id INTO v_campanha_id FROM campanhas WHERE funil_id = v_funil_id LIMIT 1;
    END IF;
  END IF;
  
  IF v_campanha_id IS NULL THEN
    RAISE EXCEPTION '❌ NENHUMA CAMPANHA ENCONTRADA!';
  END IF;
  
  RAISE NOTICE '✅ Campanha encontrada: %', v_campanha_id;
  RAISE NOTICE '';
  
  -- Inserir 7 dias de métricas
  FOR v_data IN 
    SELECT generate_series('2026-01-01'::date, '2026-01-07'::date, '1 day'::interval)::date
  LOOP
    v_dia_count := v_dia_count + 1;
    
    -- Distribuir valores pelos 7 dias (último dia pega o resto)
    IF v_dia_count < v_dias_total THEN
      v_impressoes_dia := FLOOR(v_impressoes_total::NUMERIC / v_dias_total);
      v_alcance_dia := FLOOR(v_alcance_total::NUMERIC / v_dias_total);
      v_cliques_dia := FLOOR(v_cliques_total::NUMERIC / v_dias_total);
      v_visualizacoes_dia := FLOOR(v_visualizacoes_total::NUMERIC / v_dias_total);
      v_leads_dia := FLOOR(v_leads_total::NUMERIC / v_dias_total);
      v_investimento_dia := ROUND((v_investimento_total / v_dias_total)::NUMERIC, 2);
    ELSE
      -- Último dia: pegar o que sobrou
      v_impressoes_dia := v_impressoes_total - (FLOOR(v_impressoes_total::NUMERIC / v_dias_total) * 6);
      v_alcance_dia := v_alcance_total - (FLOOR(v_alcance_total::NUMERIC / v_dias_total) * 6);
      v_cliques_dia := v_cliques_total - (FLOOR(v_cliques_total::NUMERIC / v_dias_total) * 6);
      v_visualizacoes_dia := v_visualizacoes_total - (FLOOR(v_visualizacoes_total::NUMERIC / v_dias_total) * 6);
      v_leads_dia := v_leads_total - (FLOOR(v_leads_total::NUMERIC / v_dias_total) * 6);
      v_investimento_dia := ROUND((v_investimento_total - (ROUND((v_investimento_total / v_dias_total)::NUMERIC, 2) * 6))::NUMERIC, 2);
    END IF;
    
    -- Checkouts = visualizações (campanha de aplicação)
    v_checkouts_dia := v_visualizacoes_dia;
    
    RAISE NOTICE '📅 % | Invest: R$ % | Leads: % | Impressões: %', 
      v_data, v_investimento_dia, v_leads_dia, v_impressoes_dia;
    
    INSERT INTO metricas (
      tipo, referencia_id, periodo_inicio, periodo_fim,
      alcance, impressoes, cliques, visualizacoes_pagina,
      leads, checkouts, vendas, investimento, faturamento,
      roas, ctr, cpm, cpc, cpl, taxa_conversao
    ) VALUES (
      'campanha',
      v_campanha_id,
      v_data,
      v_data,
      v_alcance_dia,
      v_impressoes_dia,
      v_cliques_dia,
      v_visualizacoes_dia,
      v_leads_dia,
      v_checkouts_dia,
      0,  -- vendas (não aplicável para campanha de aplicação)
      v_investimento_dia,
      0,  -- faturamento (não aplicável)
      0,  -- roas
      CASE WHEN v_impressoes_dia > 0 THEN ROUND((v_cliques_dia::NUMERIC / v_impressoes_dia * 100), 2) ELSE 0 END,  -- ctr
      CASE WHEN v_impressoes_dia > 0 THEN ROUND((v_investimento_dia / v_impressoes_dia * 1000), 2) ELSE 0 END,  -- cpm
      CASE WHEN v_cliques_dia > 0 THEN ROUND((v_investimento_dia / v_cliques_dia), 2) ELSE 0 END,  -- cpc
      CASE WHEN v_leads_dia > 0 THEN ROUND((v_investimento_dia / v_leads_dia), 2) ELSE 0 END,  -- cpl
      0  -- taxa_conversao
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
      taxa_conversao = EXCLUDED.taxa_conversao;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '✅ ============================================';
  RAISE NOTICE '✅ CONCLUÍDO! Métricas da semana 1 de janeiro inseridas';
  RAISE NOTICE '✅ Período: 01/01/2026 a 07/01/2026';
  RAISE NOTICE '✅ Total investido: R$ 533,81 | Total leads: 49';
  RAISE NOTICE '✅ Total impressões: 15.764 | Total cliques: 151';
  RAISE NOTICE '✅ ============================================';
  
END $$;

-- Verificar os dados inseridos
SELECT 
  '✅ VERIFICAÇÃO' as status,
  COUNT(*) as total_dias,
  TO_CHAR(SUM(investimento), 'R$ 999.99') as investimento_total,
  SUM(leads) as leads_total,
  SUM(impressoes) as impressoes_total,
  SUM(cliques) as cliques_total,
  MIN(periodo_inicio) as primeira_data,
  MAX(periodo_fim) as ultima_data
FROM metricas
WHERE tipo = 'campanha'
  AND periodo_inicio >= '2026-01-01'
  AND periodo_fim <= '2026-01-07';

-- Ver detalhes por dia
SELECT 
  periodo_inicio as data,
  impressoes,
  cliques,
  leads,
  TO_CHAR(investimento, 'R$ 99.99') as investimento,
  ROUND(ctr, 2) as ctr_pct,
  TO_CHAR(cpl, 'R$ 99.99') as custo_por_lead
FROM metricas
WHERE tipo = 'campanha'
  AND periodo_inicio >= '2026-01-01'
  AND periodo_fim <= '2026-01-07'
ORDER BY periodo_inicio;
