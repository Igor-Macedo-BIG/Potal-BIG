-- Deletar TODAS as métricas (tráfego, SDR, closer, etc)
DELETE FROM metricas;

-- Verificar se deletou tudo
SELECT COUNT(*) as total_metricas_restantes FROM metricas;

-- Confirmar que está vazio
SELECT * FROM metricas LIMIT 10;
