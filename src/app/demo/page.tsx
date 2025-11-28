'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import TabelaHierarquica from '@/components/dashboard/TabelaHierarquica';
import { 
  TrendingUp, 
  Users, 
  MousePointer, 
  Target, 
  DollarSign, 
  Zap,
  Calendar,
  BarChart3,
  Filter
} from 'lucide-react';
import type { 
  FiltrosDashboard, 
  DashboardResponse, 
  HierarquiaItem 
} from '@/types/hierarchical';

// Função utilitária para obter datas
function getCurrentDate(): string {
  return new Date().toISOString().split('T')[0];
}

function getDateDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
}

export default function DashboardSimples() {
  const [filtros, setFiltros] = useState<FiltrosDashboard>({
    periodo_inicio: getDateDaysAgo(30),
    periodo_fim: getCurrentDate(),
  });

  const [nivelSelecionado, setNivelSelecionado] = useState<string>('geral');

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

  const aplicarPeriodoPreset = (dias: number) => {
    setFiltros({
      ...filtros,
      periodo_inicio: getDateDaysAgo(dias),
      periodo_fim: getCurrentDate(),
    });
  };

  const handleItemHierarquiaClick = (item: HierarquiaItem) => {
    setNivelSelecionado(`${item.tipo}: ${item.nome}`);
    
    // Simular filtro por item
    const novosFiltros = { ...filtros };
    if (item.tipo === 'funil') {
      novosFiltros.funil_id = item.id;
    } else if (item.tipo === 'campanha') {
      novosFiltros.campanha_id = item.id;
    }
    setFiltros(novosFiltros);
  };

  // Dados fixos para demonstração
  const dashboardData: DashboardResponse = {
    metricas: {
      alcance: 125800,
      impressoes: 245600,
      cliques: 5420,
      visualizacoes_pagina: 3280,
      leads: 312,
      checkouts: 89,
      vendas: 34,
      investimento: 4500,
      faturamento: 16800,
      roas: 3.73,
      ctr: 2.21,
      cpm: 18.32,
      cpc: 0.83,
      cpl: 14.42,
      taxa_conversao: 10.90,
    },
    series_tempo: [],
    hierarquia: [
      {
        id: 'f1111111-1111-1111-1111-111111111111',
        nome: 'Masterclass de Vendas',
        tipo: 'funil',
        nivel: 0,
        metricas: {
          alcance: 125800,
          impressoes: 245600,
          cliques: 5420,
          visualizacoes_pagina: 3280,
          leads: 312,
          checkouts: 89,
          vendas: 34,
          investimento: 4500,
          faturamento: 16800,
          roas: 3.73,
          ctr: 2.21,
          cpm: 18.32,
          cpc: 0.83,
          cpl: 14.42,
          taxa_conversao: 10.90,
        },
        status_performance: 'excelente',
        expandido: true,
        children: [
          {
            id: 'c1111111-1111-1111-1111-111111111111',
            nome: 'Campanha Março 2025',
            tipo: 'campanha',
            nivel: 1,
            parent_id: 'f1111111-1111-1111-1111-111111111111',
            metricas: {
              alcance: 89500,
              impressoes: 178400,
              cliques: 3850,
              visualizacoes_pagina: 2340,
              leads: 215,
              checkouts: 58,
              vendas: 22,
              investimento: 3200,
              faturamento: 11200,
              roas: 3.50,
              ctr: 2.16,
              cpm: 17.93,
              cpc: 0.83,
              cpl: 14.88,
              taxa_conversao: 10.23,
            },
            status_performance: 'excelente',
            children: [
              {
                id: '11111111-1111-1111-1111-111111111111',
                nome: 'Mulheres 25-35 RJ/SP',
                tipo: 'conjunto',
                nivel: 2,
                parent_id: 'c1111111-1111-1111-1111-111111111111',
                metricas: {
                  alcance: 58200,
                  impressoes: 115600,
                  cliques: 2180,
                  visualizacoes_pagina: 1450,
                  leads: 138,
                  checkouts: 32,
                  vendas: 12,
                  investimento: 1800,
                  faturamento: 7200,
                  roas: 4.0,
                  ctr: 1.89,
                  cpm: 15.57,
                  cpc: 0.83,
                  cpl: 13.04,
                  taxa_conversao: 8.70,
                },
                status_performance: 'excelente',
                children: [
                  {
                    id: '1c111111-1111-1111-1111-111111111111',
                    nome: 'Vídeo Depoimento Principal',
                    tipo: 'criativo',
                    nivel: 3,
                    parent_id: '11111111-1111-1111-1111-111111111111',
                    metricas: {
                      alcance: 32800,
                      impressoes: 65200,
                      cliques: 1250,
                      visualizacoes_pagina: 890,
                      leads: 78,
                      checkouts: 18,
                      vendas: 7,
                      investimento: 980,
                      faturamento: 4200,
                      roas: 4.29,
                      ctr: 1.92,
                      cpm: 15.03,
                      cpc: 0.78,
                      cpl: 12.56,
                      taxa_conversao: 8.97,
                    },
                    status_performance: 'excelente',
                    children: [],
                  },
                  {
                    id: '2c222222-2222-2222-2222-222222222222',
                    nome: 'Carrossel Benefícios',
                    tipo: 'criativo',
                    nivel: 3,
                    parent_id: '11111111-1111-1111-1111-111111111111',
                    metricas: {
                      alcance: 25400,
                      impressoes: 50400,
                      cliques: 930,
                      visualizacoes_pagina: 560,
                      leads: 60,
                      checkouts: 14,
                      vendas: 5,
                      investimento: 820,
                      faturamento: 3000,
                      roas: 3.66,
                      ctr: 1.85,
                      cpm: 16.27,
                      cpc: 0.88,
                      cpl: 13.67,
                      taxa_conversao: 8.33,
                    },
                    status_performance: 'excelente',
                    children: [],
                  },
                ],
              },
              {
                id: '22222222-2222-2222-2222-222222222222',
                nome: 'Lookalike 1% Clientes',
                tipo: 'conjunto',
                nivel: 2,
                parent_id: 'c1111111-1111-1111-1111-111111111111',
                metricas: {
                  alcance: 31300,
                  impressoes: 62800,
                  cliques: 1670,
                  visualizacoes_pagina: 890,
                  leads: 77,
                  checkouts: 26,
                  vendas: 10,
                  investimento: 1400,
                  faturamento: 4000,
                  roas: 2.86,
                  ctr: 2.66,
                  cpm: 22.29,
                  cpc: 0.84,
                  cpl: 18.18,
                  taxa_conversao: 12.99,
                },
                status_performance: 'bom',
                children: [
                  {
                    id: '3c333333-3333-3333-3333-333333333333',
                    nome: 'Imagem + CTA Urgência',
                    tipo: 'criativo',
                    nivel: 3,
                    parent_id: '22222222-2222-2222-2222-222222222222',
                    metricas: {
                      alcance: 31300,
                      impressoes: 62800,
                      cliques: 1670,
                      visualizacoes_pagina: 890,
                      leads: 77,
                      checkouts: 26,
                      vendas: 10,
                      investimento: 1400,
                      faturamento: 4000,
                      roas: 2.86,
                      ctr: 2.66,
                      cpm: 22.29,
                      cpc: 0.84,
                      cpl: 18.18,
                      taxa_conversao: 12.99,
                    },
                    status_performance: 'bom',
                    children: [],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'f2222222-2222-2222-2222-222222222222',
        nome: 'Funil de Aplicação',
        tipo: 'funil',
        nivel: 0,
        metricas: {
          alcance: 85600,
          impressoes: 156800,
          cliques: 2840,
          visualizacoes_pagina: 1680,
          leads: 156,
          checkouts: 42,
          vendas: 18,
          investimento: 2800,
          faturamento: 8400,
          roas: 3.00,
          ctr: 1.81,
          cpm: 17.86,
          cpc: 0.99,
          cpl: 17.95,
          taxa_conversao: 11.54,
        },
        status_performance: 'bom',
        expandido: false,
        children: [],
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Painel Hierárquico
            </h1>
            <p className="text-gray-400 mt-2">Lídia Cabral Consultoria</p>
          </div>
          <Badge variant="outline" className="border-purple-500 text-purple-400">
            {nivelSelecionado}
          </Badge>
        </div>

        <div className="space-y-6">
          {/* Filtros Simplificados */}
          <Card className="border-0 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-green-500/10 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-purple-400" />
                Filtros de Período
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Período */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Data Início</label>
                  <Input
                    type="date"
                    value={filtros.periodo_inicio}
                    onChange={(e) => setFiltros({ ...filtros, periodo_inicio: e.target.value })}
                    className="bg-gray-800/50 border-gray-600"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Data Fim</label>
                  <Input
                    type="date"
                    value={filtros.periodo_fim}
                    onChange={(e) => setFiltros({ ...filtros, periodo_fim: e.target.value })}
                    className="bg-gray-800/50 border-gray-600"
                  />
                </div>

                {/* Presets */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Períodos Rápidos</label>
                  <div className="flex gap-2">
                    {[7, 15, 30, 90].map(dias => (
                      <Button
                        key={dias}
                        variant="outline"
                        size="sm"
                        onClick={() => aplicarPeriodoPreset(dias)}
                        className="border-gray-600 hover:bg-purple-600/20"
                      >
                        {dias}d
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Info */}
                <div className="flex items-end">
                  <div className="text-sm text-gray-400">
                    <p>Visualizando: {nivelSelecionado}</p>
                    <p className="text-xs mt-1">Clique nos itens para filtrar</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cards de métricas principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <Card className="border-0 bg-gradient-to-br from-purple-600/20 to-blue-600/20 backdrop-blur-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-purple-600 rounded-lg flex items-center justify-center">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Alcance</p>
                    <p className="text-white font-semibold text-lg">{formatarNumero(dashboardData.metricas.alcance)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-gradient-to-br from-blue-600/20 to-cyan-600/20 backdrop-blur-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center">
                    <MousePointer className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">CTR</p>
                    <p className="text-white font-semibold text-lg">{dashboardData.metricas.ctr.toFixed(2)}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-gradient-to-br from-green-600/20 to-emerald-600/20 backdrop-blur-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-green-600 rounded-lg flex items-center justify-center">
                    <Target className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Leads</p>
                    <p className="text-white font-semibold text-lg">{dashboardData.metricas.leads}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-gradient-to-br from-orange-600/20 to-red-600/20 backdrop-blur-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-orange-600 rounded-lg flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Investimento</p>
                    <p className="text-white font-semibold text-lg">{formatarMoeda(dashboardData.metricas.investimento)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-gradient-to-br from-yellow-600/20 to-orange-600/20 backdrop-blur-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-yellow-600 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">ROAS</p>
                    <p className={`font-semibold text-lg ${dashboardData.metricas.roas >= 2 ? 'text-green-400' : 'text-red-400'}`}>
                      {dashboardData.metricas.roas.toFixed(2)}x
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-gradient-to-br from-pink-600/20 to-purple-600/20 backdrop-blur-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-pink-600 rounded-lg flex items-center justify-center">
                    <Zap className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Vendas</p>
                    <p className="text-white font-semibold text-lg">{dashboardData.metricas.vendas}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabela Hierárquica */}
          <TabelaHierarquica
            hierarquia={dashboardData.hierarquia || []}
            onItemClick={handleItemHierarquiaClick}
            isLoading={false}
          />
        </div>
      </div>
    </div>
  );
}