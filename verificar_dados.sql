-- Primeiro, vamos ver qual campanha está ativa e seu período atual
SELECT 
  c.id,
  c.nome,
  m.periodo_inicio,
  m.periodo_fim,
  m.impressoes,
  m.alcance,
  m.cliques,
  m.leads,
  m.vendas
FROM campanhas c
LEFT JOIN metricas m ON c.id = m.referencia_id AND m.tipo = 'campanha'
ORDER BY m.created_at DESC
LIMIT 3;
