-- Script para popular dados hipotéticos de Dezembro/2025
-- Execute este SQL no Supabase SQL Editor

-- ====================================================================
-- DADOS DE DEZEMBRO 2025 - DISTRIBUÍDOS POR SEMANA
-- ====================================================================

-- Vamos assumir que temos campanhas no banco. 
-- Primeiro, vamos buscar os IDs reais das campanhas:
-- SELECT id, nome FROM campanhas ORDER BY nome;

-- Para este exemplo, vou criar dados genéricos que funcionam com qualquer campanha
-- Você pode ajustar os referencia_id depois de ver seus IDs reais

-- ====================================================================
-- SEMANA 1: 01/12/2025 a 07/12/2025
-- ====================================================================

-- Campanha 1 - Semana 1
INSERT INTO metricas (
    tipo, referencia_id, periodo_inicio, periodo_fim,
    alcance, impressoes, cliques, visualizacoes_pagina,
    leads, checkouts, vendas, investimento, faturamento,
    roas, ctr, cpm, cpc, cpl, taxa_conversao,
    detalhe_sdr
) VALUES 
-- Segunda 01/12
(
    'campanha', 
    (SELECT id FROM campanhas ORDER BY created_at LIMIT 1 OFFSET 0), 
    '2025-12-01', '2025-12-01',
    12500, 45000, 1350, 890, 45, 38, 8, 450.00, 3200.00,
    7.11, 3.0, 10.00, 0.33, 10.00, 17.78,
    '{"comecou_diagnostico": 12, "chegaram_crm_kommo": 10, "qualificados_para_mentoria": 7, "para_downsell": 3, "agendados_diagnostico": 5, "agendados_mentoria": 4, "nomes_qualificados": "Maria Silva\nJoão Santos\nAna Costa\nPedro Oliveira\nCarla Souza\nLucas Almeida\nFernanda Lima"}'::jsonb
),
-- Terça 02/12
(
    'campanha', 
    (SELECT id FROM campanhas ORDER BY created_at LIMIT 1 OFFSET 0),
    '2025-12-02', '2025-12-02',
    13200, 48000, 1440, 950, 48, 42, 9, 480.00, 3600.00,
    7.50, 3.0, 10.00, 0.33, 10.00, 18.75,
    '{"comecou_diagnostico": 15, "chegaram_crm_kommo": 12, "qualificados_para_mentoria": 8, "para_downsell": 4, "agendados_diagnostico": 6, "agendados_mentoria": 5, "nomes_qualificados": "Ricardo Pereira\nJuliana Rocha\nGabriel Martins\nBeatriz Ferreira\nRafael Costa\nPatrícia Dias\nThiago Ribeiro\nCamila Mendes"}'::jsonb
),
-- Quarta 03/12
(
    'campanha', 
    (SELECT id FROM campanhas ORDER BY created_at LIMIT 1 OFFSET 0),
    '2025-12-03', '2025-12-03',
    14100, 52000, 1560, 1020, 52, 45, 11, 520.00, 4400.00,
    8.46, 3.0, 10.00, 0.33, 10.00, 21.15,
    '{"comecou_diagnostico": 18, "chegaram_crm_kommo": 15, "qualificados_para_mentoria": 10, "para_downsell": 5, "agendados_diagnostico": 8, "agendados_mentoria": 7, "nomes_qualificados": "André Gomes\nLarissa Santos\nBruno Cardoso\nVanessa Lima\nDiego Moreira\nNatália Silva\nGustavo Araújo\nIsabela Nunes\nFábio Torres\nRenata Barbosa"}'::jsonb
),
-- Quinta 04/12
(
    'campanha', 
    (SELECT id FROM campanhas ORDER BY created_at LIMIT 1 OFFSET 0),
    '2025-12-04', '2025-12-04',
    13800, 50000, 1500, 980, 50, 43, 10, 500.00, 4000.00,
    8.00, 3.0, 10.00, 0.33, 10.00, 20.00,
    '{"comecou_diagnostico": 16, "chegaram_crm_kommo": 14, "qualificados_para_mentoria": 9, "para_downsell": 5, "agendados_diagnostico": 7, "agendados_mentoria": 6, "nomes_qualificados": "Marcos Alves\nTatiane Souza\nLeandro Cruz\nAdriana Pinto\nRodrigo Campos\nJéssica Monteiro\nCarlos Freitas\nLuiza Barros\nFelipe Dias"}'::jsonb
),
-- Sexta 05/12
(
    'campanha', 
    (SELECT id FROM campanhas ORDER BY created_at LIMIT 1 OFFSET 0),
    '2025-12-05', '2025-12-05',
    15200, 56000, 1680, 1100, 56, 48, 12, 560.00, 4800.00,
    8.57, 3.0, 10.00, 0.33, 10.00, 21.43,
    '{"comecou_diagnostico": 20, "chegaram_crm_kommo": 17, "qualificados_para_mentoria": 11, "para_downsell": 6, "agendados_diagnostico": 9, "agendados_mentoria": 8, "nomes_qualificados": "Vitor Melo\nPriscila Cunha\nEduardo Ramos\nMariana Castro\nRenato Vieira\nSabrina Duarte\nDaniel Fonseca\nLetícia Moura\nMaurício Rocha\nCláudia Teixeira\nPaulo Correia"}'::jsonb
),
-- Sábado 06/12
(
    'campanha', 
    (SELECT id FROM campanhas ORDER BY created_at LIMIT 1 OFFSET 0),
    '2025-12-06', '2025-12-06',
    11000, 40000, 1200, 780, 40, 35, 7, 400.00, 2800.00,
    7.00, 3.0, 10.00, 0.33, 10.00, 17.50,
    '{"comecou_diagnostico": 10, "chegaram_crm_kommo": 8, "qualificados_para_mentoria": 6, "para_downsell": 2, "agendados_diagnostico": 4, "agendados_mentoria": 3, "nomes_qualificados": "Sérgio Azevedo\nFernanda Borges\nMarcelo Pires\nCristina Lopes\nRoberto Tavares\nEliane Nogueira"}'::jsonb
),
-- Domingo 07/12
(
    'campanha', 
    (SELECT id FROM campanhas ORDER BY created_at LIMIT 1 OFFSET 0),
    '2025-12-07', '2025-12-07',
    9500, 35000, 1050, 680, 35, 30, 6, 350.00, 2400.00,
    6.86, 3.0, 10.00, 0.33, 10.00, 17.14,
    '{"comecou_diagnostico": 9, "chegaram_crm_kommo": 7, "qualificados_para_mentoria": 5, "para_downsell": 2, "agendados_diagnostico": 3, "agendados_mentoria": 3, "nomes_qualificados": "Alexandre Macedo\nVanessa Reis\nLuciano Vaz\nTalita Cavalcante\nIgor Braga"}'::jsonb
);

-- ====================================================================
-- SEMANA 2: 08/12/2025 a 14/12/2025
-- ====================================================================

INSERT INTO metricas (
    tipo, referencia_id, periodo_inicio, periodo_fim,
    alcance, impressoes, cliques, visualizacoes_pagina,
    leads, checkouts, vendas, investimento, faturamento,
    roas, ctr, cpm, cpc, cpl, taxa_conversao,
    detalhe_sdr
) VALUES 
-- Segunda 08/12
(
    'campanha', 
    (SELECT id FROM campanhas ORDER BY created_at LIMIT 1 OFFSET 0),
    '2025-12-08', '2025-12-08',
    13500, 49000, 1470, 960, 49, 42, 9, 490.00, 3600.00,
    7.35, 3.0, 10.00, 0.33, 10.00, 18.37,
    '{"comecou_diagnostico": 14, "chegaram_crm_kommo": 11, "qualificados_para_mentoria": 8, "para_downsell": 3, "agendados_diagnostico": 6, "agendados_mentoria": 5, "nomes_qualificados": "Helena Cardoso\nGuilherme Mendes\nBianca Soares\nOtávio Ribeiro\nCaroline Castro\nFernando Lopes\nJuliane Moreira\nRodrigo Silveira"}'::jsonb
),
-- Terça 09/12
(
    'campanha', 
    (SELECT id FROM campanhas ORDER BY created_at LIMIT 1 OFFSET 0),
    '2025-12-09', '2025-12-09',
    14800, 54000, 1620, 1060, 54, 47, 11, 540.00, 4400.00,
    8.15, 3.0, 10.00, 0.33, 10.00, 20.37,
    '{"comecou_diagnostico": 17, "chegaram_crm_kommo": 14, "qualificados_para_mentoria": 10, "para_downsell": 4, "agendados_diagnostico": 8, "agendados_mentoria": 7, "nomes_qualificados": "Amanda Oliveira\nPedro Henrique\nLarissa Fernandes\nBruno Marques\nThaís Gonçalves\nCaio Batista\nMarília Santos\nDiego Araújo\nCamila Freitas\nLucas Pereira"}'::jsonb
),
-- Quarta 10/12
(
    'campanha', 
    (SELECT id FROM campanhas ORDER BY created_at LIMIT 1 OFFSET 0),
    '2025-12-10', '2025-12-10',
    15500, 57000, 1710, 1120, 57, 50, 12, 570.00, 4800.00,
    8.42, 3.0, 10.00, 0.33, 10.00, 21.05,
    '{"comecou_diagnostico": 19, "chegaram_crm_kommo": 16, "qualificados_para_mentoria": 11, "para_downsell": 5, "agendados_diagnostico": 9, "agendados_mentoria": 8, "nomes_qualificados": "Vinícius Almeida\nGabriela Costa\nRafael Monteiro\nLuiza Barros\nMatheus Silva\nNatália Rocha\nThiago Cardoso\nIsabela Cunha\nGustavo Torres\nRenata Dias\nFelipe Barbosa"}'::jsonb
),
-- Quinta 11/12
(
    'campanha', 
    (SELECT id FROM campanhas ORDER BY created_at LIMIT 1 OFFSET 0),
    '2025-12-11', '2025-12-11',
    14200, 52000, 1560, 1020, 52, 45, 10, 520.00, 4000.00,
    7.69, 3.0, 10.00, 0.33, 10.00, 19.23,
    '{"comecou_diagnostico": 16, "chegaram_crm_kommo": 13, "qualificados_para_mentoria": 9, "para_downsell": 4, "agendados_diagnostico": 7, "agendados_mentoria": 6, "nomes_qualificados": "Daniela Melo\nMarcelo Vieira\nPaula Duarte\nLeandro Fonseca\nAdriana Moura\nRodrigo Ramos\nJéssica Castro\nCarlos Correia\nLetícia Teixeira"}'::jsonb
),
-- Sexta 12/12
(
    'campanha', 
    (SELECT id FROM campanhas ORDER BY created_at LIMIT 1 OFFSET 0),
    '2025-12-12', '2025-12-12',
    16200, 60000, 1800, 1180, 60, 52, 13, 600.00, 5200.00,
    8.67, 3.0, 10.00, 0.33, 10.00, 21.67,
    '{"comecou_diagnostico": 21, "chegaram_crm_kommo": 18, "qualificados_para_mentoria": 12, "para_downsell": 6, "agendados_diagnostico": 10, "agendados_mentoria": 9, "nomes_qualificados": "Eduardo Azevedo\nMariana Borges\nVitor Pires\nPriscila Lopes\nRenato Tavares\nSabrina Nogueira\nDaniel Macedo\nCláudia Reis\nMaurício Vaz\nFernanda Cavalcante\nPaulo Braga\nLetícia Andrade"}'::jsonb
),
-- Sábado 13/12
(
    'campanha', 
    (SELECT id FROM campanhas ORDER BY created_at LIMIT 1 OFFSET 0),
    '2025-12-13', '2025-12-13',
    11500, 42000, 1260, 820, 42, 37, 8, 420.00, 3200.00,
    7.62, 3.0, 10.00, 0.33, 10.00, 19.05,
    '{"comecou_diagnostico": 11, "chegaram_crm_kommo": 9, "qualificados_para_mentoria": 7, "para_downsell": 2, "agendados_diagnostico": 5, "agendados_mentoria": 4, "nomes_qualificados": "Alexandre Ferreira\nVanessa Gomes\nLuciano Cardoso\nTalita Mendes\nIgor Soares\nHelena Ribeiro\nGuilherme Castro"}'::jsonb
),
-- Domingo 14/12
(
    'campanha', 
    (SELECT id FROM campanhas ORDER BY created_at LIMIT 1 OFFSET 0),
    '2025-12-14', '2025-12-14',
    10200, 37000, 1110, 720, 37, 32, 7, 370.00, 2800.00,
    7.57, 3.0, 10.00, 0.33, 10.00, 18.92,
    '{"comecou_diagnostico": 10, "chegaram_crm_kommo": 8, "qualificados_para_mentoria": 6, "para_downsell": 2, "agendados_diagnostico": 4, "agendados_mentoria": 3, "nomes_qualificados": "Bianca Lopes\nOtávio Moreira\nCaroline Silveira\nFernando Oliveira\nJuliane Fernandes\nRodrigo Marques"}'::jsonb
);

-- ====================================================================
-- SEMANA 3: 15/12/2025 a 21/12/2025
-- ====================================================================

INSERT INTO metricas (
    tipo, referencia_id, periodo_inicio, periodo_fim,
    alcance, impressoes, cliques, visualizacoes_pagina,
    leads, checkouts, vendas, investimento, faturamento,
    roas, ctr, cpm, cpc, cpl, taxa_conversao,
    detalhe_sdr
) VALUES 
-- Segunda 15/12
(
    'campanha', 
    (SELECT id FROM campanhas ORDER BY created_at LIMIT 1 OFFSET 0),
    '2025-12-15', '2025-12-15',
    13800, 50000, 1500, 980, 50, 43, 10, 500.00, 4000.00,
    8.00, 3.0, 10.00, 0.33, 10.00, 20.00,
    '{"comecou_diagnostico": 15, "chegaram_crm_kommo": 12, "qualificados_para_mentoria": 9, "para_downsell": 3, "agendados_diagnostico": 7, "agendados_mentoria": 6, "nomes_qualificados": "Amanda Gonçalves\nPedro Batista\nLarissa Santos\nBruno Araújo\nThaís Freitas\nCaio Pereira\nMarília Almeida\nDiego Costa\nCamila Monteiro"}'::jsonb
),
-- Terça 16/12
(
    'campanha', 
    (SELECT id FROM campanhas ORDER BY created_at LIMIT 1 OFFSET 0),
    '2025-12-16', '2025-12-16',
    15100, 55000, 1650, 1080, 55, 48, 11, 550.00, 4400.00,
    8.00, 3.0, 10.00, 0.33, 10.00, 20.00,
    '{"comecou_diagnostico": 18, "chegaram_crm_kommo": 15, "qualificados_para_mentoria": 10, "para_downsell": 5, "agendados_diagnostico": 8, "agendados_mentoria": 7, "nomes_qualificados": "Vinícius Barros\nGabriela Silva\nRafael Rocha\nLuiza Cardoso\nMatheus Cunha\nNatália Torres\nThiago Dias\nIsabela Barbosa\nGustavo Correia\nRenata Teixeira"}'::jsonb
),
-- Quarta 17/12
(
    'campanha', 
    (SELECT id FROM campanhas ORDER BY created_at LIMIT 1 OFFSET 0),
    '2025-12-17', '2025-12-17',
    16000, 58000, 1740, 1140, 58, 51, 12, 580.00, 4800.00,
    8.28, 3.0, 10.00, 0.33, 10.00, 20.69,
    '{"comecou_diagnostico": 20, "chegaram_crm_kommo": 17, "qualificados_para_mentoria": 11, "para_downsell": 6, "agendados_diagnostico": 9, "agendados_mentoria": 8, "nomes_qualificados": "Daniela Melo\nMarcelo Vieira\nPaula Duarte\nLeandro Fonseca\nAdriana Moura\nRodrigo Ramos\nJéssica Castro\nCarlos Azevedo\nLetícia Borges\nEduardo Pires\nMariana Lopes"}'::jsonb
),
-- Quinta 18/12
(
    'campanha', 
    (SELECT id FROM campanhas ORDER BY created_at LIMIT 1 OFFSET 0),
    '2025-12-18', '2025-12-18',
    14500, 53000, 1590, 1040, 53, 46, 10, 530.00, 4000.00,
    7.55, 3.0, 10.00, 0.33, 10.00, 18.87,
    '{"comecou_diagnostico": 17, "chegaram_crm_kommo": 14, "qualificados_para_mentoria": 9, "para_downsell": 5, "agendados_diagnostico": 7, "agendados_mentoria": 6, "nomes_qualificados": "Vitor Tavares\nPriscila Nogueira\nRenato Macedo\nSabrina Reis\nDaniel Vaz\nCláudia Cavalcante\nMaurício Braga\nFernanda Andrade\nPaulo Ferreira"}'::jsonb
),
-- Sexta 19/12
(
    'campanha', 
    (SELECT id FROM campanhas ORDER BY created_at LIMIT 1 OFFSET 0),
    '2025-12-19', '2025-12-19',
    16500, 61000, 1830, 1200, 61, 53, 13, 610.00, 5200.00,
    8.52, 3.0, 10.00, 0.33, 10.00, 21.31,
    '{"comecou_diagnostico": 22, "chegaram_crm_kommo": 19, "qualificados_para_mentoria": 12, "para_downsell": 7, "agendados_diagnostico": 10, "agendados_mentoria": 9, "nomes_qualificados": "Alexandre Gomes\nVanessa Cardoso\nLuciano Mendes\nTalita Soares\nIgor Ribeiro\nHelena Castro\nGuilherme Lopes\nBianca Moreira\nOtávio Silveira\nCaroline Oliveira\nFernando Fernandes\nJuliane Marques"}'::jsonb
),
-- Sábado 20/12
(
    'campanha', 
    (SELECT id FROM campanhas ORDER BY created_at LIMIT 1 OFFSET 0),
    '2025-12-20', '2025-12-20',
    12000, 44000, 1320, 860, 44, 38, 8, 440.00, 3200.00,
    7.27, 3.0, 10.00, 0.33, 10.00, 18.18,
    '{"comecou_diagnostico": 12, "chegaram_crm_kommo": 10, "qualificados_para_mentoria": 7, "para_downsell": 3, "agendados_diagnostico": 5, "agendados_mentoria": 4, "nomes_qualificados": "Amanda Gonçalves\nPedro Batista\nLarissa Santos\nBruno Araújo\nThaís Freitas\nCaio Pereira\nMarília Almeida"}'::jsonb
),
-- Domingo 21/12
(
    'campanha', 
    (SELECT id FROM campanhas ORDER BY created_at LIMIT 1 OFFSET 0),
    '2025-12-21', '2025-12-21',
    10500, 38000, 1140, 740, 38, 33, 7, 380.00, 2800.00,
    7.37, 3.0, 10.00, 0.33, 10.00, 18.42,
    '{"comecou_diagnostico": 11, "chegaram_crm_kommo": 9, "qualificados_para_mentoria": 6, "para_downsell": 3, "agendados_diagnostico": 4, "agendados_mentoria": 3, "nomes_qualificados": "Vinícius Barros\nGabriela Silva\nRafael Rocha\nLuiza Cardoso\nMatheus Cunha\nNatália Torres"}'::jsonb
);

-- ====================================================================
-- SEMANA 4: 22/12/2025 a 28/12/2025
-- ====================================================================

INSERT INTO metricas (
    tipo, referencia_id, periodo_inicio, periodo_fim,
    alcance, impressoes, cliques, visualizacoes_pagina,
    leads, checkouts, vendas, investimento, faturamento,
    roas, ctr, cpm, cpc, cpl, taxa_conversao,
    detalhe_sdr
) VALUES 
-- Segunda 22/12
(
    'campanha', 
    (SELECT id FROM campanhas ORDER BY created_at LIMIT 1 OFFSET 0),
    '2025-12-22', '2025-12-22',
    14000, 51000, 1530, 1000, 51, 44, 10, 510.00, 4000.00,
    7.84, 3.0, 10.00, 0.33, 10.00, 19.61,
    '{"comecou_diagnostico": 16, "chegaram_crm_kommo": 13, "qualificados_para_mentoria": 9, "para_downsell": 4, "agendados_diagnostico": 7, "agendados_mentoria": 6, "nomes_qualificados": "Daniela Melo\nMarcelo Vieira\nPaula Duarte\nLeandro Fonseca\nAdriana Moura\nRodrigo Ramos\nJéssica Castro\nCarlos Azevedo\nLetícia Borges"}'::jsonb
),
-- Terça 23/12
(
    'campanha', 
    (SELECT id FROM campanhas ORDER BY created_at LIMIT 1 OFFSET 0),
    '2025-12-23', '2025-12-23',
    15300, 56000, 1680, 1100, 56, 49, 11, 560.00, 4400.00,
    7.86, 3.0, 10.00, 0.33, 10.00, 19.64,
    '{"comecou_diagnostico": 19, "chegaram_crm_kommo": 16, "qualificados_para_mentoria": 10, "para_downsell": 6, "agendados_diagnostico": 8, "agendados_mentoria": 7, "nomes_qualificados": "Vitor Tavares\nPriscila Nogueira\nRenato Macedo\nSabrina Reis\nDaniel Vaz\nCláudia Cavalcante\nMaurício Braga\nFernanda Andrade\nPaulo Ferreira\nAna Paula Lima"}'::jsonb
),
-- Quarta 24/12 (Véspera de Natal - redução)
(
    'campanha', 
    (SELECT id FROM campanhas ORDER BY created_at LIMIT 1 OFFSET 0),
    '2025-12-24', '2025-12-24',
    8500, 31000, 930, 600, 31, 27, 5, 310.00, 2000.00,
    6.45, 3.0, 10.00, 0.33, 10.00, 16.13,
    '{"comecou_diagnostico": 8, "chegaram_crm_kommo": 6, "qualificados_para_mentoria": 4, "para_downsell": 2, "agendados_diagnostico": 3, "agendados_mentoria": 2, "nomes_qualificados": "Alexandre Gomes\nVanessa Cardoso\nLuciano Mendes\nTalita Soares"}'::jsonb
),
-- Quinta 25/12 (Natal - redução significativa)
(
    'campanha', 
    (SELECT id FROM campanhas ORDER BY created_at LIMIT 1 OFFSET 0),
    '2025-12-25', '2025-12-25',
    6000, 22000, 660, 420, 22, 19, 3, 220.00, 1200.00,
    5.45, 3.0, 10.00, 0.33, 10.00, 13.64,
    '{"comecou_diagnostico": 5, "chegaram_crm_kommo": 4, "qualificados_para_mentoria": 3, "para_downsell": 1, "agendados_diagnostico": 2, "agendados_mentoria": 1, "nomes_qualificados": "Igor Ribeiro\nHelena Castro\nGuilherme Lopes"}'::jsonb
),
-- Sexta 26/12
(
    'campanha', 
    (SELECT id FROM campanhas ORDER BY created_at LIMIT 1 OFFSET 0),
    '2025-12-26', '2025-12-26',
    11200, 41000, 1230, 800, 41, 36, 7, 410.00, 2800.00,
    6.83, 3.0, 10.00, 0.33, 10.00, 17.07,
    '{"comecou_diagnostico": 12, "chegaram_crm_kommo": 10, "qualificados_para_mentoria": 6, "para_downsell": 4, "agendados_diagnostico": 5, "agendados_mentoria": 4, "nomes_qualificados": "Bianca Moreira\nOtávio Silveira\nCaroline Oliveira\nFernando Fernandes\nJuliane Marques\nAmanda Gonçalves"}'::jsonb
),
-- Sábado 27/12
(
    'campanha', 
    (SELECT id FROM campanhas ORDER BY created_at LIMIT 1 OFFSET 0),
    '2025-12-27', '2025-12-27',
    10800, 39000, 1170, 760, 39, 34, 7, 390.00, 2800.00,
    7.18, 3.0, 10.00, 0.33, 10.00, 17.95,
    '{"comecou_diagnostico": 11, "chegaram_crm_kommo": 9, "qualificados_para_mentoria": 6, "para_downsell": 3, "agendados_diagnostico": 5, "agendados_mentoria": 4, "nomes_qualificados": "Pedro Batista\nLarissa Santos\nBruno Araújo\nThaís Freitas\nCaio Pereira\nMarília Almeida"}'::jsonb
),
-- Domingo 28/12
(
    'campanha', 
    (SELECT id FROM campanhas ORDER BY created_at LIMIT 1 OFFSET 0),
    '2025-12-28', '2025-12-28',
    9800, 36000, 1080, 700, 36, 31, 6, 360.00, 2400.00,
    6.67, 3.0, 10.00, 0.33, 10.00, 16.67,
    '{"comecou_diagnostico": 10, "chegaram_crm_kommo": 8, "qualificados_para_mentoria": 5, "para_downsell": 3, "agendados_diagnostico": 4, "agendados_mentoria": 3, "nomes_qualificados": "Vinícius Barros\nGabriela Silva\nRafael Rocha\nLuiza Cardoso\nMatheus Cunha"}'::jsonb
);

-- ====================================================================
-- SEMANA 5: 29/12/2025 a 31/12/2025
-- ====================================================================

INSERT INTO metricas (
    tipo, referencia_id, periodo_inicio, periodo_fim,
    alcance, impressoes, cliques, visualizacoes_pagina,
    leads, checkouts, vendas, investimento, faturamento,
    roas, ctr, cpm, cpc, cpl, taxa_conversao,
    detalhe_sdr
) VALUES 
-- Segunda 29/12
(
    'campanha', 
    (SELECT id FROM campanhas ORDER BY created_at LIMIT 1 OFFSET 0),
    '2025-12-29', '2025-12-29',
    12500, 45000, 1350, 880, 45, 39, 8, 450.00, 3200.00,
    7.11, 3.0, 10.00, 0.33, 10.00, 17.78,
    '{"comecou_diagnostico": 13, "chegaram_crm_kommo": 11, "qualificados_para_mentoria": 7, "para_downsell": 4, "agendados_diagnostico": 6, "agendados_mentoria": 5, "nomes_qualificados": "Daniela Melo\nMarcelo Vieira\nPaula Duarte\nLeandro Fonseca\nAdriana Moura\nRodrigo Ramos\nJéssica Castro"}'::jsonb
),
-- Terça 30/12
(
    'campanha', 
    (SELECT id FROM campanhas ORDER BY created_at LIMIT 1 OFFSET 0),
    '2025-12-30', '2025-12-30',
    11800, 43000, 1290, 840, 43, 37, 7, 430.00, 2800.00,
    6.51, 3.0, 10.00, 0.33, 10.00, 16.28,
    '{"comecou_diagnostico": 12, "chegaram_crm_kommo": 10, "qualificados_para_mentoria": 6, "para_downsell": 4, "agendados_diagnostico": 5, "agendados_mentoria": 4, "nomes_qualificados": "Vitor Tavares\nPriscila Nogueira\nRenato Macedo\nSabrina Reis\nDaniel Vaz\nCláudia Cavalcante"}'::jsonb
),
-- Quarta 31/12 (Ano Novo - redução significativa)
(
    'campanha', 
    (SELECT id FROM campanhas ORDER BY created_at LIMIT 1 OFFSET 0),
    '2025-12-31', '2025-12-31',
    7200, 26000, 780, 500, 26, 23, 4, 260.00, 1600.00,
    6.15, 3.0, 10.00, 0.33, 10.00, 15.38,
    '{"comecou_diagnostico": 7, "chegaram_crm_kommo": 5, "qualificados_para_mentoria": 3, "para_downsell": 2, "agendados_diagnostico": 2, "agendados_mentoria": 2, "nomes_qualificados": "Alexandre Gomes\nVanessa Cardoso\nLuciano Mendes"}'::jsonb
);

-- ====================================================================
-- RESUMO DO MÊS DE DEZEMBRO 2025
-- ====================================================================
-- Total de dias com dados: 31
-- Total investimento: ~14.460,00
-- Total leads: ~1.432
-- Total vendas: ~280
-- Média ROAS: ~7.3x
-- Taxa conversão média: ~19%
-- 
-- Dados SDR incluem:
-- - Leads que começaram diagnóstico
-- - Leads que chegaram ao CRM Kommo
-- - Leads qualificados para mentoria
-- - Leads para downsell
-- - Agendamentos para diagnóstico
-- - Agendamentos para mentoria
-- - Nomes dos leads qualificados
-- ====================================================================

-- PARA ADICIONAR MAIS CAMPANHAS:
-- Duplique os blocos acima e substitua:
-- (SELECT id FROM campanhas ORDER BY created_at LIMIT 1 OFFSET 0)
-- Por:
-- (SELECT id FROM campanhas ORDER BY created_at LIMIT 1 OFFSET 1) -- Segunda campanha
-- (SELECT id FROM campanhas ORDER BY created_at LIMIT 1 OFFSET 2) -- Terceira campanha
-- E assim por diante...

-- ====================================================================
-- VERIFICAR DADOS INSERIDOS
-- ====================================================================
-- SELECT 
--   COUNT(*) as total_registros,
--   SUM(investimento) as investimento_total,
--   SUM(leads) as leads_total,
--   SUM(vendas) as vendas_total,
--   AVG(roas) as roas_medio,
--   AVG(taxa_conversao) as taxa_conversao_media
-- FROM metricas
-- WHERE periodo_inicio >= '2025-12-01' AND periodo_fim <= '2025-12-31';

-- ====================================================================
-- LIMPAR DADOS (SE NECESSÁRIO)
-- ====================================================================
-- DELETE FROM metricas WHERE periodo_inicio >= '2025-12-01' AND periodo_fim <= '2025-12-31';
