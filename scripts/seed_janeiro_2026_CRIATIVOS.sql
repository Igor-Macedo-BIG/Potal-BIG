-- =============================================
-- Script: Métricas REAIS a nível de CRIATIVO
-- Janeiro 2026 - Semana 1 (01/01 a 07/01)
-- Campanha: Aplicação Direta (Criativo - Formulário)
-- =============================================

DO $$
DECLARE
  v_funil_id UUID;
  v_campanha_id UUID;
  v_publico_id UUID;
  v_criativo_record RECORD;
  v_data DATE;
  v_dia_count INT;
  v_dias_total INT := 7;
  
  -- Valores por dia de cada criativo
  v_impressoes_dia INT;
  v_alcance_dia INT;
  v_cliques_dia INT;
  v_visualizacoes_dia INT;
  v_leads_dia INT;
  v_checkouts_dia INT;
  v_investimento_dia NUMERIC;
  
BEGIN
  RAISE NOTICE '🚀 Iniciando inserção de métricas a nível de CRIATIVO';
  RAISE NOTICE '📅 Período: 01/01/2026 a 07/01/2026 (7 dias)';
  RAISE NOTICE '';
  
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
  
  -- Loop pelos 5 criativos principais com dados reais
  FOR v_criativo_record IN (
    SELECT 
      a.id,
      a.nome,
      -- Dados reais do Meta Ads Manager
      CASE 
        WHEN a.nome ILIKE '%imagem%03%' OR a.nome ILIKE '%café%' THEN 259.13
        WHEN a.nome ILIKE '%vídeo%01%' OR a.nome ILIKE '%video%01%' THEN 133.90
        WHEN a.nome ILIKE '%imagem%1%' AND NOT (a.nome ILIKE '%03%') THEN 74.68
        WHEN a.nome ILIKE '%vídeo%02%' OR a.nome ILIKE '%video%02%' THEN 41.82
        WHEN a.nome ILIKE '%imagem%2%' THEN 24.28
        ELSE 0
      END as investimento_total,
      CASE 
        WHEN a.nome ILIKE '%imagem%03%' OR a.nome ILIKE '%café%' THEN 24
        WHEN a.nome ILIKE '%vídeo%01%' OR a.nome ILIKE '%video%01%' THEN 6
        WHEN a.nome ILIKE '%imagem%1%' AND NOT (a.nome ILIKE '%03%') THEN 9
        WHEN a.nome ILIKE '%vídeo%02%' OR a.nome ILIKE '%video%02%' THEN 6
        WHEN a.nome ILIKE '%imagem%2%' THEN 4
        ELSE 0
      END as leads_total,
      CASE 
        WHEN a.nome ILIKE '%imagem%03%' OR a.nome ILIKE '%café%' THEN 7654
        WHEN a.nome ILIKE '%vídeo%01%' OR a.nome ILIKE '%video%01%' THEN 3952
        WHEN a.nome ILIKE '%imagem%1%' AND NOT (a.nome ILIKE '%03%') THEN 2205
        WHEN a.nome ILIKE '%vídeo%02%' OR a.nome ILIKE '%video%02%' THEN 1234
        WHEN a.nome ILIKE '%imagem%2%' THEN 719
        ELSE 0
      END as impressoes_total,
      CASE 
        WHEN a.nome ILIKE '%imagem%03%' OR a.nome ILIKE '%café%' THEN 73
        WHEN a.nome ILIKE '%vídeo%01%' OR a.nome ILIKE '%video%01%' THEN 38
        WHEN a.nome ILIKE '%imagem%1%' AND NOT (a.nome ILIKE '%03%') THEN 21
        WHEN a.nome ILIKE '%vídeo%02%' OR a.nome ILIKE '%video%02%' THEN 12
        WHEN a.nome ILIKE '%imagem%2%' THEN 7
        ELSE 0
      END as cliques_total
    FROM anuncios a
    WHERE a.conjunto_anuncio_id = v_publico_id
      AND (
        a.nome ILIKE '%imagem%03%' OR a.nome ILIKE '%café%' OR
        a.nome ILIKE '%vídeo%01%' OR a.nome ILIKE '%video%01%' OR
        (a.nome ILIKE '%imagem%1%' AND NOT (a.nome ILIKE '%03%')) OR
        a.nome ILIKE '%vídeo%02%' OR a.nome ILIKE '%video%02%' OR
        a.nome ILIKE '%imagem%2%'
      )
  )
  LOOP
    -- Pular se não tem dados (investimento = 0)
    IF v_criativo_record.investimento_total = 0 THEN
      CONTINUE;
    END IF;
    
    RAISE NOTICE '📝 Processando criativo: % (ID: %)', v_criativo_record.nome, v_criativo_record.id;
    RAISE NOTICE '   Totais: R$ % | % leads | % impressões', 
      v_criativo_record.investimento_total, 
      v_criativo_record.leads_total,
      v_criativo_record.impressoes_total;
    
    v_dia_count := 0;
    
    -- Inserir 7 dias de métricas para este criativo
    FOR v_data IN 
      SELECT generate_series('2026-01-01'::date, '2026-01-07'::date, '1 day'::interval)::date
    LOOP
      v_dia_count := v_dia_count + 1;
      
      -- Distribuir valores pelos 7 dias
      IF v_dia_count < v_dias_total THEN
        v_impressoes_dia := FLOOR(v_criativo_record.impressoes_total::NUMERIC / v_dias_total);
        v_alcance_dia := FLOOR(v_criativo_record.impressoes_total::NUMERIC * 0.42 / v_dias_total); -- 42% de alcance
        v_cliques_dia := FLOOR(v_criativo_record.cliques_total::NUMERIC / v_dias_total);
        v_visualizacoes_dia := FLOOR(v_criativo_record.cliques_total::NUMERIC * 0.71 / v_dias_total); -- 71% visualizam
        v_leads_dia := FLOOR(v_criativo_record.leads_total::NUMERIC / v_dias_total);
        v_investimento_dia := ROUND((v_criativo_record.investimento_total / v_dias_total)::NUMERIC, 2);
      ELSE
        -- Último dia pega o resto para fechar os totais exatos
        v_impressoes_dia := v_criativo_record.impressoes_total - (FLOOR(v_criativo_record.impressoes_total::NUMERIC / v_dias_total) * 6);
        v_alcance_dia := FLOOR(v_criativo_record.impressoes_total * 0.42) - (FLOOR(v_criativo_record.impressoes_total::NUMERIC * 0.42 / v_dias_total) * 6);
        v_cliques_dia := v_criativo_record.cliques_total - (FLOOR(v_criativo_record.cliques_total::NUMERIC / v_dias_total) * 6);
        v_visualizacoes_dia := FLOOR(v_criativo_record.cliques_total * 0.71) - (FLOOR(v_criativo_record.cliques_total::NUMERIC * 0.71 / v_dias_total) * 6);
        v_leads_dia := v_criativo_record.leads_total - (FLOOR(v_criativo_record.leads_total::NUMERIC / v_dias_total) * 6);
        v_investimento_dia := ROUND((v_criativo_record.investimento_total - (ROUND((v_criativo_record.investimento_total / v_dias_total)::NUMERIC, 2) * 6))::NUMERIC, 2);
      END IF;
      
      v_checkouts_dia := v_visualizacoes_dia;
      
      INSERT INTO metricas (
        tipo, referencia_id, periodo_inicio, periodo_fim,
        alcance, impressoes, cliques, visualizacoes_pagina,
        leads, checkouts, vendas, investimento, faturamento,
        roas, ctr, cpm, cpc, cpl, taxa_conversao
      ) VALUES (
        'criativo',  -- TIPO = CRIATIVO
        v_criativo_record.id,  -- ID do anúncio
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
    
    RAISE NOTICE '   ✅ 7 dias inseridos para este criativo';
    RAISE NOTICE '';
    
  END LOOP;
  
  RAISE NOTICE '✅ ============================================';
  RAISE NOTICE '✅ CONCLUÍDO! Métricas de CRIATIVOS inseridas';
  RAISE NOTICE '✅ ============================================';
  
END $$;

-- Verificar as métricas de CRIATIVOS
SELECT 
  '✅ CRIATIVOS' as tipo,
  COUNT(DISTINCT referencia_id) as total_criativos,
  COUNT(*) as total_registros,
  TO_CHAR(SUM(investimento), 'R$ 999.99') as investimento_total,
  SUM(leads) as leads_total,
  SUM(impressoes) as impressoes_total
FROM metricas
WHERE tipo = 'criativo'
  AND periodo_inicio >= '2026-01-01'
  AND periodo_fim <= '2026-01-07';

-- Ver detalhes por criativo
SELECT 
  a.nome as criativo,
  COUNT(*) as dias,
  TO_CHAR(SUM(m.investimento), 'R$ 999.99') as investimento,
  SUM(m.leads) as leads,
  SUM(m.impressoes) as impressoes,
  SUM(m.cliques) as cliques
FROM metricas m
JOIN anuncios a ON a.id = m.referencia_id
WHERE m.tipo = 'criativo'
  AND m.periodo_inicio >= '2026-01-01'
  AND m.periodo_fim <= '2026-01-07'
GROUP BY a.nome
ORDER BY SUM(m.investimento) DESC;
