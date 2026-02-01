-- ========================================
-- VERIFICAR CAMPANHAS E CLIENTE_ID
-- ========================================

-- Ver todas as campanhas com seus clientes
SELECT 
  c.nome as cliente,
  c.id as cliente_id,
  cam.id as campanha_id,
  cam.nome as campanha,
  cam.cliente_id as cliente_id_na_campanha
FROM clientes c
LEFT JOIN campanhas cam ON cam.cliente_id = c.id
WHERE c.nome IN ('Dr. Leonardo', 'Guezzo Imóveis')
ORDER BY c.nome, cam.nome;

-- Ver campanhas órfãs (sem cliente_id ou cliente_id errado)
SELECT 
  cam.id,
  cam.nome,
  cam.cliente_id,
  CASE 
    WHEN cam.cliente_id IS NULL THEN 'SEM CLIENTE_ID'
    WHEN NOT EXISTS (SELECT 1 FROM clientes WHERE id = cam.cliente_id) THEN 'CLIENTE INEXISTENTE'
    ELSE 'OK'
  END as status
FROM campanhas cam
WHERE cam.nome LIKE '%Guezzo%' OR cam.nome LIKE '%Leonardo%' OR cam.nome LIKE '%Whatsapp%';

-- Ver contagem de campanhas por cliente
SELECT 
  c.nome as cliente,
  c.id as cliente_id,
  COUNT(cam.id) as total_campanhas
FROM clientes c
LEFT JOIN campanhas cam ON cam.cliente_id = c.id
GROUP BY c.id, c.nome
ORDER BY c.nome;
