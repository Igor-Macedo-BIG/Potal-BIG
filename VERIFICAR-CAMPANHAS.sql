-- Verificar campanhas existentes por cliente
SELECT 
    c.nome as cliente,
    cam.id,
    cam.nome as campanha,
    cam.cliente_id
FROM clientes c
LEFT JOIN campanhas cam ON cam.cliente_id = c.id
WHERE c.nome = 'Dr. Leonardo'
ORDER BY c.nome, cam.nome;
