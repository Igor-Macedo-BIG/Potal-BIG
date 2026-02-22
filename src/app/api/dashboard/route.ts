import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { cookies } from 'next/headers';
import type { 
  DashboardResponse, 
  FiltrosDashboard, 
  MetricasAgregadas,
  HierarquiaItem 
} from '@/types/hierarchical';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
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
      query = query.eq('tipo', 'anuncio').eq('referencia_id', filtros.criativo_id);
    } else if (filtros.conjunto_id) {
      query = query.eq('tipo', 'conjunto').eq('referencia_id', filtros.conjunto_id);
    } else if (filtros.campanha_id) {
      query = query.eq('tipo', 'campanha').eq('referencia_id', filtros.campanha_id);
    } else if (filtros.funil_id) {
      // Para um funil específico: buscar métricas das campanhas do funil
      // E TAMBÉM métricas tipo='funil' (detalhe_sdr do Typebot)
      const { data: campanhasFunil } = await supabase
        .from('campanhas')
        .select('id')
        .eq('funil_id', filtros.funil_id);
      
      const campanhaIds = campanhasFunil?.map(c => c.id) || [];
      // Incluir tanto campanhas do funil quanto o proprio funil (para detalhe_sdr)
      const todosRefs = [...campanhaIds, filtros.funil_id];
      query = query.in('referencia_id', todosRefs);
    } else {
      // Top-level: agregar TODAS as campanhas da empresa com meta_id
      // (campaigs vindas do Meta sync) + campanhas em funils
      const { data: campanhasEmpresa } = await supabase
        .from('campanhas')
        .select('id')
        .eq('empresa_id', filtros.empresa_id);

      if (campanhasEmpresa && campanhasEmpresa.length > 0) {
        const campanhaIds = campanhasEmpresa.map(c => c.id);
        query = query.eq('tipo', 'campanha').in('referencia_id', campanhaIds);
      } else {
        // Fallback: métricas de funil (dados manuais legados)
        const { data: funis } = await supabase
          .from('funis')
          .select('id')
          .eq('empresa_id', filtros.empresa_id);
        
        if (funis && funis.length > 0) {
          const funilIds = funis.map(f => f.id);
          query = query.eq('tipo', 'funil').in('referencia_id', funilIds);
        }
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

// Buscar série temporal com dados reais do banco
async function buscarSeriesTempo(supabase: any, filtros: FiltrosDashboard) {
  // Determinar quais referencia_ids buscar (mesma lógica do filtro principal)
  let referenciaIds: string[] = [];
  let tipoMetrica = 'campanha';

  if (filtros.criativo_id) {
    referenciaIds = [filtros.criativo_id];
    tipoMetrica = 'anuncio';
  } else if (filtros.conjunto_id) {
    referenciaIds = [filtros.conjunto_id];
    tipoMetrica = 'conjunto';
  } else if (filtros.campanha_id) {
    referenciaIds = [filtros.campanha_id];
    tipoMetrica = 'campanha';
  } else if (filtros.funil_id) {
    const { data: campanhasFunil } = await supabase
      .from('campanhas')
      .select('id')
      .eq('funil_id', filtros.funil_id);
    // Incluir campanhas do funil + o proprio funil (metricas Typebot)
    referenciaIds = [...(campanhasFunil || []).map((c: any) => c.id), filtros.funil_id];
    // Nao filtrar por tipo aqui — pode ter campanha e funil
    tipoMetrica = '';
  } else {
    const { data: campanhasEmpresa } = await supabase
      .from('campanhas')
      .select('id')
      .eq('empresa_id', filtros.empresa_id);
    referenciaIds = (campanhasEmpresa || []).map((c: any) => c.id);
    tipoMetrica = 'campanha';
  }

  if (referenciaIds.length === 0) return [];

  // Buscar métricas diárias no período
  let queryGrafico = supabase
    .from('metricas')
    .select('periodo_inicio, investimento, leads, vendas, cliques, alcance')
    .in('referencia_id', referenciaIds)
    .gte('periodo_inicio', filtros.periodo_inicio)
    .lte('periodo_inicio', filtros.periodo_fim)
    .order('periodo_inicio', { ascending: true });

  // Filtrar por tipo apenas se definido (quando filtra por funil, pode ter ambos)
  if (tipoMetrica) {
    queryGrafico = queryGrafico.eq('tipo', tipoMetrica);
  }

  const { data: metricas } = await queryGrafico;

  if (!metricas || metricas.length === 0) return [];

  // Agrupar por dia (há uma row por campanha por dia)
  const porDia = new Map<string, {
    investimento: number; leads: number; vendas: number; cliques: number; alcance: number;
  }>();

  for (const m of metricas) {
    const dia = m.periodo_inicio;
    const atual = porDia.get(dia) || { investimento: 0, leads: 0, vendas: 0, cliques: 0, alcance: 0 };
    porDia.set(dia, {
      investimento: atual.investimento + (m.investimento || 0),
      leads: atual.leads + (m.leads || 0),
      vendas: atual.vendas + (m.vendas || 0),
      cliques: atual.cliques + (m.cliques || 0),
      alcance: atual.alcance + (m.alcance || 0),
    });
  }

  return Array.from(porDia.entries())
    .map(([data, vals]) => ({ data, ...vals }))
    .sort((a, b) => a.data.localeCompare(b.data));
}

// Buscar hierarquia completa sem embedded FK joins (evita PGRST200)
// Estrutura: Funil > Campanha > Conjunto > Anúncio
async function buscarHierarquia(supabase: any, filtros: FiltrosDashboard): Promise<HierarquiaItem[]> {
  // ──────────────────────────────────────────────────────────────────
  // 1. Buscar todas as entidades (queries paralelas)
  // ──────────────────────────────────────────────────────────────────
  const [funisRes, campanhasEmpresaRes] = await Promise.all([
    supabase
      .from('funis')
      .select('id, nome')
      .eq('empresa_id', filtros.empresa_id)
      .eq('ativo', true)
      .order('nome'),
    supabase
      .from('campanhas')
      .select('id, nome, tipo, funil_id, ativo')
      .eq('empresa_id', filtros.empresa_id)
      .order('nome'),
  ]);

  const funis: any[] = funisRes.data || [];
  const todasCampanhas: any[] = campanhasEmpresaRes.data || [];

  if (todasCampanhas.length === 0) return [];

  const campanhaIds = todasCampanhas.map((c: any) => c.id);

  // Buscar conjuntos e anúncios (queries paralelas)
  const [conjuntosRes, anunciosRes] = await Promise.all([
    supabase
      .from('conjuntos_anuncio')
      .select('id, nome, publico, ativo, campanha_id')
      .in('campanha_id', campanhaIds)
      .order('nome'),
    supabase
      .from('anuncios')
      .select('id, nome, tipo, conjunto_anuncio_id')
      .order('nome'),
  ]);

  const todosConjuntos: any[] = conjuntosRes.data || [];
  const todosAnuncios: any[] = anunciosRes.data || [];

  // Filtrar anúncios apenas dos conjuntos que pertencem às campanhas da empresa
  const conjuntoIds = new Set(todosConjuntos.map((c: any) => c.id));
  const anuncios = todosAnuncios.filter((a: any) => conjuntoIds.has(a.conjunto_anuncio_id));
  const anuncioIds = anuncios.map((a: any) => a.id);

  // ──────────────────────────────────────────────────────────────────
  // 2. Buscar TODAS as métricas de uma vez (evita N+1)
  // ──────────────────────────────────────────────────────────────────
  const todosIds = [
    ...campanhaIds,
    ...todosConjuntos.map((c: any) => c.id),
    ...anuncioIds,
  ];

  const { data: todasMetricas } = await supabase
    .from('metricas')
    .select('tipo, referencia_id, alcance, impressoes, cliques, visualizacoes_pagina, leads, checkouts, vendas, investimento, faturamento, roas, ctr, cpm, cpc, cpl, taxa_conversao')
    .in('referencia_id', todosIds)
    .in('tipo', ['campanha', 'conjunto', 'anuncio'])
    .gte('periodo_inicio', filtros.periodo_inicio)
    .lte('periodo_fim', filtros.periodo_fim);

  // Indexar métricas por "tipo:referencia_id"
  const metricasIdx = new Map<string, any[]>();
  for (const m of (todasMetricas || [])) {
    const key = `${m.tipo}:${m.referencia_id}`;
    if (!metricasIdx.has(key)) metricasIdx.set(key, []);
    metricasIdx.get(key)!.push(m);
  }

  const getMetricas = (tipo: string, id: string) =>
    agregarMetricas(metricasIdx.get(`${tipo}:${id}`) || []);

  // ──────────────────────────────────────────────────────────────────
  // 3. Indexar entidades por pai
  // ──────────────────────────────────────────────────────────────────
  const campanhasPorFunil = new Map<string | null, any[]>();
  for (const c of todasCampanhas) {
    const key = c.funil_id || '__sem_funil__';
    if (!campanhasPorFunil.has(key)) campanhasPorFunil.set(key, []);
    campanhasPorFunil.get(key)!.push(c);
  }

  const conjuntosPorCampanha = new Map<string, any[]>();
  for (const c of todosConjuntos) {
    if (!conjuntosPorCampanha.has(c.campanha_id)) conjuntosPorCampanha.set(c.campanha_id, []);
    conjuntosPorCampanha.get(c.campanha_id)!.push(c);
  }

  const anunciosPorConjunto = new Map<string, any[]>();
  for (const a of anuncios) {
    if (!anunciosPorConjunto.has(a.conjunto_anuncio_id)) anunciosPorConjunto.set(a.conjunto_anuncio_id, []);
    anunciosPorConjunto.get(a.conjunto_anuncio_id)!.push(a);
  }

  // ──────────────────────────────────────────────────────────────────
  // 4. Construir árvore
  // ──────────────────────────────────────────────────────────────────
  const hierarquia: HierarquiaItem[] = [];

  // Helper: monta children de uma campanha (conjuntos + anúncios)
  const buildCampanhaChildren = (campanhaId: string): HierarquiaItem[] => {
    return (conjuntosPorCampanha.get(campanhaId) || []).map((cj: any) => {
      const metCj = getMetricas('conjunto', cj.id);
      const conjItem: HierarquiaItem = {
        id: cj.id,
        nome: cj.nome,
        tipo: 'conjunto',
        nivel: 2,
        parent_id: campanhaId,
        metricas: metCj,
        status_performance: calcularStatusPerformance(metCj.roas, metCj.ctr),
        expandido: false,
        children: (anunciosPorConjunto.get(cj.id) || []).map((an: any) => {
          const metAn = getMetricas('anuncio', an.id);
          return {
            id: an.id,
            nome: an.nome,
            tipo: 'conjunto' as const, // ad level — reusa tipo para compatibilidade
            nivel: 3,
            parent_id: cj.id,
            metricas: metAn,
            status_performance: calcularStatusPerformance(metAn.roas, metAn.ctr),
            expandido: false,
            children: [],
          } as HierarquiaItem;
        }),
      };
      return conjItem;
    });
  };

  // ── Funis com campanhas vinculadas ──────────────────────────────
  for (const funil of funis) {
    const campanhasFunil = campanhasPorFunil.get(funil.id) || [];

    const campanhaItems: HierarquiaItem[] = campanhasFunil.map((c: any) => {
      const metC = getMetricas('campanha', c.id);
      return {
        id: c.id,
        nome: c.nome,
        tipo: 'campanha',
        nivel: 1,
        parent_id: funil.id,
        metricas: metC,
        status_performance: calcularStatusPerformance(metC.roas, metC.ctr),
        expandido: false,
        children: buildCampanhaChildren(c.id),
      } as HierarquiaItem;
    });

    // Métricas do funil = soma das campanhas filhas
    const metricasFunilAgregadas = agregarMetricas(
      campanhaItems.map((ci) => ci.metricas as any)
    );

    hierarquia.push({
      id: funil.id,
      nome: funil.nome,
      tipo: 'funil',
      nivel: 0,
      metricas: metricasFunilAgregadas,
      status_performance: calcularStatusPerformance(metricasFunilAgregadas.roas, metricasFunilAgregadas.ctr),
      expandido: true,
      children: campanhaItems,
    });
  }

  // ── Campanhas sem funil ("Sem funil") ───────────────────────────
  const campanhasSemFunil = campanhasPorFunil.get('__sem_funil__') || [];
  if (campanhasSemFunil.length > 0) {
    const campanhaItems: HierarquiaItem[] = campanhasSemFunil.map((c: any) => {
      const metC = getMetricas('campanha', c.id);
      return {
        id: c.id,
        nome: c.nome,
        tipo: 'campanha',
        nivel: 1,
        parent_id: '__sem_funil__',
        metricas: metC,
        status_performance: calcularStatusPerformance(metC.roas, metC.ctr),
        expandido: false,
        children: buildCampanhaChildren(c.id),
      } as HierarquiaItem;
    });

    const metSemFunil = agregarMetricas(campanhaItems.map((ci) => ci.metricas as any));

    hierarquia.push({
      id: '__sem_funil__',
      nome: '📂 Sem funil vinculado',
      tipo: 'funil',
      nivel: 0,
      metricas: metSemFunil,
      status_performance: calcularStatusPerformance(metSemFunil.roas, metSemFunil.ctr),
      expandido: true,
      children: campanhaItems,
    });
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
      .eq('tipo', 'anuncio')
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
