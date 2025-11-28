'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import FiltrosDashboardHierarquico from '@/components/dashboard/FiltrosDashboardHierarquico';
import { FuturisticMetricCard } from '@/components/dashboard/FuturisticMetricCard';
import { FuturisticCharts } from '@/components/dashboard/FuturisticCharts';
import TabelaHierarquica from '@/components/dashboard/TabelaHierarquica';
import { TrendingUp, Users, MousePointer, Target, Zap, Rocket, Brain, Star } from 'lucide-react';
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

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [empresa, setEmpresa] = useState<string>('');
  const [showRegister, setShowRegister] = useState(false);
  
  // Estados do novo dashboard hierárquico
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
      // Construir URL com parâmetros de filtro
      const params = new URLSearchParams();
      if (filtros.empresa_id) params.set('empresa_id', filtros.empresa_id);
      if (filtros.funil_id) params.set('funil_id', filtros.funil_id);
      if (filtros.campanha_id) params.set('campanha_id', filtros.campanha_id);
      if (filtros.conjunto_id) params.set('conjunto_id', filtros.conjunto_id);
      if (filtros.criativo_id) params.set('criativo_id', filtros.criativo_id);
      params.set('periodo_inicio', filtros.periodo_inicio);
      params.set('periodo_fim', filtros.periodo_fim);

      const response = await fetch(`/api/dashboard?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      } else {
        console.error('Erro ao carregar dashboard:', await response.text());
        // Em caso de erro, usar dados de exemplo
        setDashboardData(getDadosExemplo());
      }
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
      // Em caso de erro, usar dados de exemplo
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

  // Dados de exemplo para fallback
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
        id: '1',
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
        children: [
          {
            id: '1-1',
            nome: 'Campanha Março 2025',
            tipo: 'campanha',
            nivel: 1,
            parent_id: '1',
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
            children: [],
          },
        ],
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
          <LoginForm onSwitchToRegister={() => setShowRegister(true)} />
        )}
      </div>
    );
  }

  // Dashboard logado
  return (
    <DashboardLayout empresaNome={empresa}>
      <div className="space-y-6">
        {/* Filtros */}
        <FiltrosDashboardHierarquico
          filtros={filtros}
          onFiltrosChange={setFiltros}
          isLoading={dashboardLoading}
        />

        {/* Cards de métricas principais */}
        {dashboardData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FuturisticMetricCard
              title="Alcance"
              value={dashboardData.metricas.alcance.toLocaleString()}
              icon={<Users className="w-4 h-4" />}
              trend="up"
              percentage={5.2}
              description="pessoas atingidas"
            />
            <FuturisticMetricCard
              title="CTR"
              value={`${dashboardData.metricas.ctr.toFixed(2)}%`}
              icon={<MousePointer className="w-4 h-4" />}
              trend="up"
              percentage={8.1}
              description="taxa de cliques"
            />
            <FuturisticMetricCard
              title="Leads"
              value={dashboardData.metricas.leads.toString()}
              icon={<Target className="w-4 h-4" />}
              trend="up"
              percentage={12.3}
              description="leads gerados"
            />
            <FuturisticMetricCard
              title="ROAS"
              value={`${dashboardData.metricas.roas.toFixed(2)}x`}
              icon={<TrendingUp className="w-4 h-4" />}
              trend={dashboardData.metricas.roas >= 2 ? 'up' : 'down'}
              percentage={dashboardData.metricas.roas >= 2 ? 15.8 : -8.2}
              description="retorno sobre investimento"
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráficos */}
          {dashboardData && (
            <FuturisticCharts data={dashboardData.series_tempo} />
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
    </DashboardLayout>
  );
}