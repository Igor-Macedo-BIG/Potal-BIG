-- =============================================
-- Script: Inserir Métricas REAIS - Janeiro 2026 - Semana 1 (01/01 a 07/01)
-- Funil: Aplicação
-- Campanha: Aplicação Direta (Criativo - Formulário)
-- Público: Público Quente (Assistiu 50% + 7 dias)
-- Nível: CRIATIVO (anúncios individuais)
-- =============================================

DO $$
DECLARE
  v_funil_id UUID;
  v_campanha_id UUID;
  v_publico_id UUID;
  v_criativo_id UUID;
  
  v_data_inicio DATE := '2026-01-01';
  v_data_fim DATE := '2026-01-07';
  v_data_atual DATE;
  v_dias_total INT := 7;
  v_dia_count INT;
  
  v_impressoes_total INT;
  v_alcance_total INT;
  v_cliques_total INT;
  v_visualizacoes_total INT;
  v_leads_total INT;
  v_investimento_total NUMERIC;
  
  v_impressoes_dia INT;
  v_alcance_dia INT;
  v_cliques_dia INT;
  v_visualizacoes_dia INT;
  v_leads_dia INT;
  v_checkouts_dia INT;
  v_investimento_dia NUMERIC;
  
  v_roas NUMERIC;
  v_ctr NUMERIC;
  v_cpm NUMERIC;
  v_cpc NUMERIC;
  v_cpl NUMERIC;
  v_taxa_conversao NUMERIC;
BEGIN
  RAISE NOTICE '🚀 Iniciando inserção de métricas REAIS - Janeiro 2026 - Semana 1';
  RAISE NOTICE '📅 Período: 01/01/2026 a 07/01/2026 (7 dias)';
  
  -- Buscar Funil "Aplicação"
  SELECT id INTO v_funil_id FROM funis WHERE nome ILIKE '%aplicação%' LIMIT 1;
  IF v_funil_id IS NULL THEN RAISE EXCEPTION '❌ Funil "Aplicação" não encontrado!'; END IF;
  RAISE NOTICE '✅ Funil encontrado: %', v_funil_id;
  
  -- Buscar Campanha "Aplicação Direta"
  SELECT id INTO v_campanha_id FROM campanhas WHERE funil_id = v_funil_id AND (nome ILIKE '%aplicação%direta%' OR nome ILIKE '%direta%') LIMIT 1;
  IF v_campanha_id IS NULL THEN RAISE EXCEPTION '❌ Campanha "Aplicação Direta" não encontrada!'; END IF;
  RAISE NOTICE '✅ Campanha encontrada: %', v_campanha_id;
  
  -- Buscar Público "Público Quente (Assistiu 50%)"
  SELECT id INTO v_publico_id FROM conjuntos_anuncio WHERE campanha_id = v_campanha_id AND (nome ILIKE '%quente%' OR nome ILIKE '%assistiu%50%' OR nome ILIKE '%assistiu 50%') LIMIT 1;
  IF v_publico_id IS NULL THEN RAISE EXCEPTION '❌ Público "Público Quente (Assistiu 50%%)" não encontrado!'; END IF;
  RAISE NOTICE '✅ Público encontrado: %', v_publico_id;
  
  -- =============================================
  -- CRIATIVO 1: Imagem 03
  -- =============================================
  SELECT id INTO v_criativo_id FROM anuncios WHERE conjunto_anuncio_id = v_publico_id AND nome ILIKE '%imagem%03%' LIMIT 1;
  IF v_criativo_id IS NOT NULL THEN
    RAISE NOTICE '';
    RAISE NOTICE '📊 Processando: Imagem 03';
    v_impressoes_total := 7900; v_alcance_total := 3915; v_cliques_total := 78; v_visualizacoes_total := 61; v_leads_total := 24; v_investimento_total := 259.13;
    v_dia_count := 0; v_data_atual := v_data_inicio;
    WHILE v_data_atual <= v_data_fim LOOP
      v_dia_count := v_dia_count + 1;
      IF v_dia_count < v_dias_total THEN
        v_impressoes_dia := FLOOR(v_impressoes_total::NUMERIC / v_dias_total); v_alcance_dia := FLOOR(v_alcance_total::NUMERIC / v_dias_total);
        v_cliques_dia := FLOOR(v_cliques_total::NUMERIC / v_dias_total); v_visualizacoes_dia := FLOOR(v_visualizacoes_total::NUMERIC / v_dias_total);
        v_leads_dia := FLOOR(v_leads_total::NUMERIC / v_dias_total); v_investimento_dia := ROUND((v_investimento_total / v_dias_total)::NUMERIC, 2);
      ELSE
        v_impressoes_dia := v_impressoes_total - (FLOOR(v_impressoes_total::NUMERIC / v_dias_total) * 6);
        v_alcance_dia := v_alcance_total - (FLOOR(v_alcance_total::NUMERIC / v_dias_total) * 6);
        v_cliques_dia := v_cliques_total - (FLOOR(v_cliques_total::NUMERIC / v_dias_total) * 6);
        v_visualizacoes_dia := v_visualizacoes_total - (FLOOR(v_visualizacoes_total::NUMERIC / v_dias_total) * 6);
        v_leads_dia := v_leads_total - (FLOOR(v_leads_total::NUMERIC / v_dias_total) * 6);
        v_investimento_dia := ROUND((v_investimento_total - (ROUND((v_investimento_total / v_dias_total)::NUMERIC, 2) * 6))::NUMERIC, 2);
      END IF;
      v_checkouts_dia := v_visualizacoes_dia; v_roas := 0;
      v_ctr := CASE WHEN v_impressoes_dia > 0 THEN ROUND((v_cliques_dia::NUMERIC / v_impressoes_dia * 100), 2) ELSE 0 END;
      v_cpm := CASE WHEN v_impressoes_dia > 0 THEN ROUND((v_investimento_dia / v_impressoes_dia * 1000), 2) ELSE 0 END;
      v_cpc := CASE WHEN v_cliques_dia > 0 THEN ROUND((v_investimento_dia / v_cliques_dia), 2) ELSE 0 END;
      v_cpl := CASE WHEN v_leads_dia > 0 THEN ROUND((v_investimento_dia / v_leads_dia), 2) ELSE 0 END;
      v_taxa_conversao := 0;
      INSERT INTO metricas (tipo, referencia_id, periodo_inicio, periodo_fim, alcance, impressoes, cliques, visualizacoes_pagina, leads, checkouts, vendas, investimento, faturamento, roas, ctr, cpm, cpc, cpl, taxa_conversao)
      VALUES ('criativo', v_criativo_id, v_data_atual, v_data_atual, v_alcance_dia, v_impressoes_dia, v_cliques_dia, v_visualizacoes_dia, v_leads_dia, v_checkouts_dia, 0, v_investimento_dia, 0, v_roas, v_ctr, v_cpm, v_cpc, v_cpl, v_taxa_conversao)
      ON CONFLICT (tipo, referencia_id, periodo_inicio, periodo_fim) DO UPDATE SET alcance = EXCLUDED.alcance, impressoes = EXCLUDED.impressoes, cliques = EXCLUDED.cliques, visualizacoes_pagina = EXCLUDED.visualizacoes_pagina, leads = EXCLUDED.leads, checkouts = EXCLUDED.checkouts, vendas = EXCLUDED.vendas, investimento = EXCLUDED.investimento, faturamento = EXCLUDED.faturamento, roas = EXCLUDED.roas, ctr = EXCLUDED.ctr, cpm = EXCLUDED.cpm, cpc = EXCLUDED.cpc, cpl = EXCLUDED.cpl, taxa_conversao = EXCLUDED.taxa_conversao;
      v_data_atual := v_data_atual + INTERVAL '1 day';
    END LOOP;
    RAISE NOTICE '   ✅ 7 dias inseridos';
  END IF;

  -- =============================================
  -- CRIATIVO 2: Vídeo 01
  -- =============================================
  SELECT id INTO v_criativo_id FROM anuncios WHERE conjunto_anuncio_id = v_publico_id AND nome ILIKE '%video%01%' LIMIT 1;
  IF v_criativo_id IS NOT NULL THEN
    RAISE NOTICE '';
    RAISE NOTICE '📊 Processando: Vídeo 01';
    v_impressoes_total := 4059; v_alcance_total := 2452; v_cliques_total := 35; v_visualizacoes_total := 21; v_leads_total := 6; v_investimento_total := 133.90;
    v_dia_count := 0; v_data_atual := v_data_inicio;
    WHILE v_data_atual <= v_data_fim LOOP
      v_dia_count := v_dia_count + 1;
      IF v_dia_count < v_dias_total THEN
        v_impressoes_dia := FLOOR(v_impressoes_total::NUMERIC / v_dias_total); v_alcance_dia := FLOOR(v_alcance_total::NUMERIC / v_dias_total);
        v_cliques_dia := FLOOR(v_cliques_total::NUMERIC / v_dias_total); v_visualizacoes_dia := FLOOR(v_visualizacoes_total::NUMERIC / v_dias_total);
        v_leads_dia := FLOOR(v_leads_total::NUMERIC / v_dias_total); v_investimento_dia := ROUND((v_investimento_total / v_dias_total)::NUMERIC, 2);
      ELSE
        v_impressoes_dia := v_impressoes_total - (FLOOR(v_impressoes_total::NUMERIC / v_dias_total) * 6);
        v_alcance_dia := v_alcance_total - (FLOOR(v_alcance_total::NUMERIC / v_dias_total) * 6);
        v_cliques_dia := v_cliques_total - (FLOOR(v_cliques_total::NUMERIC / v_dias_total) * 6);
        v_visualizacoes_dia := v_visualizacoes_total - (FLOOR(v_visualizacoes_total::NUMERIC / v_dias_total) * 6);
        v_leads_dia := v_leads_total - (FLOOR(v_leads_total::NUMERIC / v_dias_total) * 6);
        v_investimento_dia := ROUND((v_investimento_total - (ROUND((v_investimento_total / v_dias_total)::NUMERIC, 2) * 6))::NUMERIC, 2);
      END IF;
      v_checkouts_dia := v_visualizacoes_dia; v_roas := 0;
      v_ctr := CASE WHEN v_impressoes_dia > 0 THEN ROUND((v_cliques_dia::NUMERIC / v_impressoes_dia * 100), 2) ELSE 0 END;
      v_cpm := CASE WHEN v_impressoes_dia > 0 THEN ROUND((v_investimento_dia / v_impressoes_dia * 1000), 2) ELSE 0 END;
      v_cpc := CASE WHEN v_cliques_dia > 0 THEN ROUND((v_investimento_dia / v_cliques_dia), 2) ELSE 0 END;
      v_cpl := CASE WHEN v_leads_dia > 0 THEN ROUND((v_investimento_dia / v_leads_dia), 2) ELSE 0 END;
      v_taxa_conversao := 0;
      INSERT INTO metricas (tipo, referencia_id, periodo_inicio, periodo_fim, alcance, impressoes, cliques, visualizacoes_pagina, leads, checkouts, vendas, investimento, faturamento, roas, ctr, cpm, cpc, cpl, taxa_conversao)
      VALUES ('criativo', v_criativo_id, v_data_atual, v_data_atual, v_alcance_dia, v_impressoes_dia, v_cliques_dia, v_visualizacoes_dia, v_leads_dia, v_checkouts_dia, 0, v_investimento_dia, 0, v_roas, v_ctr, v_cpm, v_cpc, v_cpl, v_taxa_conversao)
      ON CONFLICT (tipo, referencia_id, periodo_inicio, periodo_fim) DO UPDATE SET alcance = EXCLUDED.alcance, impressoes = EXCLUDED.impressoes, cliques = EXCLUDED.cliques, visualizacoes_pagina = EXCLUDED.visualizacoes_pagina, leads = EXCLUDED.leads, checkouts = EXCLUDED.checkouts, vendas = EXCLUDED.vendas, investimento = EXCLUDED.investimento, faturamento = EXCLUDED.faturamento, roas = EXCLUDED.roas, ctr = EXCLUDED.ctr, cpm = EXCLUDED.cpm, cpc = EXCLUDED.cpc, cpl = EXCLUDED.cpl, taxa_conversao = EXCLUDED.taxa_conversao;
      v_data_atual := v_data_atual + INTERVAL '1 day';
    END LOOP;
    RAISE NOTICE '   ✅ 7 dias inseridos';
  END IF;

  -- =============================================
  -- CRIATIVO 3: Imagem 05
  -- =============================================
  SELECT id INTO v_criativo_id FROM anuncios WHERE conjunto_anuncio_id = v_publico_id AND nome ILIKE '%imagem%05%' LIMIT 1;
  IF v_criativo_id IS NOT NULL THEN
    RAISE NOTICE '';
    RAISE NOTICE '📊 Processando: Imagem 05';
    v_impressoes_total := 2136; v_alcance_total := 1311; v_cliques_total := 26; v_visualizacoes_total := 20; v_leads_total := 17; v_investimento_total := 103.42;
    v_dia_count := 0; v_data_atual := v_data_inicio;
    WHILE v_data_atual <= v_data_fim LOOP
      v_dia_count := v_dia_count + 1;
      IF v_dia_count < v_dias_total THEN
        v_impressoes_dia := FLOOR(v_impressoes_total::NUMERIC / v_dias_total); v_alcance_dia := FLOOR(v_alcance_total::NUMERIC / v_dias_total);
        v_cliques_dia := FLOOR(v_cliques_total::NUMERIC / v_dias_total); v_visualizacoes_dia := FLOOR(v_visualizacoes_total::NUMERIC / v_dias_total);
        v_leads_dia := FLOOR(v_leads_total::NUMERIC / v_dias_total); v_investimento_dia := ROUND((v_investimento_total / v_dias_total)::NUMERIC, 2);
      ELSE
        v_impressoes_dia := v_impressoes_total - (FLOOR(v_impressoes_total::NUMERIC / v_dias_total) * 6);
        v_alcance_dia := v_alcance_total - (FLOOR(v_alcance_total::NUMERIC / v_dias_total) * 6);
        v_cliques_dia := v_cliques_total - (FLOOR(v_cliques_total::NUMERIC / v_dias_total) * 6);
        v_visualizacoes_dia := v_visualizacoes_total - (FLOOR(v_visualizacoes_total::NUMERIC / v_dias_total) * 6);
        v_leads_dia := v_leads_total - (FLOOR(v_leads_total::NUMERIC / v_dias_total) * 6);
        v_investimento_dia := ROUND((v_investimento_total - (ROUND((v_investimento_total / v_dias_total)::NUMERIC, 2) * 6))::NUMERIC, 2);
      END IF;
      v_checkouts_dia := v_visualizacoes_dia; v_roas := 0;
      v_ctr := CASE WHEN v_impressoes_dia > 0 THEN ROUND((v_cliques_dia::NUMERIC / v_impressoes_dia * 100), 2) ELSE 0 END;
      v_cpm := CASE WHEN v_impressoes_dia > 0 THEN ROUND((v_investimento_dia / v_impressoes_dia * 1000), 2) ELSE 0 END;
      v_cpc := CASE WHEN v_cliques_dia > 0 THEN ROUND((v_investimento_dia / v_cliques_dia), 2) ELSE 0 END;
      v_cpl := CASE WHEN v_leads_dia > 0 THEN ROUND((v_investimento_dia / v_leads_dia), 2) ELSE 0 END;
      v_taxa_conversao := 0;
      INSERT INTO metricas (tipo, referencia_id, periodo_inicio, periodo_fim, alcance, impressoes, cliques, visualizacoes_pagina, leads, checkouts, vendas, investimento, faturamento, roas, ctr, cpm, cpc, cpl, taxa_conversao)
      VALUES ('criativo', v_criativo_id, v_data_atual, v_data_atual, v_alcance_dia, v_impressoes_dia, v_cliques_dia, v_visualizacoes_dia, v_leads_dia, v_checkouts_dia, 0, v_investimento_dia, 0, v_roas, v_ctr, v_cpm, v_cpc, v_cpl, v_taxa_conversao)
      ON CONFLICT (tipo, referencia_id, periodo_inicio, periodo_fim) DO UPDATE SET alcance = EXCLUDED.alcance, impressoes = EXCLUDED.impressoes, cliques = EXCLUDED.cliques, visualizacoes_pagina = EXCLUDED.visualizacoes_pagina, leads = EXCLUDED.leads, checkouts = EXCLUDED.checkouts, vendas = EXCLUDED.vendas, investimento = EXCLUDED.investimento, faturamento = EXCLUDED.faturamento, roas = EXCLUDED.roas, ctr = EXCLUDED.ctr, cpm = EXCLUDED.cpm, cpc = EXCLUDED.cpc, cpl = EXCLUDED.cpl, taxa_conversao = EXCLUDED.taxa_conversao;
      v_data_atual := v_data_atual + INTERVAL '1 day';
    END LOOP;
    RAISE NOTICE '   ✅ 7 dias inseridos';
  END IF;

  -- =============================================
  -- CRIATIVO 4: Imagem 02
  -- =============================================
  SELECT id INTO v_criativo_id FROM anuncios WHERE conjunto_anuncio_id = v_publico_id AND nome ILIKE '%imagem%02%' LIMIT 1;
  IF v_criativo_id IS NOT NULL THEN
    RAISE NOTICE '';
    RAISE NOTICE '📊 Processando: Imagem 02';
    v_impressoes_total := 939; v_alcance_total := 711; v_cliques_total := 10; v_visualizacoes_total := 8; v_leads_total := 0; v_investimento_total := 14.96;
    v_dia_count := 0; v_data_atual := v_data_inicio;
    WHILE v_data_atual <= v_data_fim LOOP
      v_dia_count := v_dia_count + 1;
      IF v_dia_count < v_dias_total THEN
        v_impressoes_dia := FLOOR(v_impressoes_total::NUMERIC / v_dias_total); v_alcance_dia := FLOOR(v_alcance_total::NUMERIC / v_dias_total);
        v_cliques_dia := FLOOR(v_cliques_total::NUMERIC / v_dias_total); v_visualizacoes_dia := FLOOR(v_visualizacoes_total::NUMERIC / v_dias_total);
        v_leads_dia := FLOOR(v_leads_total::NUMERIC / v_dias_total); v_investimento_dia := ROUND((v_investimento_total / v_dias_total)::NUMERIC, 2);
      ELSE
        v_impressoes_dia := v_impressoes_total - (FLOOR(v_impressoes_total::NUMERIC / v_dias_total) * 6);
        v_alcance_dia := v_alcance_total - (FLOOR(v_alcance_total::NUMERIC / v_dias_total) * 6);
        v_cliques_dia := v_cliques_total - (FLOOR(v_cliques_total::NUMERIC / v_dias_total) * 6);
        v_visualizacoes_dia := v_visualizacoes_total - (FLOOR(v_visualizacoes_total::NUMERIC / v_dias_total) * 6);
        v_leads_dia := v_leads_total - (FLOOR(v_leads_total::NUMERIC / v_dias_total) * 6);
        v_investimento_dia := ROUND((v_investimento_total - (ROUND((v_investimento_total / v_dias_total)::NUMERIC, 2) * 6))::NUMERIC, 2);
      END IF;
      v_checkouts_dia := v_visualizacoes_dia; v_roas := 0;
      v_ctr := CASE WHEN v_impressoes_dia > 0 THEN ROUND((v_cliques_dia::NUMERIC / v_impressoes_dia * 100), 2) ELSE 0 END;
      v_cpm := CASE WHEN v_impressoes_dia > 0 THEN ROUND((v_investimento_dia / v_impressoes_dia * 1000), 2) ELSE 0 END;
      v_cpc := CASE WHEN v_cliques_dia > 0 THEN ROUND((v_investimento_dia / v_cliques_dia), 2) ELSE 0 END;
      v_cpl := CASE WHEN v_leads_dia > 0 THEN ROUND((v_investimento_dia / v_leads_dia), 2) ELSE 0 END;
      v_taxa_conversao := 0;
      INSERT INTO metricas (tipo, referencia_id, periodo_inicio, periodo_fim, alcance, impressoes, cliques, visualizacoes_pagina, leads, checkouts, vendas, investimento, faturamento, roas, ctr, cpm, cpc, cpl, taxa_conversao)
      VALUES ('criativo', v_criativo_id, v_data_atual, v_data_atual, v_alcance_dia, v_impressoes_dia, v_cliques_dia, v_visualizacoes_dia, v_leads_dia, v_checkouts_dia, 0, v_investimento_dia, 0, v_roas, v_ctr, v_cpm, v_cpc, v_cpl, v_taxa_conversao)
      ON CONFLICT (tipo, referencia_id, periodo_inicio, periodo_fim) DO UPDATE SET alcance = EXCLUDED.alcance, impressoes = EXCLUDED.impressoes, cliques = EXCLUDED.cliques, visualizacoes_pagina = EXCLUDED.visualizacoes_pagina, leads = EXCLUDED.leads, checkouts = EXCLUDED.checkouts, vendas = EXCLUDED.vendas, investimento = EXCLUDED.investimento, faturamento = EXCLUDED.faturamento, roas = EXCLUDED.roas, ctr = EXCLUDED.ctr, cpm = EXCLUDED.cpm, cpc = EXCLUDED.cpc, cpl = EXCLUDED.cpl, taxa_conversao = EXCLUDED.taxa_conversao;
      v_data_atual := v_data_atual + INTERVAL '1 day';
    END LOOP;
    RAISE NOTICE '   ✅ 7 dias inseridos';
  END IF;

  -- =============================================
  -- CRIATIVO 5: Vídeo 02
  -- =============================================
  SELECT id INTO v_criativo_id FROM anuncios WHERE conjunto_anuncio_id = v_publico_id AND nome ILIKE '%video%02%' LIMIT 1;
  IF v_criativo_id IS NOT NULL THEN
    RAISE NOTICE '';
    RAISE NOTICE '📊 Processando: Vídeo 02';
    v_impressoes_total := 552; v_alcance_total := 360; v_cliques_total := 1; v_visualizacoes_total := 1; v_leads_total := 2; v_investimento_total := 19.09;
    v_dia_count := 0; v_data_atual := v_data_inicio;
    WHILE v_data_atual <= v_data_fim LOOP
      v_dia_count := v_dia_count + 1;
      IF v_dia_count < v_dias_total THEN
        v_impressoes_dia := FLOOR(v_impressoes_total::NUMERIC / v_dias_total); v_alcance_dia := FLOOR(v_alcance_total::NUMERIC / v_dias_total);
        v_cliques_dia := FLOOR(v_cliques_total::NUMERIC / v_dias_total); v_visualizacoes_dia := FLOOR(v_visualizacoes_total::NUMERIC / v_dias_total);
        v_leads_dia := FLOOR(v_leads_total::NUMERIC / v_dias_total); v_investimento_dia := ROUND((v_investimento_total / v_dias_total)::NUMERIC, 2);
      ELSE
        v_impressoes_dia := v_impressoes_total - (FLOOR(v_impressoes_total::NUMERIC / v_dias_total) * 6);
        v_alcance_dia := v_alcance_total - (FLOOR(v_alcance_total::NUMERIC / v_dias_total) * 6);
        v_cliques_dia := v_cliques_total - (FLOOR(v_cliques_total::NUMERIC / v_dias_total) * 6);
        v_visualizacoes_dia := v_visualizacoes_total - (FLOOR(v_visualizacoes_total::NUMERIC / v_dias_total) * 6);
        v_leads_dia := v_leads_total - (FLOOR(v_leads_total::NUMERIC / v_dias_total) * 6);
        v_investimento_dia := ROUND((v_investimento_total - (ROUND((v_investimento_total / v_dias_total)::NUMERIC, 2) * 6))::NUMERIC, 2);
      END IF;
      v_checkouts_dia := v_visualizacoes_dia; v_roas := 0;
      v_ctr := CASE WHEN v_impressoes_dia > 0 THEN ROUND((v_cliques_dia::NUMERIC / v_impressoes_dia * 100), 2) ELSE 0 END;
      v_cpm := CASE WHEN v_impressoes_dia > 0 THEN ROUND((v_investimento_dia / v_impressoes_dia * 1000), 2) ELSE 0 END;
      v_cpc := CASE WHEN v_cliques_dia > 0 THEN ROUND((v_investimento_dia / v_cliques_dia), 2) ELSE 0 END;
      v_cpl := CASE WHEN v_leads_dia > 0 THEN ROUND((v_investimento_dia / v_leads_dia), 2) ELSE 0 END;
      v_taxa_conversao := 0;
      INSERT INTO metricas (tipo, referencia_id, periodo_inicio, periodo_fim, alcance, impressoes, cliques, visualizacoes_pagina, leads, checkouts, vendas, investimento, faturamento, roas, ctr, cpm, cpc, cpl, taxa_conversao)
      VALUES ('criativo', v_criativo_id, v_data_atual, v_data_atual, v_alcance_dia, v_impressoes_dia, v_cliques_dia, v_visualizacoes_dia, v_leads_dia, v_checkouts_dia, 0, v_investimento_dia, 0, v_roas, v_ctr, v_cpm, v_cpc, v_cpl, v_taxa_conversao)
      ON CONFLICT (tipo, referencia_id, periodo_inicio, periodo_fim) DO UPDATE SET alcance = EXCLUDED.alcance, impressoes = EXCLUDED.impressoes, cliques = EXCLUDED.cliques, visualizacoes_pagina = EXCLUDED.visualizacoes_pagina, leads = EXCLUDED.leads, checkouts = EXCLUDED.checkouts, vendas = EXCLUDED.vendas, investimento = EXCLUDED.investimento, faturamento = EXCLUDED.faturamento, roas = EXCLUDED.roas, ctr = EXCLUDED.ctr, cpm = EXCLUDED.cpm, cpc = EXCLUDED.cpc, cpl = EXCLUDED.cpl, taxa_conversao = EXCLUDED.taxa_conversao;
      v_data_atual := v_data_atual + INTERVAL '1 day';
    END LOOP;
    RAISE NOTICE '   ✅ 7 dias inseridos';
  END IF;

  -- =============================================
  -- CRIATIVO 6: Imagem 04
  -- =============================================
  SELECT id INTO v_criativo_id FROM anuncios WHERE conjunto_anuncio_id = v_publico_id AND nome ILIKE '%imagem%04%' LIMIT 1;
  IF v_criativo_id IS NOT NULL THEN
    RAISE NOTICE '';
    RAISE NOTICE '📊 Processando: Imagem 04';
    v_impressoes_total := 148; v_alcance_total := 110; v_cliques_total := 1; v_visualizacoes_total := 1; v_leads_total := 0; v_investimento_total := 3.20;
    v_dia_count := 0; v_data_atual := v_data_inicio;
    WHILE v_data_atual <= v_data_fim LOOP
      v_dia_count := v_dia_count + 1;
      IF v_dia_count < v_dias_total THEN
        v_impressoes_dia := FLOOR(v_impressoes_total::NUMERIC / v_dias_total); v_alcance_dia := FLOOR(v_alcance_total::NUMERIC / v_dias_total);
        v_cliques_dia := FLOOR(v_cliques_total::NUMERIC / v_dias_total); v_visualizacoes_dia := FLOOR(v_visualizacoes_total::NUMERIC / v_dias_total);
        v_leads_dia := FLOOR(v_leads_total::NUMERIC / v_dias_total); v_investimento_dia := ROUND((v_investimento_total / v_dias_total)::NUMERIC, 2);
      ELSE
        v_impressoes_dia := v_impressoes_total - (FLOOR(v_impressoes_total::NUMERIC / v_dias_total) * 6);
        v_alcance_dia := v_alcance_total - (FLOOR(v_alcance_total::NUMERIC / v_dias_total) * 6);
        v_cliques_dia := v_cliques_total - (FLOOR(v_cliques_total::NUMERIC / v_dias_total) * 6);
        v_visualizacoes_dia := v_visualizacoes_total - (FLOOR(v_visualizacoes_total::NUMERIC / v_dias_total) * 6);
        v_leads_dia := v_leads_total - (FLOOR(v_leads_total::NUMERIC / v_dias_total) * 6);
        v_investimento_dia := ROUND((v_investimento_total - (ROUND((v_investimento_total / v_dias_total)::NUMERIC, 2) * 6))::NUMERIC, 2);
      END IF;
      v_checkouts_dia := v_visualizacoes_dia; v_roas := 0;
      v_ctr := CASE WHEN v_impressoes_dia > 0 THEN ROUND((v_cliques_dia::NUMERIC / v_impressoes_dia * 100), 2) ELSE 0 END;
      v_cpm := CASE WHEN v_impressoes_dia > 0 THEN ROUND((v_investimento_dia / v_impressoes_dia * 1000), 2) ELSE 0 END;
      v_cpc := CASE WHEN v_cliques_dia > 0 THEN ROUND((v_investimento_dia / v_cliques_dia), 2) ELSE 0 END;
      v_cpl := CASE WHEN v_leads_dia > 0 THEN ROUND((v_investimento_dia / v_leads_dia), 2) ELSE 0 END;
      v_taxa_conversao := 0;
      INSERT INTO metricas (tipo, referencia_id, periodo_inicio, periodo_fim, alcance, impressoes, cliques, visualizacoes_pagina, leads, checkouts, vendas, investimento, faturamento, roas, ctr, cpm, cpc, cpl, taxa_conversao)
      VALUES ('criativo', v_criativo_id, v_data_atual, v_data_atual, v_alcance_dia, v_impressoes_dia, v_cliques_dia, v_visualizacoes_dia, v_leads_dia, v_checkouts_dia, 0, v_investimento_dia, 0, v_roas, v_ctr, v_cpm, v_cpc, v_cpl, v_taxa_conversao)
      ON CONFLICT (tipo, referencia_id, periodo_inicio, periodo_fim) DO UPDATE SET alcance = EXCLUDED.alcance, impressoes = EXCLUDED.impressoes, cliques = EXCLUDED.cliques, visualizacoes_pagina = EXCLUDED.visualizacoes_pagina, leads = EXCLUDED.leads, checkouts = EXCLUDED.checkouts, vendas = EXCLUDED.vendas, investimento = EXCLUDED.investimento, faturamento = EXCLUDED.faturamento, roas = EXCLUDED.roas, ctr = EXCLUDED.ctr, cpm = EXCLUDED.cpm, cpc = EXCLUDED.cpc, cpl = EXCLUDED.cpl, taxa_conversao = EXCLUDED.taxa_conversao;
      v_data_atual := v_data_atual + INTERVAL '1 day';
    END LOOP;
    RAISE NOTICE '   ✅ 7 dias inseridos';
  END IF;

  -- =============================================
  -- CRIATIVO 7: Imagem 01
  -- =============================================
  SELECT id INTO v_criativo_id FROM anuncios WHERE conjunto_anuncio_id = v_publico_id AND nome ILIKE '%imagem%01%' LIMIT 1;
  IF v_criativo_id IS NOT NULL THEN
    RAISE NOTICE '';
    RAISE NOTICE '📊 Processando: Imagem 01';
    v_impressoes_total := 30; v_alcance_total := 27; v_cliques_total := 0; v_visualizacoes_total := 0; v_leads_total := 0; v_investimento_total := 0.11;
    v_dia_count := 0; v_data_atual := v_data_inicio;
    WHILE v_data_atual <= v_data_fim LOOP
      v_dia_count := v_dia_count + 1;
      IF v_dia_count < v_dias_total THEN
        v_impressoes_dia := FLOOR(v_impressoes_total::NUMERIC / v_dias_total); v_alcance_dia := FLOOR(v_alcance_total::NUMERIC / v_dias_total);
        v_cliques_dia := FLOOR(v_cliques_total::NUMERIC / v_dias_total); v_visualizacoes_dia := FLOOR(v_visualizacoes_total::NUMERIC / v_dias_total);
        v_leads_dia := FLOOR(v_leads_total::NUMERIC / v_dias_total); v_investimento_dia := ROUND((v_investimento_total / v_dias_total)::NUMERIC, 2);
      ELSE
        v_impressoes_dia := v_impressoes_total - (FLOOR(v_impressoes_total::NUMERIC / v_dias_total) * 6);
        v_alcance_dia := v_alcance_total - (FLOOR(v_alcance_total::NUMERIC / v_dias_total) * 6);
        v_cliques_dia := v_cliques_total - (FLOOR(v_cliques_total::NUMERIC / v_dias_total) * 6);
        v_visualizacoes_dia := v_visualizacoes_total - (FLOOR(v_visualizacoes_total::NUMERIC / v_dias_total) * 6);
        v_leads_dia := v_leads_total - (FLOOR(v_leads_total::NUMERIC / v_dias_total) * 6);
        v_investimento_dia := ROUND((v_investimento_total - (ROUND((v_investimento_total / v_dias_total)::NUMERIC, 2) * 6))::NUMERIC, 2);
      END IF;
      v_checkouts_dia := v_visualizacoes_dia; v_roas := 0;
      v_ctr := CASE WHEN v_impressoes_dia > 0 THEN ROUND((v_cliques_dia::NUMERIC / v_impressoes_dia * 100), 2) ELSE 0 END;
      v_cpm := CASE WHEN v_impressoes_dia > 0 THEN ROUND((v_investimento_dia / v_impressoes_dia * 1000), 2) ELSE 0 END;
      v_cpc := CASE WHEN v_cliques_dia > 0 THEN ROUND((v_investimento_dia / v_cliques_dia), 2) ELSE 0 END;
      v_cpl := CASE WHEN v_leads_dia > 0 THEN ROUND((v_investimento_dia / v_leads_dia), 2) ELSE 0 END;
      v_taxa_conversao := 0;
      INSERT INTO metricas (tipo, referencia_id, periodo_inicio, periodo_fim, alcance, impressoes, cliques, visualizacoes_pagina, leads, checkouts, vendas, investimento, faturamento, roas, ctr, cpm, cpc, cpl, taxa_conversao)
      VALUES ('criativo', v_criativo_id, v_data_atual, v_data_atual, v_alcance_dia, v_impressoes_dia, v_cliques_dia, v_visualizacoes_dia, v_leads_dia, v_checkouts_dia, 0, v_investimento_dia, 0, v_roas, v_ctr, v_cpm, v_cpc, v_cpl, v_taxa_conversao)
      ON CONFLICT (tipo, referencia_id, periodo_inicio, periodo_fim) DO UPDATE SET alcance = EXCLUDED.alcance, impressoes = EXCLUDED.impressoes, cliques = EXCLUDED.cliques, visualizacoes_pagina = EXCLUDED.visualizacoes_pagina, leads = EXCLUDED.leads, checkouts = EXCLUDED.checkouts, vendas = EXCLUDED.vendas, investimento = EXCLUDED.investimento, faturamento = EXCLUDED.faturamento, roas = EXCLUDED.roas, ctr = EXCLUDED.ctr, cpm = EXCLUDED.cpm, cpc = EXCLUDED.cpc, cpl = EXCLUDED.cpl, taxa_conversao = EXCLUDED.taxa_conversao;
      v_data_atual := v_data_atual + INTERVAL '1 day';
    END LOOP;
    RAISE NOTICE '   ✅ 7 dias inseridos';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '✅ ============================================';
  RAISE NOTICE '✅ CONCLUÍDO! Métricas da semana 1 de janeiro inseridas';
  RAISE NOTICE '✅ Total de criativos: 7';
  RAISE NOTICE '✅ Período: 01/01/2026 a 07/01/2026';
  RAISE NOTICE '✅ Total investido: R$ 533,81 | Total leads: 49';
  RAISE NOTICE '✅ ============================================';
  
END $$;
