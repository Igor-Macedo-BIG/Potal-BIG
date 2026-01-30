'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { TrendingUp, Target, Users, Image, AlertTriangle, Award, Zap } from 'lucide-react';

interface InsightData {
  melhorCampanha?: {
    nome: string;
    roas: number;
    investimento: number;
    faturamento: number;
  };
  melhorCriativo?: {
    nome: string;
    ctr: number;
    taxaConversao: number;
    leads: number;
  };
  melhorPublico?: {
    nome: string;
    cpl: number;
    leads: number;
    investimento: number;
  };
  alertaOtimizacao?: {
    nome: string;
    investimento: number;
    roas: number;
    tipo: 'campanha' | 'publico';
  };
}

interface InsightsCardsProps {
  dataInicio: string;
  dataFim: string;
  funilId?: string;
  campanhaId?: string;
}

export function InsightsCards({ dataInicio, dataFim, funilId, campanhaId }: InsightsCardsProps) {
  const [insights, setInsights] = useState<InsightData>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    buscarInsights();
  }, [dataInicio, dataFim, funilId, campanhaId]);

  const buscarInsights = async () => {
    setLoading(true);
    try {
      // 1. MELHOR CAMPANHA (Maior ROAS)
      await buscarMelhorCampanha();
      
      // 2. MELHOR CRIATIVO (Maior CTR + Taxa de Conversão)
      await buscarMelhorCriativo();
      
      // 3. MELHOR PÚBLICO (Menor CPL)
      await buscarMelhorPublico();
      
      // 4. ALERTA DE OTIMIZAÇÃO (Alto investimento, baixo retorno)
      await buscarAlertaOtimizacao();
      
    } catch (error) {
      console.error('Erro ao buscar insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const buscarMelhorCampanha = async () => {
    try {
      let query = supabase
        .from('metricas')
        .select('referencia_id, investimento, faturamento, leads')
        .eq('tipo', 'campanha')
        .gte('periodo_inicio', dataInicio)
        .lte('periodo_inicio', dataFim)
        .gt('investimento', 0);

      if (funilId) {
        const { data: campanhasFunil } = await supabase
          .from('campanhas')
          .select('id')
          .eq('funil_id', funilId);
        
        if (campanhasFunil && campanhasFunil.length > 0) {
          query = query.in('referencia_id', campanhasFunil.map(c => c.id));
        } else {
          return; // Sem campanhas no funil
        }
      } else if (campanhaId) {
        query = query.eq('referencia_id', campanhaId);
      }

      const { data } = await query;

      if (data && data.length > 0) {
        // Agrupar por campanha e calcular ROAS
        const campanhasMap: Record<string, any> = {};
        
        data.forEach((metrica: any) => {
          const id = metrica.referencia_id;
          if (!campanhasMap[id]) {
            campanhasMap[id] = {
              id,
              nome: '',
              investimento: 0,
              faturamento: 0,
              leads: 0
            };
          }
          campanhasMap[id].investimento += metrica.investimento || 0;
          campanhasMap[id].faturamento += metrica.faturamento || 0;
          campanhasMap[id].leads += metrica.leads || 0;
        });

        // Buscar nomes das campanhas
        const campanhaIds = Object.keys(campanhasMap);
        const { data: campanhasNomes } = await supabase
          .from('campanhas')
          .select('id, nome')
          .in('id', campanhaIds);

        if (campanhasNomes) {
          campanhasNomes.forEach((c: any) => {
            if (campanhasMap[c.id]) {
              campanhasMap[c.id].nome = c.nome;
            }
          });
        }

        // Calcular ROAS e encontrar a melhor
        const campanhasComRoas = Object.values(campanhasMap).map((c: any) => ({
          ...c,
          roas: c.investimento > 0 ? c.faturamento / c.investimento : 0
        }));

        const melhor = campanhasComRoas.sort((a, b) => b.roas - a.roas)[0];

        if (melhor && melhor.roas > 0) {
          setInsights(prev => ({
            ...prev,
            melhorCampanha: melhor
          }));
        }
      }
    } catch (error) {
      console.error('Erro ao buscar melhor campanha:', error);
    }
  };

  const buscarMelhorCriativo = async () => {
    try {
      let criativoIds: string[] = [];

      // Determinar quais criativos buscar
      if (campanhaId) {
        const { data: publicos } = await supabase
          .from('conjuntos_anuncio')
          .select('id')
          .eq('campanha_id', campanhaId);
        
        if (publicos && publicos.length > 0) {
          const { data: criativos } = await supabase
            .from('anuncios')
            .select('id')
            .in('conjunto_anuncio_id', publicos.map(p => p.id));
          
          if (criativos && criativos.length > 0) {
            criativoIds = criativos.map(c => c.id);
          }
        }
      } else if (funilId) {
        const { data: campanhasFunil } = await supabase
          .from('campanhas')
          .select('id')
          .eq('funil_id', funilId);
        
        if (campanhasFunil && campanhasFunil.length > 0) {
          const { data: publicos } = await supabase
            .from('conjuntos_anuncio')
            .select('id')
            .in('campanha_id', campanhasFunil.map(c => c.id));
          
          if (publicos && publicos.length > 0) {
            const { data: criativos } = await supabase
              .from('anuncios')
              .select('id')
              .in('conjunto_anuncio_id', publicos.map(p => p.id));
            
            if (criativos && criativos.length > 0) {
              criativoIds = criativos.map(c => c.id);
            }
          }
        }
      }

      if (criativoIds.length === 0 && (campanhaId || funilId)) {
        return; // Sem criativos
      }

      let query = supabase
        .from('metricas')
        .select('referencia_id, impressoes, cliques, leads, investimento')
        .eq('tipo', 'criativo')
        .gte('periodo_inicio', dataInicio)
        .lte('periodo_inicio', dataFim)
        .gt('impressoes', 0)
        .gt('cliques', 0);

      if (criativoIds.length > 0) {
        query = query.in('referencia_id', criativoIds);
      }

      const { data } = await query;

      if (data && data.length > 0) {
        // Agrupar por criativo
        const criativosMap: Record<string, any> = {};
        
        data.forEach((metrica: any) => {
          const id = metrica.referencia_id;
          if (!criativosMap[id]) {
            criativosMap[id] = {
              id,
              nome: '',
              impressoes: 0,
              cliques: 0,
              leads: 0,
              investimento: 0
            };
          }
          criativosMap[id].impressoes += metrica.impressoes || 0;
          criativosMap[id].cliques += metrica.cliques || 0;
          criativosMap[id].leads += metrica.leads || 0;
          criativosMap[id].investimento += metrica.investimento || 0;
        });

        // Buscar nomes dos criativos
        const criativoIdsComMetricas = Object.keys(criativosMap);
        const { data: criativosNomes } = await supabase
          .from('anuncios')
          .select('id, nome')
          .in('id', criativoIdsComMetricas);

        if (criativosNomes) {
          criativosNomes.forEach((c: any) => {
            if (criativosMap[c.id]) {
              criativosMap[c.id].nome = c.nome;
            }
          });
        }

        // Calcular CTR e Taxa de Conversão
        const criativosComMetricas = Object.values(criativosMap).map((c: any) => ({
          ...c,
          ctr: c.impressoes > 0 ? (c.cliques / c.impressoes) * 100 : 0,
          taxaConversao: c.cliques > 0 ? (c.leads / c.cliques) * 100 : 0,
          score: 0
        }));

        // Score = CTR * 0.4 + Taxa Conversão * 0.6 (peso maior para conversão)
        criativosComMetricas.forEach(c => {
          c.score = (c.ctr * 0.4) + (c.taxaConversao * 0.6);
        });

        const melhor = criativosComMetricas.sort((a, b) => b.score - a.score)[0];

        if (melhor && melhor.leads > 0) {
          setInsights(prev => ({
            ...prev,
            melhorCriativo: melhor
          }));
        }
      }
    } catch (error) {
      console.error('Erro ao buscar melhor criativo:', error);
    }
  };

  const buscarMelhorPublico = async () => {
    try {
      let publicoIds: string[] = [];

      if (campanhaId) {
        const { data: publicos } = await supabase
          .from('conjuntos_anuncio')
          .select('id')
          .eq('campanha_id', campanhaId);
        
        if (publicos && publicos.length > 0) {
          publicoIds = publicos.map(p => p.id);
        }
      } else if (funilId) {
        const { data: campanhasFunil } = await supabase
          .from('campanhas')
          .select('id')
          .eq('funil_id', funilId);
        
        if (campanhasFunil && campanhasFunil.length > 0) {
          const { data: publicos } = await supabase
            .from('conjuntos_anuncio')
            .select('id')
            .in('campanha_id', campanhasFunil.map(c => c.id));
          
          if (publicos && publicos.length > 0) {
            publicoIds = publicos.map(p => p.id);
          }
        }
      }

      if (publicoIds.length === 0 && (campanhaId || funilId)) {
        return;
      }

      let query = supabase
        .from('metricas')
        .select('referencia_id, investimento, leads')
        .eq('tipo', 'publico')
        .gte('periodo_inicio', dataInicio)
        .lte('periodo_inicio', dataFim)
        .gt('leads', 0);

      if (publicoIds.length > 0) {
        query = query.in('referencia_id', publicoIds);
      }

      const { data } = await query;

      if (data && data.length > 0) {
        const publicosMap: Record<string, any> = {};
        
        data.forEach((metrica: any) => {
          const id = metrica.referencia_id;
          if (!publicosMap[id]) {
            publicosMap[id] = {
              id,
              nome: '',
              investimento: 0,
              leads: 0
            };
          }
          publicosMap[id].investimento += metrica.investimento || 0;
          publicosMap[id].leads += metrica.leads || 0;
        });

        // Buscar nomes
        const publicoIdsComMetricas = Object.keys(publicosMap);
        const { data: publicosNomes } = await supabase
          .from('conjuntos_anuncio')
          .select('id, nome')
          .in('id', publicoIdsComMetricas);

        if (publicosNomes) {
          publicosNomes.forEach((p: any) => {
            if (publicosMap[p.id]) {
              publicosMap[p.id].nome = p.nome;
            }
          });
        }

        const publicosComCpl = Object.values(publicosMap).map((p: any) => ({
          ...p,
          cpl: p.leads > 0 ? p.investimento / p.leads : 999999
        }));

        const melhor = publicosComCpl.sort((a, b) => a.cpl - b.cpl)[0];

        if (melhor && melhor.cpl < 999999) {
          setInsights(prev => ({
            ...prev,
            melhorPublico: melhor
          }));
        }
      }
    } catch (error) {
      console.error('Erro ao buscar melhor público:', error);
    }
  };

  const buscarAlertaOtimizacao = async () => {
    try {
      // Buscar públicos com MAIOR CPL (pior desempenho)
      let publicoIds: string[] = [];

      if (campanhaId) {
        const { data: publicos } = await supabase
          .from('conjuntos_anuncio')
          .select('id')
          .eq('campanha_id', campanhaId);
        
        if (publicos && publicos.length > 0) {
          publicoIds = publicos.map(p => p.id);
        }
      } else if (funilId) {
        const { data: campanhasFunil } = await supabase
          .from('campanhas')
          .select('id')
          .eq('funil_id', funilId);
        
        if (campanhasFunil && campanhasFunil.length > 0) {
          const { data: publicos } = await supabase
            .from('conjuntos_anuncio')
            .select('id')
            .in('campanha_id', campanhasFunil.map(c => c.id));
          
          if (publicos && publicos.length > 0) {
            publicoIds = publicos.map(p => p.id);
          }
        }
      }

      if (publicoIds.length === 0 && (campanhaId || funilId)) {
        return;
      }

      let query = supabase
        .from('metricas')
        .select('referencia_id, investimento, leads')
        .eq('tipo', 'publico')
        .gte('periodo_inicio', dataInicio)
        .lte('periodo_inicio', dataFim)
        .gt('leads', 0)
        .gt('investimento', 50); // Apenas com investimento > R$ 50

      if (publicoIds.length > 0) {
        query = query.in('referencia_id', publicoIds);
      }

      const { data } = await query;

      if (data && data.length > 0) {
        const publicosMap: Record<string, any> = {};
        
        data.forEach((metrica: any) => {
          const id = metrica.referencia_id;
          if (!publicosMap[id]) {
            publicosMap[id] = {
              id,
              nome: '',
              investimento: 0,
              leads: 0
            };
          }
          publicosMap[id].investimento += metrica.investimento || 0;
          publicosMap[id].leads += metrica.leads || 0;
        });

        // Buscar nomes
        const publicoIdsComMetricas = Object.keys(publicosMap);
        const { data: publicosNomes } = await supabase
          .from('conjuntos_anuncio')
          .select('id, nome')
          .in('id', publicoIdsComMetricas);

        if (publicosNomes) {
          publicosNomes.forEach((p: any) => {
            if (publicosMap[p.id]) {
              publicosMap[p.id].nome = p.nome;
            }
          });
        }

        const publicosComCpl = Object.values(publicosMap)
          .map((p: any) => ({
            ...p,
            cpl: p.leads > 0 ? p.investimento / p.leads : 999999
          }))
          .filter(p => p.cpl < 999999 && p.cpl > 10); // CPL acima de R$ 10 já é problemático

        // Ordenar por MAIOR CPL (pior desempenho)
        const pior = publicosComCpl.sort((a, b) => b.cpl - a.cpl)[0];

        if (pior) {
          setInsights(prev => ({
            ...prev,
            alertaOtimizacao: pior as any
          }));
        }
      }
    } catch (error) {
      console.error('Erro ao buscar alerta de otimização:', error);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-gradient-to-br from-slate-900/50 to-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6 animate-pulse">
            <div className="h-4 bg-slate-700 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-slate-700 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Melhor Campanha */}
      <div className="bg-gradient-to-br from-emerald-900/20 to-green-800/10 backdrop-blur-xl border border-emerald-500/30 rounded-xl p-6 hover:border-emerald-400/50 transition-all group">
        <div className="flex items-center justify-between mb-4">
          <div className="p-2 bg-emerald-500/20 rounded-lg">
            <Award className="h-5 w-5 text-emerald-400" />
          </div>
          <div className="text-xs font-medium text-emerald-400 bg-emerald-500/20 px-2 py-1 rounded">
            ROAS
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-400">🏆 Melhor Campanha</p>
          {insights.melhorCampanha ? (
            <>
              <p className="text-lg font-bold text-white truncate" title={insights.melhorCampanha.nome}>
                {insights.melhorCampanha.nome}
              </p>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-bold text-emerald-400">
                  {insights.melhorCampanha.roas.toFixed(2)}x
                </span>
                <span className="text-xs text-slate-500">ROAS</span>
              </div>
              <p className="text-xs text-slate-400">
                R$ {insights.melhorCampanha.investimento.toFixed(2)} → R$ {insights.melhorCampanha.faturamento.toFixed(2)}
              </p>
            </>
          ) : (
            <p className="text-sm text-slate-500">Sem dados suficientes</p>
          )}
        </div>
      </div>

      {/* Melhor Criativo */}
      <div className="bg-gradient-to-br from-purple-900/20 to-pink-800/10 backdrop-blur-xl border border-purple-500/30 rounded-xl p-6 hover:border-purple-400/50 transition-all group">
        <div className="flex items-center justify-between mb-4">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <Image className="h-5 w-5 text-purple-400" />
          </div>
          <div className="text-xs font-medium text-purple-400 bg-purple-500/20 px-2 py-1 rounded">
            CTR + Conv
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-400">🎨 Melhor Criativo</p>
          {insights.melhorCriativo ? (
            <>
              <p className="text-lg font-bold text-white truncate" title={insights.melhorCriativo.nome}>
                {insights.melhorCriativo.nome}
              </p>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-bold text-purple-400">
                  {insights.melhorCriativo.taxaConversao.toFixed(1)}%
                </span>
                <span className="text-xs text-slate-500">Conv</span>
              </div>
              <p className="text-xs text-slate-400">
                CTR: {insights.melhorCriativo.ctr.toFixed(2)}% • {insights.melhorCriativo.leads} leads
              </p>
            </>
          ) : (
            <p className="text-sm text-slate-500">Sem dados suficientes</p>
          )}
        </div>
      </div>

      {/* Melhor Público */}
      <div className="bg-gradient-to-br from-blue-900/20 to-cyan-800/10 backdrop-blur-xl border border-blue-500/30 rounded-xl p-6 hover:border-blue-400/50 transition-all group">
        <div className="flex items-center justify-between mb-4">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <Users className="h-5 w-5 text-blue-400" />
          </div>
          <div className="text-xs font-medium text-blue-400 bg-blue-500/20 px-2 py-1 rounded">
            Menor CPL
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-400">👥 Melhor Público</p>
          {insights.melhorPublico ? (
            <>
              <p className="text-lg font-bold text-white truncate" title={insights.melhorPublico.nome}>
                {insights.melhorPublico.nome}
              </p>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-bold text-blue-400">
                  R$ {insights.melhorPublico.cpl.toFixed(2)}
                </span>
                <span className="text-xs text-slate-500">CPL</span>
              </div>
              <p className="text-xs text-slate-400">
                {insights.melhorPublico.leads} leads • R$ {insights.melhorPublico.investimento.toFixed(2)}
              </p>
            </>
          ) : (
            <p className="text-sm text-slate-500">Sem dados suficientes</p>
          )}
        </div>
      </div>

      {/* Alerta de Otimização */}
      <div className="bg-gradient-to-br from-orange-900/20 to-red-800/10 backdrop-blur-xl border border-orange-500/30 rounded-xl p-6 hover:border-orange-400/50 transition-all group">
        <div className="flex items-center justify-between mb-4">
          <div className="p-2 bg-orange-500/20 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-orange-400" />
          </div>
          <div className="text-xs font-medium text-orange-400 bg-orange-500/20 px-2 py-1 rounded">
            Maior CPL
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-400">⚠️ Precisa Otimizar</p>
          {insights.alertaOtimizacao ? (
            <>
              <p className="text-lg font-bold text-white truncate" title={insights.alertaOtimizacao.nome}>
                {insights.alertaOtimizacao.nome}
              </p>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-bold text-orange-400">
                  R$ {insights.alertaOtimizacao.cpl.toFixed(2)}
                </span>
                <span className="text-xs text-slate-500">CPL Alto</span>
              </div>
              <p className="text-xs text-slate-400">
                {insights.alertaOtimizacao.leads} leads • R$ {insights.alertaOtimizacao.investimento.toFixed(2)}
              </p>
            </>
          ) : (
            <p className="text-sm text-emerald-500">✓ Tudo otimizado!</p>
          )}
        </div>
      </div>
    </div>
  );
}
