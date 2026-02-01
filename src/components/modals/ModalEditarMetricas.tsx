'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Calendar, Edit3, Loader2, TrendingUp, Users, MousePointer, Target, DollarSign, List, PlusCircle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import type { Campanha } from '@/types/hierarchical';
import { useCliente } from '@/contexts/ClienteContext';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campanha: Campanha | null;
  onDadosAtualizados?: () => void;
  modoEdicao?: boolean;
  metricasExistentes?: any;
  hideFinanceFields?: boolean;
  department?: string;
  filtrosIniciais?: {
    funil: { id: string; name: string } | null;
    campanha: { id: string; name: string } | null;
    publico: { id: string; name: string } | null;
    criativo: { id: string; name: string } | null;
  };
  dataInicial?: string;
}

export default function ModalEditarMetricas({ 
  open, 
  onOpenChange, 
  campanha, 
  onDadosAtualizados, 
  modoEdicao = false, 
  metricasExistentes,
  hideFinanceFields = false,
  department,
  filtrosIniciais,
  dataInicial
}: Props) {
  const { clienteSelecionado } = useCliente();
  const [loading, setLoading] = useState(false);
  const [funis, setFunis] = useState<any[]>([]);
  const [campanhasList, setCampanhasList] = useState<any[]>([]);
  const [publicosList, setPublicosList] = useState<any[]>([]);
  const [criativosList, setCriativosList] = useState<any[]>([]);
  const [criativosListCompleta, setCriativosListCompleta] = useState<any[]>([]); // Lista completa sem filtro
  const [conjuntoPublicoMap, setConjuntoPublicoMap] = useState<Map<string, string>>(new Map()); // Mapear conjunto_id -> publico_id
  const [selectedFunil, setSelectedFunil] = useState<any>(null);
  const [selectedCampanha, setSelectedCampanha] = useState<any>(campanha || null);
  const [selectedPublico, setSelectedPublico] = useState<any>(null);
  const [selectedCriativo, setSelectedCriativo] = useState<any>(null);
  const [weeklyStart, setWeeklyStart] = useState<string>('');
  const [weeklyEnd, setWeeklyEnd] = useState<string>('');
  const [monthlyStart, setMonthlyStart] = useState<string>('');
  const [monthlyEnd, setMonthlyEnd] = useState<string>('');
  const [tipoDistribuicao, setTipoDistribuicao] = useState<'diario' | 'semanal' | 'mensal'>('diario');
  
  // Estado para controlar se há métrica existente e seus dados
  const [metricaExistente, setMetricaExistente] = useState<any>(null);
  const [modoAtual, setModoAtual] = useState<'criar' | 'editar'>('criar');
  
  // Estado para controlar as abas
  const [abaAtiva, setAbaAtiva] = useState<'adicionar' | 'listar'>('adicionar');
  const [metricasExistentesLista, setMetricasExistentesLista] = useState<any[]>([]);
  const [loadingLista, setLoadingLista] = useState(false);
  
  // Filtros da lista de métricas
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [filtroDataInicio, setFiltroDataInicio] = useState<string>('');
  const [filtroDataFim, setFiltroDataFim] = useState<string>('');
  const [metricasSelecionadas, setMetricasSelecionadas] = useState<Set<string>>(new Set());
  
  // Ref para controlar se já está carregando métricas (evitar loop infinito)
  const isLoadingMetricsRef = useRef(false);
  const lastLoadedDataRef = useRef<{campanhaId: string, data: string} | null>(null);
  
  const [formData, setFormData] = useState({
    data: dataInicial || new Date().toISOString().split('T')[0], // Data do filtro ou data atual
    alcance: '0',
    impressoes: '0',
    cliques: '0',
    visualizacoes_pagina: '0',
    leads: '0',
    checkouts: '0',
    vendas: '0',
    investimento: '0',
    faturamento: '0',
    investimento_trafego: '0',
    // Campos SDR
    sdr_comecou_diagnostico: '0',
    sdr_chegaram_crm_kommo: '0',
    sdr_qualificados_mentoria: '0',
    sdr_para_downsell: '0',
    sdr_agendados_diagnostico: '0',
    sdr_agendados_mentoria: '0',
    sdr_nomes_qualificados: ''
    ,
    // Campos Closer
    closer_calls_realizadas: '0',
    closer_nao_compareceram: '0',
    closer_vendas_mentoria: '0',
    closer_vendas_downsell: '0',
    closer_em_negociacao: '0',
    closer_em_followup: '0',
    closer_vendas_perdidas: '0',
    // Campos Social Seller
    social_seller_leads_contatados: '0',
    social_seller_agendados_diagnostico: '0',
    social_seller_agendados_mentoria: '0',
    social_seller_agendados_consultoria: '0',
    social_seller_downsell_vendido: '0',
    // Campos CS
    cs_alunas_contatadas: '0',
    cs_suporte_prestado: '0',
    cs_suporte_resolvidos: '0',
    cs_suporte_pendentes: '0',
    cs_produtos_vendidos: '0'
  });

  // Função para buscar métricas existentes (declarada antes dos useEffects)
  const buscarMetricasExistentes = useCallback(async (campanhaId: string, data: string) => {
    // Evitar loop infinito: verificar se já carregou esses dados
    if (isLoadingMetricsRef.current) {
      console.log('⏸️ Já está carregando métricas, aguardando...');
      return;
    }
    
    if (lastLoadedDataRef.current?.campanhaId === campanhaId && lastLoadedDataRef.current?.data === data) {
      console.log('✅ Métricas já carregadas para essa campanha/data');
      return;
    }
    
    isLoadingMetricsRef.current = true;
    
    try {
      console.log('🔍 Buscando métricas existentes:', { campanhaId, data });
      
      const { data: metricas, error } = await supabase
        .from('metricas')
        .select('*')
        .eq('tipo', 'campanha')
        .eq('referencia_id', campanhaId)
        .eq('periodo_inicio', data)
        .eq('periodo_fim', data)
        .maybeSingle();

      if (error) {
        console.error('Erro ao buscar métricas:', error);
        return;
      }

      // Salvar referência do que foi carregado
      lastLoadedDataRef.current = { campanhaId, data };

      if (metricas) {
        console.log('✅ Métricas encontradas:', metricas);
        
        // Salvar métrica existente e mudar modo
        setMetricaExistente(metricas);
        setModoAtual('editar');
        
        // Formatar data corretamente para pt-BR
        const [ano, mes, dia] = data.split('-');
        const dataFormatada = `${dia}/${mes}/${ano}`;
        
        toast.success('Métricas carregadas!', {
          description: `Dados de ${dataFormatada} carregados com sucesso.`
        });
        
        // Preencher formulário com dados existentes
        setFormData({
          data: metricas.periodo_inicio,
          alcance: metricas.alcance?.toString() || '0',
          impressoes: metricas.impressoes?.toString() || '0',
          cliques: metricas.cliques?.toString() || '0',
          visualizacoes_pagina: metricas.visualizacoes_pagina?.toString() || '0',
          leads: metricas.leads?.toString() || '0',
          checkouts: metricas.checkouts?.toString() || '0',
          vendas: metricas.vendas?.toString() || '0',
          investimento: metricas.investimento?.toString() || '0',
          faturamento: metricas.faturamento?.toString() || '0',
          investimento_trafego: metricas.investimento?.toString() || '0',
          // Campos SDR do JSONB
          sdr_comecou_diagnostico: metricas.detalhe_sdr?.comecou_diagnostico?.toString() || '0',
          sdr_chegaram_crm_kommo: metricas.detalhe_sdr?.chegaram_crm_kommo?.toString() || '0',
          sdr_qualificados_mentoria: metricas.detalhe_sdr?.qualificados_para_mentoria?.toString() || '0',
          sdr_para_downsell: metricas.detalhe_sdr?.para_downsell?.toString() || '0',
          sdr_agendados_diagnostico: metricas.detalhe_sdr?.agendados_diagnostico?.toString() || '0',
          sdr_agendados_mentoria: metricas.detalhe_sdr?.agendados_mentoria?.toString() || '0',
          sdr_nomes_qualificados: metricas.detalhe_sdr?.nomes_qualificados || '',
          // Campos Closer do JSONB
          closer_calls_realizadas: metricas.detalhe_closer?.calls_realizadas?.toString() || '0',
          closer_nao_compareceram: metricas.detalhe_closer?.nao_compareceram?.toString() || '0',
          closer_vendas_mentoria: metricas.detalhe_closer?.vendas_mentoria?.toString() || '0',
          closer_vendas_downsell: metricas.detalhe_closer?.vendas_downsell?.toString() || '0',
          closer_em_negociacao: metricas.detalhe_closer?.em_negociacao?.toString() || '0',
          closer_em_followup: metricas.detalhe_closer?.em_followup?.toString() || '0',
          closer_vendas_perdidas: metricas.detalhe_closer?.vendas_perdidas?.toString() || '0',
          // Campos Social Seller do JSONB
          social_seller_leads_contatados: metricas.detalhe_social_seller?.leads_contatados?.toString() || '0',
          social_seller_agendados_diagnostico: metricas.detalhe_social_seller?.agendados_diagnostico?.toString() || '0',
          social_seller_agendados_mentoria: metricas.detalhe_social_seller?.agendados_mentoria?.toString() || '0',
          social_seller_agendados_consultoria: metricas.detalhe_social_seller?.agendados_consultoria?.toString() || '0',
          social_seller_downsell_vendido: metricas.detalhe_social_seller?.downsell_vendido?.toString() || '0',
          // Campos CS do JSONB
          cs_alunas_contatadas: metricas.detalhe_cs?.alunas_contatadas?.toString() || '0',
          cs_suporte_prestado: metricas.detalhe_cs?.suporte_prestado?.toString() || '0',
          cs_suporte_resolvidos: metricas.detalhe_cs?.suporte_resolvidos?.toString() || '0',
          cs_suporte_pendentes: metricas.detalhe_cs?.suporte_pendentes?.toString() || '0',
          cs_produtos_vendidos: metricas.detalhe_cs?.produtos_vendidos?.toString() || '0'
        });
      } else {
        console.log('⚠️ Nenhuma métrica encontrada para esta data');
        
        // Limpar métrica existente e mudar para modo criar
        setMetricaExistente(null);
        setModoAtual('criar');
        
        // Formatar data corretamente para pt-BR
        const [ano, mes, dia] = data.split('-');
        const dataFormatada = `${dia}/${mes}/${ano}`;
        
        toast.info('Nova data selecionada', {
          description: `Nenhuma métrica encontrada para ${dataFormatada}. Preencha os campos.`
        });
        
        // RESETAR todos os campos para 0 quando não houver métricas
        setFormData({
          data: data,
          alcance: '0',
          impressoes: '0',
          cliques: '0',
          visualizacoes_pagina: '0',
          leads: '0',
          checkouts: '0',
          vendas: '0',
          investimento: '0',
          faturamento: '0',
          investimento_trafego: '0',
          // Campos SDR
          sdr_comecou_diagnostico: '0',
          sdr_chegaram_crm_kommo: '0',
          sdr_qualificados_mentoria: '0',
          sdr_para_downsell: '0',
          sdr_agendados_diagnostico: '0',
          sdr_agendados_mentoria: '0',
          sdr_nomes_qualificados: '',
          // Campos Closer
          closer_calls_realizadas: '0',
          closer_nao_compareceram: '0',
          closer_vendas_mentoria: '0',
          closer_vendas_downsell: '0',
          closer_em_negociacao: '0',
          closer_em_followup: '0',
          closer_vendas_perdidas: '0',
          // Campos Social Seller
          social_seller_leads_contatados: '0',
          social_seller_agendados_diagnostico: '0',
          social_seller_agendados_mentoria: '0',
          social_seller_agendados_consultoria: '0',
          social_seller_downsell_vendido: '0',
          // Campos CS
          cs_alunas_contatadas: '0',
          cs_suporte_prestado: '0',
          cs_suporte_resolvidos: '0',
          cs_suporte_pendentes: '0',
          cs_produtos_vendidos: '0'
        });
      }
    } catch (err) {
      console.error('Erro ao buscar métricas existentes:', err);
      toast.error('Erro ao buscar métricas', {
        description: 'Não foi possível carregar as métricas existentes.'
      });
    } finally {
      isLoadingMetricsRef.current = false;
    }
  }, []);

  // Resetar form quando abrir/fechar modal
  useEffect(() => {
    if (open) {
      if (modoEdicao && metricasExistentes) {
        // Carregar dados existentes para edição
        setFormData({
          data: metricasExistentes.periodo_inicio || new Date().toISOString().split('T')[0],
          alcance: metricasExistentes.alcance?.toString() || '0',
          impressoes: metricasExistentes.impressoes?.toString() || '0',
          cliques: metricasExistentes.cliques?.toString() || '0',
          visualizacoes_pagina: metricasExistentes.visualizacoes_pagina?.toString() || '0',
          leads: metricasExistentes.leads?.toString() || '0',
          checkouts: metricasExistentes.checkouts?.toString() || '0',
          vendas: metricasExistentes.vendas?.toString() || '0',
          investimento: metricasExistentes.investimento?.toString() || '0',
          faturamento: metricasExistentes.faturamento?.toString() || '0',
          investimento_trafego: metricasExistentes.investimento_trafego?.toString() || '0',
          // SDR fields might be stored in metadata — try to load if present
          sdr_comecou_diagnostico: metricasExistentes.detalhe_sdr?.comecou_diagnostico?.toString?.() || metricasExistentes.detalhe?.comecou_diagnostico?.toString?.() || '0',
          sdr_chegaram_crm_kommo: metricasExistentes.detalhe_sdr?.chegaram_crm_kommo?.toString?.() || metricasExistentes.detalhe?.chegaram_crm_kommo?.toString?.() || '0',
          sdr_qualificados_mentoria: metricasExistentes.detalhe_sdr?.qualificados_para_mentoria?.toString?.() || metricasExistentes.detalhe?.qualificados_para_mentoria?.toString?.() || '0',
          sdr_para_downsell: metricasExistentes.detalhe_sdr?.para_downsell?.toString?.() || metricasExistentes.detalhe?.para_downsell?.toString?.() || '0',
          sdr_agendados_diagnostico: metricasExistentes.detalhe_sdr?.agendados_diagnostico?.toString?.() || metricasExistentes.detalhe?.agendados_diagnostico?.toString?.() || '0',
          sdr_agendados_mentoria: metricasExistentes.detalhe_sdr?.agendados_mentoria?.toString?.() || metricasExistentes.detalhe?.agendados_mentoria?.toString?.() || '0',
          sdr_nomes_qualificados: metricasExistentes.detalhe_sdr?.nomes_qualificados || metricasExistentes.detalhe?.nomes_qualificados || '',
          // Closer fields (try to load from metricasExistentes.detalhe or detalhe_closer)
          closer_calls_realizadas: metricasExistentes.detalhe_closer?.calls_realizadas?.toString?.() || metricasExistentes.detalhe?.calls_realizadas?.toString?.() || '0',
          closer_nao_compareceram: metricasExistentes.detalhe_closer?.nao_compareceram?.toString?.() || metricasExistentes.detalhe?.nao_compareceram?.toString?.() || '0',
          closer_vendas_mentoria: metricasExistentes.detalhe_closer?.vendas_mentoria?.toString?.() || metricasExistentes.detalhe?.vendas_mentoria?.toString?.() || '0',
          closer_vendas_downsell: metricasExistentes.detalhe_closer?.vendas_downsell?.toString?.() || metricasExistentes.detalhe?.vendas_downsell?.toString?.() || '0',
          closer_em_negociacao: metricasExistentes.detalhe_closer?.em_negociacao?.toString?.() || metricasExistentes.detalhe?.em_negociacao?.toString?.() || '0',
          closer_em_followup: metricasExistentes.detalhe_closer?.em_followup?.toString?.() || metricasExistentes.detalhe?.em_followup?.toString?.() || '0',
          closer_vendas_perdidas: metricasExistentes.detalhe_closer?.vendas_perdidas?.toString?.() || metricasExistentes.detalhe?.vendas_perdidas?.toString?.() || '0',
          // Social Seller fields
          social_seller_leads_contatados: metricasExistentes.detalhe_social_seller?.leads_contatados?.toString?.() || metricasExistentes.detalhe?.leads_contatados?.toString?.() || '0',
          social_seller_agendados_diagnostico: metricasExistentes.detalhe_social_seller?.agendados_diagnostico?.toString?.() || metricasExistentes.detalhe?.agendados_diagnostico?.toString?.() || '0',
          social_seller_agendados_mentoria: metricasExistentes.detalhe_social_seller?.agendados_mentoria?.toString?.() || metricasExistentes.detalhe?.agendados_mentoria?.toString?.() || '0',
          social_seller_agendados_consultoria: metricasExistentes.detalhe_social_seller?.agendados_consultoria?.toString?.() || metricasExistentes.detalhe?.agendados_consultoria?.toString?.() || '0',
          social_seller_downsell_vendido: metricasExistentes.detalhe_social_seller?.downsell_vendido?.toString?.() || metricasExistentes.detalhe?.downsell_vendido?.toString?.() || '0',
          // CS fields
          cs_alunas_contatadas: metricasExistentes.detalhe_cs?.alunas_contatadas?.toString?.() || metricasExistentes.detalhe?.alunas_contatadas?.toString?.() || '0',
          cs_suporte_prestado: metricasExistentes.detalhe_cs?.suporte_prestado?.toString?.() || metricasExistentes.detalhe?.suporte_prestado?.toString?.() || '0',
          cs_suporte_resolvidos: metricasExistentes.detalhe_cs?.suporte_resolvidos?.toString?.() || metricasExistentes.detalhe?.suporte_resolvidos?.toString?.() || '0',
          cs_suporte_pendentes: metricasExistentes.detalhe_cs?.suporte_pendentes?.toString?.() || metricasExistentes.detalhe?.suporte_pendentes?.toString?.() || '0',
          cs_produtos_vendidos: metricasExistentes.detalhe_cs?.produtos_vendidos?.toString?.() || metricasExistentes.detalhe?.produtos_vendidos?.toString?.() || '0'
        });
        setTipoDistribuicao('diario'); // Sempre diário para edição
      } else {
        // Dados vazios para novo registro
        setFormData({
          data: new Date().toISOString().split('T')[0],
          alcance: '0',
          impressoes: '0',
          cliques: '0',
          visualizacoes_pagina: '0',
          leads: '0',
          checkouts: '0',
          vendas: '0',
          investimento: '0',
          faturamento: '0',
          investimento_trafego: '0',
          sdr_comecou_diagnostico: '0',
          sdr_chegaram_crm_kommo: '0',
          sdr_qualificados_mentoria: '0',
          sdr_para_downsell: '0',
          sdr_agendados_diagnostico: '0',
          sdr_agendados_mentoria: '0',
          sdr_nomes_qualificados: '',
          closer_calls_realizadas: '0',
          closer_nao_compareceram: '0',
          closer_vendas_mentoria: '0',
          closer_vendas_downsell: '0',
          closer_em_negociacao: '0',
          closer_em_followup: '0',
          closer_vendas_perdidas: '0',
          social_seller_leads_contatados: '0',
          social_seller_agendados_diagnostico: '0',
          social_seller_agendados_mentoria: '0',
          social_seller_agendados_consultoria: '0',
          social_seller_downsell_vendido: '0',
          cs_alunas_contatadas: '0',
          cs_suporte_prestado: '0',
          cs_suporte_resolvidos: '0',
          cs_suporte_pendentes: '0',
          cs_produtos_vendidos: '0'
        });
        setTipoDistribuicao('diario');
      }
      // Aplicar filtros iniciais se fornecidos
      if (filtrosIniciais) {
        setSelectedFunil(filtrosIniciais.funil);
        setSelectedCampanha(filtrosIniciais.campanha || campanha || null);
        setSelectedPublico(filtrosIniciais.publico);
        setSelectedCriativo(filtrosIniciais.criativo);
        
        // Buscar métricas existentes para a campanha e data
        if (filtrosIniciais.campanha?.id && dataInicial) {
          buscarMetricasExistentes(filtrosIniciais.campanha.id, dataInicial);
        }
      } else {
        // reset selects when opening
        setSelectedFunil(null);
        setSelectedCampanha(campanha || null);
        setSelectedPublico(null);
        setSelectedCriativo(null);
      }
      setFunis([]);
      setCampanhasList([]);
      setPublicosList([]);
      setCriativosList([]);
    } else {
      // Resetar ref quando fechar modal
      lastLoadedDataRef.current = null;
      isLoadingMetricsRef.current = false;
    }
  }, [open, modoEdicao, metricasExistentes, buscarMetricasExistentes, filtrosIniciais, dataInicial, campanha]);

  // carregar funis iniciais
  useEffect(() => {
    if (!open) return;
    const carregar = async () => {
      try {
        const { data, error } = await supabase.from('funis').select('*').order('nome');
        if (!error && data) setFunis(data as any[]);
      } catch (err) {
        console.error('Erro ao carregar funis', err);
      }
    };
    carregar();
  }, [open]);

  // Helpers para datas e nomes de dias em pt-BR
  const toISO = (d: Date) => d.toISOString().split('T')[0];

  // Parse YYYY-MM-DD into a Date at local timezone (avoid UTC parsing issues)
  const parseISO = (iso: string) => {
    const parts = (iso || '').split('-').map(p => parseInt(p, 10));
    if (parts.length !== 3 || parts.some(isNaN)) return new Date(iso);
    return new Date(parts[0], parts[1] - 1, parts[2]);
  };

  const weekdayPt = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const d = parseISO(dateStr);
      const names = ['domingo','segunda','terça','quarta','quinta','sexta','sábado'];
      return names[d.getDay()];
    } catch { return ''; }
  };

  const computeDefaultSaturday = (dateStr: string) => {
    const d = parseISO(dateStr);
    // Find the previous (or same) Saturday (6)
    const diff = (d.getDay() - 6 + 7) % 7;
    const sat = new Date(d.getFullYear(), d.getMonth(), d.getDate() - diff);
    return toISO(sat);
  };

  const computeDefaultMondayFromSaturday = (satISO: string) => {
    const sat = parseISO(satISO);
    const mon = new Date(sat.getFullYear(), sat.getMonth(), sat.getDate() + 2); // Saturday -> Monday
    return toISO(mon);
  };

  // Buscar métricas quando a data ou campanha mudar
  useEffect(() => {
    if (!open) return;
    if (!selectedCampanha?.id || !formData.data) return;
    
    console.log('🔄 Data ou campanha mudou, buscando métricas:', {
      campanha: selectedCampanha.id,
      data: formData.data
    });
    
    buscarMetricasExistentes(selectedCampanha.id, formData.data);
  }, [open, selectedCampanha?.id, formData.data, buscarMetricasExistentes]);

  // Pré-fill das datas semanais/mensais quando o modal abrir ou quando a data muda
  useEffect(() => {
    if (!open) return;

    if (tipoDistribuicao === 'semanal') {
      // se já não foi preenchido pelo usuário, preencher automaticamente
      if (!weeklyStart) {
        const sat = computeDefaultSaturday(formData.data);
        setWeeklyStart(sat);
      }
      if (!weeklyEnd) {
        const start = weeklyStart || computeDefaultSaturday(formData.data);
        setWeeklyEnd(computeDefaultMondayFromSaturday(start));
      }
    }

    if (tipoDistribuicao === 'mensal') {
      if (!monthlyStart) {
        const base = new Date(formData.data);
        const inicio = new Date(base.getFullYear(), base.getMonth(), 1);
        setMonthlyStart(toISO(inicio));
      }
      if (!monthlyEnd) {
        const base = parseISO(formData.data);
        const hoje = new Date();
        const fimMes = new Date(base.getFullYear(), base.getMonth() + 1, 0);
        const dataFinal = (base.getFullYear() === hoje.getFullYear() && base.getMonth() === hoje.getMonth()) ? hoje : fimMes;
        setMonthlyEnd(toISO(dataFinal));
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, tipoDistribuicao, formData.data]);

  // Auto-preencher weeklyEnd quando weeklyStart mudar (semanal)
  useEffect(() => {
    if (tipoDistribuicao === 'semanal' && weeklyStart) {
      const dataInicio = new Date(weeklyStart);
      const dataFim = new Date(dataInicio);
      dataFim.setDate(dataInicio.getDate() + 6); // +6 dias = 7 dias total
      const dataFimISO = dataFim.toISOString().split('T')[0];
      
      // Só atualizar se for diferente para evitar loop infinito
      if (weeklyEnd !== dataFimISO) {
        setWeeklyEnd(dataFimISO);
      }
    }
  }, [weeklyStart, tipoDistribuicao, weeklyEnd]);

  // Auto-preencher monthlyEnd quando monthlyStart mudar (mensal)
  useEffect(() => {
    if (tipoDistribuicao === 'mensal' && monthlyStart) {
      const dataInicio = parseISO(monthlyStart);
      const hoje = new Date();
      
      // Zerar as horas para comparação apenas de datas
      hoje.setHours(0, 0, 0, 0);
      
      // Pegar o mês e ano da data de início selecionada
      const mesInicio = dataInicio.getMonth();
      const anoInicio = dataInicio.getFullYear();
      
      // Calcular o último dia do mês selecionado (não do mês seguinte!)
      const fimMes = new Date(anoInicio, mesInicio + 1, 0);
      fimMes.setHours(0, 0, 0, 0);
      
      // Se o mês selecionado já passou completamente, usa o último dia do mês
      // Se ainda estamos no mês selecionado, usa hoje
      const dataFinal = fimMes < hoje ? fimMes : hoje;
      const dataFimISO = dataFinal.toISOString().split('T')[0];

      if (monthlyEnd !== dataFimISO) {
        setMonthlyEnd(dataFimISO);
      }
    }
  }, [monthlyStart, tipoDistribuicao, monthlyEnd]);

  // carregar campanhas quando funil selecionado ou ao abrir
  useEffect(() => {
    if (!open) return;
    const carregarCampanhas = async () => {
      try {
        let query = supabase.from('campanhas').select('*');
        if (selectedFunil?.id) query = query.eq('funil_id', selectedFunil.id);
        const { data, error } = await query.order('nome');
        if (!error && data) setCampanhasList(data as any[]);
      } catch (err) {
        console.error('Erro ao carregar campanhas', err);
      }
    };
    carregarCampanhas();
  }, [open, selectedFunil]);

  // carregar públicos/criativos a partir da campanha selecionada
  useEffect(() => {
    if (!open) return;
    const carregarPublicosECriativos = async () => {
      try {
        const campanhaId = selectedCampanha?.id || campanha?.id;
        if (!campanhaId) return;
        
        // Buscar conjuntos de anúncio diretamente da tabela
        const { data: conjuntos, error: errorConjuntos } = await supabase
          .from('conjuntos_anuncio')
          .select('id, nome, publico')
          .eq('campanha_id', campanhaId);
        
        if (errorConjuntos) {
          console.error('Erro ao buscar conjuntos:', errorConjuntos);
          return;
        }

        if (!conjuntos || conjuntos.length === 0) {
          setPublicosList([]);
          setCriativosList([]);
          return;
        }

        // Extrair públicos dos conjuntos e criar mapeamento
        const publics: any[] = [];
        const conjuntoIds = conjuntos.map(c => c.id);
        const conjuntoToPublicoMap = new Map<string, string>();

        conjuntos.forEach(cj => {
          // Mapear conjunto_id para público_id (usando o próprio ID do conjunto)
          conjuntoToPublicoMap.set(cj.id, cj.id);
          
          if (cj.publico) {
            const publicoStr = String(cj.publico);
            if (!publics.find(p => p.id === cj.id)) {
              publics.push({ id: cj.id, name: publicoStr }); // ID = conjunto.id, NAME = publico
            }
          } else if (cj.nome) {
            // Se não tiver público, usar o nome do conjunto
            if (!publics.find(p => p.id === cj.id)) {
              publics.push({ id: cj.id, name: cj.nome }); // ID = conjunto.id, NAME = conjunto.nome
            }
          }
        });

        setConjuntoPublicoMap(conjuntoToPublicoMap);

        // Buscar anúncios dos conjuntos (TODOS - para carregar inicialmente)
        const { data: anuncios, error: errorAnuncios } = await supabase
          .from('anuncios')
          .select('id, nome, tipo, conjunto_anuncio_id')
          .in('conjunto_anuncio_id', conjuntoIds);

        if (errorAnuncios) {
          console.error('Erro ao buscar anúncios:', errorAnuncios);
        }

        const creatives: any[] = [];
        anuncios?.forEach((anuncio) => {
          if (anuncio) {
            creatives.push({ 
              id: anuncio.id, 
              name: `${anuncio.nome}${anuncio.tipo ? ` (${anuncio.tipo})` : ''}`,
              conjunto_anuncio_id: anuncio.conjunto_anuncio_id
            });
          }
        });

        setPublicosList(publics);
        setCriativosListCompleta(creatives); // Salvar lista completa
        setCriativosList(creatives); // Mostrar todos inicialmente
      } catch (err) {
        console.error('Erro ao carregar públicos/criativos', err);
      }
    };
    carregarPublicosECriativos();
  }, [open, selectedCampanha, campanha]);

  // Filtrar criativos quando público é selecionado
  useEffect(() => {
    if (selectedPublico) {
      console.log('🎨 Filtrando criativos do público:', selectedPublico.id);
      // Filtrar apenas criativos do público selecionado
      const criativosFiltrados = criativosListCompleta.filter(
        cr => cr.conjunto_anuncio_id === selectedPublico.id
      );
      console.log('✅ Criativos filtrados:', criativosFiltrados.length);
      setCriativosList(criativosFiltrados);
      
      // Se o criativo selecionado não pertence a este público, limpar seleção
      if (selectedCriativo && !criativosFiltrados.find(cr => cr.id === selectedCriativo.id)) {
        console.log('⚠️ Criativo selecionado não pertence ao público, limpando seleção');
        setSelectedCriativo(null);
      }
    } else {
      // Se não tem público selecionado, mostrar todos os criativos
      console.log('🎨 Nenhum público selecionado, mostrando todos os criativos');
      setCriativosList(criativosListCompleta);
    }
  }, [selectedPublico, criativosListCompleta, selectedCriativo]);

  // Calcular datas para distribuição
  const calcularPeriodoDistribuicao = () => {
    console.log('🗓️ CALCULANDO PERÍODO:', {
      tipoDistribuicao,
      weeklyStart,
      weeklyEnd,
      monthlyStart,
      monthlyEnd,
      formDataData: formData.data
    });

    if (tipoDistribuicao === 'diario') {
      console.log('✅ PERÍODO DIÁRIO:', formData.data);
      return {
        dataInicio: formData.data,
        dataFim: formData.data,
        quantidadeDias: 1,
        datas: [formData.data]
      };
    }

    if (tipoDistribuicao === 'semanal') {
      // usar weeklyStart/weeklyEnd se fornecidos, senão derivar a partir de formData
      const inicio = weeklyStart || formData.data;
      const fim = weeklyEnd || formData.data;
      
      console.log('📅 PERÍODO SEMANAL:', {
        weeklyStart,
        weeklyEnd,
        inicio_calculado: inicio,
        fim_calculado: fim,
        fallback_usado: !weeklyStart || !weeklyEnd
      });
      
      const dInicio = new Date(inicio);
      const dFim = new Date(fim);
      const datas: string[] = [];
      for (let d = new Date(dInicio); d <= dFim; d.setDate(d.getDate() + 1)) {
        datas.push(new Date(d).toISOString().split('T')[0]);
      }
      const qtd = datas.length || 1;
      
      console.log('✅ DATAS GERADAS SEMANAL:', datas);
      
      return { dataInicio: inicio, dataFim: fim, quantidadeDias: qtd, datas };
    }

    if (tipoDistribuicao === 'mensal') {
      const inicio = monthlyStart || new Date(new Date(formData.data).getFullYear(), new Date(formData.data).getMonth(), 1).toISOString().split('T')[0];
      const fim = monthlyEnd || (() => {
        const base = new Date(formData.data);
        const hoje = new Date();
        const fimMes = new Date(base.getFullYear(), base.getMonth() + 1, 0);
        return (base.getFullYear() === hoje.getFullYear() && base.getMonth() === hoje.getMonth()) ? hoje.toISOString().split('T')[0] : fimMes.toISOString().split('T')[0];
      })();

      console.log('📆 PERÍODO MENSAL:', {
        monthlyStart,
        monthlyEnd,
        inicio_calculado: inicio,
        fim_calculado: fim
      });

      const dInicio = new Date(inicio);
      const dFim = new Date(fim);
      const datas: string[] = [];
      for (let d = new Date(dInicio); d <= dFim; d.setDate(d.getDate() + 1)) {
        datas.push(new Date(d).toISOString().split('T')[0]);
      }
      const qtd = datas.length || 1;
      
      console.log('✅ DATAS GERADAS MENSAL:', datas.slice(0, 5), '... total:', datas.length);
      
      return { dataInicio: inicio, dataFim: fim, quantidadeDias: qtd, datas };
    }

    console.log('⚠️ FALLBACK PARA DIÁRIO');
    return { dataInicio: formData.data, dataFim: formData.data, quantidadeDias: 1, datas: [formData.data] };
  };

  // Função para deletar métrica
  const handleDelete = async () => {
    if (!metricaExistente) {
      toast.error('Nenhuma métrica para deletar');
      return;
    }

    const confirmar = window.confirm(
      `⚠️ TEM CERTEZA?\n\nVocê está prestes a DELETAR a métrica:\n` +
      `📅 Data: ${new Date(metricaExistente.periodo_inicio).toLocaleDateString('pt-BR')}\n` +
      `💰 Investimento: R$ ${metricaExistente.investimento || 0}\n` +
      `📊 Leads: ${metricaExistente.leads || 0}\n\n` +
      `Esta ação NÃO pode ser desfeita!`
    );

    if (!confirmar) return;

    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('metricas')
        .delete()
        .eq('id', metricaExistente.id);

      if (error) throw error;

      toast.success('Métrica deletada com sucesso!');
      
      // Limpar estados
      setMetricaExistente(null);
      setModoAtual('criar');
      limparCampos();
      
      if (onDadosAtualizados) {
        onDadosAtualizados();
      }
      
      onOpenChange(false);
    } catch (error: any) {
      console.error('Erro ao deletar métrica:', error);
      toast.error('Erro ao deletar métrica: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Função para limpar campos do formulário
  const limparCampos = () => {
    setFormData({
      data: formData.data, // Manter a data
      alcance: '0',
      impressoes: '0',
      cliques: '0',
      visualizacoes_pagina: '0',
      leads: '0',
      checkouts: '0',
      vendas: '0',
      investimento: '0',
      faturamento: '0',
      investimento_trafego: '0',
      sdr_comecou_diagnostico: '0',
      sdr_chegaram_crm_kommo: '0',
      sdr_qualificados_mentoria: '0',
      sdr_para_downsell: '0',
      sdr_agendados_diagnostico: '0',
      sdr_agendados_mentoria: '0',
      sdr_nomes_qualificados: '',
      closer_calls_realizadas: '0',
      closer_nao_compareceram: '0',
      closer_vendas_mentoria: '0',
      closer_vendas_downsell: '0',
      closer_em_negociacao: '0',
      closer_em_followup: '0',
      closer_vendas_perdidas: '0',
      social_seller_leads_contatados: '0',
      social_seller_agendados_diagnostico: '0',
      social_seller_agendados_mentoria: '0',
      social_seller_agendados_consultoria: '0',
      social_seller_downsell_vendido: '0',
      cs_alunas_contatadas: '0',
      cs_suporte_prestado: '0',
      cs_suporte_resolvidos: '0',
      cs_suporte_pendentes: '0',
      cs_produtos_vendidos: '0'
    });
    
    setMetricaExistente(null);
    setModoAtual('criar');
    
    toast.info('Campos limpos!', {
      description: 'Você pode preencher uma nova métrica.'
    });
  };

  // Função para buscar lista de métricas existentes
  const buscarListaMetricas = async () => {
    setLoadingLista(true);
    
    try {
      // Determinar tipo e referencia_id baseado na hierarquia selecionada
      let referenciaIds: string[] = [];
      let tiposBusca: string[] = [];
      
      console.log('📋 Contexto da busca:', {
        selectedCriativo,
        selectedPublico,
        selectedCampanha,
        campanha,
        selectedFunil
      });
      
      // Se tem criativo selecionado, buscar APENAS dele
      if (selectedCriativo?.id) {
        referenciaIds = [selectedCriativo.id];
        tiposBusca = ['criativo'];
      }
      // Se tem público selecionado, buscar público + criativos do público
      else if (selectedPublico?.id) {
        referenciaIds = [selectedPublico.id];
        tiposBusca = ['publico'];
        
        // Buscar também criativos desse público
        const { data: criativos } = await supabase
          .from('anuncios')
          .select('id')
          .eq('conjunto_anuncio_id', selectedPublico.id);
        
        if (criativos && criativos.length > 0) {
          referenciaIds.push(...criativos.map(c => c.id));
          tiposBusca.push('criativo');
        }
      }
      // Se tem campanha, buscar campanha + públicos + criativos
      else if (selectedCampanha?.id || campanha?.id) {
        const campanhaId = selectedCampanha?.id || campanha?.id;
        referenciaIds = [campanhaId!];
        tiposBusca = ['campanha'];
        
        // Buscar públicos da campanha
        const { data: publicos } = await supabase
          .from('conjuntos_anuncio')
          .select('id')
          .eq('campanha_id', campanhaId);
        
        if (publicos && publicos.length > 0) {
          referenciaIds.push(...publicos.map(p => p.id));
          tiposBusca.push('publico');
          
          // Buscar criativos dos públicos
          const { data: criativos } = await supabase
            .from('anuncios')
            .select('id')
            .in('conjunto_anuncio_id', publicos.map(p => p.id));
          
          if (criativos && criativos.length > 0) {
            referenciaIds.push(...criativos.map(c => c.id));
            tiposBusca.push('criativo');
          }
        }
      }
      // Se tem funil, buscar tudo do funil
      else if (selectedFunil?.id) {
        referenciaIds = [selectedFunil.id];
        tiposBusca = ['funil'];
        
        // Buscar campanhas do funil
        const { data: campanhas } = await supabase
          .from('campanhas')
          .select('id')
          .eq('funil_id', selectedFunil.id);
        
        if (campanhas && campanhas.length > 0) {
          referenciaIds.push(...campanhas.map(c => c.id));
          tiposBusca.push('campanha');
        }
      }
      
      if (referenciaIds.length === 0) {
        console.warn('⚠️ Nenhuma referência encontrada para buscar');
        toast.info('Selecione um Funil, Campanha, Público ou Criativo');
        setMetricasExistentesLista([]);
        setLoadingLista(false);
        return;
      }

      console.log('🔍 Buscando métricas:', {
        referenciaIds: referenciaIds.length,
        tipos: tiposBusca
      });

      // Buscar métricas usando IN para os IDs
      const { data: metricas, error } = await supabase
        .from('metricas')
        .select('*')
        .in('referencia_id', referenciaIds)
        .order('periodo_inicio', { ascending: false })
        .limit(100); // Aumentar limite

      console.log('📊 Resultado da busca:', {
        total: metricas?.length || 0,
        error: error
      });

      if (error) {
        console.error('❌ Erro ao buscar métricas:', error);
        toast.error('Erro ao buscar métricas: ' + error.message);
        setMetricasExistentesLista([]);
        setLoadingLista(false);
        return;
      }

      setMetricasExistentesLista(metricas || []);
      console.log('✅ Métricas carregadas:', metricas?.length || 0);
      
      if (!metricas || metricas.length === 0) {
        toast.info('Nenhuma métrica encontrada', {
          description: 'Adicione métricas usando a aba "Adicionar"'
        });
      }
    } catch (error: any) {
      console.error('💥 Erro ao buscar lista de métricas:', error);
      toast.error('Erro ao buscar métricas');
      setMetricasExistentesLista([]);
    } finally {
      setLoadingLista(false);
    }
  };

  // Buscar lista quando trocar para aba listar ou mudar seleção
  useEffect(() => {
    if (abaAtiva === 'listar' && open) {
      buscarListaMetricas();
    }
  }, [abaAtiva, open, selectedCriativo, selectedPublico, selectedCampanha, selectedFunil]);

  // Função para carregar uma métrica específica para edição
  const carregarMetricaParaEdicao = (metrica: any) => {
    setAbaAtiva('adicionar');
    setMetricaExistente(metrica);
    setModoAtual('editar');
    
    // Preencher formulário
    setFormData({
      data: metrica.periodo_inicio,
      alcance: metrica.alcance?.toString() || '0',
      impressoes: metrica.impressoes?.toString() || '0',
      cliques: metrica.cliques?.toString() || '0',
      visualizacoes_pagina: metrica.visualizacoes_pagina?.toString() || '0',
      leads: metrica.leads?.toString() || '0',
      checkouts: metrica.checkouts?.toString() || '0',
      vendas: metrica.vendas?.toString() || '0',
      investimento: metrica.investimento?.toString() || '0',
      faturamento: metrica.faturamento?.toString() || '0',
      investimento_trafego: metrica.investimento?.toString() || '0',
      sdr_comecou_diagnostico: metrica.detalhe_sdr?.comecou_diagnostico?.toString() || '0',
      sdr_chegaram_crm_kommo: metrica.detalhe_sdr?.chegaram_crm_kommo?.toString() || '0',
      sdr_qualificados_mentoria: metrica.detalhe_sdr?.qualificados_para_mentoria?.toString() || '0',
      sdr_para_downsell: metrica.detalhe_sdr?.para_downsell?.toString() || '0',
      sdr_agendados_diagnostico: metrica.detalhe_sdr?.agendados_diagnostico?.toString() || '0',
      sdr_agendados_mentoria: metrica.detalhe_sdr?.agendados_mentoria?.toString() || '0',
      sdr_nomes_qualificados: metrica.detalhe_sdr?.nomes_qualificados || '',
      closer_calls_realizadas: metrica.detalhe_closer?.calls_realizadas?.toString() || '0',
      closer_nao_compareceram: metrica.detalhe_closer?.nao_compareceram?.toString() || '0',
      closer_vendas_mentoria: metrica.detalhe_closer?.vendas_mentoria?.toString() || '0',
      closer_vendas_downsell: metrica.detalhe_closer?.vendas_downsell?.toString() || '0',
      closer_em_negociacao: metrica.detalhe_closer?.em_negociacao?.toString() || '0',
      closer_em_followup: metrica.detalhe_closer?.em_followup?.toString() || '0',
      closer_vendas_perdidas: metrica.detalhe_closer?.vendas_perdidas?.toString() || '0',
      social_seller_leads_contatados: metrica.detalhe_social_seller?.leads_contatados?.toString() || '0',
      social_seller_agendados_diagnostico: metrica.detalhe_social_seller?.agendados_diagnostico?.toString() || '0',
      social_seller_agendados_mentoria: metrica.detalhe_social_seller?.agendados_mentoria?.toString() || '0',
      social_seller_agendados_consultoria: metrica.detalhe_social_seller?.agendados_consultoria?.toString() || '0',
      social_seller_downsell_vendido: metrica.detalhe_social_seller?.downsell_vendido?.toString() || '0',
      cs_alunas_contatadas: metrica.detalhe_cs?.alunas_contatadas?.toString() || '0',
      cs_suporte_prestado: metrica.detalhe_cs?.suporte_prestado?.toString() || '0',
      cs_suporte_resolvidos: metrica.detalhe_cs?.suporte_resolvidos?.toString() || '0',
      cs_suporte_pendentes: metrica.detalhe_cs?.suporte_pendentes?.toString() || '0',
      cs_produtos_vendidos: metrica.detalhe_cs?.produtos_vendidos?.toString() || '0'
    });
    
    toast.success('Métrica carregada para edição!');
  };

  // Função para deletar métrica da lista
  const deletarMetricaDaLista = async (metrica: any) => {
    const confirmar = window.confirm(
      `⚠️ TEM CERTEZA?\n\nVocê está prestes a DELETAR a métrica:\n` +
      `📅 Data: ${new Date(metrica.periodo_inicio).toLocaleDateString('pt-BR')}\n` +
      `💰 Investimento: R$ ${metrica.investimento || 0}\n` +
      `📊 Leads: ${metrica.leads || 0}\n\n` +
      `Esta ação NÃO pode ser desfeita!`
    );

    if (!confirmar) return;

    setLoadingLista(true);
    
    try {
      const { error } = await supabase
        .from('metricas')
        .delete()
        .eq('id', metrica.id);

      if (error) throw error;

      toast.success('Métrica deletada!');
      
      // Atualizar lista
      buscarListaMetricas();
      
      if (onDadosAtualizados) {
        onDadosAtualizados();
      }
    } catch (error: any) {
      console.error('Erro ao deletar métrica:', error);
      toast.error('Erro ao deletar: ' + error.message);
    } finally {
      setLoadingLista(false);
    }
  };

  // Deletar métricas em massa
  const deletarMetricasEmMassa = async () => {
    if (metricasSelecionadas.size === 0) {
      toast.error('Selecione pelo menos uma métrica');
      return;
    }

    const confirmar = window.confirm(
      `⚠️ TEM CERTEZA?\n\nVocê está prestes a DELETAR ${metricasSelecionadas.size} métrica(s)!\n\n` +
      `Esta ação NÃO pode ser desfeita!`
    );

    if (!confirmar) return;

    setLoadingLista(true);
    
    try {
      const idsArray = Array.from(metricasSelecionadas);
      
      const { error } = await supabase
        .from('metricas')
        .delete()
        .in('id', idsArray);

      if (error) throw error;

      toast.success(`${metricasSelecionadas.size} métrica(s) deletada(s)!`);
      
      // Limpar seleção
      setMetricasSelecionadas(new Set());
      
      // Atualizar lista
      buscarListaMetricas();
      
      if (onDadosAtualizados) {
        onDadosAtualizados();
      }
    } catch (error: any) {
      console.error('Erro ao deletar métricas:', error);
      toast.error('Erro ao deletar: ' + error.message);
    } finally {
      setLoadingLista(false);
    }
  };

  // Filtrar métricas
  console.log('🔍 APLICANDO FILTROS:', { 
    filtroTipo, 
    filtroDataInicio, 
    filtroDataFim,
    totalMetricas: metricasExistentesLista.length 
  });

  const metricasFiltradas = metricasExistentesLista.filter(metrica => {
    // Filtro por tipo
    if (filtroTipo !== 'todos' && metrica.tipo !== filtroTipo) {
      console.log('❌ Tipo não corresponde:', metrica.tipo, '!==', filtroTipo);
      return false;
    }
    
    // Filtro por data inicial
    if (filtroDataInicio) {
      const dataMetrica = new Date(metrica.periodo_inicio).toISOString().split('T')[0];
      console.log('🔎 Comparando data inicial:', dataMetrica, '>=', filtroDataInicio);
      if (dataMetrica < filtroDataInicio) {
        console.log('❌ Data inicial filtrada:', dataMetrica, '<', filtroDataInicio);
        return false;
      }
    }
    
    // Filtro por data final
    if (filtroDataFim) {
      const dataMetrica = new Date(metrica.periodo_inicio).toISOString().split('T')[0];
      console.log('🔎 Comparando data final:', dataMetrica, '<=', filtroDataFim);
      if (dataMetrica > filtroDataFim) {
        console.log('❌ Data final filtrada:', dataMetrica, '>', filtroDataFim);
        return false;
      }
    }
    
    return true;
  });

  console.log('✅ Métricas após filtros:', metricasFiltradas.length);

  // Toggle seleção de métrica
  const toggleSelecao = (id: string) => {
    const novaSelecao = new Set(metricasSelecionadas);
    if (novaSelecao.has(id)) {
      novaSelecao.delete(id);
    } else {
      novaSelecao.add(id);
    }
    setMetricasSelecionadas(novaSelecao);
  };

  // Selecionar/Desselecionar todas visíveis
  const toggleSelecionarTodas = () => {
    if (metricasSelecionadas.size === metricasFiltradas.length) {
      // Desselecionar todas
      setMetricasSelecionadas(new Set());
    } else {
      // Selecionar todas visíveis
      const novaSelecao = new Set(metricasFiltradas.map(m => m.id));
      setMetricasSelecionadas(novaSelecao);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar campos obrigatórios de data conforme tipo de distribuição
    if (tipoDistribuicao === 'semanal') {
      if (!weeklyStart || !weeklyEnd) {
        toast.error('Preencha as datas de início e fim da semana!');
        return;
      }
      // Validar que o fim não é antes do início
      if (new Date(weeklyEnd) < new Date(weeklyStart)) {
        toast.error('A data de término não pode ser anterior à data de início!');
        return;
      }
    }
    
    if (tipoDistribuicao === 'mensal') {
      if (!monthlyStart || !monthlyEnd) {
        toast.error('Preencha as datas de início e fim do mês!');
        return;
      }
      // Validar que o fim não é antes do início
      if (new Date(monthlyEnd) < new Date(monthlyStart)) {
        toast.error('A data de término não pode ser anterior à data de início!');
        return;
      }
    }
    
    // Determinar tipo e referencia_id baseado na hierarquia selecionada
    let tipo: 'campanha' | 'publico' | 'criativo' | 'funil' = 'campanha';
    let referenciaId: string | null = null;
    
    if (selectedCriativo?.id) {
      tipo = 'criativo';
      referenciaId = selectedCriativo.id;
    } else if (selectedPublico?.id) {
      tipo = 'publico';
      referenciaId = selectedPublico.id;
    } else if (selectedCampanha?.id || campanha?.id) {
      tipo = 'campanha';
      referenciaId = selectedCampanha?.id || campanha?.id || null;
    } else if (selectedFunil?.id) {
      tipo = 'funil';
      referenciaId = selectedFunil.id;
    }
    
    if (!referenciaId) {
      toast.error('Selecione pelo menos um Funil, Campanha, Público ou Criativo');
      return;
    }

    console.log('💾 Salvando métricas:', { tipo, referenciaId });
    setLoading(true);
    
    try {
      const periodo = calcularPeriodoDistribuicao();
      
      // Valores totais inseridos pelo usuário
      let valoresOriginais: any;

      if (department === 'sdr') {
        // Para SDR, coletamos apenas os campos relevantes e armazenamos um resumo
        const s_comecou = parseInt(formData.sdr_comecou_diagnostico) || 0;
        const s_chegaram_crm = parseInt(formData.sdr_chegaram_crm_kommo) || 0;
        const s_qualificados = parseInt(formData.sdr_qualificados_mentoria) || 0;
        const s_downsell = parseInt(formData.sdr_para_downsell) || 0;
        const s_agend_diag = parseInt(formData.sdr_agendados_diagnostico) || 0;
        const s_agend_ment = parseInt(formData.sdr_agendados_mentoria) || 0;

        const totalLeads = s_comecou + s_chegaram_crm + s_qualificados + s_downsell + s_agend_diag + s_agend_ment;

        valoresOriginais = {
          alcance: 0,
          impressoes: 0,
          cliques: 0,
          visualizacoes_pagina: 0,
          leads: totalLeads,
          checkouts: 0,
          vendas: s_qualificados, // usamos 'vendas' para representar leads qualificados (apenas por compatibilidade)
          investimento: 0,
          faturamento: 0,
          sdr: {
            comecou_diagnostico: s_comecou,
            chegaram_crm_kommo: s_chegaram_crm,
            qualificados_para_mentoria: s_qualificados,
            para_downsell: s_downsell,
            agendados_diagnostico: s_agend_diag,
            agendados_mentoria: s_agend_ment,
            nomes_qualificados: formData.sdr_nomes_qualificados || ''
          }
        };
      } else {
        valoresOriginais = {
          alcance: parseInt(formData.alcance) || 0,
          impressoes: parseInt(formData.impressoes) || 0,
          cliques: parseInt(formData.cliques) || 0,
          visualizacoes_pagina: parseInt(formData.visualizacoes_pagina) || 0,
          leads: parseInt(formData.leads) || 0,
          checkouts: parseInt(formData.checkouts) || 0,
          vendas: parseInt(formData.vendas) || 0,
          // Priorizar o campo 'investimento_trafego' quando preenchido (para a aba Tráfego)
          investimento: parseFloat(formData.investimento_trafego || formData.investimento) || 0,
          faturamento: parseFloat(formData.faturamento) || 0,
        };
        
        console.log('💰 DADOS DE TRÁFEGO:', {
          investimento_trafego_field: formData.investimento_trafego,
          investimento_field: formData.investimento,
          investimento_final: valoresOriginais.investimento,
          faturamento: valoresOriginais.faturamento,
          leads: valoresOriginais.leads
        });
      }

      // Preparar array de dados para inserir
      const dadosParaInserir = periodo.datas.map((data, index) => {
        // Distribuir proporcionalmente pelos dias
        const alcanceDiario = Math.floor(valoresOriginais.alcance / periodo.quantidadeDias);
        const impressoesDiarias = Math.floor(valoresOriginais.impressoes / periodo.quantidadeDias);
        const cliquesDiarios = Math.floor(valoresOriginais.cliques / periodo.quantidadeDias);
        const visualizacoesDiarias = Math.floor(valoresOriginais.visualizacoes_pagina / periodo.quantidadeDias);
        const leadsDiarios = Math.floor(valoresOriginais.leads / periodo.quantidadeDias);
        const checkoutsDiarios = Math.floor(valoresOriginais.checkouts / periodo.quantidadeDias);
        const vendasDiarias = Math.floor(valoresOriginais.vendas / periodo.quantidadeDias);
        const investimentoDiario = parseFloat((valoresOriginais.investimento / periodo.quantidadeDias).toFixed(2));
        const faturamentoDiario = parseFloat((valoresOriginais.faturamento / periodo.quantidadeDias).toFixed(2));

        console.log('📊 VALORES CALCULADOS PARA SALVAR:', {
          data,
          investimentoTotal: valoresOriginais.investimento,
          investimentoDiario,
          dias: periodo.quantidadeDias
        });

        // Se for o último dia, adicionar os restos da divisão para não perder dados
        const ehUltimoDia = index === periodo.datas.length - 1;
        const alcanceFinal = ehUltimoDia ? valoresOriginais.alcance - (alcanceDiario * (periodo.quantidadeDias - 1)) : alcanceDiario;
        const impressoesFinal = ehUltimoDia ? valoresOriginais.impressoes - (impressoesDiarias * (periodo.quantidadeDias - 1)) : impressoesDiarias;
        const cliquesFinal = ehUltimoDia ? valoresOriginais.cliques - (cliquesDiarios * (periodo.quantidadeDias - 1)) : cliquesDiarios;
        const visualizacoesFinal = ehUltimoDia ? valoresOriginais.visualizacoes_pagina - (visualizacoesDiarias * (periodo.quantidadeDias - 1)) : visualizacoesDiarias;
        const leadsFinal = ehUltimoDia ? valoresOriginais.leads - (leadsDiarios * (periodo.quantidadeDias - 1)) : leadsDiarios;
        const checkoutsFinal = ehUltimoDia ? valoresOriginais.checkouts - (checkoutsDiarios * (periodo.quantidadeDias - 1)) : checkoutsDiarios;
        const vendasFinal = ehUltimoDia ? valoresOriginais.vendas - (vendasDiarias * (periodo.quantidadeDias - 1)) : vendasDiarias;
        const investimentoFinal = ehUltimoDia ? parseFloat((valoresOriginais.investimento - (investimentoDiario * (periodo.quantidadeDias - 1))).toFixed(2)) : investimentoDiario;
        const faturamentoFinal = ehUltimoDia ? parseFloat((valoresOriginais.faturamento - (faturamentoDiario * (periodo.quantidadeDias - 1))).toFixed(2)) : faturamentoDiario;

        // Calcular métricas derivadas para cada dia
        const roas = investimentoFinal > 0 ? faturamentoFinal / investimentoFinal : 0;
        const ctr = impressoesFinal > 0 ? (cliquesFinal / impressoesFinal) * 100 : 0;
        const cpm = impressoesFinal > 0 ? (investimentoFinal / impressoesFinal) * 1000 : 0;
        const cpc = cliquesFinal > 0 ? investimentoFinal / cliquesFinal : 0;
        const cpl = leadsFinal > 0 ? investimentoFinal / leadsFinal : 0;
        const taxa_conversao = leadsFinal > 0 ? (vendasFinal / leadsFinal) * 100 : 0;

        return {
          tipo: tipo,
          referencia_id: referenciaId,
          cliente_id: clienteSelecionado?.id || null,
          periodo_inicio: data,
          periodo_fim: data,
          alcance: alcanceFinal,
          impressoes: impressoesFinal,
          cliques: cliquesFinal,
          visualizacoes_pagina: visualizacoesFinal,
          leads: leadsFinal,
          checkouts: checkoutsFinal,
          vendas: vendasFinal,
          investimento: investimentoFinal,
          faturamento: faturamentoFinal,
          roas: parseFloat(roas.toFixed(2)),
          ctr: parseFloat(ctr.toFixed(2)),
          cpm: parseFloat(cpm.toFixed(2)),
          cpc: parseFloat(cpc.toFixed(2)),
          cpl: parseFloat(cpl.toFixed(2)),
          taxa_conversao: parseFloat(taxa_conversao.toFixed(2))
        };
      });

      // Inserir ou atualizar registros
      let error;

      if (modoEdicao && metricasExistentes?.id) {
        // Modo edição - atualizar registro existente
        const dadosAtualizacao = { ...dadosParaInserir[0] } as any; // Apenas um registro no modo edição

        // Incluir detalhe_sdr quando for SDR (coluna JSONB adicionada pela migration)
        if (department === 'sdr') {
          dadosAtualizacao.detalhe_sdr = valoresOriginais.sdr;
        }
        if (department === 'closer') {
          dadosAtualizacao.detalhe_closer = {
            calls_realizadas: parseInt(formData.closer_calls_realizadas) || 0,
            nao_compareceram: parseInt(formData.closer_nao_compareceram) || 0,
            vendas_mentoria: parseInt(formData.closer_vendas_mentoria) || 0,
            vendas_downsell: parseInt(formData.closer_vendas_downsell) || 0,
            em_negociacao: parseInt(formData.closer_em_negociacao) || 0,
            em_followup: parseInt(formData.closer_em_followup) || 0,
            vendas_perdidas: parseInt(formData.closer_vendas_perdidas) || 0,
          };
        }
        if (department === 'social-seller') {
          dadosAtualizacao.detalhe_social_seller = {
            leads_contatados: parseInt(formData.social_seller_leads_contatados) || 0,
            agendados_diagnostico: parseInt(formData.social_seller_agendados_diagnostico) || 0,
            agendados_mentoria: parseInt(formData.social_seller_agendados_mentoria) || 0,
            agendados_consultoria: parseInt(formData.social_seller_agendados_consultoria) || 0,
            downsell_vendido: parseInt(formData.social_seller_downsell_vendido) || 0,
          };
        }
        if (department === 'cs') {
          dadosAtualizacao.detalhe_cs = {
            alunas_contatadas: parseInt(formData.cs_alunas_contatadas) || 0,
            suporte_prestado: parseInt(formData.cs_suporte_prestado) || 0,
            suporte_resolvidos: parseInt(formData.cs_suporte_resolvidos) || 0,
            suporte_pendentes: parseInt(formData.cs_suporte_pendentes) || 0,
            produtos_vendidos: parseInt(formData.cs_produtos_vendidos) || 0,
          };
        }

        // Tentar atualizar com a coluna detalhe_sdr; se falhar por não existir, tentar sem ela e salvar localmente
        const { error: updateError } = await supabase
          .from('metricas')
          .update(dadosAtualizacao)
          .eq('id', metricasExistentes.id);

        if (updateError && (department === 'sdr' || department === 'closer' || department === 'social-seller' || department === 'cs')) {
          console.warn('Update com detalhe_sdr falhou, tentando sem a coluna:', updateError);
          // Remover o campo e tentar novamente
          const { detalhe_sdr, detalhe_closer, detalhe_social_seller, detalhe_cs, ...fallback } = dadosAtualizacao;
          const { error: updateFallbackError } = await supabase
            .from('metricas')
            .update(fallback)
            .eq('id', metricasExistentes.id);
          error = updateFallbackError || updateError;

          // Salvar detalhe localmente como fallback
          try {
            if (typeof window !== 'undefined') {
              if (department === 'sdr') {
                const key = `metricas_sdr_${referenciaId}_${periodo.dataInicio}`;
                const payload = {
                  referenciaId,
                  tipo,
                  periodo: { inicio: periodo.dataInicio, fim: periodo.dataFim },
                  detalhe: valoresOriginais.sdr
                };
                localStorage.setItem(key, JSON.stringify(payload));
              }
              if (department === 'closer') {
                const key = `metricas_closer_${referenciaId}_${periodo.dataInicio}`;
                const payload = {
                  referenciaId,
                  tipo,
                  periodo: { inicio: periodo.dataInicio, fim: periodo.dataFim },
                  detalhe: dadosAtualizacao.detalhe_closer
                };
                localStorage.setItem(key, JSON.stringify(payload));
              }
              if (department === 'social-seller') {
                const key = `metricas_social_seller_${referenciaId}_${periodo.dataInicio}`;
                const payload = {
                  referenciaId,
                  tipo,
                  periodo: { inicio: periodo.dataInicio, fim: periodo.dataFim },
                  detalhe: dadosAtualizacao.detalhe_social_seller
                };
                localStorage.setItem(key, JSON.stringify(payload));
              }
              if (department === 'cs') {
                const key = `metricas_cs_${referenciaId}_${periodo.dataInicio}`;
                const payload = {
                  referenciaId,
                  tipo,
                  periodo: { inicio: periodo.dataInicio, fim: periodo.dataFim },
                  detalhe: dadosAtualizacao.detalhe_cs
                };
                localStorage.setItem(key, JSON.stringify(payload));
              }
            }
          } catch (err) {
            console.warn('Não foi possível salvar detalhe SDR no localStorage', err);
          }
        } else {
          error = updateError;
        }
      } else {
        // Modo inserção - criar novos registros
        if (department === 'sdr' || department === 'closer' || department === 'social-seller' || department === 'cs') {
          // Inserir registros 'compatíveis' e incluir detalhe_* no payload quando possível
          const detalhePayload = department === 'sdr' ? { detalhe_sdr: valoresOriginais.sdr } : department === 'closer' ? { detalhe_closer: {
            calls_realizadas: parseInt(formData.closer_calls_realizadas) || 0,
            nao_compareceram: parseInt(formData.closer_nao_compareceram) || 0,
            vendas_mentoria: parseInt(formData.closer_vendas_mentoria) || 0,
            vendas_downsell: parseInt(formData.closer_vendas_downsell) || 0,
            em_negociacao: parseInt(formData.closer_em_negociacao) || 0,
            em_followup: parseInt(formData.closer_em_followup) || 0,
            vendas_perdidas: parseInt(formData.closer_vendas_perdidas) || 0,
          } } : department === 'social-seller' ? { detalhe_social_seller: {
            leads_contatados: parseInt(formData.social_seller_leads_contatados) || 0,
            agendados_diagnostico: parseInt(formData.social_seller_agendados_diagnostico) || 0,
            agendados_mentoria: parseInt(formData.social_seller_agendados_mentoria) || 0,
            agendados_consultoria: parseInt(formData.social_seller_agendados_consultoria) || 0,
            downsell_vendido: parseInt(formData.social_seller_downsell_vendido) || 0,
          } } : { detalhe_cs: {
            alunas_contatadas: parseInt(formData.cs_alunas_contatadas) || 0,
            suporte_prestado: parseInt(formData.cs_suporte_prestado) || 0,
            suporte_resolvidos: parseInt(formData.cs_suporte_resolvidos) || 0,
            suporte_pendentes: parseInt(formData.cs_suporte_pendentes) || 0,
            produtos_vendidos: parseInt(formData.cs_produtos_vendidos) || 0,
          } };

          const dadosComDetalhe = dadosParaInserir.map(d => ({ ...d, ...detalhePayload }));

          // Fazer upsert manual para cada registro
          const erros = [];
          const sucessos = [];
          
          for (const dado of dadosComDetalhe) {
            // Verificar se já existe
            const { data: existente } = await supabase
              .from('metricas')
              .select('id')
              .eq('tipo', dado.tipo)
              .eq('referencia_id', dado.referencia_id)
              .eq('periodo_inicio', dado.periodo_inicio)
              .eq('periodo_fim', dado.periodo_fim)
              .maybeSingle();
            
            if (existente) {
              // Atualizar
              const { error: updateErr } = await supabase
                .from('metricas')
                .update(dado)
                .eq('id', existente.id);
              
              if (updateErr) {
                erros.push(updateErr);
              } else {
                sucessos.push(dado.periodo_inicio);
              }
            } else {
              // Inserir novo
              const { error: insertErr } = await supabase
                .from('metricas')
                .insert(dado);
              
              if (insertErr) {
                erros.push(insertErr);
              } else {
                sucessos.push(dado.periodo_inicio);
              }
            }
          }
          
          if (erros.length > 0) {
            console.error('Erros ao salvar métricas de departamento:', erros);
            error = erros[0];
          } else {
            console.log(`${sucessos.length} registros de ${department} salvos com sucesso`);
          }
        } else {
          console.log('Dados para inserir:', JSON.stringify(dadosParaInserir, null, 2));
          
          // Inserir um registro por vez, fazendo upsert manual
          const erros = [];
          const sucessos = [];
          
          for (const dado of dadosParaInserir) {
            // Primeiro verificar se já existe
            const { data: existente } = await supabase
              .from('metricas')
              .select('id')
              .eq('tipo', dado.tipo)
              .eq('referencia_id', dado.referencia_id)
              .eq('periodo_inicio', dado.periodo_inicio)
              .eq('periodo_fim', dado.periodo_fim)
              .maybeSingle();
            
            if (existente) {
              // Atualizar
              const { error: updateErr } = await supabase
                .from('metricas')
                .update(dado)
                .eq('id', existente.id);
              
              if (updateErr) {
                erros.push(updateErr);
              } else {
                console.log('✅ Atualizado:', {
                  id: existente.id,
                  tipo: dado.tipo,
                  referencia_id: dado.referencia_id,
                  periodo: dado.periodo_inicio,
                  investimento: dado.investimento,
                  leads: dado.leads
                });
                sucessos.push(dado.periodo_inicio);
              }
            } else {
              // Inserir novo
              const { error: insertErr } = await supabase
                .from('metricas')
                .insert(dado);
              
              if (insertErr) {
                erros.push(insertErr);
              } else {
                console.log('✅ Inserido:', {
                  tipo: dado.tipo,
                  referencia_id: dado.referencia_id,
                  periodo: dado.periodo_inicio,
                  investimento: dado.investimento,
                  leads: dado.leads
                });
                sucessos.push(dado.periodo_inicio);
              }
            }
          }
          
          if (erros.length > 0) {
            console.error('Erros ao salvar:', erros);
            error = erros[0]; // Mostrar primeiro erro
          } else {
            console.log(`✅ ${sucessos.length} registros salvos com sucesso em metricas!`);
            console.log('📝 Detalhes salvos:', {
              tipo,
              referenciaId,
              periodos: sucessos
            });
          }
        }
      }

      if (error) {
        console.error('Erro completo do Supabase:', JSON.stringify(error, null, 2));
        console.error('Tipo do erro:', typeof error);
        console.error('Keys do erro:', Object.keys(error));
        const errorMsg = error?.message || error?.hint || error?.details || 'Erro desconhecido ao salvar métricas';
        toast.error(`Erro ao salvar métricas: ${errorMsg}`);
        return;
      }

      if (modoEdicao) {
        toast.success('Métricas atualizadas com sucesso!');
      } else {
        const tipoTexto = tipoDistribuicao === 'diario' ? 'dia' : tipoDistribuicao === 'semanal' ? 'semana' : 'mês';
        toast.success(`Métricas distribuídas para ${periodo.quantidadeDias} dias do ${tipoTexto}!`, {
          description: 'Modal continua aberto. Altere o criativo e salve novamente se desejar.'
        });
      }
      
      // Limpar apenas os campos numéricos, mantendo seleções e datas
      setFormData(prev => ({
        ...prev,
        alcance: '0',
        impressoes: '0',
        cliques: '0',
        visualizacoes_pagina: '0',
        leads: '0',
        checkouts: '0',
        vendas: '0',
        investimento: '0',
        faturamento: '0',
        investimento_trafego: '0',
        sdr_comecou_diagnostico: '0',
        sdr_chegaram_crm_kommo: '0',
        sdr_qualificados_mentoria: '0',
        sdr_para_downsell: '0',
        sdr_agendados_diagnostico: '0',
        sdr_agendados_mentoria: '0',
        sdr_nomes_qualificados: '',
        closer_calls_realizadas: '0',
        closer_nao_compareceram: '0',
        closer_vendas_mentoria: '0',
        closer_vendas_downsell: '0',
        closer_em_negociacao: '0',
        closer_em_followup: '0',
        closer_vendas_perdidas: '0',
        social_seller_leads_contatados: '0',
        social_seller_agendados_diagnostico: '0',
        social_seller_agendados_mentoria: '0',
        social_seller_agendados_consultoria: '0',
        social_seller_downsell_vendido: '0',
        cs_alunas_contatadas: '0',
        cs_suporte_prestado: '0',
        cs_suporte_resolvidos: '0',
        cs_suporte_pendentes: '0',
        cs_produtos_vendidos: '0'
      }));
      
      // Não fechar o modal - continua aberto para próxima entrada
      // onOpenChange(false); <- REMOVIDO para manter modal aberto
      
      onDadosAtualizados?.();

    } catch (error) {
      console.error('Erro ao salvar métricas:', error);
      toast.error('Erro interno. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Permitir abrir o modal mesmo quando nenhuma campanha está pré-selecionada
  // (o formulário bloqueará o envio se não houver campanha selecionada)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] bg-gray-900 border-gray-700 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-white">
            <div className="h-8 w-8 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-lg flex items-center justify-center">
              <Edit3 className="h-4 w-4 text-white" />
            </div>
            {modoEdicao ? 'Editar Métricas' : 'Gerenciar Métricas'}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {campanha ? `Gerencie as métricas da campanha "${campanha.nome}"` : 'Gerencie as métricas da sua campanha'}
          </DialogDescription>
          
          {/* Dica de UX - Modo continuar */}
          {abaAtiva === 'adicionar' && modoAtual === 'criar' && (
            <div className="mt-2 p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-md">
              <p className="text-xs text-cyan-300">
                💡 <strong>Dica:</strong> Após salvar, o modal permanece aberto. Altere o criativo e salve novamente para adicionar mais métricas rapidamente!
              </p>
            </div>
          )}
          
          {/* Abas de Navegação */}
          <div className="flex gap-2 mt-4 border-b border-gray-700">
            <button
              type="button"
              onClick={() => setAbaAtiva('adicionar')}
              className={`px-4 py-2 font-medium text-sm transition-colors ${
                abaAtiva === 'adicionar'
                  ? 'text-cyan-400 border-b-2 border-cyan-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <PlusCircle className="h-4 w-4" />
                <span>Adicionar/Editar</span>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setAbaAtiva('listar')}
              className={`px-4 py-2 font-medium text-sm transition-colors ${
                abaAtiva === 'listar'
                  ? 'text-cyan-400 border-b-2 border-cyan-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <List className="h-4 w-4" />
                <span>Métricas Existentes</span>
                {metricasExistentesLista.length > 0 && (
                  <span className="bg-cyan-600 text-white text-xs px-2 py-0.5 rounded-full">
                    {metricasExistentesLista.length}
                  </span>
                )}
              </div>
            </button>
          </div>
        </DialogHeader>

        {/* ABA: Adicionar/Editar */}
        {abaAtiva === 'adicionar' && (
          <>
            {/* Banner de Status - Novo vs Editando */}
            {modoAtual === 'editar' && metricaExistente && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 mt-4">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 bg-amber-500/20 rounded-full flex items-center justify-center">
                    <Edit3 className="h-4 w-4 text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-amber-300">Editando Métrica Existente</p>
                    <p className="text-xs text-amber-400/80">
                      {new Date(metricaExistente.periodo_inicio).toLocaleDateString('pt-BR')} • 
                      Investimento: R$ {metricaExistente.investimento?.toFixed(2) || '0.00'} • 
                      Leads: {metricaExistente.leads || 0}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={limparCampos}
                    disabled={loading}
                    className="text-amber-300 hover:text-amber-200 hover:bg-amber-500/20"
                  >
                    Limpar
                  </Button>
                </div>
              </div>
            )}
            
            {modoAtual === 'criar' && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 mt-4">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 bg-emerald-500/20 rounded-full flex items-center justify-center">
                    <Target className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-emerald-300">Nova Métrica</p>
                    <p className="text-xs text-emerald-400/80">Preencha os campos para adicionar uma nova métrica</p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tipo de Distribuição - apenas para modo adicionar */}
          {!modoEdicao && department !== 'sdr' && department !== 'closer' && department !== 'social-seller' && department !== 'cs' && (
            <div className="space-y-3">
              <Label className="text-gray-300">Tipo de Distribuição</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={tipoDistribuicao === 'diario' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTipoDistribuicao('diario')}
                disabled={loading}
              >
                Diário
              </Button>
              <Button
                type="button"
                variant={tipoDistribuicao === 'semanal' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTipoDistribuicao('semanal')}
                disabled={loading}
              >
                Semanal
              </Button>
              <Button
                type="button"
                variant={tipoDistribuicao === 'mensal' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTipoDistribuicao('mensal')}
                disabled={loading}
              >
                Mensal
              </Button>
            </div>
            <p className="text-sm text-gray-400">
              {tipoDistribuicao === 'diario' && 'Os valores serão inseridos apenas para a data selecionada.'}
              {tipoDistribuicao === 'semanal' && 'Os valores serão distribuídos pelos 7 dias da semana selecionada.'}
              {tipoDistribuicao === 'mensal' && 'Os valores serão distribuídos por todos os dias do mês selecionado.'}
            </p>
            </div>
          )}

          {/* Aviso para departamentos SDR/Closer/etc */}
          {(department === 'sdr' || department === 'closer' || department === 'social-seller' || department === 'cs') && !modoEdicao && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <p className="text-sm text-blue-300">
                💡 <strong>Dica:</strong> Insira os valores TOTAIS da semana. Eles serão salvos como um único registro na data selecionada.
              </p>
            </div>
          )}

          {/* Data */}
          <div className="space-y-2">
            <Label className="text-gray-300 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {tipoDistribuicao === 'diario' ? 'Data das Métricas *' : 
               tipoDistribuicao === 'semanal' ? 'Período da Semana (início e fim) *' : 
               'Data de Referência (mês) *'}
            </Label>
            {tipoDistribuicao === 'semanal' ? (
              <div className="flex gap-2 items-center">
                <div className="flex-1">
                  <Label htmlFor="weeklyStart" className="text-sm text-gray-300">Início ({weeklyStart ? weekdayPt(weeklyStart) : weekdayPt(formData.data)})</Label>
                  <Input
                    id="weeklyStart"
                    type="date"
                    value={weeklyStart}
                    onChange={(e) => setWeeklyStart(e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white"
                    required
                    disabled={loading}
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor="weeklyEnd" className="text-sm text-gray-300">Término ({weeklyEnd ? weekdayPt(weeklyEnd) : weekdayPt(formData.data)})</Label>
                  <Input
                    id="weeklyEnd"
                    type="date"
                    value={weeklyEnd}
                    onChange={(e) => setWeeklyEnd(e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white"
                    required
                    disabled={loading}
                  />
                </div>
              </div>
            ) : tipoDistribuicao === 'mensal' ? (
              <div className="flex gap-2 items-center">
                <div className="flex-1">
                  <Label htmlFor="monthlyStart" className="text-sm text-gray-300">Início (1º dia)</Label>
                  <Input
                    id="monthlyStart"
                    type="date"
                    value={monthlyStart}
                    onChange={(e) => setMonthlyStart(e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white"
                    required
                    disabled={loading}
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor="monthlyEnd" className="text-sm text-gray-300">Término (último dia do mês)</Label>
                  <Input
                    id="monthlyEnd"
                    type="date"
                    value={monthlyEnd}
                    onChange={(e) => setMonthlyEnd(e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white"
                    required
                    disabled={loading}
                  />
                </div>
              </div>
            ) : (
              <Input
                id="data"
                type="date"
                value={formData.data}
                onChange={(e) => handleInputChange('data', e.target.value)}
                className="bg-gray-800 border-gray-600 text-white"
                required
                disabled={loading}
              />
            )}
          </div>

          {/* Seleção de Funil / Campanha / Público / Criativo */}
          <div className="space-y-2">
            <Label className="text-gray-300">Associar a</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <Label className="text-sm text-gray-300">Funil</Label>
                <select
                  value={selectedFunil?.id || ''}
                  onChange={(e) => {
                    const id = e.target.value;
                    const f = funis.find(x => x.id === id) || null;
                    setSelectedFunil(f ? { id: f.id, nome: f.nome } : null);
                  }}
                  className="w-full bg-gray-800 border border-gray-600 text-white px-3 py-2 rounded"
                >
                  <option value="">-- Selecionar funil --</option>
                  {funis.map((f: any) => (
                    <option key={f.id} value={f.id}>{f.nome}</option>
                  ))}
                </select>
              </div>

              <div>
                <Label className="text-sm text-gray-300">Campanha</Label>
                <select
                  value={selectedCampanha?.id || ''}
                  onChange={(e) => {
                    const id = e.target.value;
                    const c = campanhasList.find(x => x.id === id) || null;
                    setSelectedCampanha(c ? { id: c.id, nome: c.nome } : null);
                  }}
                  className="w-full bg-gray-800 border border-gray-600 text-white px-3 py-2 rounded"
                >
                  <option value="">-- Selecionar campanha --</option>
                  {campanhasList.length === 0 ? (
                    <option value="" disabled>(Não cadastrado)</option>
                  ) : (
                    campanhasList.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.nome}</option>
                    ))
                  )}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <Label className="text-sm text-gray-300">Público</Label>
                <select
                  value={selectedPublico?.id || ''}
                  onChange={(e) => {
                    const id = e.target.value;
                    const p = publicosList.find(x => x.id === id) || null;
                    setSelectedPublico(p ? { id: p.id, name: p.name } : null);
                  }}
                  className="w-full bg-gray-800 border border-gray-600 text-white px-3 py-2 rounded"
                >
                  <option value="">-- Selecionar público --</option>
                  {publicosList.length === 0 ? (
                    <option value="" disabled>(Não cadastrado)</option>
                  ) : (
                    publicosList.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <Label className="text-sm text-gray-300">Criativo</Label>
                <select
                  value={selectedCriativo?.id || ''}
                  onChange={(e) => {
                    const id = e.target.value;
                    const cr = criativosList.find(x => x.id === id) || null;
                    setSelectedCriativo(cr ? { id: cr.id, name: cr.name } : null);
                  }}
                  className="w-full bg-gray-800 border border-gray-600 text-white px-3 py-2 rounded"
                >
                  <option value="">-- Selecionar criativo --</option>
                  {criativosList.length === 0 ? (
                    <option value="" disabled>(Não cadastrado)</option>
                  ) : (
                    criativosList.map((cr: any) => (
                      <option key={cr.id} value={cr.id}>{cr.name}</option>
                    ))
                  )}
                </select>
              </div>
            </div>
          </div>

          <Separator className="bg-gray-700" />

          {/* Descrição dos Valores */}
          <div className="bg-blue-950/20 border border-blue-800/30 rounded-lg p-4">
            <h4 className="text-blue-300 font-medium mb-2">📊 Como inserir os valores:</h4>
            <div className="space-y-2">
              <p className="text-sm text-blue-200/80">
                {tipoDistribuicao === 'diario' 
                  ? 'Insira os valores exatos para o dia selecionado.'
                  : tipoDistribuicao === 'semanal'
                  ? 'Insira os valores TOTAIS da semana. Eles serão distribuídos igualmente pelos 7 dias.'
                  : 'Insira os valores TOTAIS do mês. Eles serão distribuídos pelos dias até hoje (não pelo mês completo).'}
              </p>
              <p className="text-sm text-emerald-200/80 flex items-center gap-2">
                <span>💡</span>
                <span><strong>ROAS automático:</strong> Será calculado automaticamente (Faturamento ÷ Investimento)</span>
              </p>
            </div>
          </div>

          {/* Se for SDR, mostrar campos específicos de SDR; Se for Closer, mostrar campos do Closer */}
          {department === 'sdr' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sdr_comecou_diagnostico" className="text-gray-300">Lead começou preencher diagnóstico</Label>
                  <Input
                    id="sdr_comecou_diagnostico"
                    type="number"
                    placeholder="Ex: 150"
                    value={formData.sdr_comecou_diagnostico}
                    onChange={(e) => handleInputChange('sdr_comecou_diagnostico', e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sdr_chegaram_crm_kommo" className="text-gray-300">Leads que chegaram ao CRM Kommo</Label>
                  <Input
                    id="sdr_chegaram_crm_kommo"
                    type="number"
                    placeholder="Ex: 120"
                    value={formData.sdr_chegaram_crm_kommo}
                    onChange={(e) => handleInputChange('sdr_chegaram_crm_kommo', e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sdr_qualificados_mentoria" className="text-gray-300">Leads qualificados para Mentoria</Label>
                  <Input
                    id="sdr_qualificados_mentoria"
                    type="number"
                    placeholder="Ex: 40"
                    value={formData.sdr_qualificados_mentoria}
                    onChange={(e) => handleInputChange('sdr_qualificados_mentoria', e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sdr_para_downsell" className="text-gray-300">Leads Para Downsell</Label>
                  <Input
                    id="sdr_para_downsell"
                    type="number"
                    placeholder="Ex: 10"
                    value={formData.sdr_para_downsell}
                    onChange={(e) => handleInputChange('sdr_para_downsell', e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sdr_agendados_diagnostico" className="text-gray-300">Leads agendados para Diagnóstico</Label>
                  <Input
                    id="sdr_agendados_diagnostico"
                    type="number"
                    placeholder="Ex: 25"
                    value={formData.sdr_agendados_diagnostico}
                    onChange={(e) => handleInputChange('sdr_agendados_diagnostico', e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sdr_agendados_mentoria" className="text-gray-300">Leads Agendados para Mentoria</Label>
                  <Input
                    id="sdr_agendados_mentoria"
                    type="number"
                    placeholder="Ex: 12"
                    value={formData.sdr_agendados_mentoria}
                    onChange={(e) => handleInputChange('sdr_agendados_mentoria', e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sdr_nomes_qualificados" className="text-gray-300">Nomes dos leads qualificados (um por linha)</Label>
                  <textarea
                    id="sdr_nomes_qualificados"
                    value={formData.sdr_nomes_qualificados}
                    onChange={(e) => handleInputChange('sdr_nomes_qualificados', e.target.value)}
                    className="w-full bg-gray-800 border border-gray-600 text-white px-3 py-2 rounded h-28"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>
          ) : department === 'closer' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="closer_calls_realizadas" className="text-gray-300">Calls realizadas</Label>
                  <Input
                    id="closer_calls_realizadas"
                    type="number"
                    placeholder="Ex: 120"
                    value={formData.closer_calls_realizadas}
                    onChange={(e) => handleInputChange('closer_calls_realizadas', e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="closer_nao_compareceram" className="text-gray-300">Não compareceu a call</Label>
                  <Input
                    id="closer_nao_compareceram"
                    type="number"
                    placeholder="Ex: 12"
                    value={formData.closer_nao_compareceram}
                    onChange={(e) => handleInputChange('closer_nao_compareceram', e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="closer_vendas_mentoria" className="text-gray-300">Vendas da Mentoria</Label>
                  <Input
                    id="closer_vendas_mentoria"
                    type="number"
                    placeholder="Ex: 35"
                    value={formData.closer_vendas_mentoria}
                    onChange={(e) => handleInputChange('closer_vendas_mentoria', e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="closer_vendas_downsell" className="text-gray-300">Vendas Downsell</Label>
                  <Input
                    id="closer_vendas_downsell"
                    type="number"
                    placeholder="Ex: 5"
                    value={formData.closer_vendas_downsell}
                    onChange={(e) => handleInputChange('closer_vendas_downsell', e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="closer_em_negociacao" className="text-gray-300">Em negociação</Label>
                  <Input
                    id="closer_em_negociacao"
                    type="number"
                    placeholder="Ex: 10"
                    value={formData.closer_em_negociacao}
                    onChange={(e) => handleInputChange('closer_em_negociacao', e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="closer_em_followup" className="text-gray-300">Em Follow-up</Label>
                  <Input
                    id="closer_em_followup"
                    type="number"
                    placeholder="Ex: 8"
                    value={formData.closer_em_followup}
                    onChange={(e) => handleInputChange('closer_em_followup', e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="closer_vendas_perdidas" className="text-gray-300">Vendas perdidas</Label>
                  <Input
                    id="closer_vendas_perdidas"
                    type="number"
                    placeholder="Ex: 3"
                    value={formData.closer_vendas_perdidas}
                    onChange={(e) => handleInputChange('closer_vendas_perdidas', e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>
          ) : department === 'social-seller' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="social_seller_leads_contatados" className="text-gray-300">Leads Contatados</Label>
                  <Input
                    id="social_seller_leads_contatados"
                    type="number"
                    placeholder="Ex: 250"
                    value={formData.social_seller_leads_contatados}
                    onChange={(e) => handleInputChange('social_seller_leads_contatados', e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="social_seller_agendados_diagnostico" className="text-gray-300">Leads agendados para diagnóstico</Label>
                  <Input
                    id="social_seller_agendados_diagnostico"
                    type="number"
                    placeholder="Ex: 45"
                    value={formData.social_seller_agendados_diagnostico}
                    onChange={(e) => handleInputChange('social_seller_agendados_diagnostico', e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="social_seller_agendados_mentoria" className="text-gray-300">Leads Agendados para Apresentar Mentoria</Label>
                  <Input
                    id="social_seller_agendados_mentoria"
                    type="number"
                    placeholder="Ex: 30"
                    value={formData.social_seller_agendados_mentoria}
                    onChange={(e) => handleInputChange('social_seller_agendados_mentoria', e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="social_seller_agendados_consultoria" className="text-gray-300">Leads Agendados para Apresentar Consultoria</Label>
                  <Input
                    id="social_seller_agendados_consultoria"
                    type="number"
                    placeholder="Ex: 18"
                    value={formData.social_seller_agendados_consultoria}
                    onChange={(e) => handleInputChange('social_seller_agendados_consultoria', e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="social_seller_downsell_vendido" className="text-gray-300">Downsell Vendido</Label>
                  <Input
                    id="social_seller_downsell_vendido"
                    type="number"
                    placeholder="Ex: 8"
                    value={formData.social_seller_downsell_vendido}
                    onChange={(e) => handleInputChange('social_seller_downsell_vendido', e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>
          ) : department === 'cs' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cs_alunas_contatadas" className="text-gray-300">Alunas Contatadas</Label>
                  <Input
                    id="cs_alunas_contatadas"
                    type="number"
                    placeholder="Ex: 180"
                    value={formData.cs_alunas_contatadas}
                    onChange={(e) => handleInputChange('cs_alunas_contatadas', e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cs_suporte_prestado" className="text-gray-300">Suporte Prestado</Label>
                  <Input
                    id="cs_suporte_prestado"
                    type="number"
                    placeholder="Ex: 95"
                    value={formData.cs_suporte_prestado}
                    onChange={(e) => handleInputChange('cs_suporte_prestado', e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cs_suporte_resolvidos" className="text-gray-300">Suporte Resolvidos</Label>
                  <Input
                    id="cs_suporte_resolvidos"
                    type="number"
                    placeholder="Ex: 88"
                    value={formData.cs_suporte_resolvidos}
                    onChange={(e) => handleInputChange('cs_suporte_resolvidos', e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cs_suporte_pendentes" className="text-gray-300">Suporte Pendentes</Label>
                  <Input
                    id="cs_suporte_pendentes"
                    type="number"
                    placeholder="Ex: 7"
                    value={formData.cs_suporte_pendentes}
                    onChange={(e) => handleInputChange('cs_suporte_pendentes', e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cs_produtos_vendidos" className="text-gray-300">Produtos vendidos</Label>
                  <Input
                    id="cs_produtos_vendidos"
                    type="number"
                    placeholder="Ex: 23"
                    value={formData.cs_produtos_vendidos}
                    onChange={(e) => handleInputChange('cs_produtos_vendidos', e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Alcance e Impressões */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="alcance" className="text-gray-300 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Alcance
                  </Label>
                  <Input
                    id="alcance"
                    type="number"
                    placeholder="Ex: 25000"
                    value={formData.alcance}
                    onChange={(e) => handleInputChange('alcance', e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="impressoes" className="text-gray-300">
                    Impressões
                  </Label>
                  <Input
                    id="impressoes"
                    type="number"
                    placeholder="Ex: 50000"
                    value={formData.impressoes}
                    onChange={(e) => handleInputChange('impressoes', e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Cliques e Visualizações */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cliques" className="text-gray-300 flex items-center gap-2">
                    <MousePointer className="h-4 w-4" />
                    Cliques
                  </Label>
                  <Input
                    id="cliques"
                    type="number"
                    placeholder="Ex: 1250"
                    value={formData.cliques}
                    onChange={(e) => handleInputChange('cliques', e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="visualizacoes_pagina" className="text-gray-300">
                    Visualizações da Página
                  </Label>
                  <Input
                    id="visualizacoes_pagina"
                    type="number"
                    placeholder="Ex: 800"
                    value={formData.visualizacoes_pagina}
                    onChange={(e) => handleInputChange('visualizacoes_pagina', e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Leads e Checkouts */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="leads" className="text-gray-300 flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Leads
                  </Label>
                  <Input
                    id="leads"
                    type="number"
                    placeholder="Ex: 150"
                    value={formData.leads}
                    onChange={(e) => handleInputChange('leads', e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="checkouts" className="text-gray-300">
                    Checkouts Iniciados
                  </Label>
                  <Input
                    id="checkouts"
                    type="number"
                    placeholder="Ex: 75"
                    value={formData.checkouts}
                    onChange={(e) => handleInputChange('checkouts', e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white"
                    disabled={loading}
                  />
                </div>
              </div>
            </>
          )}

          {/* Vendas - ocultar para SDR/Closer/Social Seller/CS ou quando hideFinanceFields=true */}
          {!(hideFinanceFields || department === 'sdr' || department === 'closer' || department === 'social-seller' || department === 'cs') && (
            <div className="space-y-2">
              <Label htmlFor="vendas" className="text-gray-300 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Vendas Concluídas
              </Label>
              <Input
                id="vendas"
                type="number"
                placeholder="Ex: 25"
                value={formData.vendas}
                onChange={(e) => handleInputChange('vendas', e.target.value)}
                className="bg-gray-800 border-gray-600 text-white"
                disabled={loading}
              />
            </div>
          )}

          {/* Investimento específico de Tráfego (apenas para department=trafego) */}
          {hideFinanceFields && department === 'trafego' && (
            <div className="space-y-2">
              <Label htmlFor="investimento_trafego" className="text-gray-300 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Investimento em Tráfego (R$)
              </Label>
              <Input
                id="investimento_trafego"
                type="number"
                step="0.01"
                placeholder="Ex: 1500.00"
                value={formData.investimento_trafego}
                onChange={(e) => handleInputChange('investimento_trafego', e.target.value)}
                className="bg-gray-800 border-gray-600 text-white"
                disabled={loading}
              />
            </div>
          )}

          <Separator className="bg-gray-700" />

          {/* Investimento - ocultar para SDR/Closer/Social Seller/CS */}
          {!(hideFinanceFields || department === 'sdr' || department === 'closer' || department === 'social-seller' || department === 'cs') && (
            <div className="space-y-2">
              <Label htmlFor="investimento" className="text-gray-300 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Investimento (R$)
              </Label>
              <Input
                id="investimento"
                type="number"
                step="0.01"
                placeholder="Ex: 1500.00"
                value={formData.investimento}
                onChange={(e) => handleInputChange('investimento', e.target.value)}
                className="bg-gray-800 border-gray-600 text-white"
                disabled={loading}
              />
            </div>
          )}

          {/* Faturamento - mostrar para todos exceto quando hideFinanceFields ou SDR/Closer/Social Seller/CS */}
          {!(hideFinanceFields || department === 'sdr' || department === 'closer' || department === 'social-seller' || department === 'cs') && (
            <div className="space-y-2">
              <Label htmlFor="faturamento" className="text-gray-300">
                Faturamento (R$)
              </Label>
              <Input
                id="faturamento"
                type="number"
                step="0.01"
                placeholder="Ex: 4500.00"
                value={formData.faturamento}
                onChange={(e) => handleInputChange('faturamento', e.target.value)}
                className="bg-gray-800 border-gray-600 text-white"
                disabled={loading}
              />
            </div>
          )}

          <DialogFooter className="gap-2">
            <div className="flex items-center justify-between w-full gap-2">
              {/* Botão DELETE - só aparece quando está editando */}
              {modoAtual === 'editar' && metricaExistente && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={loading}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <div className="flex items-center gap-2">
                    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                    <span>🗑️ Deletar</span>
                  </div>
                </Button>
              )}
              
              {/* Botão Limpar Campos */}
              <Button
                type="button"
                variant="outline"
                onClick={limparCampos}
                disabled={loading}
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                Limpar Campos
              </Button>
              
              <div className="flex gap-2 ml-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={loading}
                  className="border-gray-600 text-gray-300 hover:bg-gray-800"
                >
                  Fechar
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white"
                >
                  <div className="flex items-center">
                    {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    <span>{modoAtual === 'editar' ? '💾 Atualizar' : '✅ Salvar e Continuar'}</span>
                  </div>
                </Button>
              </div>
            </div>
          </DialogFooter>
        </form>
        </>
        )}

        {/* ABA: Listar Métricas Existentes */}
        {abaAtiva === 'listar' && (
          <div className="space-y-4 mt-4">
            {loadingLista ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
              </div>
            ) : metricasExistentesLista.length === 0 ? (
              <div className="text-center py-12">
                <div className="h-16 w-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <List className="h-8 w-8 text-gray-600" />
                </div>
                <p className="text-gray-400 text-sm">Nenhuma métrica encontrada</p>
                <p className="text-gray-500 text-xs mt-1">Adicione métricas usando a aba "Adicionar/Editar"</p>
              </div>
            ) : (
              <>
                {/* Filtros e Ações em Massa */}
                <div className="space-y-3">
                  {/* Header com contador e ações */}
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-300">
                      <strong>{metricasFiltradas.length}</strong> de <strong>{metricasExistentesLista.length}</strong> métrica(s)
                      {metricasSelecionadas.size > 0 && (
                        <span className="ml-2 text-cyan-400">
                          ({metricasSelecionadas.size} selecionada{metricasSelecionadas.size > 1 ? 's' : ''})
                        </span>
                      )}
                    </p>
                    
                    {metricasSelecionadas.size > 0 && (
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={deletarMetricasEmMassa}
                        disabled={loadingLista}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Deletar {metricasSelecionadas.size}
                      </Button>
                    )}
                  </div>

                  {/* Filtros */}
                  <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {/* Filtro por Tipo */}
                      <div>
                        <Label className="text-xs text-gray-400 mb-1">Tipo</Label>
                        <select
                          value={filtroTipo}
                          onChange={(e) => setFiltroTipo(e.target.value)}
                          className="w-full bg-gray-900 border border-gray-600 text-white text-sm px-2 py-1.5 rounded"
                        >
                          <option value="todos">Todos os tipos</option>
                          <option value="funil">Funil</option>
                          <option value="campanha">Campanha</option>
                          <option value="publico">Público</option>
                          <option value="criativo">Criativo</option>
                        </select>
                      </div>

                      {/* Filtro Data Inicial */}
                      <div>
                        <Label className="text-xs text-gray-400 mb-1">Data Inicial</Label>
                        <Input
                          type="date"
                          value={filtroDataInicio}
                          onChange={(e) => setFiltroDataInicio(e.target.value)}
                          className="bg-gray-900 border-gray-600 text-white text-sm h-8"
                        />
                      </div>

                      {/* Filtro Data Final */}
                      <div>
                        <Label className="text-xs text-gray-400 mb-1">Data Final</Label>
                        <Input
                          type="date"
                          value={filtroDataFim}
                          onChange={(e) => setFiltroDataFim(e.target.value)}
                          className="bg-gray-900 border-gray-600 text-white text-sm h-8"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setFiltroTipo('todos');
                          setFiltroDataInicio('');
                          setFiltroDataFim('');
                        }}
                        className="text-xs"
                      >
                        Limpar Filtros
                      </Button>
                      
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={toggleSelecionarTodas}
                        className="text-xs"
                      >
                        {metricasSelecionadas.size === metricasFiltradas.length ? 'Desselecionar' : 'Selecionar'} Todas
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {metricasFiltradas.map((metrica) => (
                    <div
                      key={metrica.id}
                      className={`bg-gray-800/50 border rounded-lg p-4 transition-colors ${
                        metricasSelecionadas.has(metrica.id)
                          ? 'border-cyan-500 bg-cyan-500/10'
                          : 'border-gray-700 hover:border-cyan-600/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {/* Checkbox */}
                        <input
                          type="checkbox"
                          checked={metricasSelecionadas.has(metrica.id)}
                          onChange={() => toggleSelecao(metrica.id)}
                          className="w-4 h-4 bg-gray-700 border-gray-600 rounded text-cyan-600 focus:ring-cyan-500"
                        />
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-cyan-400" />
                              <span className="text-white font-medium">
                                {new Date(metrica.periodo_inicio).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                            <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
                              {metrica.tipo}
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-gray-400 text-xs">Investimento</p>
                              <p className="text-emerald-400 font-semibold">
                                R$ {metrica.investimento?.toFixed(2) || '0.00'}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-400 text-xs">Leads</p>
                              <p className="text-cyan-400 font-semibold">
                                {metrica.leads || 0}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-400 text-xs">Impressões</p>
                              <p className="text-purple-400 font-semibold">
                                {metrica.impressoes?.toLocaleString('pt-BR') || 0}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 ml-4">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => carregarMetricaParaEdicao(metrica)}
                            className="border-cyan-600 text-cyan-400 hover:bg-cyan-600/20"
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => deletarMetricaDaLista(metrica)}
                            disabled={loadingLista}
                            className="border-red-600 text-red-400 hover:bg-red-600/20"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}