'use client';

import { useState } from 'react';
import { ChevronRight, ChevronDown, TrendingUp, TrendingDown, Target, Eye, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { HierarquiaItem, MetricasAgregadas } from '@/types/hierarchical';

interface Props {
  hierarquia: HierarquiaItem[];
  onItemClick?: (item: HierarquiaItem) => void;
  isLoading?: boolean;
}

export default function TabelaHierarquica({ hierarquia, onItemClick, isLoading = false }: Props) {
  const [expandidos, setExpandidos] = useState<Set<string>>(new Set());

  const toggleExpansao = (itemId: string) => {
    const novosExpandidos = new Set(expandidos);
    if (expandidos.has(itemId)) {
      novosExpandidos.delete(itemId);
    } else {
      novosExpandidos.add(itemId);
    }
    setExpandidos(novosExpandidos);
  };

  const getIconePorTipo = (tipo: string) => {
    switch (tipo) {
      case 'funil': return Target;
      case 'campanha': return Zap;
      case 'conjunto': return TrendingUp;
      case 'criativo': return Eye;
      default: return Target;
    }
  };

  const getCorStatus = (status: string) => {
    switch (status) {
      case 'excelente': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'bom': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'medio': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'ruim': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(valor);
  };

  const formatarNumero = (valor: number) => {
    if (valor >= 1000000) {
      return `${(valor / 1000000).toFixed(1)}M`;
    }
    if (valor >= 1000) {
      return `${(valor / 1000).toFixed(1)}K`;
    }
    return valor.toString();
  };

  const formatarPercentual = (valor: number) => {
    return `${valor.toFixed(2)}%`;
  };

  const renderMetricas = (metricas: MetricasAgregadas, isCompacto = false) => {
    if (isCompacto) {
      return (
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <span className="text-gray-400">ROAS:</span>
            <span className={`font-semibold ${metricas.roas >= 2 ? 'text-green-400' : 'text-red-400'}`}>
              {metricas.roas.toFixed(2)}x
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-gray-400">Invest:</span>
            <span className="font-medium text-white">{formatarMoeda(metricas.investimento)}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-gray-400">Leads:</span>
            <span className="font-medium text-blue-400">{formatarNumero(metricas.leads)}</span>
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-sm">
        <div>
          <div className="text-gray-400">Alcance</div>
          <div className="font-semibold text-purple-400">{formatarNumero(metricas.alcance)}</div>
        </div>
        <div>
          <div className="text-gray-400">Cliques</div>
          <div className="font-semibold text-blue-400">{formatarNumero(metricas.cliques)}</div>
        </div>
        <div>
          <div className="text-gray-400">CTR</div>
          <div className={`font-semibold ${metricas.ctr >= 2 ? 'text-green-400' : 'text-yellow-400'}`}>
            {formatarPercentual(metricas.ctr)}
          </div>
        </div>
        <div>
          <div className="text-gray-400">Leads</div>
          <div className="font-semibold text-cyan-400">{formatarNumero(metricas.leads)}</div>
        </div>
        <div>
          <div className="text-gray-400">Investimento</div>
          <div className="font-semibold text-orange-400">{formatarMoeda(metricas.investimento)}</div>
        </div>
        <div>
          <div className="text-gray-400">ROAS</div>
          <div className={`font-semibold ${metricas.roas >= 2 ? 'text-green-400' : 'text-red-400'}`}>
            {metricas.roas.toFixed(2)}x
          </div>
        </div>
      </div>
    );
  };

  const renderItem = (item: HierarquiaItem) => {
    const temFilhos = item.children && item.children.length > 0;
    const estaExpandido = expandidos.has(item.id);
    const Icone = getIconePorTipo(item.tipo);
    const indentacao = `ml-${item.nivel * 6}`;

    return (
      <div key={item.id} className="border-b border-gray-800 last:border-b-0">
        {/* Item principal */}
        <div
          className={`p-4 hover:bg-gray-800/50 transition-colors cursor-pointer ${indentacao}`}
          onClick={() => {
            if (temFilhos) {
              toggleExpansao(item.id);
            }
            onItemClick?.(item);
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              {/* Botão de expandir/colapsar */}
              {temFilhos && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-gray-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpansao(item.id);
                  }}
                >
                  {estaExpandido ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              )}

              {/* Ícone do tipo */}
              <div className="h-8 w-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <Icone className="h-4 w-4 text-white" />
              </div>

              {/* Nome e status */}
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-white">{item.nome}</h3>
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${getCorStatus(item.status_performance)}`}
                  >
                    {item.status_performance}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {item.tipo}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Performance rápida */}
            <div className="text-right">
              <div className="flex items-center gap-2">
                <span className={`text-lg font-bold ${item.metricas.roas >= 2 ? 'text-green-400' : 'text-red-400'}`}>
                  {item.metricas.roas.toFixed(2)}x
                </span>
                {item.metricas.roas >= 2 ? (
                  <TrendingUp className="h-4 w-4 text-green-400" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-400" />
                )}
              </div>
              <div className="text-sm text-gray-400">
                {formatarMoeda(item.metricas.faturamento)}
              </div>
            </div>
          </div>

          {/* Métricas detalhadas */}
          {renderMetricas(item.metricas, item.nivel > 0)}
        </div>

        {/* Filhos (quando expandido) */}
        {temFilhos && estaExpandido && (
          <div className="bg-gray-900/30">
            {item.children?.map(filho => renderItem(filho))}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card className="border-0 bg-gray-900/50 backdrop-blur-xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!hierarquia || hierarquia.length === 0) {
    return (
      <Card className="border-0 bg-gray-900/50 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-purple-400" />
            Estrutura Hierárquica
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-400">
            <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum dado encontrado para o período selecionado.</p>
            <p className="text-sm mt-2">Ajuste os filtros ou adicione campanhas.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 bg-gray-900/50 backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-purple-400" />
          Estrutura Hierárquica
          <Badge variant="secondary" className="ml-2">
            {hierarquia.length} funis
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-[600px] overflow-y-auto">
          {hierarquia.map(item => renderItem(item))}
        </div>
      </CardContent>
    </Card>
  );
}