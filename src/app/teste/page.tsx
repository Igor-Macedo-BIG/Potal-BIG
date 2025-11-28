'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import FiltrosDashboardHierarquico from '@/components/dashboard/FiltrosDashboardHierarquico';
import TabelaHierarquica from '@/components/dashboard/TabelaHierarquica';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Users, MousePointer, Target, DollarSign, Zap } from 'lucide-react';
import type { Session } from '@supabase/supabase-js';
import type { 
  FiltrosDashboard, 
  DashboardResponse, 
  MetricasAgregadas,
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

export default function DashboardHierarquico() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [empresa, setEmpresa] = useState<string>('');
  const [showRegister, setShowRegister] = useState(false);
  
  // Estados do dashboard hierárquico
  const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [filtros, setFiltros] = useState<FiltrosDashboard>({
    periodo_inicio: getDateDaysAgo(30),
    periodo_fim: getCurrentDate(),
  });

  useEffect(() => {
    // Verificar sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        buscarEmpresaUsuario(session.user.id);
      }
      setLoading(false);
    });

    // Escutar mudanças na autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        buscarEmpresaUsuario(session.user.id);
      } else {
        setEmpresa('');
        setDashboardData(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Carregar dados do dashboard quando filtros mudarem
  useEffect(() => {
    if (session) {
      carregarDashboard();
    }
  }, [session, filtros]);

  const buscarEmpresaUsuario = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('empresa:empresas(nome)')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Erro ao buscar empresa:', error);
        return;
      }

      if (data?.empresa) {
        setEmpresa((data.empresa as any).nome);
      }
    } catch (error) {
      console.error('Erro ao buscar empresa:', error);
    }
  };

  const carregarDashboard = async () => {
    setDashboardLoading(true);
    try {
      // Por enquanto, usar dados de exemplo enquanto a API não está pronta
      setDashboardData(getDadosExemplo());
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
      setDashboardData(getDadosExemplo());
    } finally {
      setDashboardLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleItemHierarquiaClick = (item: HierarquiaItem) => {
    // Atualizar filtros baseado no item clicado
    const novosFiltros = { ...filtros };
    
    if (item.tipo === 'funil') {
      novosFiltros.funil_id = item.id;
      novosFiltros.campanha_id = undefined;
      novosFiltros.conjunto_id = undefined;
      novosFiltros.criativo_id = undefined;
    } else if (item.tipo === 'campanha') {
      novosFiltros.campanha_id = item.id;
      novosFiltros.conjunto_id = undefined;
      novosFiltros.criativo_id = undefined;
    } else if (item.tipo === 'conjunto') {
      novosFiltros.conjunto_id = item.id;
      novosFiltros.criativo_id = undefined;
    } else if (item.tipo === 'criativo') {
      novosFiltros.criativo_id = item.id;
    }

    setFiltros(novosFiltros);
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

  // Dados de exemplo
  const getDadosExemplo = (): DashboardResponse => ({
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
    series_tempo: Array.from({ length: 30 }, (_, i) => ({
      data: getDateDaysAgo(29 - i),
      investimento: Math.random() * 300 + 100,
      leads: Math.random() * 20 + 5,
      vendas: Math.random() * 5 + 1,
      cliques: Math.random() * 200 + 50,
      alcance: Math.random() * 5000 + 1000,
    })),
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
  });

  // Estados de carregamento
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  // Não logado
  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900">
        {showRegister ? (
          <RegisterForm onBackToLogin={() => setShowRegister(false)} />
        ) : (
          <LoginForm />
        )}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <button
            onClick={() => setShowRegister(!showRegister)}
            className="text-purple-400 hover:text-purple-300 transition-colors"
          >
            {showRegister ? 'Já tem conta? Entre aqui' : 'Não tem conta? Registre-se'}
          </button>
        </div>
      </div>
    );
  }

  // Dashboard logado
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Dashboard Hierárquico
            </h1>
            <p className="text-gray-400 mt-1">{empresa}</p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Sair
          </button>
        </div>

        <div className="space-y-6">
          {/* Filtros */}
          <FiltrosDashboardHierarquico
            filtros={filtros}
            onFiltrosChange={setFiltros}
            isLoading={dashboardLoading}
          />

          {/* Cards de métricas principais */}
          {dashboardData && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              <Card className="border-0 bg-gradient-to-br from-purple-600/20 to-blue-600/20 backdrop-blur-xl">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-purple-600 rounded-lg flex items-center justify-center">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Alcance</p>
                      <p className="text-white font-semibold">{formatarNumero(dashboardData.metricas.alcance)}</p>
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
                      <p className="text-white font-semibold">{dashboardData.metricas.ctr.toFixed(2)}%</p>
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
                      <p className="text-white font-semibold">{dashboardData.metricas.leads}</p>
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
                      <p className="text-white font-semibold">{formatarMoeda(dashboardData.metricas.investimento)}</p>
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
                      <p className={`font-semibold ${dashboardData.metricas.roas >= 2 ? 'text-green-400' : 'text-red-400'}`}>
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
                      <p className="text-white font-semibold">{dashboardData.metricas.vendas}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Tabela Hierárquica */}
          {dashboardData && (
            <TabelaHierarquica
              hierarquia={dashboardData.hierarquia || []}
              onItemClick={handleItemHierarquiaClick}
              isLoading={dashboardLoading}
            />
          )}
        </div>
      </div>
    </div>
  );
}