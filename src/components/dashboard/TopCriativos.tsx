'use client';

import { useState, useEffect } from 'react';
import { Trophy, TrendingUp, DollarSign, Users, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useCampanhaContext } from '@/contexts/CampanhaContext';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

interface CriativoTop {
  id: string;
  nome: string;
  tipo: string;
  thumbnail_url: string | null;
  conjunto_nome: string;
  campanha_nome: string;
  funil_nome: string;
  investimento: number;
  leads: number;
  cpl: number;
}

export function TopCriativos() {
  const { filtroData } = useCampanhaContext();
  const { isClean } = useTheme();
  const [criativos, setCriativos] = useState<CriativoTop[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    buscarTopCriativos();
  }, [filtroData.dataInicio, filtroData.dataFim]);

  const buscarTopCriativos = async () => {
    setLoading(true);
    try {
      // Buscar métricas de anúncios no período selecionado
      const { data: metricas, error: errMetricas } = await supabase
        .from('metricas')
        .select('referencia_id, investimento, leads')
        .eq('tipo', 'anuncio')
        .gte('periodo_inicio', filtroData.dataInicio)
        .lte('periodo_fim', filtroData.dataFim);

      if (errMetricas || !metricas || metricas.length === 0) {
        setCriativos([]);
        setLoading(false);
        return;
      }

      // Agregar métricas por anúncio (pode haver múltiplas linhas de período)
      const agregado = new Map<string, { investimento: number; leads: number }>();
      metricas.forEach((m) => {
        const prev = agregado.get(m.referencia_id) || { investimento: 0, leads: 0 };
        agregado.set(m.referencia_id, {
          investimento: prev.investimento + (m.investimento || 0),
          leads: prev.leads + (m.leads || 0),
        });
      });

      // Filtrar apenas anúncios com leads > 0 (para calcular CPL)
      const anuncioIds = Array.from(agregado.entries())
        .filter(([, v]) => v.leads > 0)
        .map(([id]) => id);

      if (anuncioIds.length === 0) {
        setCriativos([]);
        setLoading(false);
        return;
      }

      // Buscar dados dos anúncios
      const { data: anuncios, error: errAnuncios } = await supabase
        .from('anuncios')
        .select('id, nome, tipo, thumbnail_url, image_url, conjunto_anuncio_id')
        .in('id', anuncioIds);

      if (errAnuncios || !anuncios) {
        setCriativos([]);
        setLoading(false);
        return;
      }

      // Buscar conjuntos com campanha
      const conjuntoIds = [...new Set(anuncios.map((a) => a.conjunto_anuncio_id))];
      const { data: conjuntos } = await supabase
        .from('conjuntos_anuncio')
        .select('id, nome, campanha_id')
        .in('id', conjuntoIds);

      const conjuntoMap = new Map<string, { nome: string; campanha_id: string }>();
      conjuntos?.forEach((c) => conjuntoMap.set(c.id, { nome: c.nome, campanha_id: c.campanha_id }));

      // Buscar campanhas com funil
      const campanhaIds = [...new Set((conjuntos || []).map((c) => c.campanha_id).filter(Boolean))];
      const { data: campanhas } = campanhaIds.length > 0
        ? await supabase
            .from('campanhas')
            .select('id, nome, funil_id')
            .in('id', campanhaIds)
        : { data: [] };

      const campanhaMap = new Map<string, { nome: string; funil_id: string | null }>();
      campanhas?.forEach((c) => campanhaMap.set(c.id, { nome: c.nome, funil_id: c.funil_id }));

      // Buscar funis
      const funilIds = [...new Set((campanhas || []).map((c) => c.funil_id).filter(Boolean))] as string[];
      const { data: funis } = funilIds.length > 0
        ? await supabase
            .from('funis')
            .select('id, nome')
            .in('id', funilIds)
        : { data: [] };

      const funilMap = new Map<string, string>();
      funis?.forEach((f) => funilMap.set(f.id, f.nome));

      // Montar o ranking
      const ranking: CriativoTop[] = anuncios
        .map((anuncio) => {
          const stats = agregado.get(anuncio.id);
          if (!stats || stats.leads === 0) return null;
          const cpl = stats.investimento / stats.leads;

          const conjunto = conjuntoMap.get(anuncio.conjunto_anuncio_id);
          const campanha = conjunto?.campanha_id ? campanhaMap.get(conjunto.campanha_id) : null;
          const funilNome = campanha?.funil_id ? funilMap.get(campanha.funil_id) : null;

          return {
            id: anuncio.id,
            nome: anuncio.nome,
            tipo: anuncio.tipo || 'Anúncio',
            thumbnail_url: anuncio.image_url || anuncio.thumbnail_url || null,
            conjunto_nome: conjunto?.nome || '—',
            campanha_nome: campanha?.nome || '—',
            funil_nome: funilNome || '—',
            investimento: stats.investimento,
            leads: stats.leads,
            cpl,
          };
        })
        .filter(Boolean) as CriativoTop[];

      // Ordenar por CPL (menor = melhor) e pegar top 4
      ranking.sort((a, b) => a.cpl - b.cpl);
      setCriativos(ranking.slice(0, 4));
    } catch (error) {
      console.error('Erro ao buscar top criativos:', error);
      setCriativos([]);
    } finally {
      setLoading(false);
    }
  };

  const medalColors = [
    'from-yellow-400 to-amber-500', // 1º - ouro
    'from-slate-300 to-slate-400',  // 2º - prata
    'from-orange-400 to-orange-600', // 3º - bronze
    'from-cyan-400 to-blue-500',    // 4º
  ];

  const medalBorders = [
    'border-yellow-500/40',
    'border-slate-400/40',
    'border-orange-500/40',
    'border-cyan-500/40',
  ];

  if (loading) {
    return (
      <div className={cn(
        "rounded-2xl p-6 border",
        isClean ? 'bg-white border-gray-200/60 shadow-sm' : 'bg-slate-900/60 backdrop-blur-xl border-slate-700/50'
      )}>
        <div className="flex items-center gap-3 mb-6">
          <Trophy className={cn("h-6 w-6", isClean ? 'text-amber-600' : 'text-yellow-400')} />
          <h3 className={cn("text-xl font-bold", isClean ? 'text-gray-900' : 'text-white')}>Top Criativos</h3>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className={cn("animate-spin rounded-full h-6 w-6 border-b-2", isClean ? 'border-amber-600' : 'border-cyan-400')}></div>
          <span className={cn("ml-3 text-sm", isClean ? 'text-gray-500' : 'text-slate-400')}>Carregando ranking...</span>
        </div>
      </div>
    );
  }

  if (criativos.length === 0) {
    return (
      <div className={cn(
        "rounded-2xl p-6 border",
        isClean ? 'bg-white border-gray-200/60 shadow-sm' : 'bg-slate-900/60 backdrop-blur-xl border-slate-700/50'
      )}>
        <div className="flex items-center gap-3 mb-4">
          <Trophy className={cn("h-6 w-6", isClean ? 'text-amber-600' : 'text-yellow-400')} />
          <h3 className={cn("text-xl font-bold", isClean ? 'text-gray-900' : 'text-white')}>Top Criativos</h3>
        </div>
        <p className={cn("text-sm text-center py-8", isClean ? 'text-gray-400' : 'text-slate-500')}>
          Nenhum criativo com leads no período selecionado
        </p>
      </div>
    );
  }

  return (
    <div className={cn(
      "rounded-2xl p-6 border",
      isClean ? 'bg-white border-gray-200/60 shadow-sm' : 'bg-slate-900/60 backdrop-blur-xl border-slate-700/50'
    )}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Trophy className={cn("h-6 w-6", isClean ? 'text-amber-600' : 'text-yellow-400')} />
          <div>
            <h3 className={cn("text-xl font-bold", isClean ? 'text-gray-900' : 'text-white')}>Top Criativos</h3>
            <p className={cn("text-xs", isClean ? 'text-gray-500' : 'text-slate-400')}>Melhor custo por lead no período</p>
          </div>
        </div>
        <span className={cn(
          "text-[10px] px-2 py-1 rounded",
          isClean ? 'text-gray-500 bg-gray-100' : 'text-slate-500 bg-slate-800/50'
        )}>
          {filtroData.dataInicio} — {filtroData.dataFim}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {criativos.map((criativo, index) => (
          <div
            key={criativo.id}
            className={cn(
              "relative rounded-xl border overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-xl group",
              isClean
                ? `border-gray-200/60 bg-white shadow-sm`
                : `${medalBorders[index]} bg-slate-800/40 backdrop-blur-xl`
            )}
          >
            {/* Posição / Medal */}
            <div className={`absolute top-3 left-3 z-10 w-7 h-7 rounded-full bg-gradient-to-br ${medalColors[index]} flex items-center justify-center shadow-lg`}>
              <span className="text-xs font-black text-white">{index + 1}</span>
            </div>

            {/* Thumbnail */}
            <div className={cn("relative h-36 overflow-hidden", isClean ? 'bg-gray-100' : 'bg-slate-700/50')}>
              {criativo.thumbnail_url ? (
                <img
                  src={criativo.thumbnail_url}
                  alt={criativo.nome}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    // Fallback se imagem falhar — esconder imagem e usar ícone
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <ImageIcon className={cn("h-10 w-10", isClean ? 'text-gray-300' : 'text-slate-600')} />
                </div>
              )}
              {/* Overlay gradient */}
              <div className={cn(
                "absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t to-transparent",
                isClean ? 'from-white/90' : 'from-slate-800/90'
              )} />
            </div>

            {/* Info */}
            <div className="p-3 space-y-2">
              <div>
                <h4 className={cn("text-sm font-bold truncate", isClean ? 'text-gray-900' : 'text-white')} title={criativo.nome}>
                  {criativo.nome}
                </h4>
                <div className="mt-1 space-y-0.5">
                  <p className="text-[10px] truncate" title={`Funil: ${criativo.funil_nome}`}>
                    <span className={cn(isClean ? 'text-gray-400' : 'text-slate-500')}>Funil:</span>{' '}
                    <span className={cn(isClean ? 'text-amber-600' : 'text-cyan-400/80')}>{criativo.funil_nome}</span>
                  </p>
                  <p className="text-[10px] truncate" title={`Campanha: ${criativo.campanha_nome}`}>
                    <span className={cn(isClean ? 'text-gray-400' : 'text-slate-500')}>Camp:</span>{' '}
                    <span className={cn(isClean ? 'text-blue-500' : 'text-blue-400/80')}>{criativo.campanha_nome}</span>
                  </p>
                  <p className="text-[10px] truncate" title={`Conjunto: ${criativo.conjunto_nome}`}>
                    <span className={cn(isClean ? 'text-gray-400' : 'text-slate-500')}>Conj:</span>{' '}
                    <span className={cn(isClean ? 'text-purple-500' : 'text-purple-400/80')}>{criativo.conjunto_nome}</span>
                  </p>
                </div>
              </div>

              {/* CPL destaque */}
              <div className={`text-center py-2 rounded-lg bg-gradient-to-r ${medalColors[index]} bg-opacity-10`}
                style={{ background: `linear-gradient(to right, ${index === 0 ? 'rgba(250,204,21,0.1)' : index === 1 ? 'rgba(148,163,184,0.1)' : index === 2 ? 'rgba(251,146,60,0.1)' : 'rgba(34,211,238,0.1)'}, transparent)` }}
              >
                <p className={cn("text-[10px] uppercase tracking-wider font-medium", isClean ? 'text-gray-500' : 'text-slate-400')}>Custo por Lead</p>
                <p className={cn("text-lg font-black", isClean ? 'text-gray-900' : 'text-white')}>
                  R$ {criativo.cpl.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2">
                <div className={cn(
                  "flex items-center gap-1.5 rounded-md px-2 py-1.5",
                  isClean ? 'bg-gray-50' : 'bg-slate-700/30'
                )}>
                  <DollarSign className={cn("h-3 w-3 flex-shrink-0", isClean ? 'text-blue-500' : 'text-blue-400')} />
                  <div>
                    <p className={cn("text-[9px]", isClean ? 'text-gray-400' : 'text-slate-500')}>Investido</p>
                    <p className={cn("text-xs font-bold", isClean ? 'text-gray-800' : 'text-white')}>
                      R$ {criativo.investimento.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </p>
                  </div>
                </div>
                <div className={cn(
                  "flex items-center gap-1.5 rounded-md px-2 py-1.5",
                  isClean ? 'bg-gray-50' : 'bg-slate-700/30'
                )}>
                  <Users className={cn("h-3 w-3 flex-shrink-0", isClean ? 'text-green-500' : 'text-green-400')} />
                  <div>
                    <p className={cn("text-[9px]", isClean ? 'text-gray-400' : 'text-slate-500')}>Leads</p>
                    <p className={cn("text-xs font-bold", isClean ? 'text-gray-800' : 'text-white')}>{criativo.leads}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
