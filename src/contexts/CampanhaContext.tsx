'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Campanha, MetricasAgregadas } from '@/types/hierarchical';

export interface FiltroData {
  tipo: 'hoje' | 'ontem' | 'semana' | 'mes' | 'mes-passado' | 'trimestre' | 'ano' | 'personalizado';
  dataInicio: string;
  dataFim: string;
}

interface CampanhaContextType {
  campanhaAtiva: Campanha | null;
  metricasCampanha: MetricasAgregadas | null;
  metricasGerais: MetricasAgregadas | null; // Nova propriedade para métricas gerais
  loading: boolean;
  filtroData: FiltroData;
  selecionarCampanha: (campanha: Campanha | null) => void;
  limparSelecao: () => void;
  atualizarFiltroData: (filtro: FiltroData) => void;
  recarregarMetricas: () => void;
}

const CampanhaContext = createContext<CampanhaContextType | undefined>(undefined);

export function useCampanhaContext() {
  const context = useContext(CampanhaContext);
  if (!context) {
    throw new Error('useCampanhaContext deve ser usado dentro do CampanhaProvider');
  }
  return context;
}

interface CampanhaProviderProps {
  children: React.ReactNode;
}

export function CampanhaProvider({ children }: CampanhaProviderProps) {
  const [campanhaAtiva, setCampanhaAtiva] = useState<Campanha | null>(null);
  const [metricasCampanha, setMetricasCampanha] = useState<MetricasAgregadas | null>(null);
  const [metricasGerais, setMetricasGerais] = useState<MetricasAgregadas | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Filtro padrão: carregar de localStorage se disponível, senão usar mês atual
  const [filtroData, setFiltroData] = useState<FiltroData>(() => {
    try {
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem('filtroData');
        if (raw) return JSON.parse(raw) as FiltroData;
      }
    } catch (err) {
      // ignore parse errors
    }
    const hoje = new Date().toISOString().split('T')[0];
    return {
      tipo: 'mes',
      dataInicio: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
      dataFim: hoje
    };
  });

  // Carregar campanha ativa do localStorage se existir
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem('campanhaAtivaId');
        if (raw) {
          // Buscar campanha por id
          (async () => {
            try {
              const { data, error } = await supabase
                .from('campanhas')
                .select('*')
                .eq('id', raw)
                .limit(1)
                .maybeSingle();

              if (error) {
                console.error('Erro ao carregar campanha do localStorage:', error);
                return;
              }

              if (data) {
                setCampanhaAtiva(data as Campanha);
                // carregar métricas para essa campanha já com o filtro atual
                buscarMetricasCampanha((data as Campanha).id);
              }
            } catch (err) {
              console.error('Erro ao buscar campanha por id:', err);
            }
          })();
        }
      }
    } catch (err) {
      // ignore
    }
  }, []);

  // Carregar métricas gerais inicialmente (quando não há campanha selecionada)
  useEffect(() => {
    if (!campanhaAtiva) {
      buscarMetricasGerais();
    }
  }, []);

  const buscarMetricasCampanha = async (campanhaId: string, filtro?: FiltroData) => {
    setLoading(true);
    const filtroAtual = filtro || filtroData;

    try {
      // Registros totalmente contidos dentro do período
      // Obs.: não usamos overlap aqui para evitar dupla contagem (ex.: mês + semana).
      const { data: metricasArray, error } = await supabase
        .from('metricas')
        .select('*')
        .eq('tipo', 'campanha')
        .eq('referencia_id', campanhaId)
        .gte('periodo_inicio', filtroAtual.dataInicio)
        .lte('periodo_fim', filtroAtual.dataFim)
        .order('periodo_inicio', { ascending: true });

      if (error) {
        console.error('Erro ao buscar métricas:', error);
      }

      if (!metricasArray || metricasArray.length === 0) {
        // Sem dados no período: retornar zeros
        setMetricasCampanha({
          alcance: 0,
          impressoes: 0,
          cliques: 0,
          visualizacoes_pagina: 0,
          leads: 0,
          checkouts: 0,
          vendas: 0,
          investimento: 0,
          faturamento: 0,
          roas: 0,
          ctr: 0,
          cpm: 0,
          cpc: 0,
          cpl: 0,
          taxa_conversao: 0
        });
      } else {
        // 1) Se existir um registro exatamente igual ao período, usar ele (consistência com o modal)
        const exata = metricasArray.find((m: any) =>
          String(m.periodo_inicio) === String(filtroAtual.dataInicio) &&
          String(m.periodo_fim) === String(filtroAtual.dataFim)
        );

        const toNumber = (v: any) => (v === null || v === undefined ? 0 : Number(v));

        if (exata) {
          const metricas: MetricasAgregadas = {
            alcance: toNumber(exata.alcance),
            impressoes: toNumber(exata.impressoes),
            cliques: toNumber(exata.cliques),
            visualizacoes_pagina: toNumber(exata.visualizacoes_pagina),
            leads: toNumber(exata.leads),
            checkouts: toNumber(exata.checkouts),
            vendas: toNumber(exata.vendas),
            investimento: toNumber(exata.investimento),
            faturamento: toNumber(exata.faturamento),
            roas: 0,
            ctr: 0,
            cpm: 0,
            cpc: 0,
            cpl: 0,
            taxa_conversao: 0
          };

          metricas.roas = metricas.investimento > 0 ? parseFloat((metricas.faturamento / metricas.investimento).toFixed(2)) : 0;
          metricas.ctr = metricas.impressoes > 0 ? parseFloat(((metricas.cliques / metricas.impressoes) * 100).toFixed(2)) : 0;
          metricas.cpm = metricas.impressoes > 0 ? parseFloat(((metricas.investimento / metricas.impressoes) * 1000).toFixed(2)) : 0;
          metricas.cpc = metricas.cliques > 0 ? parseFloat((metricas.investimento / metricas.cliques).toFixed(2)) : 0;
          metricas.cpl = metricas.leads > 0 ? parseFloat((metricas.investimento / metricas.leads).toFixed(2)) : 0;
          metricas.taxa_conversao = metricas.leads > 0 ? parseFloat(((metricas.vendas / metricas.leads) * 100).toFixed(2)) : 0;

          setMetricasCampanha(metricas);
        } else {
          // 2) Caso contrário, agregar (somar) todos os registros do intervalo
          const metricas: MetricasAgregadas = (metricasArray as any[]).reduce((acc, m) => ({
            alcance: acc.alcance + toNumber(m.alcance),
            impressoes: acc.impressoes + toNumber(m.impressoes),
            cliques: acc.cliques + toNumber(m.cliques),
            visualizacoes_pagina: acc.visualizacoes_pagina + toNumber(m.visualizacoes_pagina),
            leads: acc.leads + toNumber(m.leads),
            checkouts: acc.checkouts + toNumber(m.checkouts),
            vendas: acc.vendas + toNumber(m.vendas),
            investimento: acc.investimento + toNumber(m.investimento),
            faturamento: acc.faturamento + toNumber(m.faturamento),
            roas: 0,
            ctr: 0,
            cpm: 0,
            cpc: 0,
            cpl: 0,
            taxa_conversao: 0
          }), {
            alcance: 0,
            impressoes: 0,
            cliques: 0,
            visualizacoes_pagina: 0,
            leads: 0,
            checkouts: 0,
            vendas: 0,
            investimento: 0,
            faturamento: 0,
            roas: 0,
            ctr: 0,
            cpm: 0,
            cpc: 0,
            cpl: 0,
            taxa_conversao: 0
          });

          // Recalcular métricas derivadas
          metricas.roas = metricas.investimento > 0 ? parseFloat((metricas.faturamento / metricas.investimento).toFixed(2)) : 0;
          metricas.ctr = metricas.impressoes > 0 ? parseFloat(((metricas.cliques / metricas.impressoes) * 100).toFixed(2)) : 0;
          metricas.cpm = metricas.impressoes > 0 ? parseFloat(((metricas.investimento / metricas.impressoes) * 1000).toFixed(2)) : 0;
          metricas.cpc = metricas.cliques > 0 ? parseFloat((metricas.investimento / metricas.cliques).toFixed(2)) : 0;
          metricas.cpl = metricas.leads > 0 ? parseFloat((metricas.investimento / metricas.leads).toFixed(2)) : 0;
          metricas.taxa_conversao = metricas.leads > 0 ? parseFloat(((metricas.vendas / metricas.leads) * 100).toFixed(2)) : 0;

          setMetricasCampanha(metricas);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar métricas da campanha:', error);
    } finally {
      setLoading(false);
    }
  };

  // Nova função para buscar métricas agregadas de todas as campanhas
  const buscarMetricasGerais = async (filtro?: FiltroData) => {
    setLoading(true);
    const filtroAtual = filtro || filtroData;

    console.log('🔍 Buscando métricas gerais:', {
      filtroAtual,
      query: {
        tipo: 'campanha',
        periodo_inicio_gte: filtroAtual.dataInicio,
        periodo_fim_lte: filtroAtual.dataFim
      }
    });

    try {
      // Primeiro, vamos ver TODAS as métricas do banco para entender o que há
      const { data: todasAsMetricas } = await supabase
        .from('metricas')
        .select('referencia_id, periodo_inicio, periodo_fim, investimento, faturamento, leads, vendas')
        .eq('tipo', 'campanha')
        .order('periodo_inicio', { ascending: true });

      console.log('🗃️ TODAS as métricas no banco:', {
        total: todasAsMetricas?.length || 0,
        amostra: todasAsMetricas?.slice(0, 10), // Primeiras 10
        campanhasUnicas: [...new Set(todasAsMetricas?.map(m => m.referencia_id) || [])],
        periodosUnicos: [...new Set(todasAsMetricas?.map(m => `${m.periodo_inicio} - ${m.periodo_fim}`) || [])]
      });

      // Buscar todas as métricas de campanhas no período
      const { data: metricasArray, error } = await supabase
        .from('metricas')
        .select('*')
        .eq('tipo', 'campanha')
        .gte('periodo_inicio', filtroAtual.dataInicio)
        .lte('periodo_fim', filtroAtual.dataFim)
        .order('periodo_inicio', { ascending: true });

      console.log('📊 Métricas encontradas (TODAS as campanhas):', {
        quantidade: metricasArray?.length || 0,
        periodo: `${filtroAtual.dataInicio} até ${filtroAtual.dataFim}`,
        campanhas: [...new Set(metricasArray?.map(m => m.referencia_id) || [])],
        amostraValores: metricasArray?.slice(0, 5).map(m => ({
          campanha: m.referencia_id,
          periodo: `${m.periodo_inicio} - ${m.periodo_fim}`,
          investimento: m.investimento,
          faturamento: m.faturamento,
          leads: m.leads,
          vendas: m.vendas
        }))
      });

      if (error) {
        console.error('Erro ao buscar métricas gerais:', error);
      }

      if (!metricasArray || metricasArray.length === 0) {
        // Sem dados no período: retornar zeros
        setMetricasGerais({
          alcance: 0,
          impressoes: 0,
          cliques: 0,
          visualizacoes_pagina: 0,
          leads: 0,
          checkouts: 0,
          vendas: 0,
          investimento: 0,
          faturamento: 0,
          roas: 0,
          ctr: 0,
          cpm: 0,
          cpc: 0,
          cpl: 0,
          taxa_conversao: 0
        });
      } else {
        // NOVA LÓGICA: Agregar por campanha (evitar duplicatas)
        const toNumber = (v: any) => (v === null || v === undefined ? 0 : Number(v));
        
        // Agrupar métricas por campanha
        const metricasPorCampanha: { [campanhaId: string]: any[] } = {};
        
        (metricasArray as any[]).forEach((m) => {
          if (!metricasPorCampanha[m.referencia_id]) {
            metricasPorCampanha[m.referencia_id] = [];
          }
          metricasPorCampanha[m.referencia_id].push(m);
        });

        console.log('📋 Métricas agrupadas por campanha:', {
          campanhas: Object.keys(metricasPorCampanha),
          detalhes: Object.entries(metricasPorCampanha).map(([id, metrics]) => ({
            campanha: id,
            registros: metrics.length,
            amostra: metrics[0]
          }))
        });

        // Para cada campanha, pegar o registro mais recente ou somar se necessário
        const metricasFinais: any[] = [];
        
        Object.entries(metricasPorCampanha).forEach(([campanhaId, metrics]) => {
          if (metrics.length === 1) {
            // Se só tem um registro, usar ele
            console.log('📊 MÉTRICA ÚNICA DA CAMPANHA:', {
              campanhaId,
              investimento: metrics[0].investimento,
              leads: metrics[0].leads
            });
            metricasFinais.push(metrics[0]);
          } else {
            // Se tem múltiplos, pegar o mais recente ou somar (dependendo da lógica)
            // Por enquanto, vamos somar (pode ser métricas de dias diferentes)
            console.log('📊 AGREGANDO MÚLTIPLAS MÉTRICAS:', {
              campanhaId,
              quantidade: metrics.length,
              investimentos: metrics.map(m => m.investimento)
            });
            
            const metricaAgregada = metrics.reduce((acc, m) => ({
              ...m, // Manter outras propriedades do primeiro registro
              alcance: toNumber(acc.alcance) + toNumber(m.alcance),
              impressoes: toNumber(acc.impressoes) + toNumber(m.impressoes),
              cliques: toNumber(acc.cliques) + toNumber(m.cliques),
              visualizacoes_pagina: toNumber(acc.visualizacoes_pagina) + toNumber(m.visualizacoes_pagina),
              leads: toNumber(acc.leads) + toNumber(m.leads),
              checkouts: toNumber(acc.checkouts) + toNumber(m.checkouts),
              vendas: toNumber(acc.vendas) + toNumber(m.vendas),
              investimento: toNumber(acc.investimento) + toNumber(m.investimento),
              faturamento: toNumber(acc.faturamento) + toNumber(m.faturamento)
            }), metrics[0]);
            
            console.log('📊 RESULTADO DA AGREGAÇÃO:', {
              investimento_final: metricaAgregada.investimento,
              leads_final: metricaAgregada.leads
            });
            
            metricasFinais.push(metricaAgregada);
          }
        });

        console.log('🎯 Métricas finais por campanha:', {
          campanhas: metricasFinais.length,
          valores: metricasFinais.map(m => ({
            campanha: m.referencia_id,
            investimento: m.investimento,
            faturamento: m.faturamento
          }))
        });

        // Agora somar as métricas finais de todas as campanhas
        const metricas: MetricasAgregadas = metricasFinais.reduce((acc, m) => ({
          alcance: acc.alcance + toNumber(m.alcance),
          impressoes: acc.impressoes + toNumber(m.impressoes),
          cliques: acc.cliques + toNumber(m.cliques),
          visualizacoes_pagina: acc.visualizacoes_pagina + toNumber(m.visualizacoes_pagina),
          leads: acc.leads + toNumber(m.leads),
          checkouts: acc.checkouts + toNumber(m.checkouts),
          vendas: acc.vendas + toNumber(m.vendas),
          investimento: acc.investimento + toNumber(m.investimento),
          faturamento: acc.faturamento + toNumber(m.faturamento),
          roas: 0,
          ctr: 0,
          cpm: 0,
          cpc: 0,
          cpl: 0,
          taxa_conversao: 0
        }), {
          alcance: 0,
          impressoes: 0,
          cliques: 0,
          visualizacoes_pagina: 0,
          leads: 0,
          checkouts: 0,
          vendas: 0,
          investimento: 0,
          faturamento: 0,
          roas: 0,
          ctr: 0,
          cpm: 0,
          cpc: 0,
          cpl: 0,
          taxa_conversao: 0
        });

        // Recalcular métricas derivadas
        metricas.roas = metricas.investimento > 0 ? parseFloat((metricas.faturamento / metricas.investimento).toFixed(2)) : 0;
        metricas.ctr = metricas.impressoes > 0 ? parseFloat(((metricas.cliques / metricas.impressoes) * 100).toFixed(2)) : 0;
        metricas.cpm = metricas.impressoes > 0 ? parseFloat(((metricas.investimento / metricas.impressoes) * 1000).toFixed(2)) : 0;
        metricas.cpc = metricas.cliques > 0 ? parseFloat((metricas.investimento / metricas.cliques).toFixed(2)) : 0;
        metricas.cpl = metricas.leads > 0 ? parseFloat((metricas.investimento / metricas.leads).toFixed(2)) : 0;
        metricas.taxa_conversao = metricas.leads > 0 ? parseFloat(((metricas.vendas / metricas.leads) * 100).toFixed(2)) : 0;

        console.log('✅ Métricas gerais calculadas:', {
          investimento: metricas.investimento,
          faturamento: metricas.faturamento,
          roas: metricas.roas,
          leads: metricas.leads,
          vendas: metricas.vendas
        });

        setMetricasGerais(metricas);
      }
    } catch (error) {
      console.error('Erro ao buscar métricas gerais:', error);
    } finally {
      setLoading(false);
    }
  };

  const selecionarCampanha = (campanha: Campanha | null) => {
    setCampanhaAtiva(campanha);
    try {
      if (typeof window !== 'undefined') {
        if (campanha) localStorage.setItem('campanhaAtivaId', campanha.id);
        else localStorage.removeItem('campanhaAtivaId');
      }
    } catch (err) {
      console.warn('Não foi possível salvar campanhaAtiva no localStorage', err);
    }
    if (campanha) {
      buscarMetricasCampanha(campanha.id);
    } else {
      setMetricasCampanha(null);
      // Quando não há campanha selecionada, buscar métricas gerais
      buscarMetricasGerais();
    }
  };

  const limparSelecao = () => {
    setCampanhaAtiva(null);
    setMetricasCampanha(null);
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('campanhaAtivaId');
      }
    } catch (err) {
      // ignore
    }
  };

  const atualizarFiltroData = (novoFiltro: FiltroData) => {
    setFiltroData(novoFiltro);
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('filtroData', JSON.stringify(novoFiltro));
      }
    } catch (err) {
      console.warn('Não foi possível salvar filtro no localStorage', err);
    }
    // Se há campanha ativa, recarregar com novo filtro
    if (campanhaAtiva) {
      buscarMetricasCampanha(campanhaAtiva.id, novoFiltro);
    } else {
      // Se não há campanha ativa, atualizar métricas gerais
      buscarMetricasGerais(novoFiltro);
    }
  };

  const recarregarMetricas = () => {
    if (campanhaAtiva) {
      buscarMetricasCampanha(campanhaAtiva.id);
    } else {
      buscarMetricasGerais();
    }
  };

  return (
    <CampanhaContext.Provider
      value={{
        campanhaAtiva,
        metricasCampanha,
        metricasGerais,
        loading,
        filtroData,
        selecionarCampanha,
        limparSelecao,
        atualizarFiltroData,
        recarregarMetricas,
      }}
    >
      {children}
    </CampanhaContext.Provider>
  );
}