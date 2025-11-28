'use client';

import { useCampanhaContext, FiltroData } from '@/contexts/CampanhaContext';
import { Card } from '@/components/ui/card';
import { Users, Eye, MousePointer, ExternalLink, UserCheck, ShoppingCart, Crown, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface FunilEtapa {
  id: string;
  label: string;
  valor: number | string;
  icon: React.ReactNode;
  cor: string;
  taxaConversao?: number;
  taxaConversaoAnterior?: number;
  diferenceaPercentual?: number;
}

interface MetricasComparacao {
  impressoes: number;
  alcance: number;
  cliques: number;
  visualizacoes_pagina: number;
  checkouts: number;
  leads: number;
  vendas: number;
}

export function FunilConversao() {
  const { metricasCampanha, campanhaAtiva: campanhaSelecionada, filtroData } = useCampanhaContext();
  const [metricasAnterior, setMetricasAnterior] = useState<MetricasComparacao | null>(null);

  // Função para calcular período anterior
  const calcularPeriodoAnterior = (filtro: FiltroData) => {
    const hoje = new Date();
    
    switch (filtro.tipo) {
      case 'hoje':
        const ontem = new Date(hoje);
        ontem.setDate(hoje.getDate() - 1);
        return { inicio: ontem, fim: ontem };
        
      case 'semana':
        const semanaPassada = new Date(hoje);
        semanaPassada.setDate(hoje.getDate() - 7);
        const inicioSemanaPassada = new Date(semanaPassada);
        inicioSemanaPassada.setDate(semanaPassada.getDate() - semanaPassada.getDay());
        const fimSemanaPassada = new Date(inicioSemanaPassada);
        fimSemanaPassada.setDate(inicioSemanaPassada.getDate() + 6);
        return { inicio: inicioSemanaPassada, fim: fimSemanaPassada };
        
      case 'mes':
        const mesPassado = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
        const fimMesPassado = new Date(hoje.getFullYear(), hoje.getMonth(), 0);
        return { inicio: mesPassado, fim: fimMesPassado };
        
      case 'trimestre':
        const trimestrePassado = new Date(hoje);
        trimestrePassado.setMonth(hoje.getMonth() - 6); // 3 meses atrás + 3 meses = 6
        const fimTrimestrePassado = new Date(hoje);
        fimTrimestrePassado.setMonth(hoje.getMonth() - 3);
        fimTrimestrePassado.setDate(fimTrimestrePassado.getDate() - 1);
        return { inicio: trimestrePassado, fim: fimTrimestrePassado };
        
      default:
        const mesPassadoDefault = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
        const fimMesPassadoDefault = new Date(hoje.getFullYear(), hoje.getMonth(), 0);
        return { inicio: mesPassadoDefault, fim: fimMesPassadoDefault };
    }
  };

  // Buscar métricas do período anterior
  useEffect(() => {
    const buscarMetricasAnterior = async () => {
      if (!campanhaSelecionada) return;

      try {
        const periodoAnterior = calcularPeriodoAnterior(filtroData);
        
        const { data, error } = await supabase
          .from('metricas')
          .select('*')
          .eq('referencia_id', campanhaSelecionada.id)
          .eq('tipo', 'campanha')
          .gte('periodo_inicio', periodoAnterior.inicio.toISOString().split('T')[0])
          .lte('periodo_fim', periodoAnterior.fim.toISOString().split('T')[0])
          .order('periodo_inicio', { ascending: false })
          .limit(1);

        if (data && data.length > 0) {
          console.log('🔍 Métricas anteriores encontradas:', data[0]);
          setMetricasAnterior({
            impressoes: data[0].impressoes || 0,
            alcance: data[0].alcance || 0,
            cliques: data[0].cliques || 0,
            visualizacoes_pagina: data[0].visualizacoes_pagina || 0,
            checkouts: data[0].checkouts || 0,
            leads: data[0].leads || 0,
            vendas: data[0].vendas || 0,
          });
        } else {
          console.log('❌ Nenhuma métrica anterior encontrada para período:', periodoAnterior);
        }
      } catch (error) {
        console.error('Erro ao buscar métricas anteriores:', error);
      }
    };

    buscarMetricasAnterior();
  }, [campanhaSelecionada, filtroData]);

  // Função para calcular diferença percentual
  const calcularDiferenca = (valorAtual: number, valorAnterior: number) => {
    if (valorAnterior === 0) return valorAtual > 0 ? 100 : 0;
    return ((valorAtual - valorAnterior) / valorAnterior) * 100;
  };

  if (!metricasCampanha) {
    return (
      <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-700/50 p-6">
        <div className="text-center">
          <h3 className="text-xl font-bold text-white mb-2">Funil de Conversão</h3>
          <p className="text-slate-400">Selecione uma campanha para ver o funil</p>
        </div>
      </Card>
    );
  }

  // ORDEM CORRETA: Impressões → Alcance → Cliques → Visualizações → CHECKOUTS → LEADS → Vendas
  const etapas: FunilEtapa[] = [
    {
      id: 'impressoes',
      label: 'Impressões',
      valor: metricasCampanha.impressoes || 'Não informado',
      icon: <Eye className="h-5 w-5" />,
      cor: 'from-blue-500 to-blue-600'
    },
    {
      id: 'alcance',
      label: 'Alcance',
      valor: metricasCampanha.alcance || 'Não informado',
      icon: <Users className="h-5 w-5" />,
      cor: 'from-cyan-500 to-cyan-600',
      taxaConversao: metricasCampanha.impressoes > 0 ? (metricasCampanha.alcance / metricasCampanha.impressoes) * 100 : undefined,
      taxaConversaoAnterior: (metricasAnterior && metricasAnterior.impressoes > 0) ? (metricasAnterior.alcance / metricasAnterior.impressoes) * 100 : undefined
    },
    {
      id: 'cliques',
      label: 'Cliques',
      valor: metricasCampanha.cliques || 'Não informado',
      icon: <MousePointer className="h-5 w-5" />,
      cor: 'from-green-500 to-green-600',
      taxaConversao: metricasCampanha.ctr || undefined,
      taxaConversaoAnterior: (metricasAnterior && metricasAnterior.alcance > 0) ? (metricasAnterior.cliques / metricasAnterior.alcance) * 100 : undefined
    },
    {
      id: 'visualizacoes',
      label: 'Visualizações',
      valor: metricasCampanha.visualizacoes_pagina || 'Não informado',
      icon: <ExternalLink className="h-5 w-5" />,
      cor: 'from-yellow-500 to-yellow-600',
      taxaConversao: metricasCampanha.cliques > 0 ? (metricasCampanha.visualizacoes_pagina / metricasCampanha.cliques) * 100 : undefined,
      taxaConversaoAnterior: (metricasAnterior && metricasAnterior.cliques > 0) ? (metricasAnterior.visualizacoes_pagina / metricasAnterior.cliques) * 100 : undefined
    },
    {
      id: 'checkouts',
      label: 'Checkouts',
      valor: metricasCampanha.checkouts || 'Não informado',
      icon: <ShoppingCart className="h-5 w-5" />,
      cor: 'from-purple-500 to-purple-600',
      taxaConversao: metricasCampanha.visualizacoes_pagina > 0 ? (metricasCampanha.checkouts / metricasCampanha.visualizacoes_pagina) * 100 : undefined,
      taxaConversaoAnterior: (metricasAnterior && metricasAnterior.visualizacoes_pagina > 0) ? (metricasAnterior.checkouts / metricasAnterior.visualizacoes_pagina) * 100 : undefined
    },
    {
      id: 'leads',
      label: 'Leads',
      valor: metricasCampanha.leads || 'Não informado',
      icon: <UserCheck className="h-5 w-5" />,
      cor: 'from-orange-500 to-orange-600',
      taxaConversao: metricasCampanha.checkouts > 0 ? (metricasCampanha.leads / metricasCampanha.checkouts) * 100 : undefined,
      taxaConversaoAnterior: (metricasAnterior && metricasAnterior.checkouts > 0) ? (metricasAnterior.leads / metricasAnterior.checkouts) * 100 : undefined
    },
    {
      id: 'vendas',
      label: 'Vendas',
      valor: metricasCampanha.vendas || 'Não informado',
      icon: <Crown className="h-5 w-5" />,
      cor: 'from-pink-500 to-pink-600',
      taxaConversao: metricasCampanha.taxa_conversao || undefined,
      taxaConversaoAnterior: (metricasAnterior && metricasAnterior.leads > 0) ? (metricasAnterior.vendas / metricasAnterior.leads) * 100 : undefined
    }
  ];

  // Calcular diferenças percentuais
  etapas.forEach(etapa => {
    if (etapa.taxaConversao !== undefined && etapa.taxaConversaoAnterior !== undefined) {
      etapa.diferenceaPercentual = calcularDiferenca(etapa.taxaConversao, etapa.taxaConversaoAnterior);
    }
  });

  const formatarPeriodo = (filtro: FiltroData) => {
    switch (filtro.tipo) {
      case 'hoje': return 'ontem';
      case 'semana': return 'semana anterior';
      case 'mes': return 'mês anterior';
      case 'trimestre': return 'trimestre anterior';
      default: return 'período anterior';
    }
  };

  return (
    <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-700/50 p-6">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-white mb-2">Funil de Conversão</h3>
        <p className="text-slate-400">Acompanhe o desempenho em cada etapa do funil</p>
      </div>

      <div className="relative">
        {/* Linha conectora */}
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500/20 to-pink-500/20 transform -translate-y-1/2 z-0" />
        
        {/* Etapas do funil */}
        <div className="relative z-10 flex items-center justify-between overflow-x-auto pb-4">
          {etapas.map((etapa, index) => (
            <div key={etapa.id} className="flex items-center">
              {/* Card da etapa */}
              <div className="relative group">
                <div className={cn(
                  "relative bg-gradient-to-br rounded-2xl p-4 min-w-[140px] text-center border border-white/10 shadow-lg",
                  `bg-gradient-to-br ${etapa.cor}`,
                  "hover:scale-105 transition-all duration-300",
                  "backdrop-blur-sm"
                )}>
                  {/* Ícone */}
                  <div className="flex justify-center mb-2">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                      {etapa.icon}
                    </div>
                  </div>

                  {/* Label */}
                  <h4 className="text-white font-semibold text-sm mb-1">{etapa.label}</h4>

                  {/* Valor */}
                  <div className="text-white font-bold text-lg mb-2">
                    {typeof etapa.valor === 'number' ? etapa.valor.toLocaleString('pt-BR') : etapa.valor}
                  </div>

                  {/* Taxa de conversão */}
                  {etapa.taxaConversao !== undefined && (
                    <div className="text-white/80 text-xs mb-1">
                      {etapa.taxaConversao > 0 ? `${etapa.taxaConversao.toFixed(1)}%` : 'Não informado'}
                    </div>
                  )}

                  {/* Comparação com período anterior */}
                  {etapa.diferenceaPercentual !== undefined && (
                    <div className={cn(
                      "text-xs font-medium flex items-center justify-center gap-1",
                      etapa.diferenceaPercentual > 0 ? "text-green-300" : "text-red-300"
                    )}>
                      {etapa.diferenceaPercentual > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      <span>
                        {Math.abs(etapa.diferenceaPercentual).toFixed(1)}% {etapa.diferenceaPercentual > 0 ? 'a mais' : 'a menos'}
                      </span>
                    </div>
                  )}

                  {etapa.diferenceaPercentual !== undefined && (
                    <div className="text-white/60 text-[10px] mt-1">
                      que no {formatarPeriodo(filtroData)}
                    </div>
                  )}
                </div>
              </div>

              {/* Seta conectora */}
              {index < etapas.length - 1 && (
                <div className="mx-2 flex-shrink-0">
                  <ChevronRight className="h-5 w-5 text-slate-400" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Resumo das taxas */}
      <div className="mt-6 pt-4 border-t border-slate-700/50">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-slate-400 text-xs mb-1">CTR</div>
            <div className="text-white font-semibold">
              {metricasCampanha.ctr > 0 ? `${metricasCampanha.ctr.toFixed(2)}%` : 'Não informado'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-slate-400 text-xs mb-1">CPL</div>
            <div className="text-white font-semibold">
              {metricasCampanha.cpl > 0 ? `R$ ${metricasCampanha.cpl.toFixed(2)}` : 'Não informado'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-slate-400 text-xs mb-1">CPC</div>
            <div className="text-white font-semibold">
              {metricasCampanha.cpc > 0 ? `R$ ${metricasCampanha.cpc.toFixed(2)}` : 'Não informado'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-slate-400 text-xs mb-1">Taxa Final</div>
            <div className="text-white font-semibold">
              {metricasCampanha.taxa_conversao > 0 ? `${metricasCampanha.taxa_conversao.toFixed(1)}%` : 'Não informado'}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}