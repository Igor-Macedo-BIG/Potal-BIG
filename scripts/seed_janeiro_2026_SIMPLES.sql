-- =============================================
-- Script SIMPLES: Métricas Janeiro 2026 - Semana 1
-- Apenas insere dados FIXOS de teste
-- Se funcionar, adaptamos para dados reais
-- =============================================

DO $$
DECLARE
  v_campanha_id UUID;
  v_data DATE;
BEGIN
  RAISE NOTICE '🚀 Iniciando inserção SIMPLES de dados de teste';
  
  -- Pegar QUALQUER campanha que exista
  SELECT id INTO v_campanha_id FROM campanhas LIMIT 1;
  
  IF v_campanha_id IS NULL THEN
    RAISE EXCEPTION '❌ NENHUMA CAMPANHA ENCONTRADA NO BANCO!';
  END IF;
  
  RAISE NOTICE '✅ Usando campanha: %', v_campanha_id;
  
  -- Inserir 7 dias de métricas SIMPLES para esta campanha
  FOR v_data IN 
    SELECT generate_series('2026-01-01'::date, '2026-01-07'::date, '1 day'::interval)::date
  LOOP
    RAISE NOTICE '📅 Inserindo dia: %', v_data;
    
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
      1000,  -- alcance
      5000,  -- impressoes
      150,   -- cliques
      100,   -- visualizacoes
      10,    -- leads
      8,     -- checkouts
      2,     -- vendas
      50.00, -- investimento
      200.00,-- faturamento
      4.0,   -- roas
      3.0,   -- ctr
      10.0,  -- cpm
      0.33,  -- cpc
      5.0,   -- cpl
      20.0   -- taxa_conversao
    )
    ON CONFLICT (tipo, referencia_id, periodo_inicio, periodo_fim) 
    DO UPDATE SET
      alcance = EXCLUDED.alcance,
      impressoes = EXCLUDED.impressoes,
      cliques = EXCLUDED.cliques,
      leads = EXCLUDED.leads,
      investimento = EXCLUDED.investimento,
      faturamento = EXCLUDED.faturamento;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '✅ CONCLUÍDO! 7 dias de métricas inseridos';
  RAISE NOTICE '📊 Campanha: %', v_campanha_id;
  RAISE NOTICE '📅 Período: 01/01/2026 a 07/01/2026';
  
END $$;

-- Verificar os dados inseridos
SELECT 
  'TESTE - Métricas inseridas' as status,
  COUNT(*) as total_dias,
  SUM(investimento) as investimento_total,
  SUM(leads) as leads_total,
  MIN(periodo_inicio) as primeira_data,
  MAX(periodo_fim) as ultima_data
FROM metricas
WHERE tipo = 'campanha'
  AND periodo_inicio >= '2026-01-01'
  AND periodo_fim <= '2026-01-07';
