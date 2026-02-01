'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Campanha, MetricasAgregadas } from '@/types/hierarchical';
import { useCliente } from './ClienteContext';

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
  filtroHierarquico: { tipo: 'funil' | 'campanha' | 'publico' | 'criativo' | null; id: string | null } | null;
  selecionarCampanha: (campanha: Campanha | null) => void;
  limparSelecao: () => void;
  limparMetricasCampanha: () => void;
  atualizarFiltroData: (filtro: FiltroData) => void;
  recarregarMetricas: () => void;
  buscarMetricasPorFunil: (funilId: string, filtro?: FiltroData) => Promise<void>;
  buscarMetricasPorPublico: (publicoId: string, filtro?: FiltroData) => Promise<void>;
  buscarMetricasPorCriativo: (criativoId: string, filtro?: FiltroData) => Promise<void>;
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
  const { clienteSelecionado } = useCliente();
  const [campanhaAtiva, setCampanhaAtiva] = useState<Campanha | null>(null);
  const [metricasCampanha, setMetricasCampanha] = useState<MetricasAgregadas | null>(null);
  const [metricasGerais, setMetricasGerais] = useState<MetricasAgregadas | null>(null);
  const [loading, setLoading] = useState(false);
  const [filtroHierarquico, setFiltroHierarquico] = useState<{ tipo: 'funil' | 'campanha' | 'publico' | 'criativo' | null; id: string | null } | null>(null);
  
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
    if (!clienteSelecionado) {
      console.log(' Nenhum cliente selecionado - limpando dados');
      setCampanhaAtiva(null);
      setMetricasCampanha(null);
      setMetricasGerais(null);
      return;
    }

    console.log(' Filtrando por cliente:', clienteSelecionado?.nome);

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
                .eq('cliente_id', clienteSelecionado.id)
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
  // E recarregar quando o cliente selecionado mudar
  useEffect(() => {
    // LIMPAR campanha ativa e suas métricas ao mudar de cliente
    setCampanhaAtiva(null);
    setMetricasCampanha(null);
    

    // Recarregar métricas SOMENTE se houver cliente
    if (clienteSelecionado) {
      buscarMetricasGerais();
    } else {
      setMetricasGerais({
        investimento: 0,
        faturamento: 0,
        roas: 0,
        leads: 0,
        vendas: 0,
        alcance: 0,
        impressoes: 0,
        cliques: 0,
        visualizacoes_pagina: 0,
        checkouts: 0,
        ctr: 0,
        cpm: 0,
        cpc: 0,
        cpl: 0,
        taxa_conversao: 0
      });
    }
  }, [clienteSelecionado]);

  const buscarMetricasCampanha = async (campanhaId: string, filtro?: FiltroData) => {
    setLoading(true);
    const filtroAtual = filtro || filtroData;

    console.log('🔍 BUSCANDO MÉTRICAS DA CAMPANHA:', {
      campanhaId,
      filtroDataInicio: filtroAtual.dataInicio,
      filtroDataFim: filtroAtual.dataFim,
      tipo: 'campanha'
    });

    try {
      // Buscar públicos da campanha
      const { data: publicosCampanha } = await supabase
        .from('conjuntos_anuncio')
        .select('id')
        .eq('campanha_id', campanhaId);

      const publicoIds = publicosCampanha?.map(p => p.id) || [];

      // Buscar criativos dos públicos
      const { data: criativosCampanha } = await supabase
        .from('anuncios')
        .select('id')
        .in('conjunto_anuncio_id', publicoIds);

      const criativoIds = criativosCampanha?.map(c => c.id) || [];

      // Buscar métricas de TODOS os níveis: campanha, públicos e criativos
      const queries = [];
      
      // Métricas da própria campanha
      queries.push(
        supabase
          .from('metricas')
          .select('*')
          .eq('tipo', 'campanha')
          .eq('referencia_id', campanhaId)
          .gte('periodo_inicio', filtroAtual.dataInicio)
          .lte('periodo_inicio', filtroAtual.dataFim)
      );
      
      // Métricas dos públicos
      if (publicoIds.length > 0) {
        queries.push(
          supabase
            .from('metricas')
            .select('*')
            .eq('tipo', 'publico')
            .in('referencia_id', publicoIds)
            .gte('periodo_inicio', filtroAtual.dataInicio)
            .lte('periodo_inicio', filtroAtual.dataFim)
        );
      }
      
      // Métricas dos criativos
      if (criativoIds.length > 0) {
        queries.push(
          supabase
            .from('metricas')
            .select('*')
            .eq('tipo', 'criativo')
            .in('referencia_id', criativoIds)
            .gte('periodo_inicio', filtroAtual.dataInicio)
            .lte('periodo_inicio', filtroAtual.dataFim)
        );
      }

      // Executar todas as queries em paralelo
      const results = await Promise.all(queries);
      
      // Combinar todos os resultados
      const metricasArray = results.flatMap(result => result.data || []);
      const error = results.find(result => result.error)?.error;

      console.log('📊 RESULTADO DA BUSCA (TODOS os níveis):', {
        total: metricasArray.length,
        campanha: metricasArray.filter(m => m.tipo === 'campanha').length,
        publicos: metricasArray.filter(m => m.tipo === 'publico').length,
        criativos: metricasArray.filter(m => m.tipo === 'criativo').length
      });

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
      
      // Marcar que estamos filtrando por campanha
      setFiltroHierarquico({ tipo: 'campanha', id: campanhaId });
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
        periodo_inicio_gte: filtroAtual.dataInicio,
        periodo_inicio_lte: filtroAtual.dataFim
      }
    });

    try {
      // Construir queries com filtro de cliente
      let queryFunis = supabase
        .from('metricas')
        .select('*')
        .eq('tipo', 'funil')
        .gte('periodo_inicio', filtroAtual.dataInicio)
        .lte('periodo_inicio', filtroAtual.dataFim);
      
      let queryCampanhas = supabase
        .from('metricas')
        .select('*')
        .eq('tipo', 'campanha')
        .gte('periodo_inicio', filtroAtual.dataInicio)
        .lte('periodo_inicio', filtroAtual.dataFim);
      
      let queryPublicos = supabase
        .from('metricas')
        .select('*')
        .eq('tipo', 'publico')
        .gte('periodo_inicio', filtroAtual.dataInicio)
        .lte('periodo_inicio', filtroAtual.dataFim);
      
      let queryCriativos = supabase
        .from('metricas')
        .select('*')
        .eq('tipo', 'criativo')
        .gte('periodo_inicio', filtroAtual.dataInicio)
        .lte('periodo_inicio', filtroAtual.dataFim);
      
      // Adicionar filtro de cliente se houver um selecionado
      if (clienteSelecionado) {
        console.log('✅ Filtrando métricas por cliente:', clienteSelecionado.nome, '| ID:', clienteSelecionado.id);
        queryFunis = queryFunis.eq('cliente_id', clienteSelecionado.id);
        queryCampanhas = queryCampanhas.eq('cliente_id', clienteSelecionado.id);
        queryPublicos = queryPublicos.eq('cliente_id', clienteSelecionado.id);
        queryCriativos = queryCriativos.eq('cliente_id', clienteSelecionado.id);
      } else {
        console.warn('⚠️ NENHUM CLIENTE SELECIONADO - Buscando todas as métricas (pode estar errado!)');
      }

      const queries = [queryFunis, queryCampanhas, queryPublicos, queryCriativos];
      // Executar todas as queries em paralelo
      const results = await Promise.all(queries);
      
      // Combinar todos os resultados
      const metricasArray = results.flatMap(result => result.data || []);
      const error = results.find(result => result.error)?.error;

      console.log('📊 Métricas encontradas (TODOS os níveis):', {
        total: metricasArray.length,
        funil: metricasArray.filter(m => m.tipo === 'funil').length,
        campanhas: metricasArray.filter(m => m.tipo === 'campanha').length,
        publicos: metricasArray.filter(m => m.tipo === 'publico').length,
        criativos: metricasArray.filter(m => m.tipo === 'criativo').length,
        periodo: `${filtroAtual.dataInicio} até ${filtroAtual.dataFim}`,
        amostras: metricasArray.slice(0, 3).map(m => ({
          tipo: m.tipo,
          periodo_inicio: m.periodo_inicio,
          periodo_fim: m.periodo_fim,
          investimento: m.investimento
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
        // Somar TODAS as métricas diretamente (não agrupar por referencia_id)
        const toNumber = (v: any) => (v === null || v === undefined ? 0 : Number(v));

        console.log('📊 Somando todas as métricas diretamente:', {
          total: metricasArray.length,
          amostra: metricasArray.slice(0, 3).map(m => ({
            tipo: m.tipo,
            investimento: m.investimento,
            referencia_id: m.referencia_id?.substring(0, 8)
          }))
        });

        // Somar tudo diretamente
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

        console.log('✅ Métricas gerais calculadas:', {
          investimento: metricas.investimento,
          faturamento: metricas.faturamento,
          roas: metricas.roas,
          leads: metricas.leads,
          vendas: metricas.vendas
        });

        setMetricasGerais(metricas);
      }
      
      // Marcar que estamos vendo métricas gerais (sem filtro hierárquico)
      setFiltroHierarquico(null);
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

  const limparMetricasCampanha = () => {
    setMetricasCampanha(null);
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

  // Nova função para buscar métricas agregadas de um funil específico
  const buscarMetricasPorFunil = async (funilId: string, filtro?: FiltroData) => {
    setLoading(true);
    const filtroAtual = filtro || filtroData;

    console.log('🔍 BUSCANDO MÉTRICAS DO FUNIL:', {
      funilId,
      filtroDataInicio: filtroAtual.dataInicio,
      filtroDataFim: filtroAtual.dataFim
    });

    try {
      console.log('🔍 Buscando métricas do funil:', funilId);
      
      // Primeiro, buscar todas as campanhas do funil
      const { data: campanhasFunil, error: errorCampanhas } = await supabase
        .from('campanhas')
        .select('id')
        .eq('funil_id', funilId);

      if (errorCampanhas) {
        console.error('Erro ao buscar campanhas do funil:', errorCampanhas);
        setLoading(false);
        return;
      }

      if (!campanhasFunil || campanhasFunil.length === 0) {
        console.log('⚠️ Nenhuma campanha encontrada para o funil:', funilId);
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
        setLoading(false);
        return;
      }

      const campanhaIds = campanhasFunil.map(c => c.id);
      console.log('📋 Campanhas do funil:', campanhaIds);

      // Buscar públicos (conjuntos_anuncio) das campanhas
      const { data: publicosFunil, error: errorPublicos } = await supabase
        .from('conjuntos_anuncio')
        .select('id')
        .in('campanha_id', campanhaIds);

      const publicoIds = publicosFunil?.map(p => p.id) || [];
      console.log('📋 Públicos do funil:', publicoIds.length);

      // Buscar criativos (anuncios) dos públicos
      const { data: criativosFunil, error: errorCriativos } = await supabase
        .from('anuncios')
        .select('id')
        .in('conjunto_anuncio_id', publicoIds);

      const criativoIds = criativosFunil?.map(c => c.id) || [];
      console.log('📋 Criativos do funil:', criativoIds.length);

      // Buscar métricas de TODOS os níveis: funil, campanhas, públicos e criativos
      const queries = [];
      
      // Métricas do próprio funil
      queries.push(
        supabase
          .from('metricas')
          .select('*')
          .eq('tipo', 'funil')
          .eq('referencia_id', funilId)
          .gte('periodo_inicio', filtroAtual.dataInicio)
          .lte('periodo_inicio', filtroAtual.dataFim)
      );
      
      // Métricas das campanhas
      if (campanhaIds.length > 0) {
        queries.push(
          supabase
            .from('metricas')
            .select('*')
            .eq('tipo', 'campanha')
            .in('referencia_id', campanhaIds)
            .gte('periodo_inicio', filtroAtual.dataInicio)
            .lte('periodo_inicio', filtroAtual.dataFim)
        );
      }
      
      // Métricas dos públicos
      if (publicoIds.length > 0) {
        queries.push(
          supabase
            .from('metricas')
            .select('*')
            .eq('tipo', 'publico')
            .in('referencia_id', publicoIds)
            .gte('periodo_inicio', filtroAtual.dataInicio)
            .lte('periodo_inicio', filtroAtual.dataFim)
        );
      }
      
      // Métricas dos criativos
      if (criativoIds.length > 0) {
        queries.push(
          supabase
            .from('metricas')
            .select('*')
            .eq('tipo', 'criativo')
            .in('referencia_id', criativoIds)
            .gte('periodo_inicio', filtroAtual.dataInicio)
            .lte('periodo_inicio', filtroAtual.dataFim)
        );
      }

      // Executar todas as queries em paralelo
      const results = await Promise.all(queries);
      
      // Combinar todos os resultados
      const metricasArray = results.flatMap(result => result.data || []);
      const errorMetricas = results.find(result => result.error)?.error;

      console.log('📊 Métricas encontradas (TODOS os níveis):', {
        total: metricasArray.length,
        funil: metricasArray.filter(m => m.tipo === 'funil').length,
        campanhas: metricasArray.filter(m => m.tipo === 'campanha').length,
        publicos: metricasArray.filter(m => m.tipo === 'publico').length,
        criativos: metricasArray.filter(m => m.tipo === 'criativo').length
      });

      if (errorMetricas) {
        console.error('Erro ao buscar métricas do funil:', errorMetricas);
        setLoading(false);
        return;
      }

      console.log('📊 Métricas encontradas do funil:', {
        quantidade: metricasArray?.length || 0,
        campanhas: [...new Set(metricasArray?.map(m => m.referencia_id) || [])]
      });

      if (!metricasArray || metricasArray.length === 0) {
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
        // Agregar todas as métricas
        const toNumber = (v: any) => (v === null || v === undefined ? 0 : Number(v));
        
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

        console.log('✅ Métricas agregadas do funil:', metricas);
        setMetricasGerais(metricas);
      }
      
      // Marcar que estamos filtrando por funil
      setFiltroHierarquico({ tipo: 'funil', id: funilId });
    } catch (error) {
      console.error('Erro ao buscar métricas por funil:', error);
    } finally {
      setLoading(false);
    }
  };

  // Nova função para buscar métricas de um público (conjunto) específico
  const buscarMetricasPorPublico = async (publicoId: string, filtro?: FiltroData) => {
    setLoading(true);
    const filtroAtual = filtro || filtroData;

    try {
      console.log('🔍 Buscando métricas do público:', publicoId);
      console.log('📅 Filtro de data:', filtroAtual);
      
      // Buscar criativos do público
      const { data: criativosPublico } = await supabase
        .from('anuncios')
        .select('id')
        .eq('conjunto_anuncio_id', publicoId);

      const criativoIds = criativosPublico?.map(c => c.id) || [];
      console.log('📋 Criativos do público:', criativoIds.length);

      // Buscar métricas do público E dos criativos
      const queries = [];
      
      // Métricas do próprio público
      queries.push(
        supabase
          .from('metricas')
          .select('*')
          .eq('tipo', 'publico')
          .eq('referencia_id', publicoId)
          .gte('periodo_inicio', filtroAtual.dataInicio)
          .lte('periodo_inicio', filtroAtual.dataFim)
      );
      
      // Métricas dos criativos
      if (criativoIds.length > 0) {
        queries.push(
          supabase
            .from('metricas')
            .select('*')
            .eq('tipo', 'criativo')
            .in('referencia_id', criativoIds)
            .gte('periodo_inicio', filtroAtual.dataInicio)
            .lte('periodo_inicio', filtroAtual.dataFim)
        );
      }

      // Executar queries em paralelo
      const results = await Promise.all(queries);
      const metricasArray = results.flatMap(result => result.data || []);
      const error = results.find(result => result.error)?.error;

      console.log('📊 Métricas encontradas (TODOS os níveis):', {
        total: metricasArray.length,
        publico: metricasArray.filter(m => m.tipo === 'publico').length,
        criativos: metricasArray.filter(m => m.tipo === 'criativo').length
      });

      if (error) {
        console.error('❌ Erro ao buscar métricas do público:', error);
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
        setLoading(false);
        return;
      }

      if (!metricasArray || metricasArray.length === 0) {
        console.warn('⚠️ Nenhuma métrica encontrada para o público:', publicoId);
        console.warn('Execute o script seed_janeiro_2026_PUBLICO.sql para inserir dados');
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
        // Agregar métricas
        const toNumber = (v: any) => (v === null || v === undefined ? 0 : Number(v));
        
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

        console.log('✅ Métricas agregadas do público:', metricas);
        setMetricasGerais(metricas);
      }
      
      // Marcar que estamos filtrando por público
      setFiltroHierarquico({ tipo: 'publico', id: publicoId });
    } catch (error) {
      console.error('Erro ao buscar métricas por público:', error);
    } finally {
      setLoading(false);
    }
  };

  // Nova função para buscar métricas de um criativo (anúncio) específico
  const buscarMetricasPorCriativo = async (criativoId: string, filtro?: FiltroData) => {
    setLoading(true);
    const filtroAtual = filtro || filtroData;

    try {
      console.log('🔍 Buscando métricas do criativo:', criativoId);
      console.log('📅 Filtro de data:', filtroAtual);
      
      // Buscar métricas do criativo (tipo='criativo')
      const { data: metricasArray, error } = await supabase
        .from('metricas')
        .select('*')
        .eq('tipo', 'criativo')
        .eq('referencia_id', criativoId)
        .gte('periodo_inicio', filtroAtual.dataInicio)
        .lte('periodo_inicio', filtroAtual.dataFim)
        .order('periodo_inicio', { ascending: true });

      console.log('📊 Métricas encontradas do criativo:', {
        total: metricasArray?.length || 0,
        criativos: metricasArray?.filter(m => m.tipo === 'criativo').length
      });

      if (error) {
        console.error('❌ Erro ao buscar métricas do criativo:', error);
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
        setLoading(false);
        return;
      }

      if (!metricasArray || metricasArray.length === 0) {
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
        // Agregar métricas
        const toNumber = (v: any) => (v === null || v === undefined ? 0 : Number(v));
        
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

        console.log('✅ Métricas agregadas do criativo:', metricas);
        setMetricasGerais(metricas);
      }
      
      // Marcar que estamos filtrando por criativo
      setFiltroHierarquico({ tipo: 'criativo', id: criativoId });
    } catch (error) {
      console.error('Erro ao buscar métricas por criativo:', error);
    } finally {
      setLoading(false);
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
        filtroHierarquico,
        selecionarCampanha,
        limparSelecao,
        limparMetricasCampanha,
        atualizarFiltroData,
        recarregarMetricas,
        buscarMetricasPorFunil,
        buscarMetricasPorPublico,
        buscarMetricasPorCriativo,
      }}
    >
      {children}
    </CampanhaContext.Provider>
  );
}
