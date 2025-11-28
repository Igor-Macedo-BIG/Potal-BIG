'use client';

import { useState, useEffect } from 'react';
import { useCampanhaContext } from '@/contexts/CampanhaContext';
import { FuturisticMetricCard } from '@/components/dashboard/FuturisticMetricCard';
import { FuturisticCampanhasTable } from '@/components/dashboard/FuturisticCampanhasTable';
import { FuturisticCharts } from '@/components/dashboard/FuturisticCharts';
import FiltrosDashboard from '@/components/dashboard/FiltrosDashboard';
import { FunilConversao } from '@/components/dashboard/FunilConversao';
import { FiltrosCascata } from '@/components/dashboard/FiltrosCascata';
import { supabase } from '@/lib/supabase';
import ModalEditarMetricas from '@/components/modals/ModalEditarMetricas';

import { TrendingUp, Users, MousePointer, Target, Zap, Rocket, Brain, Star, Edit3, Plus, DollarSign, UserCheck, ShoppingCart, Megaphone, Phone, Handshake, HeadphonesIcon, Eye, BarChart3, Calendar, MessageCircle, Clock, Award, TrendingDown, Filter, Share2 } from 'lucide-react';

// Componente de Abas dos Departamentos - Estilo Funil de Conversão
function DashboardTabs() {
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
    <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl">
      <div className="p-6 border-b border-slate-700/50">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-3xl font-black text-white flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-cyan-400" />
            Métricas por Departamento
          </h3>
        </div>
        
        {/* Navegação das Abas */}
        <div className="flex space-x-1 bg-slate-800/50 p-1 rounded-xl">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center space-x-2 px-4 py-3 rounded-lg font-bold transition-all duration-300 flex-1 justify-center
                ${activeTab === tab.id
                  ? `bg-slate-700/70 ${tab.color} border border-slate-600/50 shadow-lg`
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }
              `}
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
          <h2 className="text-2xl font-black text-slate-300 mb-2">
            {departamento.title}
          </h2>
          <p className="text-slate-400 font-medium">
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
                className={`relative rounded-2xl border-2 p-6 text-center transition-all duration-300 hover:scale-105 hover:shadow-2xl bg-slate-800/30 backdrop-blur-xl ${metrica.corFundo}`}
              >
                <div className="flex items-center justify-center mb-4">
                  <div className={`p-3 rounded-xl ${metrica.corFundo}`}>
                    <IconeMetrica className={`h-6 w-6 ${metrica.cor}`} />
                  </div>
                </div>
                
                <div className="text-sm text-slate-400 uppercase tracking-widest font-black mb-2">
                  {metrica.nome}
                </div>
                
                <div className={`text-2xl font-black ${metrica.cor} mb-2`}>
                  {metrica.valor}
                </div>
                
                <div className="text-xs text-slate-500">
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
  const { campanhaAtiva, metricasCampanha, metricasGerais, loading, filtroData, atualizarFiltroData, recarregarMetricas, selecionarCampanha } = useCampanhaContext();
  const [modalEditarAberto, setModalEditarAberto] = useState(false);
  const [reloadTrigger, setReloadTrigger] = useState(0);
  
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
    
    // Mostrar feedback visual de que os filtros foram aplicados
    if (filters.campanha) {
      console.log('🎯 Campanha selecionada:', filters.campanha.name);
      // Buscar e selecionar a campanha real se ela existir
      await buscarEselecionarCampanha(filters.campanha.id, filters.campanha.name);
    } else if (filters.funil) {
      console.log('📊 Funil selecionado:', filters.funil.name);
      // Limpar seleção de campanha para mostrar visão geral do funil
      selecionarCampanha(null);
      await buscarMetricasPorFunil(filters.funil.id);
    } else {
      console.log('🏠 Voltando para visão geral');
      // Limpar tudo e mostrar métricas gerais
      selecionarCampanha(null);
      await recarregarMetricas();
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
  const buscarMetricasPorCampanha = async (campanhaId: string) => {
    try {
      console.log('📊 Buscando métricas para campanha:', campanhaId);
      
      // Buscar dados da campanha
      const { data: campanha, error: errorCampanha } = await supabase
        .from('campanhas')
        .select('*')
        .eq('id', campanhaId)
        .single();

      if (errorCampanha) {
        console.error('Erro ao buscar campanha:', errorCampanha);
        return;
      }

      // Buscar métricas da campanha
      const { data: metricas, error: errorMetricas } = await supabase
        .from('metricas_campanhas')
        .select('*')
        .eq('campanha_id', campanhaId);

      if (errorMetricas) {
        console.error('Erro ao buscar métricas:', errorMetricas);
        // Usar métricas de exemplo se não houver dados reais
        const metricasExemplo = gerarMetricasExemplo(campanha);
        console.log('📊 Usando métricas de exemplo:', metricasExemplo);
        // As métricas serão exibidas através do contexto
        return;
      }

      // Se há métricas reais, processá-las
      if (metricas && metricas.length > 0) {
        const metricasProcessadas = processarMetricas(metricas);
        console.log('📊 Métricas reais processadas:', metricasProcessadas);
        // As métricas serão exibidas através do contexto
      } else {
        // Gerar métricas de exemplo baseadas na campanha
        const metricasExemplo = gerarMetricasExemplo(campanha);
        console.log('📊 Usando métricas de exemplo para campanha:', metricasExemplo);
        // As métricas serão exibidas através do contexto
      }

      // Atualizar a campanha ativa - isso vai triggerar o carregamento das métricas
      selecionarCampanha(campanha);
      
      console.log('✅ Métricas atualizadas para campanha:', campanha.nome);
      
    } catch (error) {
      console.error('Erro geral ao buscar métricas da campanha:', error);
    }
  };

  // Função para buscar métricas agregadas de um funil
  const buscarMetricasPorFunil = async (funilId: string) => {
    try {
      console.log('📈 Buscando métricas agregadas para funil:', funilId);
      
      // Buscar todas as campanhas do funil
      const { data: campanhas, error: errorCampanhas } = await supabase
        .from('campanhas')
        .select('*')
        .eq('funil_id', funilId);

      if (errorCampanhas) {
        console.error('Erro ao buscar campanhas do funil:', errorCampanhas);
        return;
      }

      // Gerar métricas agregadas de exemplo para o funil
      const metricasAgregadas = gerarMetricasAgregadasFunil(campanhas || []);
      console.log('📊 Métricas agregadas do funil:', metricasAgregadas);
      
      // Limpar campanha ativa para mostrar visão do funil
      selecionarCampanha(null);
      
      console.log('✅ Métricas agregadas atualizadas para funil');
      
    } catch (error) {
      console.error('Erro ao buscar métricas do funil:', error);
    }
  };

  // Função para gerar métricas de exemplo baseadas na campanha
  const gerarMetricasExemplo = (campanha: any) => {
    const base = {
      'Masterclass': { investimento: 2500, faturamento: 8900, leads: 320, vendas: 45 },
      'Captação': { investimento: 1800, faturamento: 5400, leads: 280, vendas: 32 },
      'Reativação': { investimento: 1200, faturamento: 4200, leads: 180, vendas: 28 },
      'Vendas': { investimento: 3200, faturamento: 12800, leads: 420, vendas: 65 }
    };

    const tipo = Object.keys(base).find(key => 
      campanha.nome.toLowerCase().includes(key.toLowerCase())
    ) || 'Masterclass';

    const metricas = base[tipo as keyof typeof base];
    
    return {
      investimento: metricas.investimento,
      faturamento: metricas.faturamento,
      roas: metricas.faturamento / metricas.investimento,
      leads: metricas.leads,
      vendas: metricas.vendas,
      taxa_conversao: (metricas.vendas / metricas.leads) * 100,
      ctr: 2.4 + Math.random(),
      cpm: 15 + Math.random() * 10,
      cpc: 1.2 + Math.random() * 0.8
    };
  };

  // Função para gerar métricas agregadas de funil
  const gerarMetricasAgregadasFunil = (campanhas: any[]) => {
    const totalCampanhas = campanhas.length || 3;
    
    return {
      investimento: totalCampanhas * 2000 + Math.random() * 1000,
      faturamento: totalCampanhas * 6000 + Math.random() * 2000,
      roas: 2.8 + Math.random() * 0.4,
      leads: totalCampanhas * 250 + Math.floor(Math.random() * 100),
      vendas: totalCampanhas * 35 + Math.floor(Math.random() * 20),
      taxa_conversao: 12 + Math.random() * 3,
      ctr: 2.2 + Math.random() * 0.6,
      cpm: 18 + Math.random() * 8,
      cpc: 1.4 + Math.random() * 0.6
    };
  };

  // Função para processar métricas reais do banco
  const processarMetricas = (metricas: any[]) => {
    // Agregar todas as métricas se houver múltiplas entradas
    return metricas.reduce((acc, metrica) => ({
      investimento: (acc.investimento || 0) + (metrica.investimento || 0),
      faturamento: (acc.faturamento || 0) + (metrica.faturamento || 0),
      roas: metrica.roas || (metrica.faturamento / Math.max(metrica.investimento, 1)),
      leads: (acc.leads || 0) + (metrica.leads || 0),
      vendas: (acc.vendas || 0) + (metrica.vendas || 0),
      taxa_conversao: metrica.taxa_conversao || 0,
      ctr: metrica.ctr || 0,
      cpm: metrica.cpm || 0,
      cpc: metrica.cpc || 0
    }), {});
  };

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
      if (department === 'sdr') {
        const buscarMetricasSdr = async () => {
          try {
            // Filtros SDR aplicados

            // Construir query base
            let queryAtual = supabase
              .from('metricas')
              .select('detalhe_sdr, referencia_id, periodo_inicio, periodo_fim')
              .gte('periodo_inicio', filtroData.dataInicio)
              .lte('periodo_fim', filtroData.dataFim)
              .not('detalhe_sdr', 'is', null);

            // Aplicar filtros se houver campanha selecionada
            if (filtrosAtivos.campanha?.id) {
              queryAtual = queryAtual.eq('referencia_id', filtrosAtivos.campanha.id);
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
                  nomes_qualificados: det.nomes_qualificados || ''
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
              .select('detalhe_sdr')
              .gte('periodo_inicio', periodoAnterior.inicio)
              .lte('periodo_fim', periodoAnterior.fim)
              .not('detalhe_sdr', 'is', null);

            // Aplicar mesmos filtros para período anterior
            if (filtrosAtivos.campanha?.id) {
              queryAnterior = queryAnterior.eq('referencia_id', filtrosAtivos.campanha.id);
            }

            const { data: metricasAnteriores } = await queryAnterior;

            if (metricasAnteriores && metricasAnteriores.length > 0) {
              const totalAnterior = metricasAnteriores.reduce((acc: any, item: any) => {
                const det = item.detalhe_sdr;
                return {
                  comecou_diagnostico: (acc.comecou_diagnostico || 0) + (det.comecou_diagnostico || 0),
                  chegaram_crm_kommo: (acc.chegaram_crm_kommo || 0) + (det.chegaram_crm_kommo || 0),
                  qualificados_para_mentoria: (acc.qualificados_para_mentoria || 0) + (det.qualificados_para_mentoria || 0)
                };
              }, {
                comecou_diagnostico: 0,
                chegaram_crm_kommo: 0,
                qualificados_para_mentoria: 0
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
    }, [department, filtroData.dataInicio, filtroData.dataFim, filtrosAtivos.campanha?.id, reloadTrigger]);

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
      // valores fallback se não houver detalhe SDR salvo
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

      const diffPercent = (current: number, prev: number) => {
        if (prev === 0) return current === 0 ? 0 : 100;
        return Math.round(((current - prev) / prev) * 100);
      };

      const taxaConversao = comecouDiag > 0 ? parseFloat(((qualificados / comecouDiag) * 100).toFixed(2)) : 0;
      const taxaConversaoPrev = comecouDiagPrev > 0 ? parseFloat(((qualificadosPrev / comecouDiagPrev) * 100).toFixed(2)) : 0;

      return [
        {
          title: 'Lead começou preencher diagnóstico',
          value: comecouDiag.toString(),
          trend: 'up' as const,
          icon: <Edit3 className="h-5 w-5" />,
          percentage: diffPercent(comecouDiag, comecouDiagPrev),
          gradient: 'from-cyan-500/20 to-blue-500/20',
          description: `${diffPercent(comecouDiag, comecouDiagPrev) >= 0 ? '+' : ''}${diffPercent(comecouDiag, comecouDiagPrev)}% vs período anterior`
        },
        {
          title: 'Leads que chegaram ao CRM Kommo',
          value: chegaramCrm.toString(),
          trend: 'up' as const,
          icon: <Users className="h-5 w-5" />,
          percentage: diffPercent(chegaramCrm, chegaramCrmPrev),
          gradient: 'from-blue-500/20 to-indigo-500/20',
          description: `${diffPercent(chegaramCrm, chegaramCrmPrev) >= 0 ? '+' : ''}${diffPercent(chegaramCrm, chegaramCrmPrev)}% vs período anterior`
        },
        {
          title: 'Leads qualificados para Mentoria',
          value: qualificados.toString(),
          trend: 'up' as const,
          icon: <UserCheck className="h-5 w-5" />,
          percentage: diffPercent(qualificados, qualificadosPrev),
          gradient: 'from-emerald-500/20 to-teal-500/20',
          description: `${diffPercent(qualificados, qualificadosPrev) >= 0 ? '+' : ''}${diffPercent(qualificados, qualificadosPrev)}% vs período anterior`
        },
        {
          title: 'Leads para Downsell',
          value: paraDownsell.toString(),
          trend: 'stable' as const,
          icon: <TrendingDown className="h-5 w-5" />,
          percentage: 0,
          gradient: 'from-orange-500/20 to-amber-500/20',
          description: 'Leads designados para oferta altern.'
        },
        {
          title: 'Agendados para Diagnóstico',
          value: agendDiag.toString(),
          trend: 'up' as const,
          icon: <Calendar className="h-5 w-5" />,
          percentage: 0,
          gradient: 'from-purple-500/20 to-pink-500/20',
          description: 'Agendamentos gerados'
        },
        {
          title: 'Agendados para Mentoria',
          value: agendMent.toString(),
          trend: 'up' as const,
          icon: <Phone className="h-5 w-5" />,
          percentage: 0,
          gradient: 'from-yellow-500/20 to-orange-500/20',
          description: 'Agendamentos confirmados'
        },
        {
          title: 'Nomes dos leads qualificados',
          value: (nomes ? nomes.split('\n').filter(Boolean).length : 0).toString(),
          trend: 'stable' as const,
          icon: <MessageCircle className="h-5 w-5" />,
          percentage: 0,
          gradient: 'from-pink-500/20 to-purple-500/20',
          description: nomes ? `${nomes.split('\n').slice(0,3).join(', ')}${nomes.split('\n').length > 3 ? '…' : ''}` : '—'
        },
        {
          title: 'Taxa de Conversão (qualificados / preencheram)',
          value: `${taxaConversao}%`,
          trend: taxaConversao >= taxaConversaoPrev ? 'up' as const : 'down' as const,
          icon: <TrendingUp className="h-5 w-5" />,
          percentage: Math.abs(Math.round(((taxaConversao - taxaConversaoPrev) || 0))),
          gradient: 'from-pink-500/20 to-purple-500/20',
          description: `${taxaConversaoPrev ? (taxaConversao >= taxaConversaoPrev ? '+' : '-') : ''}${taxaConversaoPrev ? Math.round(((taxaConversao - taxaConversaoPrev) / Math.max(taxaConversaoPrev,1)) * 100) : ''}% vs anterior`
        }
      ];
    })() : department === 'closer' ? (() => {
      const getCloserDetailFromStorage = () => {
        try {
          if (typeof window === 'undefined') return null;
          if (!campanhaAtiva) return null;
          const key = `metricas_closer_${campanhaAtiva.id}_${filtroData.dataInicio}`;
          const raw = localStorage.getItem(key);
          if (!raw) return null;
          const parsed = JSON.parse(raw);
          return parsed?.detalhe || parsed?.detalhe_closer || null;
        } catch (err) {
          return null;
        }
      };

      const closerDetail = getCloserDetailFromStorage();
      const closerDetailPrev = (() => {
        try {
          if (typeof window === 'undefined') return null;
          if (!campanhaAtiva) return null;
          const key = `metricas_closer_${campanhaAtiva.id}_${periodoAnterior.inicio}`;
          const raw = localStorage.getItem(key);
          if (!raw) return null;
          const parsed = JSON.parse(raw);
          return parsed?.detalhe || parsed?.detalhe_closer || null;
        } catch (err) {
          return null;
        }
      })();

      const calls = closerDetail?.calls_realizadas ?? 0;
      const noShows = closerDetail?.nao_compareceram ?? 0;
      const vendasMentoria = closerDetail?.vendas_mentoria ?? (metricasParaExibir?.vendas ?? 0);
      const vendasDownsell = closerDetail?.vendas_downsell ?? 0;
      const emNegociacao = closerDetail?.em_negociacao ?? 0;
      const emFollowup = closerDetail?.em_followup ?? 0;
      const vendasPerdidas = closerDetail?.vendas_perdidas ?? 0;

      const callsPrev = closerDetailPrev?.calls_realizadas ?? 0;
      const noShowsPrev = closerDetailPrev?.nao_compareceram ?? 0;
      const vendasMentoriaPrev = closerDetailPrev?.vendas_mentoria ?? 0;

      const diffPercent = (current: number, prev: number) => {
        if (prev === 0) return current === 0 ? 0 : 100;
        return Math.round(((current - prev) / prev) * 100);
      };

      return [
        {
          title: 'Call realizadas',
          value: calls.toString(),
          trend: 'up' as const,
          icon: <Phone className="h-5 w-5" />,
          percentage: diffPercent(calls, callsPrev),
          gradient: 'from-blue-500/20 to-cyan-500/20',
          description: `${diffPercent(calls, callsPrev) >= 0 ? '+' : ''}${diffPercent(calls, callsPrev)}% vs período anterior`
        },
        {
          title: 'Não compareceu a call',
          value: noShows.toString(),
          trend: noShows > (noShowsPrev || 0) ? 'down' as const : 'stable' as const,
          icon: <TrendingDown className="h-5 w-5" />,
          percentage: diffPercent(noShows, noShowsPrev),
          gradient: 'from-red-500/20 to-pink-500/20',
          description: `${diffPercent(noShows, noShowsPrev) >= 0 ? '+' : ''}${diffPercent(noShows, noShowsPrev)}% vs anterior`
        },
        {
          title: 'Vendas da Mentoria',
          value: vendasMentoria.toString(),
          trend: 'up' as const,
          icon: <Handshake className="h-5 w-5" />,
          percentage: diffPercent(vendasMentoria, vendasMentoriaPrev),
          gradient: 'from-emerald-500/20 to-teal-500/20',
          description: `${diffPercent(vendasMentoria, vendasMentoriaPrev) >= 0 ? '+' : ''}${diffPercent(vendasMentoria, vendasMentoriaPrev)}% vs anterior`
        },
        {
          title: 'Vendas Downsell',
          value: vendasDownsell.toString(),
          trend: 'stable' as const,
          icon: <TrendingDown className="h-5 w-5" />,
          percentage: 0,
          gradient: 'from-orange-500/20 to-amber-500/20',
          description: 'Vendas atribuídas ao Downsell'
        },
        {
          title: 'Em negociação',
          value: emNegociacao.toString(),
          trend: 'stable' as const,
          icon: <Clock className="h-5 w-5" />,
          percentage: 0,
          gradient: 'from-purple-500/20 to-pink-500/20',
          description: 'Oportunidades em negociação'
        },
        {
          title: 'Em Follow-up',
          value: emFollowup.toString(),
          trend: 'stable' as const,
          icon: <Clock className="h-5 w-5" />,
          percentage: 0,
          gradient: 'from-yellow-500/20 to-orange-500/20',
          description: 'Leads em acompanhamento'
        },
        {
          title: 'Vendas perdidas',
          value: vendasPerdidas.toString(),
          trend: 'down' as const,
          icon: <TrendingDown className="h-5 w-5" />,
          percentage: 0,
          gradient: 'from-red-500/20 to-pink-500/20',
          description: 'Oportunidades perdidas'
        }
      ];
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
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10 blur-3xl" />
        <div className="relative bg-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-4">
              <div className="flex space-x-1">
                <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse"></div>
                <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse animation-delay-200"></div>
                <div className="w-3 h-3 bg-pink-400 rounded-full animate-pulse animation-delay-400"></div>
              </div>
              <h1 className="text-3xl font-bold text-white bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                {defaultTitle}
                {(campanhaAtiva || filtrosAtivos.funil) && (
                  <span className="text-2xl font-semibold text-slate-300">{` • ${campanhaAtiva ? `Campanha: ${campanhaAtiva.nome}` : `Funil: ${filtrosAtivos.funil?.name}`}`}</span>
                )}
              </h1>
              
              {/* Indicador de Filtros Ativos */}
              {(filtrosAtivos.funil || filtrosAtivos.campanha || filtrosAtivos.publico || filtrosAtivos.criativo) && (
                <div className="flex items-center space-x-2 mt-2">
                  <div className="flex items-center space-x-1 px-3 py-1 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-full border border-cyan-500/30">
                    <Filter className="h-3 w-3 text-cyan-400" />
                    <span className="text-xs text-cyan-300 font-medium">Filtros ativos</span>
                  </div>
                  <div className="flex items-center space-x-1 text-xs text-slate-400">
                    {filtrosAtivos.funil && (
                      <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded">
                        📊 {filtrosAtivos.funil.name}
                      </span>
                    )}
                    {filtrosAtivos.campanha && (
                      <span className="px-2 py-0.5 bg-green-500/20 text-green-300 rounded">
                        📈 {filtrosAtivos.campanha.name}
                      </span>
                    )}
                    {filtrosAtivos.publico && (
                      <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded">
                        👥 {filtrosAtivos.publico.name}
                      </span>
                    )}
                    {filtrosAtivos.criativo && (
                      <span className="px-2 py-0.5 bg-orange-500/20 text-orange-300 rounded">
                        🎨 {filtrosAtivos.criativo.name}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
            
          </div>
          
          <p className="text-slate-300 text-base">
            {campanhaAtiva 
              ? `Análise detalhada da campanha • ${campanhaAtiva.plataforma} • ${campanhaAtiva.tipo.charAt(0).toUpperCase() + campanhaAtiva.tipo.slice(1)}`
              : 'Visão consolidada de todas as campanhas • Métricas agregadas'
            }
          </p>
          {loading && (
            <div className="mt-4 flex items-center text-cyan-400">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cyan-400 mr-2"></div>
              Carregando dados da campanha...
            </div>
          )}

          {showEditButton && (
            <div className="mt-4 flex justify-end">
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
          {metricsData.map((metric, index) => (
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
          ))}
        </div>

        {/* Funil de Conversão (ocultar no dashboard SDR, Closer, Social Seller e CS) */}
        {department !== 'sdr' && department !== 'closer' && department !== 'social-seller' && department !== 'cs' && <FunilConversao />}

        {/* Gráficos Futurísticos */}
        <FuturisticCharts data={chartData} />

        {/* Tabela Futurística */}
        <FuturisticCampanhasTable campanhas={campanhasData} />

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


    </div>
  );
}
