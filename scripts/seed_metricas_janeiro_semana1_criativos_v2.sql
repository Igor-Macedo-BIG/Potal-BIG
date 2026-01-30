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
  v_criativo_nome TEXT;
  
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
  
  PROCEDURE processar_criativo(
    p_nome TEXT,
    p_pattern TEXT,
    p_impressoes INT,
    p_alcance INT,
    p_cliques INT,
    p_visualizacoes INT,
    p_leads INT,
    p_investimento NUMERIC
  ) AS
  DECLARE
    temp_criativo_id UUID;
    temp_data DATE;
    temp_dia INT;
  BEGIN
    SELECT id INTO temp_criativo_id FROM anuncios WHERE conjunto_id = v_publico_id AND titulo ILIKE p_pattern LIMIT 1;
    
    IF temp_criativo_id IS NULL THEN
      RAISE NOTICE '⚠️ Criativo "%" não encontrado - pulando', p_nome;
      RETURN;
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '📊 Processando criativo: %', p_nome;
    RAISE NOTICE '   Total semanal - Impressões: % | Alcance: % | Cliques: % | Visualizações: % | Leads: % | Investimento: R$ %', 
      p_impressoes, p_alcance, p_cliques, p_visualizacoes, p_leads, p_investimento;
    
    temp_dia := 0;
    temp_data := v_data_inicio;
    
    WHILE temp_data <= v_data_fim LOOP
      temp_dia := temp_dia + 1;
      
      IF temp_dia < v_dias_total THEN
        v_impressoes_dia := FLOOR(p_impressoes::NUMERIC / v_dias_total);
        v_alcance_dia := FLOOR(p_alcance::NUMERIC / v_dias_total);
        v_cliques_dia := FLOOR(p_cliques::NUMERIC / v_dias_total);
        v_visualizacoes_dia := FLOOR(p_visualizacoes::NUMERIC / v_dias_total);
        v_leads_dia := FLOOR(p_leads::NUMERIC / v_dias_total);
        v_investimento_dia := ROUND((p_investimento / v_dias_total)::NUMERIC, 2);
      ELSE
        v_impressoes_dia := p_impressoes - (FLOOR(p_impressoes::NUMERIC / v_dias_total) * (v_dias_total - 1));
        v_alcance_dia := p_alcance - (FLOOR(p_alcance::NUMERIC / v_dias_total) * (v_dias_total - 1));
        v_cliques_dia := p_cliques - (FLOOR(p_cliques::NUMERIC / v_dias_total) * (v_dias_total - 1));
        v_visualizacoes_dia := p_visualizacoes - (FLOOR(p_visualizacoes::NUMERIC / v_dias_total) * (v_dias_total - 1));
        v_leads_dia := p_leads - (FLOOR(p_leads::NUMERIC / v_dias_total) * (v_dias_total - 1));
        v_investimento_dia := ROUND((p_investimento - (ROUND((p_investimento / v_dias_total)::NUMERIC, 2) * (v_dias_total - 1)))::NUMERIC, 2);
      END IF;
      
      v_checkouts_dia := v_visualizacoes_dia;
      v_roas := 0;
      v_ctr := CASE WHEN v_impressoes_dia > 0 THEN ROUND((v_cliques_dia::NUMERIC / v_impressoes_dia * 100), 2) ELSE 0 END;
      v_cpm := CASE WHEN v_impressoes_dia > 0 THEN ROUND((v_investimento_dia / v_impressoes_dia * 1000), 2) ELSE 0 END;
      v_cpc := CASE WHEN v_cliques_dia > 0 THEN ROUND((v_investimento_dia / v_cliques_dia), 2) ELSE 0 END;
      v_cpl := CASE WHEN v_leads_dia > 0 THEN ROUND((v_investimento_dia / v_leads_dia), 2) ELSE 0 END;
      v_taxa_conversao := 0;
      
      INSERT INTO metricas (tipo, referencia_id, periodo_inicio, periodo_fim, alcance, impressoes, cliques, visualizacoes_pagina, leads, checkouts, vendas, investimento, faturamento, roas, ctr, cpm, cpc, cpl, taxa_conversao)
      VALUES ('criativo', temp_criativo_id, temp_data, temp_data, v_alcance_dia, v_impressoes_dia, v_cliques_dia, v_visualizacoes_dia, v_leads_dia, v_checkouts_dia, 0, v_investimento_dia, 0, v_roas, v_ctr, v_cpm, v_cpc, v_cpl, v_taxa_conversao)
      ON CONFLICT (tipo, referencia_id, periodo_inicio, periodo_fim) DO UPDATE SET
        alcance = EXCLUDED.alcance, impressoes = EXCLUDED.impressoes, cliques = EXCLUDED.cliques, visualizacoes_pagina = EXCLUDED.visualizacoes_pagina,
        leads = EXCLUDED.leads, checkouts = EXCLUDED.checkouts, vendas = EXCLUDED.vendas, investimento = EXCLUDED.investimento,
        faturamento = EXCLUDED.faturamento, roas = EXCLUDED.roas, ctr = EXCLUDED.ctr, cpm = EXCLUDED.cpm, cpc = EXCLUDED.cpc, cpl = EXCLUDED.cpl, taxa_conversao = EXCLUDED.taxa_conversao;
      
      temp_data := temp_data + INTERVAL '1 day';
    END LOOP;
    
    RAISE NOTICE '   ✅ 7 dias inseridos';
  END;

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
  SELECT id INTO v_publico_id FROM conjuntos_anuncio WHERE campanha_id = v_campanha_id AND (name ILIKE '%quente%' OR name ILIKE '%assistiu%50%' OR name ILIKE '%assistiu 50%') LIMIT 1;
  IF v_publico_id IS NULL THEN RAISE EXCEPTION '❌ Público "Público Quente (Assistiu 50%%)" não encontrado!'; END IF;
  RAISE NOTICE '✅ Público encontrado: %', v_publico_id;
  
  -- Processar cada criativo
  CALL processar_criativo('Imagem 03', '%imagem%03%', 7900, 3915, 78, 61, 24, 259.13);
  CALL processar_criativo('Vídeo 01', '%video%01%', 4059, 2452, 35, 21, 6, 133.90);
  CALL processar_criativo('Imagem 05', '%imagem%05%', 2136, 1311, 26, 20, 17, 103.42);
  CALL processar_criativo('Imagem 02', '%imagem%02%', 939, 711, 10, 8, 0, 14.96);
  CALL processar_criativo('Vídeo 02', '%video%02%', 552, 360, 1, 1, 2, 19.09);
  CALL processar_criativo('Imagem 04', '%imagem%04%', 148, 110, 1, 1, 0, 3.20);
  CALL processar_criativo('Imagem 01', '%imagem%01%', 30, 27, 0, 0, 0, 0.11);
  
  RAISE NOTICE '';
  RAISE NOTICE '✅ ============================================';
  RAISE NOTICE '✅ CONCLUÍDO! Métricas da semana 1 de janeiro inseridas';
  RAISE NOTICE '✅ Total de criativos processados: 7';
  RAISE NOTICE '✅ Período: 01/01/2026 a 07/01/2026';
  RAISE NOTICE '✅ ============================================';
  
END $$;
