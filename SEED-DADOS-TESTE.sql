-- ========================================
-- SEED DE DADOS DE TESTE - TODOS OS CLIENTES
-- ========================================

-- IDs dos clientes:
-- Cliente Teste: 846146b1-4ce9-494d-8041-43d36e7f86ca
-- Dr. Leonardo: 265b7609-5310-4b3b-8806-157eb86a48bd
-- Guezzo Imóveis: 785805f4-44f3-4a5a-96fc-78dab21ac435
-- Letícia Amaral: 4fb46062-fc2f-4ffd-9e21-1f68bfc75124
-- Sonolins: 5cb4a87d-a28f-4506-b840-3c4099d65844

-- ========================================
-- PASSO 1: LIMPAR DADOS ANTIGOS (OPCIONAL)
-- Descomente se quiser começar do zero
-- ========================================

-- DELETE FROM metricas;
-- DELETE FROM anuncios;
-- DELETE FROM conjuntos_anuncio;
-- DELETE FROM publicos;
-- DELETE FROM funis;
-- DELETE FROM campanhas;

-- ========================================
-- PASSO 2: ATUALIZAR REGISTROS EXISTENTES
-- ========================================

-- Atualizar campanhas e publicos sem cliente_id para Dr. Leonardo
UPDATE campanhas 
SET cliente_id = '265b7609-5310-4b3b-8806-157eb86a48bd'
WHERE cliente_id IS NULL;

UPDATE publicos 
SET cliente_id = '265b7609-5310-4b3b-8806-157eb86a48bd'
WHERE cliente_id IS NULL;

UPDATE funis 
SET cliente_id = '265b7609-5310-4b3b-8806-157eb86a48bd'
WHERE cliente_id IS NULL;

-- ========================================
-- PASSO 3: INSERIR CAMPANHAS
-- ========================================

-- Cliente Teste
INSERT INTO campanhas (id, nome, cliente_id, empresa_id, created_at) VALUES
('11111111-1111-1111-1111-111111111111', 'Campanha Black Friday - Cliente Teste', '846146b1-4ce9-494d-8041-43d36e7f86ca', '550e8400-e29b-41d4-a716-446655440000', NOW() - INTERVAL '30 days'),
('11111111-1111-1111-1111-111111111112', 'Campanha Verão 2026 - Cliente Teste', '846146b1-4ce9-494d-8041-43d36e7f86ca', '550e8400-e29b-41d4-a716-446655440000', NOW() - INTERVAL '15 days');

-- Dr. Leonardo
INSERT INTO campanhas (id, nome, cliente_id, empresa_id, created_at) VALUES
('22222222-2222-2222-2222-222222222221', 'Campanha Implantes Dentários', '265b7609-5310-4b3b-8806-157eb86a48bd', '550e8400-e29b-41d4-a716-446655440000', NOW() - INTERVAL '45 days'),
('22222222-2222-2222-2222-222222222222', 'Campanha Clareamento Dental', '265b7609-5310-4b3b-8806-157eb86a48bd', '550e8400-e29b-41d4-a716-446655440000', NOW() - INTERVAL '20 days');

-- Guezzo Imóveis
INSERT INTO campanhas (id, nome, cliente_id, empresa_id, created_at) VALUES
('33333333-3333-3333-3333-333333333331', 'Campanha Apartamentos Centro', '785805f4-44f3-4a5a-96fc-78dab21ac435', '550e8400-e29b-41d4-a716-446655440000', NOW() - INTERVAL '60 days'),
('33333333-3333-3333-3333-333333333332', 'Campanha Casas Condomínio', '785805f4-44f3-4a5a-96fc-78dab21ac435', '550e8400-e29b-41d4-a716-446655440000', NOW() - INTERVAL '25 days');

-- Letícia Amaral
INSERT INTO campanhas (id, nome, cliente_id, empresa_id, created_at) VALUES
('44444444-4444-4444-4444-444444444441', 'Campanha Emagrecimento Saudável', '4fb46062-fc2f-4ffd-9e21-1f68bfc75124', '550e8400-e29b-41d4-a716-446655440000', NOW() - INTERVAL '35 days'),
('44444444-4444-4444-4444-444444444442', 'Campanha Consultoria Nutricional', '4fb46062-fc2f-4ffd-9e21-1f68bfc75124', '550e8400-e29b-41d4-a716-446655440000', NOW() - INTERVAL '10 days');

-- Sonolins
INSERT INTO campanhas (id, nome, cliente_id, empresa_id, created_at) VALUES
('55555555-5555-5555-5555-555555555551', 'Campanha Colchões Ortopédicos', '5cb4a87d-a28f-4506-b840-3c4099d65844', '550e8400-e29b-41d4-a716-446655440000', NOW() - INTERVAL '40 days'),
('55555555-5555-5555-5555-555555555552', 'Campanha Travesseiros Premium', '5cb4a87d-a28f-4506-b840-3c4099d65844', '550e8400-e29b-41d4-a716-446655440000', NOW() - INTERVAL '5 days');

-- ========================================
-- PASSO 4: INSERIR FUNIS
-- ========================================

-- Cliente Teste
INSERT INTO funis (id, nome, cliente_id, empresa_id, created_at) VALUES
('f1111111-1111-1111-1111-111111111111', 'Funil Vendas Online - Cliente Teste', '846146b1-4ce9-494d-8041-43d36e7f86ca', '550e8400-e29b-41d4-a716-446655440000', NOW() - INTERVAL '30 days'),
('f1111111-1111-1111-1111-111111111112', 'Funil Captação Leads - Cliente Teste', '846146b1-4ce9-494d-8041-43d36e7f86ca', '550e8400-e29b-41d4-a716-446655440000', NOW() - INTERVAL '15 days');

-- Dr. Leonardo
INSERT INTO funis (id, nome, cliente_id, empresa_id, created_at) VALUES
('f2222222-2222-2222-2222-222222222221', 'Funil Agendamento Consultas', '265b7609-5310-4b3b-8806-157eb86a48bd', '550e8400-e29b-41d4-a716-446655440000', NOW() - INTERVAL '45 days'),
('f2222222-2222-2222-2222-222222222222', 'Funil Avaliação Gratuita', '265b7609-5310-4b3b-8806-157eb86a48bd', '550e8400-e29b-41d4-a716-446655440000', NOW() - INTERVAL '20 days');

-- Guezzo Imóveis
INSERT INTO funis (id, nome, cliente_id, empresa_id, created_at) VALUES
('f3333333-3333-3333-3333-333333333331', 'Funil Visita Imóveis', '785805f4-44f3-4a5a-96fc-78dab21ac435', '550e8400-e29b-41d4-a716-446655440000', NOW() - INTERVAL '60 days'),
('f3333333-3333-3333-3333-333333333332', 'Funil Cadastro Interessados', '785805f4-44f3-4a5a-96fc-78dab21ac435', '550e8400-e29b-41d4-a716-446655440000', NOW() - INTERVAL '25 days');

-- Letícia Amaral
INSERT INTO funis (id, nome, cliente_id, empresa_id, created_at) VALUES
('f4444444-4444-4444-4444-444444444441', 'Funil Plano Alimentar', '4fb46062-fc2f-4ffd-9e21-1f68bfc75124', '550e8400-e29b-41d4-a716-446655440000', NOW() - INTERVAL '35 days'),
('f4444444-4444-4444-4444-444444444442', 'Funil Acompanhamento Mensal', '4fb46062-fc2f-4ffd-9e21-1f68bfc75124', '550e8400-e29b-41d4-a716-446655440000', NOW() - INTERVAL '10 days');

-- Sonolins
INSERT INTO funis (id, nome, cliente_id, empresa_id, created_at) VALUES
('f5555555-5555-5555-5555-555555555551', 'Funil Venda Direta', '5cb4a87d-a28f-4506-b840-3c4099d65844', '550e8400-e29b-41d4-a716-446655440000', NOW() - INTERVAL '40 days'),
('f5555555-5555-5555-5555-555555555552', 'Funil Teste Grátis', '5cb4a87d-a28f-4506-b840-3c4099d65844', '550e8400-e29b-41d4-a716-446655440000', NOW() - INTERVAL '5 days');

-- ========================================
-- PASSO 5: INSERIR MÉTRICAS DE CAMPANHAS
-- ========================================

-- Cliente Teste - Campanha 1
INSERT INTO metricas (tipo, referencia_id, cliente_id, data, impressoes, cliques, conversoes, investimento, receita, created_at) VALUES
('campanha', '11111111-1111-1111-1111-111111111111', '846146b1-4ce9-494d-8041-43d36e7f86ca', CURRENT_DATE - 7, 15000, 450, 25, 850.00, 3500.00, NOW()),
('campanha', '11111111-1111-1111-1111-111111111111', '846146b1-4ce9-494d-8041-43d36e7f86ca', CURRENT_DATE - 6, 18000, 520, 32, 920.00, 4200.00, NOW()),
('campanha', '11111111-1111-1111-1111-111111111111', '846146b1-4ce9-494d-8041-43d36e7f86ca', CURRENT_DATE - 5, 16500, 480, 28, 880.00, 3800.00, NOW());

-- Cliente Teste - Campanha 2
INSERT INTO metricas (tipo, referencia_id, cliente_id, data, impressoes, cliques, conversoes, investimento, receita, created_at) VALUES
('campanha', '11111111-1111-1111-1111-111111111112', '846146b1-4ce9-494d-8041-43d36e7f86ca', CURRENT_DATE - 3, 12000, 380, 18, 650.00, 2800.00, NOW()),
('campanha', '11111111-1111-1111-1111-111111111112', '846146b1-4ce9-494d-8041-43d36e7f86ca', CURRENT_DATE - 2, 14000, 420, 22, 720.00, 3200.00, NOW());

-- Dr. Leonardo - Campanha 1
INSERT INTO metricas (tipo, referencia_id, cliente_id, data, impressoes, cliques, conversoes, investimento, receita, created_at) VALUES
('campanha', '22222222-2222-2222-2222-222222222221', '265b7609-5310-4b3b-8806-157eb86a48bd', CURRENT_DATE - 10, 25000, 850, 45, 1500.00, 9000.00, NOW()),
('campanha', '22222222-2222-2222-2222-222222222221', '265b7609-5310-4b3b-8806-157eb86a48bd', CURRENT_DATE - 9, 28000, 920, 52, 1650.00, 10400.00, NOW()),
('campanha', '22222222-2222-2222-2222-222222222221', '265b7609-5310-4b3b-8806-157eb86a48bd', CURRENT_DATE - 8, 26500, 880, 48, 1580.00, 9600.00, NOW());

-- Dr. Leonardo - Campanha 2
INSERT INTO metricas (tipo, referencia_id, cliente_id, data, impressoes, cliques, conversoes, investimento, receita, created_at) VALUES
('campanha', '22222222-2222-2222-2222-222222222222', '265b7609-5310-4b3b-8806-157eb86a48bd', CURRENT_DATE - 5, 20000, 650, 35, 1200.00, 7000.00, NOW()),
('campanha', '22222222-2222-2222-2222-222222222222', '265b7609-5310-4b3b-8806-157eb86a48bd', CURRENT_DATE - 4, 22000, 710, 40, 1300.00, 8000.00, NOW());

-- Guezzo Imóveis - Campanha 1
INSERT INTO metricas (tipo, referencia_id, cliente_id, data, impressoes, cliques, conversoes, investimento, receita, created_at) VALUES
('campanha', '33333333-3333-3333-3333-333333333331', '785805f4-44f3-4a5a-96fc-78dab21ac435', CURRENT_DATE - 12, 30000, 1100, 8, 2000.00, 16000.00, NOW()),
('campanha', '33333333-3333-3333-3333-333333333331', '785805f4-44f3-4a5a-96fc-78dab21ac435', CURRENT_DATE - 11, 32000, 1200, 10, 2150.00, 20000.00, NOW()),
('campanha', '33333333-3333-3333-3333-333333333331', '785805f4-44f3-4a5a-96fc-78dab21ac435', CURRENT_DATE - 10, 31000, 1150, 9, 2080.00, 18000.00, NOW());

-- Guezzo Imóveis - Campanha 2
INSERT INTO metricas (tipo, referencia_id, cliente_id, data, impressoes, cliques, conversoes, investimento, receita, created_at) VALUES
('campanha', '33333333-3333-3333-3333-333333333332', '785805f4-44f3-4a5a-96fc-78dab21ac435', CURRENT_DATE - 6, 28000, 980, 7, 1850.00, 14000.00, NOW()),
('campanha', '33333333-3333-3333-3333-333333333332', '785805f4-44f3-4a5a-96fc-78dab21ac435', CURRENT_DATE - 5, 29500, 1050, 8, 1920.00, 16000.00, NOW());

-- Letícia Amaral - Campanha 1
INSERT INTO metricas (tipo, referencia_id, cliente_id, data, impressoes, cliques, conversoes, investimento, receita, created_at) VALUES
('campanha', '44444444-4444-4444-4444-444444444441', '4fb46062-fc2f-4ffd-9e21-1f68bfc75124', CURRENT_DATE - 8, 18000, 580, 38, 1100.00, 5700.00, NOW()),
('campanha', '44444444-4444-4444-4444-444444444441', '4fb46062-fc2f-4ffd-9e21-1f68bfc75124', CURRENT_DATE - 7, 19500, 620, 42, 1180.00, 6300.00, NOW()),
('campanha', '44444444-4444-4444-4444-444444444441', '4fb46062-fc2f-4ffd-9e21-1f68bfc75124', CURRENT_DATE - 6, 18800, 600, 40, 1140.00, 6000.00, NOW());

-- Letícia Amaral - Campanha 2
INSERT INTO metricas (tipo, referencia_id, cliente_id, data, impressoes, cliques, conversoes, investimento, receita, created_at) VALUES
('campanha', '44444444-4444-4444-4444-444444444442', '4fb46062-fc2f-4ffd-9e21-1f68bfc75124', CURRENT_DATE - 3, 15000, 480, 30, 950.00, 4500.00, NOW()),
('campanha', '44444444-4444-4444-4444-444444444442', '4fb46062-fc2f-4ffd-9e21-1f68bfc75124', CURRENT_DATE - 2, 16000, 510, 33, 1000.00, 4950.00, NOW());

-- Sonolins - Campanha 1
INSERT INTO metricas (tipo, referencia_id, cliente_id, data, impressoes, cliques, conversoes, investimento, receita, created_at) VALUES
('campanha', '55555555-5555-5555-5555-555555555551', '5cb4a87d-a28f-4506-b840-3c4099d65844', CURRENT_DATE - 9, 22000, 720, 55, 1400.00, 8250.00, NOW()),
('campanha', '55555555-5555-5555-5555-555555555551', '5cb4a87d-a28f-4506-b840-3c4099d65844', CURRENT_DATE - 8, 24000, 780, 60, 1500.00, 9000.00, NOW()),
('campanha', '55555555-5555-5555-5555-555555555551', '5cb4a87d-a28f-4506-b840-3c4099d65844', CURRENT_DATE - 7, 23000, 750, 58, 1450.00, 8700.00, NOW());

-- Sonolins - Campanha 2
INSERT INTO metricas (tipo, referencia_id, cliente_id, data, impressoes, cliques, conversoes, investimento, receita, created_at) VALUES
('campanha', '55555555-5555-5555-5555-555555555552', '5cb4a87d-a28f-4506-b840-3c4099d65844', CURRENT_DATE - 2, 19000, 600, 45, 1200.00, 6750.00, NOW()),
('campanha', '55555555-5555-5555-5555-555555555552', '5cb4a87d-a28f-4506-b840-3c4099d65844', CURRENT_DATE - 1, 20000, 640, 48, 1280.00, 7200.00, NOW());

-- ========================================
-- PASSO 6: INSERIR MÉTRICAS DE FUNIS
-- ========================================

-- Cliente Teste - Funil 1
INSERT INTO metricas (tipo, referencia_id, cliente_id, data, impressoes, cliques, conversoes, investimento, receita, created_at) VALUES
('funil', 'f1111111-1111-1111-1111-111111111111', '846146b1-4ce9-494d-8041-43d36e7f86ca', CURRENT_DATE - 7, 8000, 320, 15, 450.00, 1800.00, NOW()),
('funil', 'f1111111-1111-1111-1111-111111111111', '846146b1-4ce9-494d-8041-43d36e7f86ca', CURRENT_DATE - 6, 9000, 360, 18, 500.00, 2100.00, NOW());

-- Dr. Leonardo - Funil 1
INSERT INTO metricas (tipo, referencia_id, cliente_id, data, impressoes, cliques, conversoes, investimento, receita, created_at) VALUES
('funil', 'f2222222-2222-2222-2222-222222222221', '265b7609-5310-4b3b-8806-157eb86a48bd', CURRENT_DATE - 10, 12000, 480, 25, 800.00, 5000.00, NOW()),
('funil', 'f2222222-2222-2222-2222-222222222221', '265b7609-5310-4b3b-8806-157eb86a48bd', CURRENT_DATE - 9, 13000, 520, 28, 850.00, 5600.00, NOW());

-- Guezzo Imóveis - Funil 1
INSERT INTO metricas (tipo, referencia_id, cliente_id, data, impressoes, cliques, conversoes, investimento, receita, created_at) VALUES
('funil', 'f3333333-3333-3333-3333-333333333331', '785805f4-44f3-4a5a-96fc-78dab21ac435', CURRENT_DATE - 12, 15000, 600, 5, 1000.00, 10000.00, NOW()),
('funil', 'f3333333-3333-3333-3333-333333333331', '785805f4-44f3-4a5a-96fc-78dab21ac435', CURRENT_DATE - 11, 16000, 640, 6, 1080.00, 12000.00, NOW());

-- Letícia Amaral - Funil 1
INSERT INTO metricas (tipo, referencia_id, cliente_id, data, impressoes, cliques, conversoes, investimento, receita, created_at) VALUES
('funil', 'f4444444-4444-4444-4444-444444444441', '4fb46062-fc2f-4ffd-9e21-1f68bfc75124', CURRENT_DATE - 8, 10000, 400, 20, 600.00, 3000.00, NOW()),
('funil', 'f4444444-4444-4444-4444-444444444441', '4fb46062-fc2f-4ffd-9e21-1f68bfc75124', CURRENT_DATE - 7, 11000, 440, 22, 650.00, 3300.00, NOW());

-- Sonolins - Funil 1
INSERT INTO metricas (tipo, referencia_id, cliente_id, data, impressoes, cliques, conversoes, investimento, receita, created_at) VALUES
('funil', 'f5555555-5555-5555-5555-555555555551', '5cb4a87d-a28f-4506-b840-3c4099d65844', CURRENT_DATE - 9, 11500, 460, 30, 700.00, 4500.00, NOW()),
('funil', 'f5555555-5555-5555-5555-555555555551', '5cb4a87d-a28f-4506-b840-3c4099d65844', CURRENT_DATE - 8, 12500, 500, 32, 750.00, 4800.00, NOW());

-- ========================================
-- PASSO 7: VERIFICAR RESULTADOS
-- ========================================

-- Contar campanhas por cliente
SELECT c.nome as cliente, COUNT(cam.id) as total_campanhas
FROM clientes c
LEFT JOIN campanhas cam ON cam.cliente_id = c.id
GROUP BY c.id, c.nome
ORDER BY c.nome;

-- Contar funis por cliente
SELECT c.nome as cliente, COUNT(f.id) as total_funis
FROM clientes c
LEFT JOIN funis f ON f.cliente_id = c.id
GROUP BY c.id, c.nome
ORDER BY c.nome;

-- Contar métricas por cliente
SELECT c.nome as cliente, COUNT(m.id) as total_metricas
FROM clientes c
LEFT JOIN metricas m ON m.cliente_id = c.id
GROUP BY c.id, c.nome
ORDER BY c.nome;

-- Resumo geral de métricas por cliente
SELECT 
    c.nome as cliente,
    COUNT(m.id) as total_metricas,
    SUM(m.impressoes) as total_impressoes,
    SUM(m.cliques) as total_cliques,
    SUM(m.conversoes) as total_conversoes,
    SUM(m.investimento) as total_investimento,
    SUM(m.receita) as total_receita,
    ROUND(SUM(m.receita) - SUM(m.investimento), 2) as lucro
FROM clientes c
LEFT JOIN metricas m ON m.cliente_id = c.id
GROUP BY c.id, c.nome
ORDER BY c.nome;
