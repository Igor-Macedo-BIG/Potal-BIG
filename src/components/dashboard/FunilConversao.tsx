'use client';

import { useCampanhaContext } from '@/contexts/CampanhaContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Eye, MousePointer, ExternalLink, UserCheck, ShoppingCart, Crown, Target, ArrowRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

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
  const { metricasCampanha, campanhaAtiva, filtroData } = useCampanhaContext();
  const [metricasAnterior, setMetricasAnterior] = useState<MetricasAnterior | null>(null);
  const supabase = createClientComponentClient();

  // Função para calcular período anterior
  const calcularPeriodoAnterior = () => {
    if (!filtroData) return null;

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
      periodoAnterior: resultado
    });

    return resultado;
  };

  // Buscar métricas do período anterior
  const buscarMetricasAnterior = async () => {
    if (!campanhaAtiva?.id || !filtroData) return;

    const periodoAnterior = calcularPeriodoAnterior();
    if (!periodoAnterior) return;

    console.log('🔍 Buscando métricas anteriores:', {
      campanhaId: campanhaAtiva.id,
      periodoAnterior,
      periodoAtual: filtroData
    });

    try {
      // Primeiro, vamos ver TODAS as métricas desta campanha
      const { data: todasMetricas } = await supabase
        .from('metricas')
        .select('periodo_inicio, periodo_fim, impressoes, alcance, leads')
        .eq('tipo', 'campanha')
        .eq('referencia_id', campanhaAtiva.id)
        .order('periodo_inicio', { ascending: true });

      console.log('📋 TODAS as métricas desta campanha:', todasMetricas);

      const { data: metricasArray, error } = await supabase
        .from('metricas')
        .select(`
          alcance, impressoes, cliques, visualizacoes_pagina, 
          leads, checkouts, vendas, investimento, faturamento, 
          roas, ctr
        `)
        .eq('tipo', 'campanha')
        .eq('referencia_id', campanhaAtiva.id)
        .gte('periodo_inicio', periodoAnterior.dataInicio)
        .lte('periodo_fim', periodoAnterior.dataFim);

      console.log('🎯 Query específica para período anterior:', {
        query: {
          tipo: 'campanha',
          referencia_id: campanhaAtiva.id,
          periodo_inicio_gte: periodoAnterior.dataInicio,
          periodo_fim_lte: periodoAnterior.dataFim
        }
      });

      if (error) {
        console.error('Erro ao buscar métricas anteriores:', error);
        return;
      }

      console.log('📊 Métricas encontradas do período anterior:', metricasArray);

      if (metricasArray && metricasArray.length > 0) {
        // Agregar métricas do período anterior
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
        
        // Tentar busca mais flexível - última métrica antes do período atual
        try {
          const { data: metricaAnterior } = await supabase
            .from('metricas')
            .select(`
              alcance, impressoes, cliques, visualizacoes_pagina, 
              leads, checkouts, vendas
            `)
            .eq('tipo', 'campanha')
            .eq('referencia_id', campanhaAtiva.id)
            .lt('periodo_fim', filtroData.dataInicio)
            .order('periodo_fim', { ascending: false })
            .limit(1);

          console.log('🔄 Tentativa de busca flexível - última métrica anterior:', metricaAnterior);

          if (metricaAnterior && metricaAnterior.length > 0) {
            console.log('✅ Encontrou métrica anterior com busca flexível');
            setMetricasAnterior(metricaAnterior[0]);
          } else {
            console.log('❌ Nenhuma métrica anterior encontrada mesmo com busca flexível');
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

  // Effect para buscar métricas anteriores quando mudar campanha ou filtro
  useEffect(() => {
    if (campanhaAtiva && metricasCampanha) {
      buscarMetricasAnterior();
    }
  }, [campanhaAtiva?.id, filtroData?.dataInicio, filtroData?.dataFim]);

  if (!metricasCampanha) {
    return (
      <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-700/50">
        <CardContent className="p-8 text-center">
          <div className="text-slate-400 text-lg">Selecione uma campanha para ver o funil de conversão</div>
        </CardContent>
      </Card>
    );
  }

  // Definindo as etapas do funil horizontalmente
  const etapas: FunilEtapa[] = [
    {
      id: 'impressoes',
      nome: 'Impressões',
      valor: metricasCampanha.impressoes || 0,
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
      valor: metricasCampanha.alcance || 0,
      valorAnterior: metricasAnterior?.alcance || 0,
      icone: Users,
      cor: 'text-indigo-400',
      corFundo: 'bg-indigo-500/10 border-indigo-400/30',
      taxaConversao: metricasCampanha.impressoes ? ((metricasCampanha.alcance || 0) / metricasCampanha.impressoes * 100) : 0,
      taxaConversaoAnterior: (metricasAnterior?.impressoes && metricasAnterior.impressoes > 0) ? ((metricasAnterior.alcance || 0) / metricasAnterior.impressoes * 100) : 0,
    },
    {
      id: 'cliques',
      nome: 'Cliques',
      valor: metricasCampanha.cliques || 0,
      valorAnterior: metricasAnterior?.cliques || 0,
      icone: MousePointer,
      cor: 'text-purple-400',
      corFundo: 'bg-purple-500/10 border-purple-400/30',
      taxaConversao: metricasCampanha.alcance ? ((metricasCampanha.cliques || 0) / metricasCampanha.alcance * 100) : 0,
      taxaConversaoAnterior: (metricasAnterior?.alcance && metricasAnterior.alcance > 0) ? ((metricasAnterior.cliques || 0) / metricasAnterior.alcance * 100) : 0,
    },
    {
      id: 'visualizacoes',
      nome: 'Visualizações',
      valor: metricasCampanha.visualizacoes_pagina || 0,
      valorAnterior: metricasAnterior?.visualizacoes_pagina || 0,
      icone: ExternalLink,
      cor: 'text-pink-400',
      corFundo: 'bg-pink-500/10 border-pink-400/30',
      taxaConversao: metricasCampanha.cliques ? ((metricasCampanha.visualizacoes_pagina || 0) / metricasCampanha.cliques * 100) : 0,
      taxaConversaoAnterior: (metricasAnterior?.cliques && metricasAnterior.cliques > 0) ? ((metricasAnterior.visualizacoes_pagina || 0) / metricasAnterior.cliques * 100) : 0,
    },
    {
      id: 'checkouts',
      nome: 'Checkouts',
      valor: metricasCampanha.checkouts || 0,
      valorAnterior: metricasAnterior?.checkouts || 0,
      icone: ShoppingCart,
      cor: 'text-orange-400',
      corFundo: 'bg-orange-500/10 border-orange-400/30',
      taxaConversao: metricasCampanha.visualizacoes_pagina ? ((metricasCampanha.checkouts || 0) / metricasCampanha.visualizacoes_pagina * 100) : 0,
      taxaConversaoAnterior: (metricasAnterior?.visualizacoes_pagina && metricasAnterior.visualizacoes_pagina > 0) ? ((metricasAnterior.checkouts || 0) / metricasAnterior.visualizacoes_pagina * 100) : 0,
      isKPI: true
    },
    {
      id: 'leads',
      nome: 'Leads',
      valor: metricasCampanha.leads || 0,
      valorAnterior: metricasAnterior?.leads || 0,
      icone: UserCheck,
      cor: 'text-green-400',
      corFundo: 'bg-green-500/10 border-green-400/30',
      taxaConversao: metricasCampanha.checkouts ? ((metricasCampanha.leads || 0) / metricasCampanha.checkouts * 100) : 0,
      taxaConversaoAnterior: (metricasAnterior?.checkouts && metricasAnterior.checkouts > 0) ? ((metricasAnterior.leads || 0) / metricasAnterior.checkouts * 100) : 0,
      isKPI: true
    },
    {
      id: 'vendas',
      nome: 'Vendas',
      valor: metricasCampanha.vendas || 0,
      valorAnterior: metricasAnterior?.vendas || 0,
      icone: Crown,
      cor: 'text-yellow-400',
      corFundo: 'bg-yellow-500/10 border-yellow-400/30',
      taxaConversao: metricasCampanha.leads ? ((metricasCampanha.vendas || 0) / metricasCampanha.leads * 100) : 0,
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
      <CardHeader className="pb-6">
        <CardTitle className="text-3xl font-black text-white flex items-center gap-3">
          <Target className="h-8 w-8 text-cyan-400" />
          Funil de Conversão 
        </CardTitle>
        <p className="text-slate-300 text-lg font-medium">
          Acompanhe a jornada completa dos seus clientes
        </p>
      </CardHeader>

      <CardContent className="space-y-8">
        {/* Layout Horizontal - Cards lado a lado */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7 gap-6">
          {etapas.map((etapa, index) => {
            const Icone = etapa.icone;
            
            return (
              <div key={etapa.id} className="relative group">
                {/* Card Principal */}
                <div className={cn(
                  'relative p-6 rounded-2xl border-2 transition-all duration-300 hover:scale-105',
                  'backdrop-blur-sm shadow-lg hover:shadow-2xl min-h-[200px]',
                  etapa.corFundo,
                  etapa.isKPI ? 'ring-2 ring-yellow-400/40' : ''
                )}>
                  
                  {/* Badge KPI */}
                  {etapa.isKPI && (
                    <div className="absolute -top-2 -right-2 z-10">
                      <Badge className="bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-black text-xs px-2 py-1 animate-pulse">
                        KPI 
                      </Badge>
                    </div>
                  )}

                  {/* Ícone */}
                  <div className="flex justify-center mb-4">
                    <div className={cn(
                      'p-4 rounded-full transition-colors',
                      etapa.isKPI ? 'bg-yellow-500/20' : 'bg-white/10'
                    )}>
                      <Icone className={cn(
                        'h-8 w-8',
                        etapa.isKPI ? 'text-yellow-400' : etapa.cor
                      )} />
                    </div>
                  </div>

                  {/* Nome da Etapa */}
                  <div className="text-center mb-3">
                    <h3 className={cn(
                      'text-lg font-bold tracking-wide',
                      etapa.isKPI ? 'text-yellow-200' : 'text-white'
                    )}>
                      {etapa.nome}
                    </h3>
                  </div>

                  {/* Valor Principal - DESTAQUE MÁXIMO */}
                  <div className="text-center mb-4">
                    <div className={cn(
                      'font-black tracking-tight leading-none drop-shadow-2xl',
                      etapa.isKPI ? 'text-4xl text-white' : 'text-3xl text-white'
                    )}>
                      {etapa.valor === 0 ? '-' : formatarNumero(etapa.valor)}
                    </div>

                    {/* Comparação com período anterior - DESTACADA */}
                    {deveExibirComparacao(etapa.valorAnterior || 0, etapa.id) ? (
                      <div className="mt-3 border-t border-slate-700/30 pt-3">
                        {(() => {
                          // Calcular variação real com base nos dados dos períodos
                          const variacao = calcularVariacao(etapa.valor, etapa.valorAnterior || 0);
                          const IconeVariacao = obterIconeVariacao(variacao);
                          
                          return (
                            <div className="flex items-center justify-center">
                              <div className={cn(
                                'flex items-center gap-2 px-3 py-2 rounded-xl font-black text-sm border-2',
                                variacao && variacao > 0 ? 'text-emerald-300 bg-emerald-500/20 border-emerald-500/40' :
                                variacao && variacao < 0 ? 'text-red-300 bg-red-500/20 border-red-500/40' :
                                'text-slate-300 bg-slate-500/20 border-slate-500/40'
                              )}>
                                <IconeVariacao className="h-4 w-4" />
                                <span className="text-base">{formatarVariacao(variacao)}</span>
                              </div>
                            </div>
                          );
                        })()}
                        <div className="text-center mt-1">
                          <span className="text-xs text-slate-500 font-medium">vs período anterior</span>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3 border-t border-slate-700/30 pt-3">
                        <div className="flex items-center justify-center">
                          <div className="flex items-center gap-2 px-3 py-2 rounded-xl font-medium text-sm border-2 text-slate-400 bg-slate-600/20 border-slate-600/40">
                            <Minus className="h-4 w-4" />
                            <span className="text-sm">Sem dados anteriores</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Taxa de Conversão */}
                  {index > 0 && (
                    <div className="text-center">
                      <div className="text-xs text-slate-400 uppercase tracking-wider mb-2 font-bold">
                        Conversão
                      </div>
                      <Badge className={cn(
                        'text-lg font-black px-3 py-1 border-2',
                        obterCorTaxa(etapa.taxaConversao || 0)
                      )}>
                        {formatarTaxa(etapa.taxaConversao || 0)}
                      </Badge>
                      
                      {/* Comparação da Taxa de Conversão com período anterior */}
                      {deveExibirComparacao(etapa.valorAnterior || 0, etapa.id) && (etapa.taxaConversaoAnterior || 0) > 0 ? (
                        <div className="mt-2">
                          {(() => {
                            const variacaoTaxa = calcularVariacao(etapa.taxaConversao || 0, etapa.taxaConversaoAnterior || 0);
                            const IconeVariacaoTaxa = obterIconeVariacao(variacaoTaxa);
                            
                            return (
                              <div className="flex items-center justify-center">
                                <div className={cn(
                                  'flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold',
                                  variacaoTaxa && variacaoTaxa > 0 ? 'text-emerald-400 bg-emerald-500/10' :
                                  variacaoTaxa && variacaoTaxa < 0 ? 'text-red-400 bg-red-500/10' :
                                  'text-slate-400 bg-slate-500/10'
                                )}>
                                  <IconeVariacaoTaxa className="h-3 w-3" />
                                  <span>{formatarVariacao(variacaoTaxa)}</span>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      ) : (
                        <div className="mt-2">
                          <div className="flex items-center justify-center">
                            <div className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-slate-500 bg-slate-600/10">
                              <Minus className="h-3 w-3" />
                              <span>-</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Efeito de brilho para KPIs */}
                  {etapa.isKPI && (
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300 bg-gradient-to-br from-yellow-400/20 to-orange-400/20 rounded-2xl pointer-events-none" />
                  )}
                </div>

                {/* Seta conectora (apenas para telas grandes) */}
                {index < etapas.length - 1 && (
                  <div className="hidden 2xl:flex absolute -right-3 top-1/2 transform -translate-y-1/2 z-20">
                    <div className="bg-slate-800/80 rounded-full p-2 border-2 border-slate-600">
                      <ArrowRight className="h-4 w-4 text-slate-400" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Resumo Estatístico */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8 p-6 bg-gradient-to-r from-slate-800/40 to-slate-700/40 rounded-xl border-2 border-slate-600/30">
          <div className="text-center">
            <div className="text-sm text-cyan-400 uppercase tracking-widest font-black mb-2">
              Melhor Taxa
            </div>
            <div className="text-3xl font-black text-emerald-400">
              {Math.max(...etapas.slice(1).map(e => e.taxaConversao || 0)).toFixed(1)}%
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-sm text-cyan-400 uppercase tracking-widest font-black mb-2">
              Taxa Média
            </div>
            <div className="text-3xl font-black text-cyan-400">
              {(etapas.slice(1).reduce((sum, e) => sum + (e.taxaConversao || 0), 0) / (etapas.length - 1)).toFixed(1)}%
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-sm text-cyan-400 uppercase tracking-widest font-black mb-2">
              Conversão Geral
            </div>
            <div className="text-3xl font-black text-yellow-400">
              {etapas[0].valor > 0 ? ((etapas[etapas.length - 1].valor / etapas[0].valor) * 100).toFixed(1) : '0'}%
            </div>
          </div>

          {/* Variação Geral vs Período Anterior */}
          <div className="text-center">
            <div className="text-sm text-cyan-400 uppercase tracking-widest font-black mb-2">
              Variação Geral
            </div>
            {(() => {
              // Calcular variação geral baseada nas vendas (última etapa do funil)
              const vendas = etapas[etapas.length - 1];
              const temDadosAnteriores = deveExibirComparacao(vendas.valorAnterior || 0, vendas.id);
              
              if (!temDadosAnteriores) {
                return (
                  <div className="flex flex-col items-center gap-1">
                    <div className="text-2xl font-black text-slate-400">
                      -
                    </div>
                    <div className="text-xs text-slate-500">Sem dados anteriores</div>
                  </div>
                );
              }

              const variacaoGeralReal = calcularVariacao(vendas.valor, vendas.valorAnterior || 0);
              const IconeVariacaoGeral = obterIconeVariacao(variacaoGeralReal);
              
              return (
                <div className="flex flex-col items-center gap-1">
                  <div className={cn(
                    'text-2xl font-black flex items-center gap-2',
                    variacaoGeralReal && variacaoGeralReal > 0 ? 'text-emerald-400' : 
                    variacaoGeralReal && variacaoGeralReal < 0 ? 'text-red-400' : 'text-slate-400'
                  )}>
                    <IconeVariacaoGeral className="h-6 w-6" />
                    {formatarVariacao(variacaoGeralReal)}
                  </div>
                  <div className="text-xs text-slate-400">vs anterior</div>
                </div>
              );
            })()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
