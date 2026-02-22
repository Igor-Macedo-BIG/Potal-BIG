'use client';

import { useState, useEffect } from 'react';
import { GitBranch, Users, TrendingDown, Trophy, XCircle, Loader2, Clock } from 'lucide-react';

// ============================================
// Tipos
// ============================================

interface FunnelStage {
  stage_id: number;
  stage_nome: string;
  quantidade: number;
  valor: number;
  nomes_leads: string;
  percentual_total: number;
  taxa_conversao: number;
  color: string;
  tipo: 'active' | 'won' | 'lost';
  sort: number;
}

interface FunnelData {
  pipeline: { id: string; pipeline_id_kommo: number; nome: string };
  funil: FunnelStage[];
  resumo: {
    total_leads: number;
    total_estagios: number;
    taxa_geral_conversao: number;
    departamento: string;
  };
  ultima_sync?: string | null;
}

interface KommoFunnelProps {
  pipelineId?: string;
  pipelineKommoId?: number;
  departamento?: 'sdr' | 'closer' | 'all';
  dataInicio?: string;
  dataFim?: string;
  compact?: boolean;
}

// ============================================
// Componente
// ============================================

export function KommoFunnel({
  pipelineId,
  pipelineKommoId,
  departamento = 'all',
  dataInicio,
  dataFim,
  compact = false,
}: KommoFunnelProps) {
  const [data, setData] = useState<FunnelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredStage, setHoveredStage] = useState<number | null>(null);

  useEffect(() => {
    const fetchFunnel = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (pipelineId) params.set('pipeline_id', pipelineId);
        if (pipelineKommoId) params.set('pipeline_kommo_id', pipelineKommoId.toString());
        if (departamento) params.set('departamento', departamento);
        if (dataInicio) params.set('data_inicio', dataInicio);
        if (dataFim) params.set('data_fim', dataFim);

        const res = await fetch(`/api/kommo/funnel?${params.toString()}`);
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Erro ao carregar funil');
        }
        const result = await res.json();
        setData(result);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchFunnel();
  }, [pipelineId, pipelineKommoId, departamento, dataInicio, dataFim]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-purple-400" />
        <span className="text-gray-400 text-sm ml-2">Carregando funil...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-4 text-gray-500 text-sm">
        <p>{error}</p>
      </div>
    );
  }

  if (!data || data.funil.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500 text-sm">
        <GitBranch className="h-5 w-5 mx-auto mb-1 opacity-50" />
        <p>Sem dados de funil. Sincronize o Kommo primeiro.</p>
      </div>
    );
  }

  const maxQtd = Math.max(...data.funil.map(s => s.quantidade), 1);

  // Formatar última sync
  const formatUltimaSync = (isoDate: string | null | undefined) => {
    if (!isoDate) return null;
    try {
      const date = new Date(isoDate);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMin = Math.floor(diffMs / 60000);
      const diffHrs = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);
      if (diffMin < 1) return 'agora mesmo';
      if (diffMin < 60) return `há ${diffMin}min`;
      if (diffHrs < 24) return `há ${diffHrs}h`;
      return `há ${diffDays}d`;
    } catch { return null; }
  };

  // Separar estágios ativos, ganhos e perdidos
  const activeStages = data.funil.filter(s => s.tipo === 'active');
  const wonStages = data.funil.filter(s => s.tipo === 'won');
  const lostStages = data.funil.filter(s => s.tipo === 'lost');

  const getStageColor = (stage: FunnelStage) => {
    if (stage.tipo === 'won') return 'from-emerald-500/30 to-emerald-600/10';
    if (stage.tipo === 'lost') return 'from-red-500/30 to-red-600/10';
    
    // Gradiente baseado na posição no funil
    const ratio = stage.quantidade / maxQtd;
    if (ratio > 0.6) return 'from-purple-500/30 to-purple-600/10';
    if (ratio > 0.3) return 'from-blue-500/30 to-blue-600/10';
    return 'from-cyan-500/30 to-cyan-600/10';
  };

  const getBorderColor = (stage: FunnelStage) => {
    if (stage.tipo === 'won') return 'border-emerald-500/40';
    if (stage.tipo === 'lost') return 'border-red-500/40';
    return 'border-purple-500/30';
  };

  const getIcon = (stage: FunnelStage) => {
    if (stage.tipo === 'won') return <Trophy className="h-3.5 w-3.5 text-emerald-400" />;
    if (stage.tipo === 'lost') return <XCircle className="h-3.5 w-3.5 text-red-400" />;
    return <Users className="h-3.5 w-3.5 text-purple-400" />;
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-purple-400" />
          <span className="text-sm font-semibold text-white">
            Pipeline: {data.pipeline.nome}
          </span>
          {departamento !== 'all' && (
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${
              departamento === 'sdr' ? 'bg-blue-500/20 text-blue-300' : 'bg-orange-500/20 text-orange-300'
            }`}>
              {departamento.toUpperCase()}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span>{data.resumo.total_leads} leads</span>
          <span className="text-emerald-400">{data.resumo.taxa_geral_conversao}% conversão geral</span>
          {data.ultima_sync && formatUltimaSync(data.ultima_sync) && (
            <span className="flex items-center gap-1 text-gray-500" title={`Última sync: ${new Date(data.ultima_sync).toLocaleString('pt-BR')}`}>
              <Clock className="h-3 w-3" />
              {formatUltimaSync(data.ultima_sync)}
            </span>
          )}
        </div>
      </div>

      {/* Funil visual - barras horizontais */}
      <div className="space-y-1">
        {activeStages.map((stage, index) => {
          const widthPercent = maxQtd > 0 ? Math.max((stage.quantidade / maxQtd) * 100, 8) : 8;
          const isHovered = hoveredStage === stage.stage_id;

          return (
            <div
              key={stage.stage_id}
              onMouseEnter={() => setHoveredStage(stage.stage_id)}
              onMouseLeave={() => setHoveredStage(null)}
              className="relative group"
            >
              <div className="flex items-center gap-2">
                {/* Barra do funil */}
                <div className="flex-1 relative">
                  <div
                    className={`relative h-${compact ? '8' : '10'} rounded-lg border ${getBorderColor(stage)} bg-gradient-to-r ${getStageColor(stage)} transition-all duration-300 ${isHovered ? 'scale-[1.01] shadow-lg shadow-purple-500/10' : ''}`}
                    style={{ width: `${widthPercent}%`, minWidth: '120px' }}
                  >
                    <div className="absolute inset-0 flex items-center justify-between px-3">
                      <div className="flex items-center gap-2">
                        {getIcon(stage)}
                        <span className="text-white text-xs font-medium truncate">{stage.stage_nome}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-white text-xs font-bold">{stage.quantidade}</span>
                        {!compact && stage.valor > 0 && (
                          <span className="text-gray-400 text-[10px]">
                            R$ {stage.valor.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Taxa de conversão */}
                <div className="w-16 text-right">
                  {index === 0 ? (
                    <span className="text-gray-500 text-[10px]">100%</span>
                  ) : (
                    <span className={`text-[10px] font-medium ${
                      stage.taxa_conversao > 50 ? 'text-emerald-400' :
                      stage.taxa_conversao > 20 ? 'text-yellow-400' :
                      'text-red-400'
                    }`}>
                      {stage.taxa_conversao}%
                    </span>
                  )}
                </div>
              </div>

              {/* Seta de conversão entre estágios */}
              {index < activeStages.length - 1 && !compact && (
                <div className="flex items-center ml-8 my-0.5">
                  <TrendingDown className="h-3 w-3 text-gray-600 rotate-[-30deg]" />
                </div>
              )}

              {/* Tooltip com nomes */}
              {isHovered && stage.nomes_leads && !compact && (
                <div className="absolute left-0 top-full mt-1 z-10 bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-xl max-w-sm">
                  <p className="text-xs text-gray-300 font-semibold mb-1">{stage.stage_nome} — {stage.quantidade} leads</p>
                  <div className="max-h-32 overflow-y-auto">
                    {stage.nomes_leads.split('\n').filter(Boolean).slice(0, 15).map((nome, i) => (
                      <p key={i} className="text-[10px] text-gray-400 py-0.5">{nome}</p>
                    ))}
                    {stage.nomes_leads.split('\n').filter(Boolean).length > 15 && (
                      <p className="text-[10px] text-gray-500 mt-1">
                        + {stage.nomes_leads.split('\n').filter(Boolean).length - 15} mais...
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Estágios finais: Won + Lost */}
      {(wonStages.length > 0 || lostStages.length > 0) && (
        <div className={`grid ${wonStages.length > 0 && lostStages.length > 0 ? 'grid-cols-2' : 'grid-cols-1'} gap-2 mt-2`}>
          {wonStages.map((stage) => (
            <div key={stage.stage_id} className="border border-emerald-500/30 bg-emerald-500/5 rounded-lg p-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-emerald-400" />
                <div>
                  <span className="text-emerald-300 text-xs font-medium">{stage.stage_nome}</span>
                  {stage.valor > 0 && (
                    <p className="text-emerald-400/60 text-[10px]">
                      R$ {stage.valor.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                    </p>
                  )}
                </div>
              </div>
              <span className="text-emerald-400 text-lg font-bold">{stage.quantidade}</span>
            </div>
          ))}

          {lostStages.map((stage) => (
            <div key={stage.stage_id} className="border border-red-500/30 bg-red-500/5 rounded-lg p-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-400" />
                <span className="text-red-300 text-xs font-medium">{stage.stage_nome}</span>
              </div>
              <span className="text-red-400 text-lg font-bold">{stage.quantidade}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
