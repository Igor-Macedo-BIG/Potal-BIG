-- Inserindo métricas de exemplo para setembro (mês anterior) para comparação
INSERT INTO metricas (tipo, referencia_id, periodo_inicio, periodo_fim, 
  alcance, impressoes, cliques, visualizacoes_pagina, leads, checkouts, vendas, 
  investimento, faturamento, roas, ctr) 
SELECT 
  'campanha' as tipo,
  id as referencia_id,
  '2025-09-01' as periodo_inicio,
  '2025-09-30' as periodo_fim,
  FLOOR(RANDOM() * 40000 + 8000) as alcance,
  FLOOR(RANDOM() * 80000 + 15000) as impressoes,
  FLOOR(RANDOM() * 4000 + 800) as cliques,
  FLOOR(RANDOM() * 2500 + 400) as visualizacoes_pagina,
  FLOOR(RANDOM() * 600 + 150) as leads,
  FLOOR(RANDOM() * 150 + 40) as checkouts,
  FLOOR(RANDOM() * 80 + 20) as vendas,
  FLOOR(RANDOM() * 4000 + 800) as investimento,
  FLOOR(RANDOM() * 12000 + 2500) as faturamento,
  2.5 as roas,
  5.2 as ctr
FROM campanhas 
LIMIT 5
ON CONFLICT (tipo, referencia_id, periodo_inicio, periodo_fim) 
DO NOTHING;
