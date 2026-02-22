-- =============================================
-- FIX: Limpar metricas de periodo largo do Typebot antigo
-- e vincular ao funil. Executar no Supabase SQL Editor.
-- =============================================

-- 1. Adicionar coluna funil_id (se nao existe)
ALTER TABLE integracoes_typebot ADD COLUMN IF NOT EXISTS funil_id UUID REFERENCES funis(id) ON DELETE SET NULL;

-- 2. Vincular integracao ao funil Aplicacao (se ainda nao vinculou)
UPDATE integracoes_typebot 
SET funil_id = (
    SELECT f.id FROM funis f 
    WHERE f.empresa_id = integracoes_typebot.empresa_id 
    AND f.nome ILIKE '%aplica%'
    LIMIT 1
),
updated_at = NOW()
WHERE funil_id IS NULL;

-- 3. Confirmar vinculo
SELECT it.id, it.nome, it.funil_id, f.nome as funil_nome
FROM integracoes_typebot it
LEFT JOIN funis f ON f.id = it.funil_id;

-- 4. DELETAR metricas de funil com periodo largo (onde periodo_inicio != periodo_fim)
--    que tem detalhe_sdr do Typebot. Essas sao as que causam dupla contagem.
--    O novo sync grava 1 linha por dia (inicio = fim).
DELETE FROM metricas 
WHERE tipo = 'funil'
AND detalhe_sdr IS NOT NULL
AND periodo_inicio != periodo_fim;

-- 5. Verificar o que sobrou (deve estar limpo ou com linhas diarias apenas)
SELECT m.id, m.tipo, m.referencia_id, m.periodo_inicio, m.periodo_fim, 
       m.detalhe_sdr->>'comecou_diagnostico' as comecou,
       m.detalhe_sdr->>'chegaram_crm_kommo' as chegaram,
       m.detalhe_sdr->>'nomes_qualificados' as nomes_q,
       f.nome as funil_nome
FROM metricas m
LEFT JOIN funis f ON f.id = m.referencia_id AND m.tipo = 'funil'
WHERE m.detalhe_sdr IS NOT NULL
ORDER BY m.periodo_inicio DESC;

-- =============================================
-- PRONTO! Agora sincronize novamente no painel.
-- O sync agora grava 1 linha por dia (igual a Meta).
-- Nao importa se sincroniza semana ou mes: sem duplicar.
-- =============================================
