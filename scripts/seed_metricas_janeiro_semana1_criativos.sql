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
  
  -- IDs dos criativos (serão buscados dinamicamente)
  v_criativo_id UUID;
  v_criativo_nome TEXT;
  
  -- Controle de datas
  v_data_inicio DATE := '2026-01-01';
  v_data_fim DATE := '2026-01-07';
  v_data_atual DATE;
  v_dias_total INT := 7;
  
  -- Dados semanais do criativo atual
  v_impressoes_total INT;
  v_alcance_total INT;
  v_cliques_total INT;
  v_visualizacoes_total INT;
  v_leads_total INT;
  v_investimento_total NUMERIC;
  
  -- Métricas diárias (calculadas)
  v_impressoes_dia INT;
  v_alcance_dia INT;
  v_cliques_dia INT;
  v_visualizacoes_dia INT;
  v_leads_dia INT;
  v_checkouts_dia INT;
  v_investimento_dia NUMERIC;
  
  -- Métricas derivadas
  v_roas NUMERIC;
  v_ctr NUMERIC;
  v_cpm NUMERIC;
  v_cpc NUMERIC;
  v_cpl NUMERIC;
  v_taxa_conversao NUMERIC;
  
  v_dia_count INT;
BEGIN
  RAISE NOTICE '🚀 Iniciando inserção de métricas REAIS - Janeiro 2026 - Semana 1';
  RAISE NOTICE '📅 Período: 01/01/2026 a 07/01/2026 (7 dias)';
  
  -- =============================================
  -- 1. BUSCAR IDs DO FUNIL, CAMPANHA E PÚBLICO
  -- =============================================
  
  -- Buscar Funil "Aplicação"
  SELECT id INTO v_funil_id
  FROM funis
  WHERE nome ILIKE '%aplicação%'
  LIMIT 1;
  
  IF v_funil_id IS NULL THEN
    RAISE EXCEPTION '❌ Funil "Aplicação" não encontrado!';
  END IF;
  RAISE NOTICE '✅ Funil encontrado: %', v_funil_id;
  
  -- Buscar Campanha "Aplicação Direta"
  SELECT id INTO v_campanha_id
  FROM campanhas
  WHERE funil_id = v_funil_id
    AND (nome ILIKE '%aplicação%direta%' OR nome ILIKE '%direta%')
  LIMIT 1;
  
  IF v_campanha_id IS NULL THEN
    RAISE EXCEPTION '❌ Campanha "Aplicação Direta" não encontrada!';
  END IF;
  RAISE NOTICE '✅ Campanha encontrada: %', v_campanha_id;
  
  -- Buscar Público "Público Quente (Assistiu 50%)"
  SELECT id INTO v_publico_id
  FROM conjuntos_anuncio
  WHERE campanha_id = v_campanha_id
    AND (name ILIKE '%quente%' OR name ILIKE '%assistiu%50%' OR name ILIKE '%assistiu 50%')
  LIMIT 1;
  
  IF v_publico_id IS NULL THEN
    RAISE EXCEPTION '❌ Público "Público Quente (Assistiu 50%%)" não encontrado!';
  END IF;
  RAISE NOTICE '✅ Público encontrado: %', v_publico_id;
  
  -- =============================================
  -- 2. PROCESSAR CRIATIVO: Imagem 03
  -- =============================================
  
  v_criativo_nome := 'Imagem 03';
  v_impressoes_total := 7900;
  v_alcance_total := 3915;
  v_cliques_total := 78;
  v_visualizacoes_total := 61;
  v_leads_total := 24;
  v_investimento_total := 259.13;
  
  SELECT id INTO v_criativo_id FROM anuncios WHERE conjunto_id = v_publico_id AND titulo ILIKE '%imagem%03%' LIMIT 1;
  
  IF v_criativo_id IS NOT NULL THEN
    RAISE NOTICE '';
    RAISE NOTICE '📊 Processando criativo: %', v_criativo_nome;
    RAISE NOTICE '   Total semanal - Impressões: % | Alcance: % | Cliques: % | Visualizações: % | Leads: % | Investimento: R$ %', 
      v_impressoes_total, v_alcance_total, v_cliques_total, v_visualizacoes_total, v_leads_total, v_investimento_total;
    
    v_dia_count := 0;
    v_data_atual := v_data_inicio;
    
    WHILE v_data_atual <= v_data_fim LOOP
      v_dia_count := v_dia_count + 1;
      
      IF v_dia_count < v_dias_total THEN
        v_impressoes_dia := FLOOR(v_impressoes_total::NUMERIC / v_dias_total);
        v_alcance_dia := FLOOR(v_alcance_total::NUMERIC / v_dias_total);
        v_cliques_dia := FLOOR(v_cliques_total::NUMERIC / v_dias_total);
        v_visualizacoes_dia := FLOOR(v_visualizacoes_total::NUMERIC / v_dias_total);
        v_leads_dia := FLOOR(v_leads_total::NUMERIC / v_dias_total);
        v_investimento_dia := ROUND((v_investimento_total / v_dias_total)::NUMERIC, 2);
      ELSE
        v_impressoes_dia := v_impressoes_total - (FLOOR(v_impressoes_total::NUMERIC / v_dias_total) * (v_dias_total - 1));
        v_alcance_dia := v_alcance_total - (FLOOR(v_alcance_total::NUMERIC / v_dias_total) * (v_dias_total - 1));
        v_cliques_dia := v_cliques_total - (FLOOR(v_cliques_total::NUMERIC / v_dias_total) * (v_dias_total - 1));
        v_visualizacoes_dia := v_visualizacoes_total - (FLOOR(v_visualizacoes_total::NUMERIC / v_dias_total) * (v_dias_total - 1));
        v_leads_dia := v_leads_total - (FLOOR(v_leads_total::NUMERIC / v_dias_total) * (v_dias_total - 1));
        v_investimento_dia := ROUND((v_investimento_total - (ROUND((v_investimento_total / v_dias_total)::NUMERIC, 2) * (v_dias_total - 1)))::NUMERIC, 2);
      END IF;
      
      v_checkouts_dia := v_visualizacoes_dia;
      v_roas := 0;
      v_ctr := CASE WHEN v_impressoes_dia > 0 THEN ROUND((v_cliques_dia::NUMERIC / v_impressoes_dia * 100), 2) ELSE 0 END;
      v_cpm := CASE WHEN v_impressoes_dia > 0 THEN ROUND((v_investimento_dia / v_impressoes_dia * 1000), 2) ELSE 0 END;
      v_cpc := CASE WHEN v_cliques_dia > 0 THEN ROUND((v_investimento_dia / v_cliques_dia), 2) ELSE 0 END;
      v_cpl := CASE WHEN v_leads_dia > 0 THEN ROUND((v_investimento_dia / v_leads_dia), 2) ELSE 0 END;
      v_taxa_conversao := 0;
      
      INSERT INTO metricas (tipo, referencia_id, periodo_inicio, periodo_fim, alcance, impressoes, cliques, visualizacoes_pagina, leads, checkouts, vendas, investimento, faturamento, roas, ctr, cpm, cpc, cpl, taxa_conversao)
      VALUES ('criativo', v_criativo_id, v_data_atual, v_data_atual, v_alcance_dia, v_impressoes_dia, v_cliques_dia, v_visualizacoes_dia, v_leads_dia, v_checkouts_dia, 0, v_investimento_dia, 0, v_roas, v_ctr, v_cpm, v_cpc, v_cpl, v_taxa_conversao)
      ON CONFLICT (tipo, referencia_id, periodo_inicio, periodo_fim) DO UPDATE SET
        alcance = EXCLUDED.alcance, impressoes = EXCLUDED.impressoes, cliques = EXCLUDED.cliques, visualizacoes_pagina = EXCLUDED.visualizacoes_pagina,
        leads = EXCLUDED.leads, checkouts = EXCLUDED.checkouts, vendas = EXCLUDED.vendas, investimento = EXCLUDED.investimento,
        faturamento = EXCLUDED.faturamento, roas = EXCLUDED.roas, ctr = EXCLUDED.ctr, cpm = EXCLUDED.cpm, cpc = EXCLUDED.cpc, cpl = EXCLUDED.cpl, taxa_conversao = EXCLUDED.taxa_conversao;
      
      v_data_atual := v_data_atual + INTERVAL '1 day';
    END LOOP;
    RAISE NOTICE '   ✅ 7 dias inseridos';
  ELSE
    RAISE NOTICE '⚠️ Criativo "%" não encontrado - pulando', v_criativo_nome;
  END IF;
  
  -- =============================================
  -- 3. PROCESSAR CRIATIVO: Vídeo 01
  -- =============================================
  
  v_criativo_nome := 'Vídeo 01';
  v_impressoes_total := 4059;
  v_alcance_total := 2452;
  v_cliques_total := 35;
  v_visualizacoes_total := 21;
  v_leads_total := 6;
  v_investimento_total := 133.90;
  
  SELECT id INTO v_criativo_id FROM anuncios WHERE conjunto_id = v_publico_id AND titulo ILIKE '%video%01%' LIMIT 1;
    
    RAISE NOTICE '';
    RAISE NOTICE '📊 Processando criativo: %', v_criativo.nome;
    RAISE NOTICE '   Total semanal - Impressões: % | Alcance: % | Cliques: % | Visualizações: % | Leads: % | Investimento: R$ %', 
      v_criativo.impressoes, v_criativo.alcance, v_criativo.cliques, 
      v_criativo.visualizacoes, v_criativo.leads, v_criativo.investimento;
    
    -- Resetar contador de dias
    v_dia_count := 0;
    v_data_atual := v_data_inicio;
    
    -- Loop pelos 7 dias da semana
    WHILE v_data_atual <= v_data_fim LOOP
      v_dia_count := v_dia_count + 1;
      
      -- Calcular valores diários (divisão igual + resto no último dia)
      IF v_dia_count < v_dias_total THEN
        v_impressoes_dia := FLOOR(v_criativo.impressoes::NUMERIC / v_dias_total);
        v_alcance_dia := FLOOR(v_criativo.alcance::NUMERIC / v_dias_total);
        v_cliques_dia := FLOOR(v_criativo.cliques::NUMERIC / v_dias_total);
        v_visualizacoes_dia := FLOOR(v_criativo.visualizacoes::NUMERIC / v_dias_total);
        v_leads_dia := FLOOR(v_criativo.leads::NUMERIC / v_dias_total);
        v_investimento_dia := ROUND((v_criativo.investimento / v_dias_total)::NUMERIC, 2);
      ELSE
        -- Último dia: adicionar o resto
        v_impressoes_dia := v_criativo.impressoes - (FLOOR(v_criativo.impressoes::NUMERIC / v_dias_total) * (v_dias_total - 1));
        v_alcance_dia := v_criativo.alcance - (FLOOR(v_criativo.alcance::NUMERIC / v_dias_total) * (v_dias_total - 1));
        v_cliques_dia := v_criativo.cliques - (FLOOR(v_criativo.cliques::NUMERIC / v_dias_total) * (v_dias_total - 1));
        v_visualizacoes_dia := v_criativo.visualizacoes - (FLOOR(v_criativo.visualizacoes::NUMERIC / v_dias_total) * (v_dias_total - 1));
        v_leads_dia := v_criativo.leads - (FLOOR(v_criativo.leads::NUMERIC / v_dias_total) * (v_dias_total - 1));
        v_investimento_dia := ROUND((v_criativo.investimento - (ROUND((v_criativo.investimento / v_dias_total)::NUMERIC, 2) * (v_dias_total - 1)))::NUMERIC, 2);
      END IF;
      
      -- Checkouts = Visualizações (conforme solicitado)
      v_checkouts_dia := v_visualizacoes_dia;
      
      -- Calcular métricas derivadas
      v_roas := 0; -- Campanha de aplicação não tem faturamento
      v_ctr := CASE WHEN v_impressoes_dia > 0 THEN ROUND((v_cliques_dia::NUMERIC / v_impressoes_dia * 100), 2) ELSE 0 END;
      v_cpm := CASE WHEN v_impressoes_dia > 0 THEN ROUND((v_investimento_dia / v_impressoes_dia * 1000), 2) ELSE 0 END;
      v_cpc := CASE WHEN v_cliques_dia > 0 THEN ROUND((v_investimento_dia / v_cliques_dia), 2) ELSE 0 END;
      v_cpl := CASE WHEN v_leads_dia > 0 THEN ROUND((v_investimento_dia / v_leads_dia), 2) ELSE 0 END;
      v_taxa_conversao := CASE WHEN v_leads_dia > 0 THEN ROUND((v_leads_dia::NUMERIC / v_leads_dia * 100), 2) ELSE 0 END;
      
      -- Inserir ou atualizar métrica do dia
      INSERT INTO metricas (
        tipo,
        referencia_id,
        periodo_inicio,
        periodo_fim,
        alcance,
        impressoes,
        cliques,
        visualizacoes_pagina,
        leads,
        checkouts,
        vendas,
        investimento,
        faturamento,
        roas,
        ctr,
        cpm,
        cpc,
        cpl,
        taxa_conversao
      ) VALUES (
        'criativo',
        v_criativo.criativo_id,
        v_data_atual,
        v_data_atual,
        v_alcance_dia,
        v_impressoes_dia,
        v_cliques_dia,
        v_visualizacoes_dia,
        v_leads_dia,
        v_checkouts_dia,
        0, -- Sem vendas diretas em campanha de aplicação
        v_investimento_dia,
        0, -- Sem faturamento em campanha de aplicação
        v_roas,
        v_ctr,
        v_cpm,
        v_cpc,
        v_cpl,
        v_taxa_conversao
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
      
      -- Avançar para próximo dia
      v_data_atual := v_data_atual + INTERVAL '1 day';
    END LOOP;
    
    RAISE NOTICE '   ✅ 7 dias inseridos para criativo "%"', v_criativo.nome;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '✅ ============================================';
  RAISE NOTICE '✅ CONCLUÍDO! Métricas da semana 1 de janeiro inseridas';
  RAISE NOTICE '✅ Total de criativos processados: 7';
  RAISE NOTICE '✅ Período: 01/01/2026 a 07/01/2026';
  RAISE NOTICE '✅ ============================================';
  
END $$;
