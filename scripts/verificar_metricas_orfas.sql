-- =============================================
-- Script: Verificar Métricas Órfãs
-- Identifica métricas que não estão vinculadas
-- corretamente à hierarquia de funis
-- =============================================

-- 1. Métricas de CAMPANHA sem campanha correspondente
SELECT 
  '❌ CAMPANHAS ÓRFÃS' as problema,
  COUNT(*) as total,
  SUM(investimento) as investimento_total,
  SUM(leads) as leads_total
FROM metricas m
WHERE m.tipo = 'campanha'
  AND NOT EXISTS (
    SELECT 1 FROM campanhas c WHERE c.id = m.referencia_id
  );

-- 2. Métricas de PÚBLICO sem público correspondente
SELECT 
  '❌ PÚBLICOS ÓRFÃOS' as problema,
  COUNT(*) as total,
  SUM(investimento) as investimento_total,
  SUM(leads) as leads_total
FROM metricas m
WHERE m.tipo = 'publico'
  AND NOT EXISTS (
    SELECT 1 FROM conjuntos_anuncio ca WHERE ca.id = m.referencia_id
  );

-- 3. Métricas de CRIATIVO sem criativo correspondente
SELECT 
  '❌ CRIATIVOS ÓRFÃOS' as problema,
  COUNT(*) as total,
  SUM(investimento) as investimento_total,
  SUM(leads) as leads_total
FROM metricas m
WHERE m.tipo = 'criativo'
  AND NOT EXISTS (
    SELECT 1 FROM anuncios a WHERE a.id = m.referencia_id
  );

-- 4. Campanhas sem funil
SELECT 
  '❌ CAMPANHAS SEM FUNIL' as problema,
  COUNT(DISTINCT c.id) as total_campanhas,
  SUM(m.investimento) as investimento_total,
  SUM(m.leads) as leads_total
FROM campanhas c
LEFT JOIN metricas m ON m.tipo = 'campanha' AND m.referencia_id = c.id
WHERE c.funil_id IS NULL;

-- 5. Métricas de campanhas que não têm funil
SELECT 
  '❌ MÉTRICAS DE CAMPANHAS SEM FUNIL' as problema,
  COUNT(*) as total,
  SUM(m.investimento) as investimento_total,
  SUM(m.leads) as leads_total
FROM metricas m
WHERE m.tipo = 'campanha'
  AND EXISTS (
    SELECT 1 FROM campanhas c 
    WHERE c.id = m.referencia_id 
      AND c.funil_id IS NULL
  );

-- 6. Públicos sem campanha
SELECT 
  '❌ PÚBLICOS SEM CAMPANHA' as problema,
  COUNT(DISTINCT ca.id) as total_publicos,
  SUM(m.investimento) as investimento_total,
  SUM(m.leads) as leads_total
FROM conjuntos_anuncio ca
LEFT JOIN metricas m ON m.tipo = 'publico' AND m.referencia_id = ca.id
WHERE ca.campanha_id IS NULL;

-- 7. Resumo geral de métricas por tipo
SELECT 
  '📊 RESUMO GERAL' as info,
  tipo,
  COUNT(*) as total_registros,
  TO_CHAR(SUM(investimento), 'R$ 999,999.99') as investimento,
  SUM(leads) as leads
FROM metricas
GROUP BY tipo
ORDER BY tipo;

-- 8. Listar IDs específicos de métricas órfãs de campanha (primeiros 10)
SELECT 
  '🔍 DETALHES - Campanhas órfãs' as info,
  m.id as metrica_id,
  m.referencia_id as campanha_id_inexistente,
  m.periodo_inicio,
  m.periodo_fim,
  m.investimento,
  m.leads
FROM metricas m
WHERE m.tipo = 'campanha'
  AND NOT EXISTS (
    SELECT 1 FROM campanhas c WHERE c.id = m.referencia_id
  )
LIMIT 10;
