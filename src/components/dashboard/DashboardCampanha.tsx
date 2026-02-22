'use client';

import { useState, useEffect } from 'react';
import { useCampanhaContext } from '@/contexts/CampanhaContext';
import { FuturisticMetricCard } from '@/components/dashboard/FuturisticMetricCard';
import { FuturisticCampanhasTable } from '@/components/dashboard/FuturisticCampanhasTable';
import FiltrosDashboard from '@/components/dashboard/FiltrosDashboard';
import { FunilConversao } from '@/components/dashboard/FunilConversao';
import { TopCriativos } from '@/components/dashboard/TopCriativos';
import { FiltrosCascata } from '@/components/dashboard/FiltrosCascata';
import { supabase } from '@/lib/supabase';
import ModalEditarMetricas from '@/components/modals/ModalEditarMetricas';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

import { TrendingUp, Users, MousePointer, Target, Zap, Rocket, Brain, Star, Edit3, Plus, DollarSign, UserCheck, ShoppingCart, Megaphone, Phone, Handshake, HeadphonesIcon, Eye, BarChart3, Calendar, MessageCircle, Clock, Award, TrendingDown, Filter, Share2, X } from 'lucide-react';

// Componente de Abas dos Departamentos - Estilo Funil de Conversão
function DashboardTabs() {
  const { isClean } = useTheme();
  const [activeTab, setActiveTab] = useState<'trafego' | 'sdr' | 'closer' | 'social-seller' | 'cs'>('trafego');
  const [metricasSdr, setMetricasSdr] = useState({
    comecou_diagnostico: 0,
    chegaram_crm_kommo: 0,
    qualificados_mentoria: 0,
    para_downsell: 0,
    agendados_diagnostico: 0,
    agendados_mentoria: 0
  });

  // Carregar métricas SDR do banco
  useEffect(() => {
    const carregarMetricasSdr = async () => {
      try {
        const { data, error } = await supabase
          .from('metricas')
          .select('detalhe_sdr')
          .not('detalhe_sdr', 'is', null)
          .order('periodo_inicio', { ascending: false })
          .limit(30);

        if (!error && data && data.length > 0) {
          // Agregar os valores
          let totais = {
            comecou_diagnostico: 0,
            chegaram_crm_kommo: 0,
            qualificados_mentoria: 0,
            para_downsell: 0,
            agendados_diagnostico: 0,
            agendados_mentoria: 0
          };

          data.forEach((item: any) => {
            const detalhe = item.detalhe_sdr;
            if (detalhe) {
              totais.comecou_diagnostico += detalhe.comecou_diagnostico || 0;
              totais.chegaram_crm_kommo += detalhe.chegaram_crm_kommo || 0;
              totais.qualificados_mentoria += detalhe.qualificados_para_mentoria || 0;
              totais.para_downsell += detalhe.para_downsell || 0;
              totais.agendados_diagnostico += detalhe.agendados_diagnostico || 0;
              totais.agendados_mentoria += detalhe.agendados_mentoria || 0;
            }
          });

          setMetricasSdr(totais);
        }
      } catch (err) {
        console.error('Erro ao carregar métricas SDR:', err);
      }
    };

    carregarMetricasSdr();
  }, []);

  const tabs = [
    { 
      id: 'trafego' as const, 
      name: 'Tráfego', 
      icon: <Megaphone className="h-5 w-5" />,
      color: 'text-blue-400'
    },
    { 
      id: 'sdr' as const, 
      name: 'SDR', 
      icon: <Phone className="h-5 w-5" />,
      color: 'text-green-400'
    },
    { 
      id: 'closer' as const, 
      name: 'Closer', 
      icon: <Handshake className="h-5 w-5" />,
      color: 'text-purple-400'
    },
    { 
      id: 'social-seller' as const, 
      name: 'Social Seller', 
      icon: <Share2 className="h-5 w-5" />,
      color: 'text-pink-400'
    },
    { 
      id: 'cs' as const, 
      name: 'CS', 
      icon: <HeadphonesIcon className="h-5 w-5" />,
      color: 'text-orange-400'
    },
  ];

  // Dados detalhados por departamento seguindo as especificações
  const dadosDepartamento = {
    trafego: {
      title: '📊 TRÁFEGO',
      metricas: [
        { nome: 'Investimento Total', valor: 'R$ 15.250', icone: DollarSign, cor: 'text-blue-400', corFundo: 'bg-blue-500/10 border-blue-400/30' },
        { nome: 'Impressões', valor: '1.2M', icone: Eye, cor: 'text-cyan-400', corFundo: 'bg-cyan-500/10 border-cyan-400/30' },
        { nome: 'Alcance', valor: '847k', icone: Users, cor: 'text-purple-400', corFundo: 'bg-purple-500/10 border-purple-400/30' },
        { nome: 'Cliques', valor: '28.5k', icone: MousePointer, cor: 'text-green-400', corFundo: 'bg-green-500/10 border-green-400/30' },
        { nome: 'CPC (Custo por Clique)', valor: 'R$ 0,89', icone: Target, cor: 'text-yellow-400', corFundo: 'bg-yellow-500/10 border-yellow-400/30' },
        { nome: 'Visualizações', valor: '15.2k', icone: BarChart3, cor: 'text-pink-400', corFundo: 'bg-pink-500/10 border-pink-400/30' },
        { nome: 'Checkouts', valor: '2.1k', icone: ShoppingCart, cor: 'text-orange-400', corFundo: 'bg-orange-500/10 border-orange-400/30' },
        { nome: 'Leads', valor: '1.8k', icone: UserCheck, cor: 'text-emerald-400', corFundo: 'bg-emerald-500/10 border-emerald-400/30' },
        { nome: 'Custo por Lead', valor: 'R$ 8,47', icone: DollarSign, cor: 'text-blue-400', corFundo: 'bg-blue-500/10 border-blue-400/30' },
        { nome: 'Vendas', valor: '287', icone: Award, cor: 'text-yellow-400', corFundo: 'bg-yellow-500/10 border-yellow-400/30' },
        { nome: 'Custo por Venda', valor: 'R$ 53,14', icone: DollarSign, cor: 'text-red-400', corFundo: 'bg-red-500/10 border-red-400/30' },
      ]
    },
    sdr: {
      title: '📞 SDR (Pré-venda)',
      metricas: [
        { nome: 'Lead começou preencher diagnóstico', valor: metricasSdr.comecou_diagnostico.toString(), icone: Edit3, cor: 'text-cyan-400', corFundo: 'bg-cyan-500/10 border-cyan-400/30' },
        { nome: 'Leads que chegaram ao CRM Kommo', valor: metricasSdr.chegaram_crm_kommo.toString(), icone: Users, cor: 'text-blue-400', corFundo: 'bg-blue-500/10 border-blue-400/30' },
        { nome: 'Leads qualificados para Mentoria', valor: metricasSdr.qualificados_mentoria.toString(), icone: UserCheck, cor: 'text-green-400', corFundo: 'bg-green-500/10 border-green-400/30' },
        { nome: 'Leads Para Downsell', valor: metricasSdr.para_downsell.toString(), icone: TrendingDown, cor: 'text-orange-400', corFundo: 'bg-orange-500/10 border-orange-400/30' },
        { nome: 'Leads agendados para Diagnóstico', valor: metricasSdr.agendados_diagnostico.toString(), icone: Calendar, cor: 'text-purple-400', corFundo: 'bg-purple-500/10 border-purple-400/30' },
        { nome: 'Leads Agendados para Mentoria', valor: metricasSdr.agendados_mentoria.toString(), icone: Star, cor: 'text-yellow-400', corFundo: 'bg-yellow-500/10 border-yellow-400/30' },
      ]
    },
    closer: {
      title: '🤝 CLOSER (Vendas)',
      metricas: [
        { nome: 'Reuniões Realizadas', valor: '189', icone: Users, cor: 'text-purple-400', corFundo: 'bg-purple-500/10 border-purple-400/30' },
        { nome: 'Taxa de Comparecimento', valor: '78,5%', icone: UserCheck, cor: 'text-green-400', corFundo: 'bg-green-500/10 border-green-400/30' },
        { nome: 'Reuniões Remarcadas', valor: '43', icone: Calendar, cor: 'text-orange-400', corFundo: 'bg-orange-500/10 border-orange-400/30' },
        { nome: 'Vendas Fechadas', valor: '156', icone: Handshake, cor: 'text-emerald-400', corFundo: 'bg-emerald-500/10 border-emerald-400/30' },
        { nome: 'Taxa de Fechamento', valor: '82,5%', icone: Target, cor: 'text-yellow-400', corFundo: 'bg-yellow-500/10 border-yellow-400/30' },
      ]
    },
    cs: {
      title: '❤️ CS (Customer Success)',
      metricas: [
        { nome: 'Cancelamentos / Churn Rate', valor: '2,1%', icone: TrendingDown, cor: 'text-red-400', corFundo: 'bg-red-500/10 border-red-400/30' },
        { nome: 'Motivo Principal de Cancelamento', valor: 'Financeiro', icone: DollarSign, cor: 'text-orange-400', corFundo: 'bg-orange-500/10 border-orange-400/30' },
        { nome: 'Tempo Médio de Permanência', valor: '8.3 meses', icone: Clock, cor: 'text-blue-400', corFundo: 'bg-blue-500/10 border-blue-400/30' },
        { nome: 'Valor Total Retido (MRR)', valor: 'R$ 234k', icone: DollarSign, cor: 'text-green-400', corFundo: 'bg-green-500/10 border-green-400/30' },
        { nome: 'LTV (Lifetime Value)', valor: 'R$ 12.4k', icone: TrendingUp, cor: 'text-emerald-400', corFundo: 'bg-emerald-500/10 border-emerald-400/30' },
        { nome: 'Upsells Realizados', valor: '67', icone: Award, cor: 'text-yellow-400', corFundo: 'bg-yellow-500/10 border-yellow-400/30' },
        { nome: 'Taxa de Engajamento', valor: '94,2%', icone: Users, cor: 'text-purple-400', corFundo: 'bg-purple-500/10 border-purple-400/30' },
        { nome: 'NPS (Net Promoter Score)', valor: '8.7/10', icone: Star, cor: 'text-pink-400', corFundo: 'bg-pink-500/10 border-pink-400/30' },
      ]
    },
    'social-seller': {
      title: '📱 Social Seller',
      metricas: [
        { nome: 'Posts Criados', valor: '145', icone: MessageCircle, cor: 'text-pink-400', corFundo: 'bg-pink-500/10 border-pink-400/30' },
        { nome: 'Engajamento Total', valor: '28.5k', icone: Users, cor: 'text-purple-400', corFundo: 'bg-purple-500/10 border-purple-400/30' },
        { nome: 'Leads Gerados', valor: '342', icone: UserCheck, cor: 'text-green-400', corFundo: 'bg-green-500/10 border-green-400/30' },
        { nome: 'Taxa de Conversão', valor: '12,3%', icone: Target, cor: 'text-yellow-400', corFundo: 'bg-yellow-500/10 border-yellow-400/30' },
      ]
    },
  };

  const departamento = dadosDepartamento[activeTab];

  return (
    <div className={cn(
      "rounded-2xl",
      isClean
        ? 'bg-white border border-gray-200/60 shadow-sm'
        : 'bg-slate-900/60 backdrop-blur-xl border border-slate-700/50'
    )}>
      <div className={cn(
        "p-6 border-b",
        isClean ? 'border-gray-100' : 'border-slate-700/50'
      )}>
        <div className="flex items-center justify-between mb-6">
          <h3 className={cn(
            "text-xl md:text-3xl font-black flex items-center gap-3",
            isClean ? 'text-gray-900' : 'text-white'
          )}>
            <BarChart3 className={cn("h-8 w-8", isClean ? 'text-amber-600' : 'text-cyan-400')} />
            Métricas por Departamento
          </h3>
        </div>
        
        {/* Navegação das Abas */}
        <div className={cn(
          "flex space-x-1 p-1 rounded-xl",
          isClean ? 'bg-gray-100' : 'bg-slate-800/50'
        )}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center space-x-2 px-4 py-3 rounded-lg font-bold transition-all duration-300 flex-1 justify-center',
                activeTab === tab.id
                  ? isClean
                    ? `bg-white ${tab.color} shadow-sm border border-gray-200/60`
                    : `bg-slate-700/70 ${tab.color} border border-slate-600/50 shadow-lg`
                  : isClean
                    ? 'text-gray-400 hover:text-gray-700 hover:bg-gray-50'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              )}
            >
              {tab.icon}
              <span>{tab.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        {/* Título do Departamento */}
        <div className="text-center mb-8">
          <h2 className={cn(
            "text-2xl font-black mb-2",
            isClean ? 'text-gray-800' : 'text-slate-300'
          )}>
            {departamento.title}
          </h2>
          <p className={cn("font-medium", isClean ? 'text-gray-500' : 'text-slate-400')}>
            Acompanhe as métricas específicas deste departamento
          </p>
        </div>

        {/* Grid de Métricas - Estilo Funil */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {departamento.metricas.map((metrica, index) => {
            const IconeMetrica = metrica.icone;
            
            return (
              <div
                key={index}
                className={cn(
                  'relative rounded-2xl border-2 p-6 text-center transition-all duration-300 hover:scale-105 hover:shadow-2xl',
                  isClean
                    ? 'bg-white border-gray-200/60 shadow-sm'
                    : `bg-slate-800/30 backdrop-blur-xl ${metrica.corFundo}`
                )}
              >
                <div className="flex items-center justify-center mb-4">
                  <div className={cn(
                    "p-3 rounded-xl",
                    isClean ? 'bg-gray-50' : metrica.corFundo
                  )}>
                    <IconeMetrica className={cn("h-6 w-6", isClean ? 'text-gray-600' : metrica.cor)} />
                  </div>
                </div>
                
                <div className={cn(
                  "text-sm uppercase tracking-widest font-black mb-2",
                  isClean ? 'text-gray-500' : 'text-slate-400'
                )}>
                  {metrica.nome}
                </div>
                
                <div className={cn("text-2xl font-black mb-2", isClean ? 'text-gray-900' : metrica.cor)}>
                  {metrica.valor}
                </div>
                
                <div className={cn("text-xs", isClean ? 'text-gray-400' : 'text-slate-500')}>
                  Atualizado hoje
                </div>
              </div>
            );
          })}
        </div>

        {/* Botão de Edição */}
        <div className="mt-8 flex justify-center">
          <button className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-xl font-bold hover:from-cyan-600 hover:to-purple-600 transition-all duration-300 shadow-lg hover:shadow-xl">
            <Edit3 className="h-5 w-5" />
            <span>Editar Métricas {tabs.find(t => t.id === activeTab)?.name}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// Interface para os filtros em cascata
interface FilterState {
  funil: { id: string; name: string } | null;
  campanha: { id: string; name: string } | null;
  publico: { id: string; name: string } | null;
  criativo: { id: string; name: string } | null;
}

export function DashboardCampanha({ defaultTitle = 'Dashboard Geral', showEditButton = false, hideFinanceFields = false, department }: { defaultTitle?: string; showEditButton?: boolean; hideFinanceFields?: boolean; department?: string }) {
  const { campanhaAtiva, metricasCampanha, metricasGerais, loading, filtroData, atualizarFiltroData, recarregarMetricas, selecionarCampanha, limparSelecao, buscarMetricasPorFunil: buscarMetricasFunilCtx, buscarMetricasPorPublico: buscarMetricasPublicoCtx, buscarMetricasPorCriativo: buscarMetricasCriativoCtx } = useCampanhaContext();
  const { isClean } = useTheme();
  const [modalEditarAberto, setModalEditarAberto] = useState(false);
  const [reloadTrigger, setReloadTrigger] = useState(0);
  const [nomesModal, setNomesModal] = useState<{ titulo: string; nomes: string[] } | null>(null);

  // Config de métricas do dashboard (renome, visibilidade, descrição)
  const [metricasConfigMap, setMetricasConfigMap] = useState<Map<string, any>>(new Map());

  useEffect(() => {
    if (department === 'sdr' || department === 'closer') {
      const carregarConfig = async () => {
        try {
          const res = await fetch(`/api/dashboard/metricas-config?departamento=${department}`);
          if (!res.ok) return;
          const data = await res.json();
          const map = new Map<string, any>();
          for (const cfg of data.configs || []) {
            map.set(cfg.metrica_key, cfg);
          }
          setMetricasConfigMap(map);
        } catch (err) {
          console.error('Erro ao carregar config métricas:', err);
        }
      };
      carregarConfig();
    }
  }, [department]);

  // Helpers para config de métricas
  const getMetricaDisplay = (key: string, fallback: string) => {
    const cfg = metricasConfigMap.get(key);
    return cfg?.nome_display || fallback;
  };
  const isMetricaVisivel = (key: string) => {
    if (metricasConfigMap.size === 0) return true; // Sem config = mostrar tudo
    const cfg = metricasConfigMap.get(key);
    return cfg?.visivel !== false;
  };
  const getMetricaDescricao = (key: string) => {
    const cfg = metricasConfigMap.get(key);
    return cfg?.descricao || null;
  };
  
  // Carregar filtros do localStorage
  const [filtrosAtivos, setFiltrosAtivos] = useState<FilterState>(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('filtrosCampanhaAtivos');
        if (saved) return JSON.parse(saved);
      }
    } catch (err) {
      console.error('Erro ao carregar filtros:', err);
    }
    return {
      funil: null,
      campanha: null,
      publico: null,
      criativo: null,
    };
  });

  // Salvar filtros no localStorage sempre que mudarem
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('filtrosCampanhaAtivos', JSON.stringify(filtrosAtivos));
      }
    } catch (err) {
      console.error('Erro ao salvar filtros:', err);
    }
  }, [filtrosAtivos]);

  // Função para lidar com mudanças nos filtros em cascata
  const handleFiltersChange = async (filters: FilterState) => {
    setFiltrosAtivos(filters);
    console.log('🔍 Filtros aplicados:', filters);
    
    // Prioridade: criativo > publico > campanha > funil (mais específico vence)
    if (filters.criativo) {
      console.log('🎨 Criativo selecionado:', filters.criativo.name);
      limparSelecao(); // Limpa campanha sem buscar métricas gerais (evita race condition)
      await buscarMetricasCriativoCtx(filters.criativo.id);
    } else if (filters.publico) {
      console.log('👥 Público selecionado:', filters.publico.name);
      limparSelecao();
      await buscarMetricasPublicoCtx(filters.publico.id);
    } else if (filters.campanha) {
      console.log('🎯 Campanha selecionada:', filters.campanha.name);
      // Buscar e selecionar a campanha real se ela existir
      await buscarEselecionarCampanha(filters.campanha.id, filters.campanha.name);
    } else if (filters.funil) {
      console.log('📊 Funil selecionado:', filters.funil.name);
      limparSelecao();
      await buscarMetricasFunilCtx(filters.funil.id);
    } else {
      console.log('🏠 Voltando para visão geral');
      // Limpar tudo e mostrar métricas gerais
      // selecionarCampanha(null) já chama buscarMetricasGerais() que limpa filtroHierarquico
      selecionarCampanha(null);
    }
  };

  // Função simplificada para buscar e selecionar campanha
  const buscarEselecionarCampanha = async (campanhaId: string, campanhaName: string) => {
    try {
      // Primeiro tentar buscar campanha real
      const { data: campanha, error } = await supabase
        .from('campanhas')
        .select('*')
        .eq('id', campanhaId)
        .single();

      if (!error && campanha) {
        // Campanha real encontrada
        selecionarCampanha(campanha);
        console.log('✅ Campanha real selecionada:', campanha.nome);
      } else {
        // Criar objeto de campanha temporário para demonstração
        const campanhaTemp = {
          id: campanhaId,
          nome: campanhaName,
          tipo: 'leads',
          plataforma: 'Meta Ads',
          ativo: true
        };
        selecionarCampanha(campanhaTemp as any);
        console.log('📝 Campanha de exemplo selecionada:', campanhaName);
      }
    } catch (error) {
      console.error('Erro ao buscar campanha:', error);
      // Em caso de erro, ainda mostrar feedback
      const campanhaTemp = {
        id: campanhaId,
        nome: campanhaName,
        tipo: 'leads',
        plataforma: 'Meta Ads',
        ativo: true
      };
      selecionarCampanha(campanhaTemp as any);
    }
  };

  // Função para buscar métricas de uma campanha específica
  // Delega ao contexto via selecionarCampanha, que dispara buscarMetricasCampanha internamente
  const buscarMetricasPorCampanha = async (campanhaId: string) => {
    try {
      console.log('📊 Buscando métricas para campanha:', campanhaId);
      
      const { data: campanha, error: errorCampanha } = await supabase
        .from('campanhas')
        .select('*')
        .eq('id', campanhaId)
        .single();

      if (errorCampanha) {
        console.error('Erro ao buscar campanha:', errorCampanha);
        return;
      }

      // Selecionar a campanha — o contexto busca as métricas reais automaticamente
      selecionarCampanha(campanha);
      console.log('✅ Campanha selecionada:', campanha.nome);
      
    } catch (error) {
      console.error('Erro geral ao buscar métricas da campanha:', error);
    }
  };

  // Nota: buscarMetricasPorFunil vem do CampanhaContext (buscarMetricasFunilCtx)
  // e já consulta métricas reais do banco filtradas por funil.

  // Dados padrão quando nenhuma campanha está selecionada
  const metricsDataPadrao = [
    {
      title: 'Revenue Engine',
      value: 'R$ 8.234,00',
      trend: 'up' as const,
      icon: <Rocket className="h-5 w-5" />,
      percentage: 85.2,
      gradient: 'from-emerald-500/20 to-teal-500/20',
      description: '+24% vs mês anterior'
    },
    {
      title: 'Lead Generation',
      value: '1.283',
      trend: 'up' as const,
      icon: <Zap className="h-5 w-5" />,
      percentage: 92.7,
      gradient: 'from-blue-500/20 to-cyan-500/20',
      description: '+18% esta semana'
    },
    {
      title: 'Engagement Rate',
      value: '2,4%',
      trend: 'stable' as const,
      icon: <Brain className="h-5 w-5" />,
      percentage: 76.3,
      gradient: 'from-purple-500/20 to-pink-500/20',
      description: 'Mantendo estabilidade'
    },
    {
      title: 'Conversion Power',
      value: '12,5%',
      trend: 'up' as const,
      icon: <Star className="h-5 w-5" />,
      percentage: 89.4,
      gradient: 'from-amber-500/20 to-orange-500/20',
      description: 'Performance excepcional'
    },
  ];

  const campanhasDataPadrao = [
    {
      id: '1',
      nome: 'Masterclass Vendas',
      plataforma: 'Meta Ads',
      investido: 2300,
      leads: 380,
      ctr: 2.6,
      conversao: 12,
      ativa: true
    },
    {
      id: '2',
      nome: 'Funil de Aplicação',
      plataforma: 'Google Ads',
      investido: 3100,
      leads: 498,
      ctr: 3.1,
      conversao: 15,
      ativa: true
    },
    {
      id: '3',
      nome: 'Captação Leads',
      plataforma: 'Meta Ads',
      investido: 1850,
      leads: 225,
      ctr: 1.8,
      conversao: 8.5,
      ativa: false
    }
  ];

  const chartDataPadrao = [
    { data: '2024-10-20', investimento: 500, leads: 45, vendas: 8, cliques: 120, alcance: 1200 },
    { data: '2024-10-21', investimento: 750, leads: 62, vendas: 12, cliques: 180, alcance: 1800 },
    { data: '2024-10-22', investimento: 620, leads: 58, vendas: 10, cliques: 150, alcance: 1500 },
    { data: '2024-10-23', investimento: 890, leads: 78, vendas: 15, cliques: 210, alcance: 2100 },
    { data: '2024-10-24', investimento: 1200, leads: 95, vendas: 18, cliques: 280, alcance: 2800 },
  ];

    // Usar métricas da campanha específica ou métricas gerais (soma de todas)
    const metricasParaExibir = metricasCampanha || metricasGerais;

    console.log('📊 MÉTRICAS DETALHADAS:', JSON.stringify({
      temMetricasCampanha: !!metricasCampanha,
      temMetricasGerais: !!metricasGerais,
      investimento: metricasParaExibir?.investimento || 0,
      leads: metricasParaExibir?.leads || 0,
      faturamento: metricasParaExibir?.faturamento || 0,
      vendas: metricasParaExibir?.vendas || 0,
      department
    }, null, 2));

    // Calcular custo por lead
    const custoPortLead = metricasParaExibir && metricasParaExibir.leads > 0 
      ? metricasParaExibir.investimento / metricasParaExibir.leads 
      : 0;

    // Métricas financeiras (4 cards incluindo custo por lead)
    // Se for dashboard SDR, buscar dados do Supabase
    const [sdrDetail, setSdrDetail] = useState<any>(null);
    const [sdrDetailPrev, setSdrDetailPrev] = useState<any>(null);

    useEffect(() => {
      // Buscar dados SDR tanto no dashboard SDR quanto no Closer (o Closer precisa de agendados_mentoria para taxas)
      if (department === 'sdr' || department === 'closer') {
        const buscarMetricasSdr = async () => {
          try {
            // Filtros SDR aplicados

            // Construir query base
            let queryAtual = supabase
              .from('metricas')
              .select('detalhe_sdr, tipo, referencia_id, periodo_inicio, periodo_fim')
              .gte('periodo_inicio', filtroData.dataInicio)
              .lte('periodo_fim', filtroData.dataFim)
              .not('detalhe_sdr', 'is', null);

            // Aplicar filtros hierárquicos: criativo > público > campanha > funil
            if (filtrosAtivos.criativo?.id) {
              queryAtual = queryAtual.eq('tipo', 'anuncio').eq('referencia_id', filtrosAtivos.criativo.id);
            } else if (filtrosAtivos.publico?.id) {
              queryAtual = queryAtual.eq('tipo', 'conjunto').eq('referencia_id', filtrosAtivos.publico.id);
            } else if (filtrosAtivos.campanha?.id) {
              queryAtual = queryAtual.eq('tipo', 'campanha').eq('referencia_id', filtrosAtivos.campanha.id);
            } else if (filtrosAtivos.funil?.id) {
              // Buscar metricas SDR do funil (tipo='funil' com referencia_id = funil_id)
              // O Typebot grava detalhe_sdr em metricas tipo='funil'
              queryAtual = queryAtual.eq('tipo', 'funil').eq('referencia_id', filtrosAtivos.funil.id);
            }

            const { data: metricasAtuais, error: errorAtual } = await queryAtual.order('periodo_inicio', { ascending: false });

            // Métricas encontradas: ${metricasAtuais?.length || 0}

            if (metricasAtuais && metricasAtuais.length > 0) {
              // Agregar os valores do período atual
              const totalAtual = metricasAtuais.reduce((acc: any, item: any) => {
                const det = item.detalhe_sdr;
                return {
                  comecou_diagnostico: (acc.comecou_diagnostico || 0) + (det.comecou_diagnostico || 0),
                  chegaram_crm_kommo: (acc.chegaram_crm_kommo || 0) + (det.chegaram_crm_kommo || 0),
                  qualificados_para_mentoria: (acc.qualificados_para_mentoria || 0) + (det.qualificados_para_mentoria || 0),
                  para_downsell: (acc.para_downsell || 0) + (det.para_downsell || 0),
                  agendados_diagnostico: (acc.agendados_diagnostico || 0) + (det.agendados_diagnostico || 0),
                  agendados_mentoria: (acc.agendados_mentoria || 0) + (det.agendados_mentoria || 0),
                  nomes_qualificados: [acc.nomes_qualificados, det.nomes_qualificados].filter(Boolean).join('\n')
                };
              }, {
                comecou_diagnostico: 0,
                chegaram_crm_kommo: 0,
                qualificados_para_mentoria: 0,
                para_downsell: 0,
                agendados_diagnostico: 0,
                agendados_mentoria: 0,
                nomes_qualificados: ''
              });
              
              setSdrDetail(totalAtual);
            } else {
              // Limpar se não houver dados
              setSdrDetail(null);
            }

            // Buscar métricas do período anterior para comparação
            const periodoAnterior = calcularPeriodoAnterior();
            let queryAnterior = supabase
              .from('metricas')
              .select('detalhe_sdr, tipo')
              .gte('periodo_inicio', periodoAnterior.inicio)
              .lte('periodo_fim', periodoAnterior.fim)
              .not('detalhe_sdr', 'is', null);

            // Aplicar mesmos filtros hierárquicos para período anterior
            if (filtrosAtivos.criativo?.id) {
              queryAnterior = queryAnterior.eq('tipo', 'anuncio').eq('referencia_id', filtrosAtivos.criativo.id);
            } else if (filtrosAtivos.publico?.id) {
              queryAnterior = queryAnterior.eq('tipo', 'conjunto').eq('referencia_id', filtrosAtivos.publico.id);
            } else if (filtrosAtivos.campanha?.id) {
              queryAnterior = queryAnterior.eq('tipo', 'campanha').eq('referencia_id', filtrosAtivos.campanha.id);
            } else if (filtrosAtivos.funil?.id) {
              // Buscar metricas SDR do funil (tipo='funil' com referencia_id = funil_id)
              queryAnterior = queryAnterior.eq('tipo', 'funil').eq('referencia_id', filtrosAtivos.funil.id);
            }

            const { data: metricasAnteriores } = await queryAnterior;

            if (metricasAnteriores && metricasAnteriores.length > 0) {
              const totalAnterior = metricasAnteriores.reduce((acc: any, item: any) => {
                const det = item.detalhe_sdr;
                return {
                  comecou_diagnostico: (acc.comecou_diagnostico || 0) + (det.comecou_diagnostico || 0),
                  chegaram_crm_kommo: (acc.chegaram_crm_kommo || 0) + (det.chegaram_crm_kommo || 0),
                  qualificados_para_mentoria: (acc.qualificados_para_mentoria || 0) + (det.qualificados_para_mentoria || 0),
                  para_downsell: (acc.para_downsell || 0) + (det.para_downsell || 0),
                  agendados_diagnostico: (acc.agendados_diagnostico || 0) + (det.agendados_diagnostico || 0),
                  agendados_mentoria: (acc.agendados_mentoria || 0) + (det.agendados_mentoria || 0)
                };
              }, {
                comecou_diagnostico: 0,
                chegaram_crm_kommo: 0,
                qualificados_para_mentoria: 0,
                para_downsell: 0,
                agendados_diagnostico: 0,
                agendados_mentoria: 0
              });
              
              setSdrDetailPrev(totalAnterior);
            } else {
              setSdrDetailPrev(null);
            }
          } catch (err) {
            console.error('Erro ao buscar métricas SDR:', err);
          }
        };

        buscarMetricasSdr();
      }
    }, [department, filtroData.dataInicio, filtroData.dataFim, filtrosAtivos.campanha?.id, filtrosAtivos.publico?.id, filtrosAtivos.criativo?.id, filtrosAtivos.funil?.id, reloadTrigger]);

    // ===== CLOSER: Buscar dados reais do Supabase (detalhe_closer) =====
    const [closerDetailDb, setCloserDetailDb] = useState<any>(null);
    const [closerDetailPrevDb, setCloserDetailPrevDb] = useState<any>(null);

    useEffect(() => {
      if (department === 'closer') {
        const buscarMetricasCloser = async () => {
          try {
            let queryAtual = supabase
              .from('metricas')
              .select('detalhe_closer, tipo, referencia_id, periodo_inicio, periodo_fim')
              .gte('periodo_inicio', filtroData.dataInicio)
              .lte('periodo_fim', filtroData.dataFim)
              .not('detalhe_closer', 'is', null);

            // Aplicar filtros hierárquicos
            if (filtrosAtivos.criativo?.id) {
              queryAtual = queryAtual.eq('tipo', 'anuncio').eq('referencia_id', filtrosAtivos.criativo.id);
            } else if (filtrosAtivos.publico?.id) {
              queryAtual = queryAtual.eq('tipo', 'conjunto').eq('referencia_id', filtrosAtivos.publico.id);
            } else if (filtrosAtivos.campanha?.id) {
              queryAtual = queryAtual.eq('tipo', 'campanha').eq('referencia_id', filtrosAtivos.campanha.id);
            } else if (filtrosAtivos.funil?.id) {
              queryAtual = queryAtual.eq('tipo', 'funil').eq('referencia_id', filtrosAtivos.funil.id);
            }

            const { data: metricasAtuais } = await queryAtual.order('periodo_inicio', { ascending: false });

            if (metricasAtuais && metricasAtuais.length > 0) {
              const totalAtual = metricasAtuais.reduce((acc: any, item: any) => {
                const det = item.detalhe_closer;
                return {
                  calls_realizadas: (acc.calls_realizadas || 0) + (det.calls_realizadas || 0),
                  nao_compareceram: (acc.nao_compareceram || 0) + (det.nao_compareceram || 0),
                  vendas_mentoria: (acc.vendas_mentoria || 0) + (det.vendas_mentoria || 0),
                  vendas_downsell: (acc.vendas_downsell || 0) + (det.vendas_downsell || 0),
                  em_negociacao: (acc.em_negociacao || 0) + (det.em_negociacao || 0),
                  em_followup: (acc.em_followup || 0) + (det.em_followup || 0),
                  vendas_perdidas: (acc.vendas_perdidas || 0) + (det.vendas_perdidas || 0),
                  lead_desqualificado: (acc.lead_desqualificado || 0) + (det.lead_desqualificado || 0),
                  nomes_vendas: [acc.nomes_vendas, det.nomes_vendas].filter(Boolean).join('\n'),
                  valor_vendas: (acc.valor_vendas || 0) + (det.valor_vendas || 0),
                };
              }, {
                calls_realizadas: 0,
                nao_compareceram: 0,
                vendas_mentoria: 0,
                vendas_downsell: 0,
                em_negociacao: 0,
                em_followup: 0,
                vendas_perdidas: 0,
                lead_desqualificado: 0,
                nomes_vendas: '',
                valor_vendas: 0,
              });
              setCloserDetailDb(totalAtual);
            } else {
              setCloserDetailDb(null);
            }

            // Buscar período anterior
            const periodoAnt = calcularPeriodoAnterior();
            let queryAnt = supabase
              .from('metricas')
              .select('detalhe_closer, tipo')
              .gte('periodo_inicio', periodoAnt.inicio)
              .lte('periodo_fim', periodoAnt.fim)
              .not('detalhe_closer', 'is', null);

            if (filtrosAtivos.criativo?.id) {
              queryAnt = queryAnt.eq('tipo', 'anuncio').eq('referencia_id', filtrosAtivos.criativo.id);
            } else if (filtrosAtivos.publico?.id) {
              queryAnt = queryAnt.eq('tipo', 'conjunto').eq('referencia_id', filtrosAtivos.publico.id);
            } else if (filtrosAtivos.campanha?.id) {
              queryAnt = queryAnt.eq('tipo', 'campanha').eq('referencia_id', filtrosAtivos.campanha.id);
            } else if (filtrosAtivos.funil?.id) {
              queryAnt = queryAnt.eq('tipo', 'funil').eq('referencia_id', filtrosAtivos.funil.id);
            }

            const { data: metricasAnteriores } = await queryAnt;

            if (metricasAnteriores && metricasAnteriores.length > 0) {
              const totalAnt = metricasAnteriores.reduce((acc: any, item: any) => {
                const det = item.detalhe_closer;
                return {
                  calls_realizadas: (acc.calls_realizadas || 0) + (det.calls_realizadas || 0),
                  nao_compareceram: (acc.nao_compareceram || 0) + (det.nao_compareceram || 0),
                  vendas_mentoria: (acc.vendas_mentoria || 0) + (det.vendas_mentoria || 0),
                  vendas_downsell: (acc.vendas_downsell || 0) + (det.vendas_downsell || 0),
                  em_negociacao: (acc.em_negociacao || 0) + (det.em_negociacao || 0),
                  em_followup: (acc.em_followup || 0) + (det.em_followup || 0),
                  vendas_perdidas: (acc.vendas_perdidas || 0) + (det.vendas_perdidas || 0),
                  lead_desqualificado: (acc.lead_desqualificado || 0) + (det.lead_desqualificado || 0),
                  valor_vendas: (acc.valor_vendas || 0) + (det.valor_vendas || 0),
                };
              }, {
                calls_realizadas: 0,
                nao_compareceram: 0,
                vendas_mentoria: 0,
                vendas_downsell: 0,
                em_negociacao: 0,
                em_followup: 0,
                vendas_perdidas: 0,
                lead_desqualificado: 0,
                valor_vendas: 0,
              });
              setCloserDetailPrevDb(totalAnt);
            } else {
              setCloserDetailPrevDb(null);
            }
          } catch (err) {
            console.error('Erro ao buscar métricas Closer:', err);
          }
        };

        buscarMetricasCloser();
      }
    }, [department, filtroData.dataInicio, filtroData.dataFim, filtrosAtivos.campanha?.id, filtrosAtivos.publico?.id, filtrosAtivos.criativo?.id, filtrosAtivos.funil?.id, reloadTrigger]);

    // calcular período anterior simples (mesmo tamanho em dias)
    const calcularPeriodoAnterior = () => {
      try {
        const inicio = new Date(filtroData.dataInicio);
        const fim = new Date(filtroData.dataFim);
        const msPorDia = 24 * 60 * 60 * 1000;
        const dias = Math.round((fim.getTime() - inicio.getTime()) / msPorDia) + 1;
        const prevFim = new Date(inicio.getTime() - msPorDia);
        const prevInicio = new Date(prevFim.getTime() - (dias - 1) * msPorDia);
        const toIso = (d: Date) => d.toISOString().split('T')[0];
        return { inicio: toIso(prevInicio), fim: toIso(prevFim) };
      } catch (err) {
        const hoje = new Date();
        const prev = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
        const end = new Date(hoje.getFullYear(), hoje.getMonth(), 0);
        return { inicio: prev.toISOString().split('T')[0], fim: end.toISOString().split('T')[0] };
      }
    };

    const periodoAnterior = calcularPeriodoAnterior();

    const metricsData = department === 'sdr' ? (() => {
      // ========================================================
      // SDR — Funil de Qualificação
      // Fluxo: Diagnóstico → CRM → Qualificados → Agendados
      // Cada card mostra: valor + % vs período anterior + taxa de conversão da etapa anterior
      // ========================================================
      const comecouDiag = sdrDetail?.comecou_diagnostico ?? 0;
      const chegaramCrm = sdrDetail?.chegaram_crm_kommo ?? 0;
      const qualificados = sdrDetail?.qualificados_para_mentoria ?? (metricasParaExibir?.vendas ?? 0);
      const paraDownsell = sdrDetail?.para_downsell ?? 0;
      const agendDiag = sdrDetail?.agendados_diagnostico ?? 0;
      const agendMent = sdrDetail?.agendados_mentoria ?? 0;
      const nomes = sdrDetail?.nomes_qualificados ?? '';

      const comecouDiagPrev = sdrDetailPrev?.comecou_diagnostico ?? 0;
      const chegaramCrmPrev = sdrDetailPrev?.chegaram_crm_kommo ?? 0;
      const qualificadosPrev = sdrDetailPrev?.qualificados_para_mentoria ?? 0;
      const paraDownsellPrev = sdrDetailPrev?.para_downsell ?? 0;
      const agendDiagPrev = sdrDetailPrev?.agendados_diagnostico ?? 0;
      const agendMentPrev = sdrDetailPrev?.agendados_mentoria ?? 0;

      // Variação % vs período anterior
      const diffPercent = (current: number, prev: number) => {
        if (prev === 0) return current === 0 ? 0 : 100;
        return Math.round(((current - prev) / prev) * 100);
      };

      // ── Taxas de conversão entre etapas do funil SDR ──
      // Taxa CRM/Diagnóstico: dos que começaram o diagnóstico, quantos chegaram ao CRM
      const taxaCrmSobreDiag = comecouDiag > 0 ? parseFloat(((chegaramCrm / comecouDiag) * 100).toFixed(1)) : 0;
      // Taxa Qualificação: dos que chegaram ao CRM, quantos foram qualificados
      const taxaQualSobreCrm = chegaramCrm > 0 ? parseFloat(((qualificados / chegaramCrm) * 100).toFixed(1)) : 0;
      // Taxa Agendamento Diagnóstico: dos que chegaram ao CRM, quantos agendaram diagnóstico
      const taxaAgendDiagSobreCrm = chegaramCrm > 0 ? parseFloat(((agendDiag / chegaramCrm) * 100).toFixed(1)) : 0;
      // Taxa Agendamento Mentoria: dos qualificados, quantos agendaram mentoria
      const taxaAgendMentSobreQual = qualificados > 0 ? parseFloat(((agendMent / qualificados) * 100).toFixed(1)) : 0;
      // Taxa de Desqualificação: dos que chegaram ao CRM, quantos foram para downsell
      const taxaDownsellSobreCrm = chegaramCrm > 0 ? parseFloat(((paraDownsell / chegaramCrm) * 100).toFixed(1)) : 0;
      // Taxa geral do funil SDR: começou diagnóstico → agendou mentoria
      const taxaFunilCompleto = comecouDiag > 0 ? parseFloat(((agendMent / comecouDiag) * 100).toFixed(1)) : 0;
      const taxaFunilCompletoPrev = comecouDiagPrev > 0 ? parseFloat(((agendMentPrev / comecouDiagPrev) * 100).toFixed(1)) : 0;

      // Texto com comparativo vs anterior
      const descPrev = (current: number, prev: number) => {
        const pct = diffPercent(current, prev);
        return `${pct >= 0 ? '+' : ''}${pct}% vs período anterior`;
      };

      // Monta description com: taxa de conversão + explicação + comparativo
      const descComTaxa = (taxa: string, explicacao: string, current: number, prev: number) => {
        const pct = diffPercent(current, prev);
        const seta = pct >= 0 ? '↑' : '↓';
        return `${taxa} · ${explicacao} · ${seta} ${Math.abs(pct)}% vs anterior`;
      };

      const allSdrCards = [
        {
          // Topo do funil: leads que iniciaram o diagnóstico (Typebot)
          _key: 'comecou_diagnostico',
          title: 'Começaram o Formulário',
          value: comecouDiag.toString(),
          trend: comecouDiag >= comecouDiagPrev ? 'up' as const : 'down' as const,
          icon: <Edit3 className="h-5 w-5" />,
          percentage: diffPercent(comecouDiag, comecouDiagPrev),
          gradient: 'from-cyan-500/20 to-blue-500/20',
          description: `Entrada do funil · ${descPrev(comecouDiag, comecouDiagPrev)}`
        },
        {
          // Chegaram ao CRM: leads que entraram no pipeline Kommo
          _key: 'chegaram_crm_kommo',
          title: 'Chegaram ao CRM',
          value: chegaramCrm.toString(),
          trend: chegaramCrm >= chegaramCrmPrev ? 'up' as const : 'down' as const,
          icon: <Users className="h-5 w-5" />,
          percentage: diffPercent(chegaramCrm, chegaramCrmPrev),
          gradient: 'from-blue-500/20 to-indigo-500/20',
          description: descComTaxa(`Conv: ${taxaCrmSobreDiag}%`, 'de quem começou diagnóstico', chegaramCrm, chegaramCrmPrev)
        },
        {
          // Qualificados: leads aprovados pelo SDR para mentoria
          _key: 'qualificados_para_mentoria',
          title: 'Qualificados p/ Mentoria',
          value: qualificados.toString(),
          trend: qualificados >= qualificadosPrev ? 'up' as const : 'down' as const,
          icon: <UserCheck className="h-5 w-5" />,
          percentage: diffPercent(qualificados, qualificadosPrev),
          gradient: 'from-emerald-500/20 to-teal-500/20',
          description: descComTaxa(`Conv: ${taxaQualSobreCrm}%`, 'dos leads no CRM', qualificados, qualificadosPrev)
        },
        {
          // Leads direcionados para downsell (não qualificados para mentoria)
          _key: 'para_downsell',
          title: 'Direcionados p/ Downsell',
          value: paraDownsell.toString(),
          trend: paraDownsell <= paraDownsellPrev ? 'up' as const : 'down' as const,
          icon: <TrendingDown className="h-5 w-5" />,
          percentage: diffPercent(paraDownsell, paraDownsellPrev),
          gradient: 'from-orange-500/20 to-amber-500/20',
          description: descComTaxa(`${taxaDownsellSobreCrm}% do CRM`, 'taxa de desqualificação', paraDownsell, paraDownsellPrev)
        },
        {
          // Agendados Diagnóstico: leads que agendaram sessão de diagnóstico
          _key: 'agendados_diagnostico',
          title: 'Agendados Diagnóstico',
          value: agendDiag.toString(),
          trend: agendDiag >= agendDiagPrev ? 'up' as const : 'down' as const,
          icon: <Calendar className="h-5 w-5" />,
          percentage: diffPercent(agendDiag, agendDiagPrev),
          gradient: 'from-purple-500/20 to-pink-500/20',
          description: descComTaxa(`Conv: ${taxaAgendDiagSobreCrm}%`, 'dos leads no CRM', agendDiag, agendDiagPrev)
        },
        {
          // Agendados Mentoria: leads qualificados que agendaram call de mentoria
          _key: 'agendados_mentoria',
          title: 'Agendados Mentoria',
          value: agendMent.toString(),
          trend: agendMent >= agendMentPrev ? 'up' as const : 'down' as const,
          icon: <Phone className="h-5 w-5" />,
          percentage: diffPercent(agendMent, agendMentPrev),
          gradient: 'from-yellow-500/20 to-orange-500/20',
          description: descComTaxa(`Conv: ${taxaAgendMentSobreQual}%`, 'dos qualificados', agendMent, agendMentPrev)
        },
        {
          // Lista de nomes dos leads qualificados (clicável para ver todos)
          _key: 'nomes_qualificados',
          title: 'Nomes dos Qualificados',
          value: `${qualificados} leads`,
          trend: 'stable' as const,
          icon: <MessageCircle className="h-5 w-5" />,
          percentage: 0,
          gradient: 'from-pink-500/20 to-purple-500/20',
          description: nomes
            ? `${nomes.split('\n').filter(Boolean).slice(0, 5).join(', ')}${nomes.split('\n').filter(Boolean).length > 5 ? ` … +${nomes.split('\n').filter(Boolean).length - 5}` : ''}`
            : '—',
          _onClick: nomes ? () => setNomesModal({ titulo: 'Leads Qualificados', nomes: nomes.split('\n').filter(Boolean) }) : undefined
        },
        {
          // Taxa geral do funil SDR: de diagnóstico até agendamento de mentoria
          _key: 'taxa_conversao',
          title: 'Taxa do Funil SDR',
          value: `${taxaFunilCompleto}%`,
          trend: taxaFunilCompleto >= taxaFunilCompletoPrev ? 'up' as const : 'down' as const,
          icon: <TrendingUp className="h-5 w-5" />,
          percentage: diffPercent(taxaFunilCompleto, taxaFunilCompletoPrev),
          gradient: taxaFunilCompleto >= 30 ? 'from-emerald-500/20 to-green-500/20' : taxaFunilCompleto >= 15 ? 'from-yellow-500/20 to-amber-500/20' : 'from-red-500/20 to-pink-500/20',
          description: `Diagnóstico → Agendou Mentoria · ${descPrev(taxaFunilCompleto, taxaFunilCompletoPrev)}`
        }
      ];
      return allSdrCards.filter(c => isMetricaVisivel(c._key));
    })() : department === 'closer' ? (() => {
      // ========================================================
      // CLOSER — Funil de Fechamento
      // Fluxo: Agendados(SDR) → Calls → Vendas / Negociação / Perdidas
      // Cada card mostra: valor + % vs período anterior + taxa de conversão da etapa anterior
      // ========================================================
      const calls = closerDetailDb?.calls_realizadas ?? 0;
      const noShows = closerDetailDb?.nao_compareceram ?? 0;
      const vendasMentoria = closerDetailDb?.vendas_mentoria ?? (metricasParaExibir?.vendas ?? 0);
      const vendasDownsell = closerDetailDb?.vendas_downsell ?? 0;
      const emNegociacao = closerDetailDb?.em_negociacao ?? 0;
      const emFollowup = closerDetailDb?.em_followup ?? 0;
      const vendasPerdidas = closerDetailDb?.vendas_perdidas ?? 0;
      const nomesVendas = closerDetailDb?.nomes_vendas ?? '';
      // Agendados do SDR (etapa anterior do funil) para taxa de comparecimento
      const agendadosSdr = sdrDetail?.agendados_mentoria ?? (calls + noShows);
      const agendadosSdrPrev = sdrDetailPrev?.agendados_mentoria ?? (closerDetailPrevDb?.calls_realizadas ?? 0) + (closerDetailPrevDb?.nao_compareceram ?? 0);

      const noShowsPrev = closerDetailPrevDb?.nao_compareceram ?? 0;
      const callsPrev = closerDetailPrevDb?.calls_realizadas ?? 0;
      const vendasMentoriaPrev = closerDetailPrevDb?.vendas_mentoria ?? 0;
      const vendasDownsellPrev = closerDetailPrevDb?.vendas_downsell ?? 0;
      const emNegociacaoPrev = closerDetailPrevDb?.em_negociacao ?? 0;
      const emFollowupPrev = closerDetailPrevDb?.em_followup ?? 0;
      const vendasPerdidasPrev = closerDetailPrevDb?.vendas_perdidas ?? 0;

      // Total de vendas (mentoria + downsell)
      const totalVendas = vendasMentoria + vendasDownsell;
      const totalVendasPrev = vendasMentoriaPrev + vendasDownsellPrev;

      // Variação % vs período anterior
      const diffPercent = (current: number, prev: number) => {
        if (prev === 0) return current === 0 ? 0 : 100;
        return Math.round(((current - prev) / prev) * 100);
      };

      const descPrev = (current: number, prev: number) => {
        const pct = diffPercent(current, prev);
        return `${pct >= 0 ? '+' : ''}${pct}% vs período anterior`;
      };

      // Monta description com: taxa de conversão + explicação + comparativo
      const descComTaxa = (taxa: string, explicacao: string, current: number, prev: number) => {
        const pct = diffPercent(current, prev);
        const seta = pct >= 0 ? '↑' : '↓';
        return `${taxa} · ${explicacao} · ${seta} ${Math.abs(pct)}% vs anterior`;
      };

      // ── Taxas de conversão entre etapas do funil Closer ──
      // Taxa de Comparecimento: dos agendados pelo SDR, quantos de fato fizeram a call
      const taxaComparecimento = agendadosSdr > 0 ? parseFloat(((calls / agendadosSdr) * 100).toFixed(1)) : 0;
      // Taxa de No-show: inverso do comparecimento
      const taxaNoShow = agendadosSdr > 0 ? parseFloat(((noShows / agendadosSdr) * 100).toFixed(1)) : 0;
      // Taxa de Fechamento Mentoria: das calls realizadas, quantas viraram venda de mentoria
      const taxaFechMentoria = calls > 0 ? parseFloat(((vendasMentoria / calls) * 100).toFixed(1)) : 0;
      // Taxa de Recuperação Downsell: das vendas perdidas, quantas foram convertidas em downsell
      const taxaRecuperacao = vendasPerdidas > 0 ? parseFloat(((vendasDownsell / vendasPerdidas) * 100).toFixed(1)) : 0;
      // Taxa de Negociação: das calls, quantas estão em negociação ativa
      const taxaNegociacao = calls > 0 ? parseFloat(((emNegociacao / calls) * 100).toFixed(1)) : 0;
      // Taxa de Follow-up: das calls, quantas estão em follow-up
      const taxaFollowup = calls > 0 ? parseFloat(((emFollowup / calls) * 100).toFixed(1)) : 0;
      // Taxa de Perda: das calls, quantas viraram venda perdida
      const taxaPerda = calls > 0 ? parseFloat(((vendasPerdidas / calls) * 100).toFixed(1)) : 0;
      // Taxa geral de fechamento: de todas as calls, quantas resultaram em qualquer venda
      const taxaFechamentoTotal = calls > 0 ? parseFloat(((totalVendas / calls) * 100).toFixed(1)) : 0;
      const taxaFechamentoTotalPrev = callsPrev > 0 ? parseFloat(((totalVendasPrev / callsPrev) * 100).toFixed(1)) : 0;

      const allCloserCards = [
        {
          // Calls efetivamente realizadas (agendados que compareceram)
          _key: 'calls_realizadas',
          title: 'Calls Realizadas',
          value: calls.toString(),
          trend: calls >= callsPrev ? 'up' as const : 'down' as const,
          icon: <Phone className="h-5 w-5" />,
          percentage: diffPercent(calls, callsPrev),
          gradient: 'from-blue-500/20 to-cyan-500/20',
          description: descComTaxa(`Comparecimento: ${taxaComparecimento}%`, 'dos agendados', calls, callsPrev)
        },
        {
          // No-shows: agendados que não compareceram (métrica negativa — menos = melhor)
          _key: 'nao_compareceram',
          title: 'Não Compareceram',
          value: noShows.toString(),
          trend: noShows <= noShowsPrev ? 'up' as const : 'down' as const,
          icon: <TrendingDown className="h-5 w-5" />,
          percentage: diffPercent(noShows, noShowsPrev),
          gradient: 'from-red-500/20 to-pink-500/20',
          description: descComTaxa(`No-show: ${taxaNoShow}%`, 'dos agendados', noShows, noShowsPrev)
        },
        {
          // Vendas de Mentoria: principal produto, conversão direta das calls
          _key: 'vendas_mentoria',
          title: 'Vendas Mentoria',
          value: vendasMentoria.toString(),
          trend: vendasMentoria >= vendasMentoriaPrev ? 'up' as const : 'down' as const,
          icon: <Handshake className="h-5 w-5" />,
          percentage: diffPercent(vendasMentoria, vendasMentoriaPrev),
          gradient: 'from-emerald-500/20 to-teal-500/20',
          description: descComTaxa(`Fechamento: ${taxaFechMentoria}%`, 'das calls', vendasMentoria, vendasMentoriaPrev)
        },
        {
          // Vendas Downsell: vendas de recuperação de leads que não fecharam mentoria
          _key: 'vendas_downsell',
          title: 'Vendas Downsell',
          value: vendasDownsell.toString(),
          trend: vendasDownsell >= vendasDownsellPrev ? 'up' as const : 'down' as const,
          icon: <ShoppingCart className="h-5 w-5" />,
          percentage: diffPercent(vendasDownsell, vendasDownsellPrev),
          gradient: 'from-orange-500/20 to-amber-500/20',
          description: descComTaxa(`Recuperação: ${taxaRecuperacao}%`, 'das perdidas', vendasDownsell, vendasDownsellPrev)
        },
        {
          // Em negociação: leads que passaram pela call e estão em negociação ativa
          _key: 'em_negociacao',
          title: 'Em Negociação',
          value: emNegociacao.toString(),
          trend: emNegociacao >= emNegociacaoPrev ? 'up' as const : 'down' as const,
          icon: <Clock className="h-5 w-5" />,
          percentage: diffPercent(emNegociacao, emNegociacaoPrev),
          gradient: 'from-purple-500/20 to-pink-500/20',
          description: descComTaxa(`${taxaNegociacao}% das calls`, 'em andamento', emNegociacao, emNegociacaoPrev)
        },
        {
          // Em follow-up: leads aguardando retorno após call
          _key: 'em_followup',
          title: 'Em Follow-up',
          value: emFollowup.toString(),
          trend: emFollowup >= emFollowupPrev ? 'up' as const : 'down' as const,
          icon: <Clock className="h-5 w-5" />,
          percentage: diffPercent(emFollowup, emFollowupPrev),
          gradient: 'from-yellow-500/20 to-orange-500/20',
          description: descComTaxa(`${taxaFollowup}% das calls`, 'aguardando retorno', emFollowup, emFollowupPrev)
        },
        {
          // Vendas perdidas: leads que não converteram (métrica negativa — menos = melhor)
          _key: 'vendas_perdidas',
          title: 'Vendas Perdidas',
          value: vendasPerdidas.toString(),
          trend: vendasPerdidas <= vendasPerdidasPrev ? 'up' as const : 'down' as const,
          icon: <TrendingDown className="h-5 w-5" />,
          percentage: diffPercent(vendasPerdidas, vendasPerdidasPrev),
          gradient: 'from-red-500/20 to-pink-500/20',
          description: descComTaxa(`${taxaPerda}% das calls`, 'não converteram', vendasPerdidas, vendasPerdidasPrev)
        },
        {
          // Taxa geral de fechamento: visão executiva do resultado do Closer
          _key: 'taxa_fechamento',
          title: 'Taxa de Fechamento',
          value: `${taxaFechamentoTotal}%`,
          trend: taxaFechamentoTotal >= taxaFechamentoTotalPrev ? 'up' as const : 'down' as const,
          icon: <Target className="h-5 w-5" />,
          percentage: diffPercent(taxaFechamentoTotal, taxaFechamentoTotalPrev),
          gradient: taxaFechamentoTotal >= 30 ? 'from-emerald-500/20 to-green-500/20' : taxaFechamentoTotal >= 15 ? 'from-yellow-500/20 to-amber-500/20' : 'from-red-500/20 to-pink-500/20',
          description: `${totalVendas} vendas de ${calls} calls · ${descPrev(taxaFechamentoTotal, taxaFechamentoTotalPrev)}`
        },
        {
          // Lista de nomes dos leads que fecharam venda (clicável)
          _key: 'nomes_vendas',
          title: 'Nomes das Vendas',
          value: `${totalVendas} vendas`,
          trend: totalVendas >= totalVendasPrev ? 'up' as const : 'down' as const,
          icon: <MessageCircle className="h-5 w-5" />,
          percentage: diffPercent(totalVendas, totalVendasPrev),
          gradient: 'from-emerald-500/20 to-teal-500/20',
          description: nomesVendas
            ? `${nomesVendas.split('\n').filter(Boolean).slice(0, 5).join(', ')}${nomesVendas.split('\n').filter(Boolean).length > 5 ? ` … +${nomesVendas.split('\n').filter(Boolean).length - 5}` : ''}`
            : '—',
          _onClick: nomesVendas ? () => setNomesModal({ titulo: 'Nomes das Vendas', nomes: nomesVendas.split('\n').filter(Boolean) }) : undefined
        }
      ];
      return allCloserCards.filter(c => isMetricaVisivel(c._key));
    })() : department === 'social-seller' ? (() => {
      const getSocialSellerDetailFromStorage = () => {
        try {
          if (typeof window === 'undefined') return null;
          if (!campanhaAtiva) return null;
          const key = `metricas_social_seller_${campanhaAtiva.id}_${filtroData.dataInicio}`;
          const raw = localStorage.getItem(key);
          if (!raw) return null;
          const parsed = JSON.parse(raw);
          return parsed?.detalhe || parsed?.detalhe_social_seller || null;
        } catch (err) {
          return null;
        }
      };

      const socialSellerDetail = getSocialSellerDetailFromStorage();
      const socialSellerDetailPrev = (() => {
        try {
          if (typeof window === 'undefined') return null;
          if (!campanhaAtiva) return null;
          const key = `metricas_social_seller_${campanhaAtiva.id}_${periodoAnterior.inicio}`;
          const raw = localStorage.getItem(key);
          if (!raw) return null;
          const parsed = JSON.parse(raw);
          return parsed?.detalhe || parsed?.detalhe_social_seller || null;
        } catch (err) {
          return null;
        }
      })();

      const leadsContatados = socialSellerDetail?.leads_contatados ?? 0;
      const agendDiag = socialSellerDetail?.agendados_diagnostico ?? 0;
      const agendMent = socialSellerDetail?.agendados_mentoria ?? 0;
      const agendConsult = socialSellerDetail?.agendados_consultoria ?? 0;
      const downsellVendido = socialSellerDetail?.downsell_vendido ?? 0;

      const leadsContatadosPrev = socialSellerDetailPrev?.leads_contatados ?? 0;
      const agendDiagPrev = socialSellerDetailPrev?.agendados_diagnostico ?? 0;
      const agendMentPrev = socialSellerDetailPrev?.agendados_mentoria ?? 0;

      const diffPercent = (current: number, prev: number) => {
        if (prev === 0) return current === 0 ? 0 : 100;
        return Math.round(((current - prev) / prev) * 100);
      };

      return [
        {
          title: 'Leads Contatados',
          value: leadsContatados.toString(),
          trend: 'up' as const,
          icon: <Phone className="h-5 w-5" />,
          percentage: diffPercent(leadsContatados, leadsContatadosPrev),
          gradient: 'from-blue-500/20 to-cyan-500/20',
          description: `${diffPercent(leadsContatados, leadsContatadosPrev) >= 0 ? '+' : ''}${diffPercent(leadsContatados, leadsContatadosPrev)}% vs período anterior`
        },
        {
          title: 'Leads agendados para diagnóstico',
          value: agendDiag.toString(),
          trend: 'up' as const,
          icon: <Calendar className="h-5 w-5" />,
          percentage: diffPercent(agendDiag, agendDiagPrev),
          gradient: 'from-green-500/20 to-emerald-500/20',
          description: `${diffPercent(agendDiag, agendDiagPrev) >= 0 ? '+' : ''}${diffPercent(agendDiag, agendDiagPrev)}% vs anterior`
        },
        {
          title: 'Leads Agendados para Apresentar Mentoria',
          value: agendMent.toString(),
          trend: 'up' as const,
          icon: <Users className="h-5 w-5" />,
          percentage: diffPercent(agendMent, agendMentPrev),
          gradient: 'from-purple-500/20 to-pink-500/20',
          description: `${diffPercent(agendMent, agendMentPrev) >= 0 ? '+' : ''}${diffPercent(agendMent, agendMentPrev)}% vs anterior`
        },
        {
          title: 'Leads Agendados para Apresentar Consultoria',
          value: agendConsult.toString(),
          trend: 'stable' as const,
          icon: <MessageCircle className="h-5 w-5" />,
          percentage: 0,
          gradient: 'from-orange-500/20 to-amber-500/20',
          description: 'Agendamentos para consultoria'
        },
        {
          title: 'Downsell Vendido',
          value: downsellVendido.toString(),
          trend: 'stable' as const,
          icon: <Handshake className="h-5 w-5" />,
          percentage: 0,
          gradient: 'from-yellow-500/20 to-orange-500/20',
          description: 'Vendas de downsell realizadas'
        }
      ];
    })() : department === 'cs' ? (() => {
      const getCsDetailFromStorage = () => {
        try {
          if (typeof window === 'undefined') return null;
          if (!campanhaAtiva) return null;
          const key = `metricas_cs_${campanhaAtiva.id}_${filtroData.dataInicio}`;
          const raw = localStorage.getItem(key);
          if (!raw) return null;
          const parsed = JSON.parse(raw);
          return parsed?.detalhe || parsed?.detalhe_cs || null;
        } catch (err) {
          return null;
        }
      };

      const csDetail = getCsDetailFromStorage();
      const csDetailPrev = (() => {
        try {
          if (typeof window === 'undefined') return null;
          if (!campanhaAtiva) return null;
          const key = `metricas_cs_${campanhaAtiva.id}_${periodoAnterior.inicio}`;
          const raw = localStorage.getItem(key);
          if (!raw) return null;
          const parsed = JSON.parse(raw);
          return parsed?.detalhe || parsed?.detalhe_cs || null;
        } catch (err) {
          return null;
        }
      })();

      const alunasContatadas = csDetail?.alunas_contatadas ?? 0;
      const suportePrestado = csDetail?.suporte_prestado ?? 0;
      const suporteResolvidos = csDetail?.suporte_resolvidos ?? 0;
      const suportePendentes = csDetail?.suporte_pendentes ?? 0;
      const produtosVendidos = csDetail?.produtos_vendidos ?? 0;

      const alunasContatadadasPrev = csDetailPrev?.alunas_contatadas ?? 0;
      const suportePrestadoPrev = csDetailPrev?.suporte_prestado ?? 0;
      const suporteResolvidosPrev = csDetailPrev?.suporte_resolvidos ?? 0;

      const diffPercent = (current: number, prev: number) => {
        if (prev === 0) return current === 0 ? 0 : 100;
        return Math.round(((current - prev) / prev) * 100);
      };

      return [
        {
          title: 'Alunas Contatadas',
          value: alunasContatadas.toString(),
          trend: 'up' as const,
          icon: <Users className="h-5 w-5" />,
          percentage: diffPercent(alunasContatadas, alunasContatadadasPrev),
          gradient: 'from-blue-500/20 to-cyan-500/20',
          description: `${diffPercent(alunasContatadas, alunasContatadadasPrev) >= 0 ? '+' : ''}${diffPercent(alunasContatadas, alunasContatadadasPrev)}% vs período anterior`
        },
        {
          title: 'Suporte Prestado',
          value: suportePrestado.toString(),
          trend: 'up' as const,
          icon: <HeadphonesIcon className="h-5 w-5" />,
          percentage: diffPercent(suportePrestado, suportePrestadoPrev),
          gradient: 'from-green-500/20 to-emerald-500/20',
          description: `${diffPercent(suportePrestado, suportePrestadoPrev) >= 0 ? '+' : ''}${diffPercent(suportePrestado, suportePrestadoPrev)}% vs anterior`
        },
        {
          title: 'Suporte Resolvidos',
          value: suporteResolvidos.toString(),
          trend: 'up' as const,
          icon: <Award className="h-5 w-5" />,
          percentage: diffPercent(suporteResolvidos, suporteResolvidosPrev),
          gradient: 'from-purple-500/20 to-pink-500/20',
          description: `${diffPercent(suporteResolvidos, suporteResolvidosPrev) >= 0 ? '+' : ''}${diffPercent(suporteResolvidos, suporteResolvidosPrev)}% vs anterior`
        },
        {
          title: 'Suporte Pendentes',
          value: suportePendentes.toString(),
          trend: suportePendentes > 0 ? 'down' as const : 'stable' as const,
          icon: <Clock className="h-5 w-5" />,
          percentage: 0,
          gradient: 'from-orange-500/20 to-amber-500/20',
          description: 'Casos aguardando resolução'
        },
        {
          title: 'Produtos vendidos',
          value: produtosVendidos.toString(),
          trend: 'up' as const,
          icon: <ShoppingCart className="h-5 w-5" />,
          percentage: 0,
          gradient: 'from-yellow-500/20 to-orange-500/20',
          description: 'Vendas adicionais realizadas'
        }
      ];
    })() : metricasParaExibir ? [
      {
        title: 'Investimento',
        value: metricasParaExibir.investimento > 0 ? `R$ ${metricasParaExibir.investimento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'Não informado',
        trend: 'up' as const,
        icon: <Target className="h-5 w-5" />,
        percentage: 85,
        gradient: 'from-blue-500/20 to-cyan-500/20',
        description: campanhaAtiva ? 'Total investido' : 'Total de todas as campanhas'
      },
      {
        title: 'Faturamento',
        value: metricasParaExibir.faturamento > 0 ? `R$ ${metricasParaExibir.faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'Não informado',
        trend: metricasParaExibir.faturamento >= metricasParaExibir.investimento ? 'up' as const : 'down' as const,
        icon: <Rocket className="h-5 w-5" />,
        percentage: Math.min((metricasParaExibir.faturamento / Math.max(metricasParaExibir.investimento, 1)) * 50, 100),
        gradient: 'from-emerald-500/20 to-teal-500/20',
        description: campanhaAtiva ? 'Receita total' : 'Receita de todas as campanhas'
      },
      {
        title: 'ROAS',
        value: metricasParaExibir.roas > 0 ? `${metricasParaExibir.roas.toFixed(2)}x` : 'Não informado',
        trend: metricasParaExibir.roas >= 2 ? 'up' as const : metricasParaExibir.roas > 0 ? 'stable' as const : 'down' as const,
        icon: <TrendingUp className="h-5 w-5" />,
        percentage: Math.min(metricasParaExibir.roas * 30, 100),
        gradient: 'from-purple-500/20 to-pink-500/20',
        description: metricasParaExibir.roas >= 2 ? 'Excelente retorno' : metricasParaExibir.roas > 0 ? 'Retorno moderado' : 'Sem dados'
      },
      {
        title: 'Custo por Lead',
        value: custoPortLead > 0 ? `R$ ${custoPortLead.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'Não informado',
        trend: custoPortLead <= 50 ? 'up' as const : custoPortLead <= 100 ? 'stable' as const : 'down' as const,
        icon: <UserCheck className="h-5 w-5" />,
        percentage: custoPortLead > 0 ? Math.max(100 - custoPortLead, 10) : 0,
        gradient: 'from-orange-500/20 to-amber-500/20',
        description: custoPortLead <= 50 ? 'Custo otimizado' : custoPortLead <= 100 ? 'Custo moderado' : 'Custo elevado'
      }
    ] : [
      {
        title: 'Investimento',
        value: 'Não informado',
        trend: 'stable' as const,
        icon: <Target className="h-5 w-5" />,
        percentage: 0,
        gradient: 'from-blue-500/20 to-cyan-500/20',
        description: 'Selecione uma campanha'
      },
      {
        title: 'Faturamento',
        value: 'Não informado',
        trend: 'stable' as const,
        icon: <Rocket className="h-5 w-5" />,
        percentage: 0,
        gradient: 'from-emerald-500/20 to-teal-500/20',
        description: 'Selecione uma campanha'
      },
      {
        title: 'ROAS',
        value: 'Não informado',
        trend: 'stable' as const,
        icon: <TrendingUp className="h-5 w-5" />,
        percentage: 0,
        gradient: 'from-purple-500/20 to-pink-500/20',
        description: 'Selecione uma campanha'
      },
      {
        title: 'Custo por Lead',
        value: 'Não informado',
        trend: 'stable' as const,
        icon: <UserCheck className="h-5 w-5" />,
        percentage: 0,
        gradient: 'from-orange-500/20 to-amber-500/20',
        description: 'Selecione uma campanha'
      }
    ];  // Dados da campanha para a tabela
  const campanhasData = campanhaAtiva && metricasCampanha ? [
    {
      id: campanhaAtiva.id,
      nome: campanhaAtiva.nome,
      plataforma: campanhaAtiva.plataforma,
      investido: metricasCampanha.investimento,
      leads: metricasCampanha.leads,
      ctr: metricasCampanha.ctr,
      conversao: metricasCampanha.taxa_conversao,
      ativa: campanhaAtiva.ativo
    }
  ] : campanhasDataPadrao;

  // Gerar dados de gráfico baseados na campanha
  const chartData = metricasCampanha ? [
    { 
      data: '2024-10-20', 
      investimento: Math.floor(metricasCampanha.investimento * 0.15), 
      leads: Math.floor(metricasCampanha.leads * 0.12), 
      vendas: Math.floor(metricasCampanha.vendas * 0.18) 
    },
    { 
      data: '2024-10-21', 
      investimento: Math.floor(metricasCampanha.investimento * 0.22), 
      leads: Math.floor(metricasCampanha.leads * 0.25), 
      vendas: Math.floor(metricasCampanha.vendas * 0.28) 
    },
    { 
      data: '2024-10-22', 
      investimento: Math.floor(metricasCampanha.investimento * 0.18), 
      leads: Math.floor(metricasCampanha.leads * 0.20), 
      vendas: Math.floor(metricasCampanha.vendas * 0.22) 
    },
    { 
      data: '2024-10-23', 
      investimento: Math.floor(metricasCampanha.investimento * 0.25), 
      leads: Math.floor(metricasCampanha.leads * 0.28), 
      vendas: Math.floor(metricasCampanha.vendas * 0.25) 
    },
    { 
      data: '2024-10-24', 
      investimento: Math.floor(metricasCampanha.investimento * 0.20), 
      leads: Math.floor(metricasCampanha.leads * 0.15), 
      vendas: Math.floor(metricasCampanha.vendas * 0.07) 
    },
  ] : chartDataPadrao;

  return (
    <div className="space-y-4 p-2">
      {/* Futuristic Header */}
      <div className="relative">
        {!isClean && <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10 blur-3xl" />}
        <div className={cn(
          "dashboard-header relative rounded-2xl p-5",
          isClean
            ? 'bg-white border border-gray-200/60 shadow-sm'
            : 'bg-slate-900/50 backdrop-blur-xl border border-slate-700/50'
        )}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-4">
              <div className="header-dots flex space-x-1">
                <div className={cn("w-3 h-3 rounded-full animate-pulse", isClean ? 'bg-amber-500' : 'bg-cyan-400')}></div>
                <div className={cn("w-3 h-3 rounded-full animate-pulse animation-delay-200", isClean ? 'bg-amber-300' : 'bg-purple-400')}></div>
                <div className={cn("w-3 h-3 rounded-full animate-pulse animation-delay-400", isClean ? 'bg-amber-200' : 'bg-pink-400')}></div>
              </div>
              <h1 className={cn(
                "text-xl md:text-3xl font-bold",
                isClean
                  ? 'text-amber-700'
                  : 'text-white bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent'
              )}>
                {defaultTitle}
                {(campanhaAtiva || filtrosAtivos.funil) && (
                  <span className={cn("text-base md:text-2xl font-semibold", isClean ? 'text-gray-500' : 'text-slate-300')}>{` • ${campanhaAtiva ? `Campanha: ${campanhaAtiva.nome}` : `Funil: ${filtrosAtivos.funil?.name}`}`}</span>
                )}
              </h1>
              
              {/* Indicador de Filtros Ativos */}
              {(filtrosAtivos.funil || filtrosAtivos.campanha || filtrosAtivos.publico || filtrosAtivos.criativo) && (
                <div className="flex items-center space-x-2 mt-2">
                  <div className={cn(
                    "flex items-center space-x-1 px-3 py-1 rounded-full border",
                    isClean
                      ? 'bg-amber-50 border-amber-200'
                      : 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border-cyan-500/30'
                  )}>
                    <Filter className={cn("h-3 w-3", isClean ? 'text-amber-600' : 'text-cyan-400')} />
                    <span className={cn("text-xs font-medium", isClean ? 'text-amber-700' : 'text-cyan-300')}>Filtros ativos</span>
                  </div>
                  <div className="flex items-center space-x-1 text-xs">
                    {filtrosAtivos.funil && (
                      <span className={cn("px-2 py-0.5 rounded", isClean ? 'bg-blue-50 text-blue-600' : 'bg-blue-500/20 text-blue-300')}>
                        📊 {filtrosAtivos.funil.name}
                      </span>
                    )}
                    {filtrosAtivos.campanha && (
                      <span className={cn("px-2 py-0.5 rounded", isClean ? 'bg-green-50 text-green-600' : 'bg-green-500/20 text-green-300')}>
                        📈 {filtrosAtivos.campanha.name}
                      </span>
                    )}
                    {filtrosAtivos.publico && (
                      <span className={cn("px-2 py-0.5 rounded", isClean ? 'bg-purple-50 text-purple-600' : 'bg-purple-500/20 text-purple-300')}>
                        👥 {filtrosAtivos.publico.name}
                      </span>
                    )}
                    {filtrosAtivos.criativo && (
                      <span className={cn("px-2 py-0.5 rounded", isClean ? 'bg-orange-50 text-orange-600' : 'bg-orange-500/20 text-orange-300')}>
                        🎨 {filtrosAtivos.criativo.name}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
            
          </div>
          
          <p className={cn("header-subtitle text-base", isClean ? 'text-gray-500' : 'text-slate-300')}>
            {campanhaAtiva 
              ? `Análise detalhada da campanha • ${campanhaAtiva.plataforma} • ${campanhaAtiva.tipo.charAt(0).toUpperCase() + campanhaAtiva.tipo.slice(1)}`
              : 'Visão consolidada de todas as campanhas • Métricas agregadas'
            }
          </p>
          {loading && (
            <div className={cn("mt-4 flex items-center", isClean ? 'text-amber-600' : 'text-cyan-400')}>
              <div className={cn("animate-spin rounded-full h-4 w-4 border-b-2 mr-2", isClean ? 'border-amber-600' : 'border-cyan-400')}></div>
              Carregando dados da campanha...
            </div>
          )}

          {showEditButton && (
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => setModalEditarAberto(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-md font-medium hover:from-cyan-600 hover:to-purple-600 transition-all"
              >
                <Plus className="h-4 w-4" />
                <span>Incluir Métricas</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filtros de Data */}
      <FiltrosDashboard
        filtroAtual={filtroData}
        onFiltroChange={atualizarFiltroData}
        campanhaAtiva={campanhaAtiva}
        onMetricasAtualizadas={recarregarMetricas}
      />

      {/* Filtros de Campanha em Cascata */}
      <FiltrosCascata onFiltersChange={handleFiltersChange} />

        {/* Métricas Financeiras */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {metricsData.map((metric, index) => {
            const clickHandler = (metric as any)._onClick;
            const card = (
              <FuturisticMetricCard
                key={index}
                title={metric.title}
                value={metric.value}
                trend={metric.trend}
                icon={metric.icon}
                percentage={metric.percentage}
                gradient={metric.gradient}
                description={metric.description}
              />
            );
            if (clickHandler) {
              return (
                <div key={index} onClick={clickHandler} className="cursor-pointer hover:scale-[1.02] transition-transform">
                  {card}
                </div>
              );
            }
            return card;
          })}
        </div>

        {/* Funil de Conversão (ocultar no dashboard SDR, Closer, Social Seller e CS) */}
        {department !== 'sdr' && department !== 'closer' && department !== 'social-seller' && department !== 'cs' && <FunilConversao />}

        {/* Top 4 Criativos por melhor CPL */}
        {department !== 'sdr' && department !== 'closer' && department !== 'social-seller' && department !== 'cs' && <TopCriativos />}

        {/* Tabela Futurística */}
        <FuturisticCampanhasTable dataInicio={filtroData.dataInicio} dataFim={filtroData.dataFim} />

        {/* Modal de edição de métricas (montado para controle via botão) */}
        {showEditButton && (
          <ModalEditarMetricas
            open={modalEditarAberto}
            onOpenChange={setModalEditarAberto}
            campanha={campanhaAtiva}
            onDadosAtualizados={() => {
              recarregarMetricas();
              setReloadTrigger(prev => prev + 1);
            }}
            hideFinanceFields={hideFinanceFields}
            department={department}
            filtrosIniciais={filtrosAtivos}
            dataInicial={filtroData.dataInicio}
          />
        )}

        {/* Modal de Nomes */}
        {nomesModal && (
          <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setNomesModal(null)}>
            <div className={cn(
              "modal-content rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col border",
              isClean ? 'bg-white border-gray-200' : 'bg-zinc-900 border-zinc-700'
            )} onClick={(e) => e.stopPropagation()}>
              <div className={cn(
                "modal-header flex items-center justify-between p-5 border-b",
                isClean ? 'border-gray-200' : 'border-zinc-700'
              )}>
                <h3 className={cn("text-lg font-bold", isClean ? 'text-gray-900' : 'text-white')}>{nomesModal.titulo}</h3>
                <button onClick={() => setNomesModal(null)} className={cn("modal-close-btn transition-colors p-1 rounded-md", isClean ? 'text-gray-400 hover:text-gray-600' : 'text-zinc-400 hover:text-white')}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5 overflow-y-auto flex-1">
                <p className={cn("text-sm mb-3", isClean ? 'text-gray-500' : 'text-zinc-400')}>{nomesModal.nomes.length} {nomesModal.nomes.length === 1 ? 'nome' : 'nomes'}</p>
                <ol className="space-y-1.5">
                  {nomesModal.nomes.map((nome, i) => (
                    <li key={i} className={cn("text-sm flex items-start gap-2", isClean ? 'text-gray-700' : 'text-zinc-200')}>
                      <span className={cn("font-mono text-xs mt-0.5 min-w-[24px]", isClean ? 'text-gray-400' : 'text-zinc-500')}>{i + 1}.</span>
                      <span>{nome}</span>
                    </li>
                  ))}
                </ol>
              </div>
              <div className={cn("modal-footer p-4 border-t", isClean ? 'border-gray-200' : 'border-zinc-700')}>
                <button
                  onClick={() => setNomesModal(null)}
                  className={cn(
                    "modal-close-btn w-full py-2 rounded-lg transition-colors text-sm font-medium",
                    isClean ? 'bg-gray-100 hover:bg-gray-200 text-gray-700' : 'bg-zinc-800 hover:bg-zinc-700 text-white'
                  )}
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}


    </div>
  );
}
