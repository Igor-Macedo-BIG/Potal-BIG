-- Inserindo métricas de exemplo para diferentes períodos para testar agregação
-- Primeiro, vamos inserir para diferentes meses do ano atual
INSERT INTO metricas (tipo, referencia_id, periodo_inicio, periodo_fim, 
  alcance, impressoes, cliques, visualizacoes_pagina, leads, checkouts, vendas, 
  investimento, faturamento, roas, ctr) 
SELECT 
  'campanha' as tipo,
  id as referencia_id,
  '2025-08-01' as periodo_inicio,
  '2025-08-31' as periodo_fim,
  FLOOR(RANDOM() * 30000 + 5000) as alcance,
  FLOOR(RANDOM() * 60000 + 10000) as impressoes,
  FLOOR(RANDOM() * 3000 + 500) as cliques,
  FLOOR(RANDOM() * 2000 + 300) as visualizacoes_pagina,
  FLOOR(RANDOM() * 500 + 100) as leads,
  FLOOR(RANDOM() * 120 + 30) as checkouts,
  FLOOR(RANDOM() * 60 + 15) as vendas,
  FLOOR(RANDOM() * 3500 + 600) as investimento,
  FLOOR(RANDOM() * 10000 + 2000) as faturamento,
  2.8 as roas,
  4.8 as ctr
FROM campanhas 
LIMIT 3
ON CONFLICT (tipo, referencia_id, periodo_inicio, periodo_fim) 
DO NOTHING;

-- Inserindo para julho também
INSERT INTO metricas (tipo, referencia_id, periodo_inicio, periodo_fim, 
  alcance, impressoes, cliques, visualizacoes_pagina, leads, checkouts, vendas, 
  investimento, faturamento, roas, ctr) 
SELECT 
  'campanha' as tipo,
  id as referencia_id,
  '2025-07-01' as periodo_inicio,
  '2025-07-31' as periodo_fim,
  FLOOR(RANDOM() * 35000 + 7000) as alcance,
  FLOOR(RANDOM() * 70000 + 12000) as impressoes,
  FLOOR(RANDOM() * 3500 + 600) as cliques,
  FLOOR(RANDOM() * 2200 + 350) as visualizacoes_pagina,
  FLOOR(RANDOM() * 550 + 120) as leads,
  FLOOR(RANDOM() * 130 + 35) as checkouts,
  FLOOR(RANDOM() * 70 + 18) as vendas,
  FLOOR(RANDOM() * 4000 + 700) as investimento,
  FLOOR(RANDOM() * 11000 + 2200) as faturamento,
  3.1 as roas,
  5.1 as ctr
FROM campanhas 
LIMIT 3
ON CONFLICT (tipo, referencia_id, periodo_inicio, periodo_fim) 
DO NOTHING;
