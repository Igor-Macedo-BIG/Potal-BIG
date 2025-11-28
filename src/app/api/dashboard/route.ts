import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { 
  DashboardResponse, 
  FiltrosDashboard, 
  MetricasAgregadas,
  HierarquiaItem 
} from '@/types/hierarchical';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Verificar autenticação
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Obter parâmetros da URL
    const { searchParams } = new URL(request.url);
    const filtros: FiltrosDashboard = {
      empresa_id: searchParams.get('empresa_id') || undefined,
      funil_id: searchParams.get('funil_id') || undefined,
      campanha_id: searchParams.get('campanha_id') || undefined,
      conjunto_id: searchParams.get('conjunto_id') || undefined,
      criativo_id: searchParams.get('criativo_id') || undefined,
      periodo_inicio: searchParams.get('periodo_inicio') || getDateDaysAgo(30),
      periodo_fim: searchParams.get('periodo_fim') || getCurrentDate(),
    };

    // Obter empresa_id do usuário se não fornecido
    if (!filtros.empresa_id) {
      const { data: usuario } = await supabase
        .from('usuarios')
        .select('empresa_id')
        .eq('id', session.user.id)
        .single();
      
      if (!usuario) {
        return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
      }
      filtros.empresa_id = usuario.empresa_id;
    }

    // Construir query base para métricas
    let query = supabase
      .from('metricas')
      .select('*')
      .gte('periodo_inicio', filtros.periodo_inicio)
      .lte('periodo_fim', filtros.periodo_fim);

    // Aplicar filtros hierárquicos
    if (filtros.criativo_id) {
      query = query.eq('tipo', 'criativo').eq('referencia_id', filtros.criativo_id);
    } else if (filtros.conjunto_id) {
      query = query.eq('tipo', 'conjunto').eq('referencia_id', filtros.conjunto_id);
    } else if (filtros.campanha_id) {
      query = query.eq('tipo', 'campanha').eq('referencia_id', filtros.campanha_id);
    } else if (filtros.funil_id) {
      query = query.eq('tipo', 'funil').eq('referencia_id', filtros.funil_id);
    } else {
      // Se nenhum filtro específico, buscar todos os funis da empresa
      const { data: funis } = await supabase
        .from('funis')
        .select('id')
        .eq('empresa_id', filtros.empresa_id);
      
      if (funis && funis.length > 0) {
        const funilIds = funis.map(f => f.id);
        query = query.eq('tipo', 'funil').in('referencia_id', funilIds);
      }
    }

    // Executar query principal
    const { data: metricas, error } = await query;

    if (error) {
      console.error('Erro ao buscar métricas:', error);
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }

    // Agregar métricas
    const metricasAgregadas = agregarMetricas(metricas || []);

    // Buscar dados para série temporal (últimos 30 dias, agrupado por dia)
    const seriesTempo = await buscarSeriesTempo(supabase, filtros);

    // Buscar hierarquia se necessário (quando não há filtros específicos)
    const hierarquia = await buscarHierarquia(supabase, filtros);

    // Buscar comparativo de criativos se estamos em nível de conjunto
    const comparativocriativos = filtros.conjunto_id 
      ? await buscarComparativoCriativos(supabase, filtros.conjunto_id, filtros)
      : undefined;

    const response: DashboardResponse = {
      metricas: metricasAgregadas,
      series_tempo: seriesTempo,
      hierarquia,
      comparativo_criativos: comparativocriativos,
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Erro na API dashboard:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// Função para agregar métricas
function agregarMetricas(metricas: any[]): MetricasAgregadas {
  const agregadas = metricas.reduce((acc, metrica) => ({
    alcance: acc.alcance + (metrica.alcance || 0),
    impressoes: acc.impressoes + (metrica.impressoes || 0),
    cliques: acc.cliques + (metrica.cliques || 0),
    visualizacoes_pagina: acc.visualizacoes_pagina + (metrica.visualizacoes_pagina || 0),
    leads: acc.leads + (metrica.leads || 0),
    checkouts: acc.checkouts + (metrica.checkouts || 0),
    vendas: acc.vendas + (metrica.vendas || 0),
    investimento: acc.investimento + (metrica.investimento || 0),
    faturamento: acc.faturamento + (metrica.faturamento || 0),
  }), {
    alcance: 0,
    impressoes: 0,
    cliques: 0,
    visualizacoes_pagina: 0,
    leads: 0,
    checkouts: 0,
    vendas: 0,
    investimento: 0,
    faturamento: 0,
  });

  // Calcular métricas derivadas
  return {
    ...agregadas,
    roas: agregadas.investimento > 0 ? agregadas.faturamento / agregadas.investimento : 0,
    ctr: agregadas.impressoes > 0 ? (agregadas.cliques / agregadas.impressoes) * 100 : 0,
    cpm: agregadas.impressoes > 0 ? (agregadas.investimento / agregadas.impressoes) * 1000 : 0,
    cpc: agregadas.cliques > 0 ? agregadas.investimento / agregadas.cliques : 0,
    cpl: agregadas.leads > 0 ? agregadas.investimento / agregadas.leads : 0,
    taxa_conversao: agregadas.leads > 0 ? (agregadas.vendas / agregadas.leads) * 100 : 0,
  };
}

// Buscar série temporal
async function buscarSeriesTempo(supabase: any, filtros: FiltrosDashboard) {
  // Para simplicidade, vamos buscar métricas agrupadas por período
  // Na implementação real, você poderia ter métricas diárias
  const diasPeriodo = gerarDiasPeriodo(filtros.periodo_inicio, filtros.periodo_fim);
  
  return diasPeriodo.map(data => ({
    data,
    investimento: Math.random() * 500 + 100, // Dados simulados por enquanto
    leads: Math.random() * 50 + 10,
    vendas: Math.random() * 10 + 1,
    cliques: Math.random() * 200 + 50,
    alcance: Math.random() * 5000 + 1000,
  }));
}

// Buscar hierarquia completa
async function buscarHierarquia(supabase: any, filtros: FiltrosDashboard): Promise<HierarquiaItem[]> {
  // Buscar funis da empresa
  const { data: funis } = await supabase
    .from('funis')
    .select(`
      id, nome, created_at,
      campanhas (
        id, nome, tipo,
        conjuntos_anuncio (
          id, nome, publico,
          criativos (
            id, nome, tipo, descricao
          )
        )
      )
    `)
    .eq('empresa_id', filtros.empresa_id)
    .eq('ativo', true);

  if (!funis) return [];

  // Construir hierarquia
  const hierarquia: HierarquiaItem[] = [];

  for (const funil of funis) {
    // Buscar métricas do funil
    const { data: metricasFunil } = await supabase
      .from('metricas')
      .select('*')
      .eq('tipo', 'funil')
      .eq('referencia_id', funil.id)
      .gte('periodo_inicio', filtros.periodo_inicio)
      .lte('periodo_fim', filtros.periodo_fim);

    const metricasAgregadasFunil = agregarMetricas(metricasFunil || []);

    const itemFunil: HierarquiaItem = {
      id: funil.id,
      nome: funil.nome,
      tipo: 'funil',
      nivel: 0,
      metricas: metricasAgregadasFunil,
      status_performance: calcularStatusPerformance(metricasAgregadasFunil.roas, metricasAgregadasFunil.ctr),
      children: [],
      expandido: true,
    };

    // Adicionar campanhas
    if (funil.campanhas) {
      for (const campanha of funil.campanhas) {
        const { data: metricasCampanha } = await supabase
          .from('metricas')
          .select('*')
          .eq('tipo', 'campanha')
          .eq('referencia_id', campanha.id)
          .gte('periodo_inicio', filtros.periodo_inicio)
          .lte('periodo_fim', filtros.periodo_fim);

        const metricasAgregadasCampanha = agregarMetricas(metricasCampanha || []);

        const itemCampanha: HierarquiaItem = {
          id: campanha.id,
          nome: campanha.nome,
          tipo: 'campanha',
          nivel: 1,
          parent_id: funil.id,
          metricas: metricasAgregadasCampanha,
          status_performance: calcularStatusPerformance(metricasAgregadasCampanha.roas, metricasAgregadasCampanha.ctr),
          children: [],
          expandido: false,
        };

        itemFunil.children?.push(itemCampanha);
      }
    }

    hierarquia.push(itemFunil);
  }

  return hierarquia;
}

// Buscar comparativo de criativos
async function buscarComparativoCriativos(supabase: any, conjuntoId: string, filtros: FiltrosDashboard) {
  const { data: criativos } = await supabase
    .from('criativos')
    .select('*')
    .eq('conjunto_id', conjuntoId)
    .eq('ativo', true);

  if (!criativos) return [];

  const comparativo = [];
  
  for (const criativo of criativos) {
    const { data: metricas } = await supabase
      .from('metricas')
      .select('*')
      .eq('tipo', 'criativo')
      .eq('referencia_id', criativo.id)
      .gte('periodo_inicio', filtros.periodo_inicio)
      .lte('periodo_fim', filtros.periodo_fim);

    comparativo.push({
      criativo,
      metricas: agregarMetricas(metricas || [])
    });
  }

  return comparativo.sort((a, b) => b.metricas.roas - a.metricas.roas);
}

// Utilitários
function calcularStatusPerformance(roas: number, ctr: number): 'excelente' | 'bom' | 'medio' | 'ruim' {
  if (roas >= 3 && ctr >= 2) return 'excelente';
  if (roas >= 2 && ctr >= 1.5) return 'bom';
  if (roas >= 1.5 && ctr >= 1) return 'medio';
  return 'ruim';
}

function getCurrentDate(): string {
  return new Date().toISOString().split('T')[0];
}

function getDateDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
}

function gerarDiasPeriodo(inicio: string, fim: string): string[] {
  const dias = [];
  const dataInicio = new Date(inicio);
  const dataFim = new Date(fim);
  
  for (let d = new Date(dataInicio); d <= dataFim; d.setDate(d.getDate() + 1)) {
    dias.push(d.toISOString().split('T')[0]);
  }
  
  return dias;
}
