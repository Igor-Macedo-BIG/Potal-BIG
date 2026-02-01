'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Users, MousePointerClick, ShoppingCart, DollarSign } from 'lucide-react';
import { MetricaFilter } from '@/components/public/MetricaFilter';

interface Cliente {
  id: string;
  nome: string;
  logo_url?: string;
  cor_primaria?: string;
  cor_secundaria?: string;
}

interface Metrica {
  impressoes: number;
  cliques: number;
  ctr: number;
  cpc: number;
  conversoes: number;
  custo: number;
  receita: number;
  roas: number;
  data: string;
  campanhas: {
    nome: string;
  };
  funis: {
    nome: string;
  };
}

interface PublicDashboardProps {
  cliente: Cliente;
  metricas: Metrica[];
}

export default function PublicDashboard({ cliente, metricas }: PublicDashboardProps) {
  const [totais, setTotais] = useState({
    impressoes: 0,
    cliques: 0,
    conversoes: 0,
    custo: 0,
    receita: 0,
    roas: 0,
    ctr: 0,
    cpc: 0,
  });

  useEffect(() => {
    if (metricas && metricas.length > 0) {
      const totais = metricas.reduce(
        (acc, m) => ({
          impressoes: acc.impressoes + (m.impressoes || 0),
          cliques: acc.cliques + (m.cliques || 0),
          conversoes: acc.conversoes + (m.conversoes || 0),
          custo: acc.custo + (m.custo || 0),
          receita: acc.receita + (m.receita || 0),
          roas: 0,
          ctr: 0,
          cpc: 0,
        }),
        { impressoes: 0, cliques: 0, conversoes: 0, custo: 0, receita: 0, roas: 0, ctr: 0, cpc: 0 }
      );

      totais.roas = totais.custo > 0 ? totais.receita / totais.custo : 0;
      totais.ctr = totais.impressoes > 0 ? (totais.cliques / totais.impressoes) * 100 : 0;
      totais.cpc = totais.cliques > 0 ? totais.custo / totais.cliques : 0;

      setTotais(totais);
    }
  }, [metricas]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 md:p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            {cliente.logo_url && (
              <img 
                src={cliente.logo_url} 
                alt={cliente.nome}
                className="h-16 w-16 object-contain rounded-lg bg-white p-2"
              />
            )}
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white">
                {cliente.nome}
              </h1>
              <p className="text-purple-300 mt-1">Dashboard de Performance</p>
            </div>
          </div>
        </div>

        <div className="h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 rounded-full" />
      </div>

      {/* MÃ©tricas Principais */}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* ImpressÃµes */}
          <MetricaFilter metricaKey="impressoes">
            <Card className="bg-white/10 backdrop-blur-lg border-purple-500/20">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-sm font-medium">
                    ImpressÃµes
                  </CardTitle>
                  <Users className="h-5 w-5 text-purple-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {formatNumber(totais.impressoes)}
                </div>
                <p className="text-purple-300 text-xs mt-1">
                  Total de visualizaÃ§Ãµes
                </p>
              </CardContent>
            </Card>
          </MetricaFilter>

          {/* Cliques */}
          <MetricaFilter metricaKey="cliques">
            <Card className="bg-white/10 backdrop-blur-lg border-purple-500/20">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-sm font-medium">
                    Cliques
                  </CardTitle>
                  <MousePointerClick className="h-5 w-5 text-blue-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {formatNumber(totais.cliques)}
                </div>
                <p className="text-purple-300 text-xs mt-1">
                  CTR: {formatPercent(totais.ctr)}
                </p>
              </CardContent>
            </Card>
          </MetricaFilter>

          {/* ConversÃµes */}
          <MetricaFilter metricaKey="vendas">
            <Card className="bg-white/10 backdrop-blur-lg border-purple-500/20">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-sm font-medium">
                    ConversÃµes
                  </CardTitle>
                  <ShoppingCart className="h-5 w-5 text-green-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {formatNumber(totais.conversoes)}
                </div>
                <p className="text-purple-300 text-xs mt-1">
                  Total de vendas
                </p>
              </CardContent>
            </Card>
          </MetricaFilter>

          {/* ROAS */}
          <MetricaFilter metricaKey="roas">
            <Card className="bg-white/10 backdrop-blur-lg border-purple-500/20">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-sm font-medium">
                    ROAS
                  </CardTitle>
                  <TrendingUp className="h-5 w-5 text-yellow-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {totais.roas.toFixed(2)}x
                </div>
                <p className="text-purple-300 text-xs mt-1">
                  Retorno sobre investimento
                </p>
              </CardContent>
            </Card>
          </MetricaFilter>
        </div>

        {/* MÃ©tricas Financeiras */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Investimento */}
          <MetricaFilter metricaKey="investimento">
            <Card className="bg-white/10 backdrop-blur-lg border-purple-500/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-sm font-medium">
                  Investimento Total
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-400">
                  {formatCurrency(totais.custo)}
                </div>
                <p className="text-purple-300 text-xs mt-1">
                  CPC: {formatCurrency(totais.cpc)}
                </p>
              </CardContent>
            </Card>
          </MetricaFilter>

          {/* Receita */}
          <MetricaFilter metricaKey="faturamento">
            <Card className="bg-white/10 backdrop-blur-lg border-purple-500/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-sm font-medium">
                  Receita Total
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-400">
                  {formatCurrency(totais.receita)}
                </div>
                <p className="text-purple-300 text-xs mt-1">
                  Faturamento gerado
                </p>
              </CardContent>
            </Card>
          </MetricaFilter>

          {/* Lucro */}
          <Card className="bg-white/10 backdrop-blur-lg border-purple-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-sm font-medium">
                Lucro LÃ­quido
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${totais.receita - totais.custo > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formatCurrency(totais.receita - totais.custo)}
              </div>
              <p className="text-purple-300 text-xs mt-1">
                Receita - Investimento
              </p>
            </CardContent>
          </Card>
        </div>


        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-purple-300 text-sm">
            Dashboard atualizado automaticamente com as Ãºltimas mÃ©tricas
          </p>
        </div>
      </div>
    </div>
  );
}
