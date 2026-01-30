'use client';

import { useCampanhaContext } from '@/contexts/CampanhaContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Eye, MousePointer, ExternalLink, UserCheck, ShoppingCart, Crown, Target, ArrowRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface FunilEtapa {
  id: string;
  nome: string;
  valor: number;
  valorAnterior?: number;
  icone: React.ComponentType<any>;
  cor: string;
  corFundo: string;
  taxaConversao?: number;
  taxaConversaoAnterior?: number;
  isKPI?: boolean;
}

interface MetricasAnterior {
  impressoes?: number;
  alcance?: number;
  cliques?: number;
  visualizacoes_pagina?: number;
  leads?: number;
  checkouts?: number;
  vendas?: number;
}

export function FunilConversao() {
  const { metricasCampanha, metricasGerais, campanhaAtiva, filtroData, filtroHierarquico } = useCampanhaContext();
  const [metricasAnterior, setMetricasAnterior] = useState<MetricasAnterior | null>(null);
  
  // Usar metricasCampanha se disponível, senão usar metricasGerais
  const metricasParaExibir = metricasCampanha || metricasGerais;

  // Função para calcular período anterior
  const calcularPeriodoAnterior = () => {
    if (!filtroData) {
      console.log('⚠️ Sem filtroData - usando mês anterior ao mês atual');
      // Se não há filtro, buscar mês anterior ao mês atual
      const hoje = new Date();
      const primeiroDiaMesAtual = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      
      // Mês anterior
      const mesAnterior = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
      const ultimoDiaMesAnterior = new Date(hoje.getFullYear(), hoje.getMonth(), 0);

      const resultado = {
        dataInicio: mesAnterior.toISOString().split('T')[0],
        dataFim: ultimoDiaMesAnterior.toISOString().split('T')[0]
      };

      console.log('📅 Período anterior calculado (sem filtro):', resultado);
      return resultado;
    }

    const inicio = new Date(filtroData.dataInicio);
    const fim = new Date(filtroData.dataFim);
    const diffDias = Math.ceil((fim.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const inicioAnterior = new Date(inicio);
    inicioAnterior.setDate(inicio.getDate() - diffDias);
    
    const fimAnterior = new Date(inicio);
    fimAnterior.setDate(inicio.getDate() - 1);

    const resultado = {
      dataInicio: inicioAnterior.toISOString().split('T')[0],
      dataFim: fimAnterior.toISOString().split('T')[0]
    };

    console.log('📅 Cálculo do período anterior:', {
      periodoAtual: {
        inicio: filtroData.dataInicio,
        fim: filtroData.dataFim,
        dias: diffDias
      },
      periodoAnterior: resultado,
      diasAnterior: diffDias
    });

    return resultado;
  };

  // Buscar métricas do período anterior
  const buscarMetricasAnterior = async () => {
    console.log('🔍 buscarMetricasAnterior chamado:', {
      filtroHierarquico,
      campanhaAtiva: campanhaAtiva?.id,
      filtroData
    });
    
    const periodoAnterior = calcularPeriodoAnterior();
    if (!periodoAnterior) return;

    // Se não há filtro hierárquico E não há campanha, buscar TODAS as métricas gerais
    if (!filtroHierarquico && !campanhaAtiva?.id) {
      console.log('🔍 Buscando métricas GERAIS do período anterior (sem filtro específico):', {
        periodoAnterior,
        periodoAtual: filtroData
      });

      try {
        // Buscar TODAS as métricas do período anterior
        const { data: metricasArray, error } = await supabase
          .from('metricas')
          .select('*')
          .gte('periodo_inicio', periodoAnterior.dataInicio)
          .lte('periodo_fim', periodoAnterior.dataFim);

        console.log('📊 Métricas gerais anteriores encontradas:', {
          total: metricasArray?.length || 0
        });

        if (error) {
          console.error('Erro ao buscar métricas gerais anteriores:', error);
          return;
        }

        if (metricasArray && metricasArray.length > 0) {
          const metricas = metricasArray.reduce((acc, metrica) => ({
            impressoes: (acc.impressoes || 0) + (metrica.impressoes || 0),
            alcance: (acc.alcance || 0) + (metrica.alcance || 0),
            cliques: (acc.cliques || 0) + (metrica.cliques || 0),
            visualizacoes_pagina: (acc.visualizacoes_pagina || 0) + (metrica.visualizacoes_pagina || 0),
            leads: (acc.leads || 0) + (metrica.leads || 0),
            checkouts: (acc.checkouts || 0) + (metrica.checkouts || 0),
            vendas: (acc.vendas || 0) + (metrica.vendas || 0),
          }), {} as MetricasAnterior);

          console.log('✅ Métricas gerais agregadas do período anterior:', metricas);
          setMetricasAnterior(metricas);
        } else {
          console.log('⚠️ Nenhuma métrica geral encontrada no período anterior');
          setMetricasAnterior(null);
        }
      } catch (error) {
        console.error('Erro ao buscar métricas gerais anteriores:', error);
        setMetricasAnterior(null);
      }
      return;
    }

    // Determinar tipo e id da referência (para filtros específicos)
    const tipo = filtroHierarquico?.tipo || 'campanha';
    const referenciaId = filtroHierarquico?.id || campanhaAtiva?.id;

    if (!referenciaId) {
      console.log('⚠️ Sem ID de referência para buscar métricas anteriores');
      return;
    }

    console.log('🔍 Buscando métricas anteriores (filtro específico):', {
      tipo,
      referenciaId,
      periodoAnterior,
      periodoAtual: filtroData
    });

    try {
      // BUSCAR HIERARQUIA COMPLETA (igual ao período atual)
      let queries: any[] = [];
      
      if (tipo === 'funil') {
        // Buscar campanhas do funil
        const { data: campanhas } = await supabase
          .from('campanhas')
          .select('id')
          .eq('funil_id', referenciaId);
        const campanhaIds = campanhas?.map(c => c.id) || [];
        
        // Buscar públicos das campanhas
        const { data: publicos } = await supabase
          .from('conjuntos_anuncio')
          .select('id')
          .in('campanha_id', campanhaIds);
        const publicoIds = publicos?.map(p => p.id) || [];
        
        // Buscar criativos dos públicos
        const { data: criativos } = await supabase
          .from('anuncios')
          .select('id')
          .in('conjunto_anuncio_id', publicoIds);
        const criativoIds = criativos?.map(cr => cr.id) || [];
        
        queries = [
          supabase.from('metricas').select('*').eq('tipo', 'funil').eq('referencia_id', referenciaId).gte('periodo_inicio', periodoAnterior.dataInicio).lte('periodo_fim', periodoAnterior.dataFim),
          ...(campanhaIds.length > 0 ? [supabase.from('metricas').select('*').eq('tipo', 'campanha').in('referencia_id', campanhaIds).gte('periodo_inicio', periodoAnterior.dataInicio).lte('periodo_fim', periodoAnterior.dataFim)] : []),
          ...(publicoIds.length > 0 ? [supabase.from('metricas').select('*').eq('tipo', 'publico').in('referencia_id', publicoIds).gte('periodo_inicio', periodoAnterior.dataInicio).lte('periodo_fim', periodoAnterior.dataFim)] : []),
          ...(criativoIds.length > 0 ? [supabase.from('metricas').select('*').eq('tipo', 'criativo').in('referencia_id', criativoIds).gte('periodo_inicio', periodoAnterior.dataInicio).lte('periodo_fim', periodoAnterior.dataFim)] : [])
        ];
      } else if (tipo === 'campanha') {
        // Buscar públicos da campanha
        const { data: publicos } = await supabase
          .from('conjuntos_anuncio')
          .select('id')
          .eq('campanha_id', referenciaId);
        const publicoIds = publicos?.map(p => p.id) || [];
        
        // Buscar criativos dos públicos
        const { data: criativos } = await supabase
          .from('anuncios')
          .select('id')
          .in('conjunto_anuncio_id', publicoIds);
        const criativoIds = criativos?.map(cr => cr.id) || [];
        
        queries = [
          supabase.from('metricas').select('*').eq('tipo', 'campanha').eq('referencia_id', referenciaId).gte('periodo_inicio', periodoAnterior.dataInicio).lte('periodo_fim', periodoAnterior.dataFim),
          ...(publicoIds.length > 0 ? [supabase.from('metricas').select('*').eq('tipo', 'publico').in('referencia_id', publicoIds).gte('periodo_inicio', periodoAnterior.dataInicio).lte('periodo_fim', periodoAnterior.dataFim)] : []),
          ...(criativoIds.length > 0 ? [supabase.from('metricas').select('*').eq('tipo', 'criativo').in('referencia_id', criativoIds).gte('periodo_inicio', periodoAnterior.dataInicio).lte('periodo_fim', periodoAnterior.dataFim)] : [])
        ];
      } else if (tipo === 'publico') {
        // Buscar criativos do público
        const { data: criativos } = await supabase
          .from('anuncios')
          .select('id')
          .eq('conjunto_anuncio_id', referenciaId);
        const criativoIds = criativos?.map(cr => cr.id) || [];
        
        queries = [
          supabase.from('metricas').select('*').eq('tipo', 'publico').eq('referencia_id', referenciaId).gte('periodo_inicio', periodoAnterior.dataInicio).lte('periodo_fim', periodoAnterior.dataFim),
          ...(criativoIds.length > 0 ? [supabase.from('metricas').select('*').eq('tipo', 'criativo').in('referencia_id', criativoIds).gte('periodo_inicio', periodoAnterior.dataInicio).lte('periodo_fim', periodoAnterior.dataFim)] : [])
        ];
      } else {
        // Criativo: buscar apenas o próprio criativo
        queries = [
          supabase.from('metricas').select('*').eq('tipo', 'criativo').eq('referencia_id', referenciaId).gte('periodo_inicio', periodoAnterior.dataInicio).lte('periodo_fim', periodoAnterior.dataFim)
        ];
      }
      
      console.log(`🔍 Buscando métricas anteriores (${tipo}) com hierarquia completa:`, {
        tipo,
        referenciaId,
        periodoAnterior,
        totalQueries: queries.length
      });
      
      // Executar todas as queries em paralelo
      const results = await Promise.all(queries);
      const metricasArray = results.flatMap(result => result.data || []);
      const error = results.find(result => result.error)?.error;

      console.log('📊 Métricas anteriores encontradas:', {
        total: metricasArray.length,
        porTipo: {
          funil: metricasArray.filter(m => m.tipo === 'funil').length,
          campanha: metricasArray.filter(m => m.tipo === 'campanha').length,
          publico: metricasArray.filter(m => m.tipo === 'publico').length,
          criativo: metricasArray.filter(m => m.tipo === 'criativo').length
        }
      });

      if (error) {
        console.error('Erro ao buscar métricas anteriores:', error);
        return;
      }

      if (metricasArray && metricasArray.length > 0) {
        // Agregar métricas do período anterior (TODOS os níveis da hierarquia)
        const metricas = metricasArray.reduce((acc, metrica) => ({
          impressoes: (acc.impressoes || 0) + (metrica.impressoes || 0),
          alcance: (acc.alcance || 0) + (metrica.alcance || 0),
          cliques: (acc.cliques || 0) + (metrica.cliques || 0),
          visualizacoes_pagina: (acc.visualizacoes_pagina || 0) + (metrica.visualizacoes_pagina || 0),
          leads: (acc.leads || 0) + (metrica.leads || 0),
          checkouts: (acc.checkouts || 0) + (metrica.checkouts || 0),
          vendas: (acc.vendas || 0) + (metrica.vendas || 0),
        }), {} as MetricasAnterior);

        console.log('✅ Métricas agregadas do período anterior:', metricas);
        setMetricasAnterior(metricas);
      } else {
        console.log('❌ Nenhuma métrica encontrada para o período anterior com filtros exatos');
        console.log('🔍 Tentando busca flexível...');
        
        // Tentar busca mais flexível - última métrica antes do período atual
        try {
          const { data: metricaAnterior, error: errorFlex } = await supabase
            .from('metricas')
            .select(`
              alcance, impressoes, cliques, visualizacoes_pagina, 
              leads, checkouts, vendas, periodo_inicio, periodo_fim
            `)
            .eq('tipo', tipo)
            .eq('referencia_id', referenciaId)
            .lt('periodo_fim', filtroData?.dataInicio || new Date().toISOString().split('T')[0])
            .order('periodo_fim', { ascending: false })
            .limit(10);

          console.log('🔄 Busca flexível - últimas métricas anteriores:', {
            encontradas: metricaAnterior?.length || 0,
            dados: metricaAnterior,
            erro: errorFlex
          });

          if (metricaAnterior && metricaAnterior.length > 0) {
            console.log('✅ Encontrou métricas anteriores com busca flexível - agregando...');
            
            // Agregar todas as métricas encontradas
            const metricas = metricaAnterior.reduce((acc, metrica) => ({
              impressoes: (acc.impressoes || 0) + (metrica.impressoes || 0),
              alcance: (acc.alcance || 0) + (metrica.alcance || 0),
              cliques: (acc.cliques || 0) + (metrica.cliques || 0),
              visualizacoes_pagina: (acc.visualizacoes_pagina || 0) + (metrica.visualizacoes_pagina || 0),
              leads: (acc.leads || 0) + (metrica.leads || 0),
              checkouts: (acc.checkouts || 0) + (metrica.checkouts || 0),
              vendas: (acc.vendas || 0) + (metrica.vendas || 0),
            }), {} as MetricasAnterior);
            
            console.log('✅ Métricas agregadas da busca flexível:', metricas);
            setMetricasAnterior(metricas);
          } else {
            console.warn('⚠️ NENHUMA MÉTRICA ANTERIOR ENCONTRADA!');
            console.warn('💡 Para ver comparações, adicione dados no período anterior:', periodoAnterior);
            console.warn('💡 Ou adicione mais dados históricos para este', tipo);
            setMetricasAnterior(null);
          }
        } catch (flexError) {
          console.error('Erro na busca flexível:', flexError);
          setMetricasAnterior(null);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar métricas anteriores:', error);
      setMetricasAnterior(null);
    }
  };

  // Effect para buscar métricas anteriores quando mudar campanha, filtro hierárquico ou filtro de data
  useEffect(() => {
    console.log('🔔 useEffect FunilConversao disparado:', {
      temFiltroHierarquico: !!filtroHierarquico,
      filtroHierarquico,
      temCampanhaAtiva: !!campanhaAtiva,
      campanhaAtiva: campanhaAtiva?.id,
      temMetricasParaExibir: !!metricasParaExibir,
      filtroData
    });
    
    // Buscar métricas anteriores se houver métricas para exibir
    if (metricasParaExibir) {
      console.log('✅ Condições satisfeitas - chamando buscarMetricasAnterior');
      buscarMetricasAnterior();
    } else {
      console.log('❌ Sem métricas para exibir - não buscar métricas anteriores');
    }
  }, [campanhaAtiva?.id, filtroHierarquico?.tipo, filtroHierarquico?.id, filtroData?.dataInicio, filtroData?.dataFim, metricasParaExibir]);

  if (!metricasParaExibir) {
    return (
      <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-700/50">
        <CardContent className="p-8 text-center">
          <div className="text-slate-400 text-lg">Selecione um funil, campanha, público ou criativo para ver o funil de conversão</div>
        </CardContent>
      </Card>
    );
  }

  // Definindo as etapas do funil horizontalmente
  const etapas: FunilEtapa[] = [
    {
      id: 'impressoes',
      nome: 'Impressões',
      valor: metricasParaExibir.impressoes || 0,
      valorAnterior: metricasAnterior?.impressoes || 0,
      icone: Eye,
      cor: 'text-blue-400',
      corFundo: 'bg-blue-500/10 border-blue-400/30',
      taxaConversao: 100,
      taxaConversaoAnterior: 100, // Impressões sempre 100%
    },
    {
      id: 'alcance',
      nome: 'Alcance',
      valor: metricasParaExibir.alcance || 0,
      valorAnterior: metricasAnterior?.alcance || 0,
      icone: Users,
      cor: 'text-indigo-400',
      corFundo: 'bg-indigo-500/10 border-indigo-400/30',
      taxaConversao: metricasParaExibir.impressoes ? ((metricasParaExibir.alcance || 0) / metricasParaExibir.impressoes * 100) : 0,
      taxaConversaoAnterior: (metricasAnterior?.impressoes && metricasAnterior.impressoes > 0) ? ((metricasAnterior.alcance || 0) / metricasAnterior.impressoes * 100) : 0,
    },
    {
      id: 'cliques',
      nome: 'Cliques',
      valor: metricasParaExibir.cliques || 0,
      valorAnterior: metricasAnterior?.cliques || 0,
      icone: MousePointer,
      cor: 'text-purple-400',
      corFundo: 'bg-purple-500/10 border-purple-400/30',
      taxaConversao: metricasParaExibir.alcance ? ((metricasParaExibir.cliques || 0) / metricasParaExibir.alcance * 100) : 0,
      taxaConversaoAnterior: (metricasAnterior?.alcance && metricasAnterior.alcance > 0) ? ((metricasAnterior.cliques || 0) / metricasAnterior.alcance * 100) : 0,
    },
    {
      id: 'visualizacoes',
      nome: 'Visualizações',
      valor: metricasParaExibir.visualizacoes_pagina || 0,
      valorAnterior: metricasAnterior?.visualizacoes_pagina || 0,
      icone: ExternalLink,
      cor: 'text-pink-400',
      corFundo: 'bg-pink-500/10 border-pink-400/30',
      taxaConversao: metricasParaExibir.cliques ? ((metricasParaExibir.visualizacoes_pagina || 0) / metricasParaExibir.cliques * 100) : 0,
      taxaConversaoAnterior: (metricasAnterior?.cliques && metricasAnterior.cliques > 0) ? ((metricasAnterior.visualizacoes_pagina || 0) / metricasAnterior.cliques * 100) : 0,
    },
    {
      id: 'checkouts',
      nome: 'Checkouts',
      valor: metricasParaExibir.checkouts || 0,
      valorAnterior: metricasAnterior?.checkouts || 0,
      icone: ShoppingCart,
      cor: 'text-orange-400',
      corFundo: 'bg-orange-500/10 border-orange-400/30',
      taxaConversao: metricasParaExibir.visualizacoes_pagina ? ((metricasParaExibir.checkouts || 0) / metricasParaExibir.visualizacoes_pagina * 100) : 0,
      taxaConversaoAnterior: (metricasAnterior?.visualizacoes_pagina && metricasAnterior.visualizacoes_pagina > 0) ? ((metricasAnterior.checkouts || 0) / metricasAnterior.visualizacoes_pagina * 100) : 0,
      isKPI: true
    },
    {
      id: 'leads',
      nome: 'Leads',
      valor: metricasParaExibir.leads || 0,
      valorAnterior: metricasAnterior?.leads || 0,
      icone: UserCheck,
      cor: 'text-green-400',
      corFundo: 'bg-green-500/10 border-green-400/30',
      taxaConversao: metricasParaExibir.checkouts ? ((metricasParaExibir.leads || 0) / metricasParaExibir.checkouts * 100) : 0,
      taxaConversaoAnterior: (metricasAnterior?.checkouts && metricasAnterior.checkouts > 0) ? ((metricasAnterior.leads || 0) / metricasAnterior.checkouts * 100) : 0,
      isKPI: true
    },
    {
      id: 'vendas',
      nome: 'Vendas',
      valor: metricasParaExibir.vendas || 0,
      valorAnterior: metricasAnterior?.vendas || 0,
      icone: Crown,
      cor: 'text-yellow-400',
      corFundo: 'bg-yellow-500/10 border-yellow-400/30',
      taxaConversao: metricasParaExibir.leads ? ((metricasParaExibir.vendas || 0) / metricasParaExibir.leads * 100) : 0,
      taxaConversaoAnterior: (metricasAnterior?.leads && metricasAnterior.leads > 0) ? ((metricasAnterior.vendas || 0) / metricasAnterior.leads * 100) : 0,
      isKPI: true
    }
  ];

  const formatarNumero = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toLocaleString('pt-BR');
  };

  const formatarTaxa = (taxa: number) => {
    if (taxa === 0 || isNaN(taxa)) return '0%';
    return `${taxa.toFixed(1)}%`;
  };

  const obterCorTaxa = (taxa: number) => {
    if (taxa >= 15) return 'text-emerald-400 bg-emerald-500/20 border-emerald-400/50';
    if (taxa >= 8) return 'text-green-400 bg-green-500/20 border-green-400/50';
    if (taxa >= 3) return 'text-yellow-400 bg-yellow-500/20 border-yellow-400/50';
    return 'text-red-400 bg-red-500/20 border-red-400/50';
  };

  // Função para calcular variação percentual
  const calcularVariacao = (valorAtual: number, valorAnterior: number) => {
    if (valorAnterior === 0) return null; // Retorna null quando não há dados para comparar
    return ((valorAtual - valorAnterior) / valorAnterior) * 100;
  };

  // Função para verificar se deve mostrar comparação
  const deveExibirComparacao = (valorAnterior: number, etapaId: string) => {
    // Só exibe comparação se houver dados significativos do período anterior
    if (valorAnterior <= 0) return false;
    
    // Para diferentes tipos de métrica, definir um mínimo significativo
    const minimosPorEtapa: { [key: string]: number } = {
      'impressoes': 100,      // Mínimo 100 impressões
      'alcance': 50,          // Mínimo 50 pessoas alcançadas  
      'cliques': 5,           // Mínimo 5 cliques
      'visualizacoes_pagina': 3, // Mínimo 3 visualizações
      'checkouts': 1,         // Mínimo 1 checkout
      'leads': 1,             // Mínimo 1 lead
      'vendas': 1             // Mínimo 1 venda
    };
    
    const minimoNecessario = minimosPorEtapa[etapaId] || 1;
    return valorAnterior >= minimoNecessario;
  };

  // Função para formatar a variação
  const formatarVariacao = (variacao: number | null) => {
    if (variacao === null) return '';
    const abs = Math.abs(variacao);
    if (abs < 0.1) return '0%';
    return `${variacao > 0 ? '+' : ''}${variacao.toFixed(1)}%`;
  };

  // Função para obter ícone da variação
  const obterIconeVariacao = (variacao: number | null) => {
    if (variacao === null) return Minus;
    if (variacao > 0) return TrendingUp;
    if (variacao < 0) return TrendingDown;
    return Minus;
  };

  // Função para obter cor da variação
  const obterCorVariacao = (variacao: number) => {
    if (variacao > 0) return 'text-emerald-400 bg-emerald-500/10';
    if (variacao < 0) return 'text-red-400 bg-red-500/10';
    return 'text-slate-400 bg-slate-500/10';
  };

  return (
    <Card className="bg-slate-900/60 backdrop-blur-xl border-slate-700/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-black text-white flex items-center gap-2">
            <Target className="h-5 w-5 text-cyan-400" />
            Funil de Conversão
          </CardTitle>
          <p className="text-slate-500 text-[10px] font-medium">
            Jornada dos clientes
          </p>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Layout Horizontal - Cards lado a lado */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7 gap-3">
          {etapas.map((etapa, index) => {
            const Icone = etapa.icone;
            
            return (
              <div key={etapa.id} className="relative group">
                {/* Card Principal */}
                <div className={cn(
                  'relative p-3 rounded-lg border-2 transition-all duration-300 hover:scale-105',
                  'backdrop-blur-sm shadow-lg hover:shadow-2xl min-h-[150px]',
                  etapa.corFundo,
                  etapa.isKPI ? 'ring-2 ring-yellow-400/40' : ''
                )}>
                  
                  {/* Badge KPI */}
                  {etapa.isKPI && (
                    <div className="absolute -top-2 -right-2 z-10">
                      <Badge className="bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-black text-[10px] px-1.5 py-0.5 animate-pulse">
                        KPI 
                      </Badge>
                    </div>
                  )}

                  {/* Ícone */}
                  <div className="flex justify-center mb-2">
                    <div className={cn(
                      'p-2 rounded-full transition-colors',
                      etapa.isKPI ? 'bg-yellow-500/20' : 'bg-white/10'
                    )}>
                      <Icone className={cn(
                        'h-5 w-5',
                        etapa.isKPI ? 'text-yellow-400' : etapa.cor
                      )} />
                    </div>
                  </div>

                  {/* Nome da Etapa */}
                  <div className="text-center mb-1.5">
                    <h3 className={cn(
                      'text-sm font-bold tracking-wide',
                      etapa.isKPI ? 'text-yellow-200' : 'text-white'
                    )}>
                      {etapa.nome}
                    </h3>
                  </div>

                  {/* Valor Principal - DESTAQUE MÁXIMO */}
                  <div className="text-center mb-2">
                    <div className={cn(
                      'font-black tracking-tight leading-none drop-shadow-2xl',
                      etapa.isKPI ? 'text-2xl text-white' : 'text-xl text-white'
                    )}>
                      {etapa.valor === 0 ? '-' : formatarNumero(etapa.valor)}
                    </div>

                    {/* Comparação com período anterior - DESTACADA */}
                    {deveExibirComparacao(etapa.valorAnterior || 0, etapa.id) ? (
                      <div className="mt-2 border-t border-slate-700/30 pt-2">
                        {(() => {
                          // Calcular variação real com base nos dados dos períodos
                          const variacao = calcularVariacao(etapa.valor, etapa.valorAnterior || 0);
                          const IconeVariacao = obterIconeVariacao(variacao);
                          
                          return (
                            <div className="flex items-center justify-center">
                              <div className={cn(
                                'flex items-center gap-1.5 px-2 py-1.5 rounded-lg font-black text-xs border-2',
                                variacao && variacao > 0 ? 'text-emerald-300 bg-emerald-500/20 border-emerald-500/40' :
                                variacao && variacao < 0 ? 'text-red-300 bg-red-500/20 border-red-500/40' :
                                'text-slate-300 bg-slate-500/20 border-slate-500/40'
                              )}>
                                <IconeVariacao className="h-3.5 w-3.5" />
                                <span className="text-sm">{formatarVariacao(variacao)}</span>
                              </div>
                            </div>
                          );
                        })()}
                        <div className="text-center mt-0.5">
                          <span className="text-[10px] text-slate-500 font-medium">vs anterior</span>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2 border-t border-slate-700/30 pt-2">
                        <div className="flex items-center justify-center">
                          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg font-medium text-xs border-2 text-slate-400 bg-slate-600/20 border-slate-600/40">
                            <Minus className="h-3 w-3" />
                            <span className="text-[10px]">Sem dados</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Taxa de Conversão */}
                  {index > 0 && (
                    <div className="text-center">
                      <div className="text-[9px] text-slate-400 uppercase tracking-wider mb-1 font-bold">
                        Conv
                      </div>
                      <Badge className={cn(
                        'text-sm font-black px-2 py-0.5 border-2',
                        obterCorTaxa(etapa.taxaConversao || 0)
                      )}>
                        {formatarTaxa(etapa.taxaConversao || 0)}
                      </Badge>
                      
                      {/* Comparação da Taxa de Conversão com período anterior */}
                      {deveExibirComparacao(etapa.valorAnterior || 0, etapa.id) && (etapa.taxaConversaoAnterior || 0) > 0 ? (
                        <div className="mt-1.5">
                          {(() => {
                            const variacaoTaxa = calcularVariacao(etapa.taxaConversao || 0, etapa.taxaConversaoAnterior || 0);
                            const IconeVariacaoTaxa = obterIconeVariacao(variacaoTaxa);
                            
                            return (
                              <div className="flex items-center justify-center">
                                <div className={cn(
                                  'flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold',
                                  variacaoTaxa && variacaoTaxa > 0 ? 'text-emerald-400 bg-emerald-500/10' :
                                  variacaoTaxa && variacaoTaxa < 0 ? 'text-red-400 bg-red-500/10' :
                                  'text-slate-400 bg-slate-500/10'
                                )}>
                                  <IconeVariacaoTaxa className="h-2.5 w-2.5" />
                                  <span>{formatarVariacao(variacaoTaxa)}</span>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      ) : (
                        <div className="mt-1.5">
                          <div className="flex items-center justify-center">
                            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-slate-500 bg-slate-600/10">
                              <Minus className="h-2.5 w-2.5" />
                              <span>-</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Efeito de brilho para KPIs */}
                  {etapa.isKPI && (
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300 bg-gradient-to-br from-yellow-400/20 to-orange-400/20 rounded-xl pointer-events-none" />
                  )}
                </div>

                {/* Seta conectora (apenas para telas grandes) */}
                {index < etapas.length - 1 && (
                  <div className="hidden 2xl:flex absolute -right-3 top-1/2 transform -translate-y-1/2 z-20">
                    <div className="bg-slate-800/80 rounded-full p-1.5 border-2 border-slate-600">
                      <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
