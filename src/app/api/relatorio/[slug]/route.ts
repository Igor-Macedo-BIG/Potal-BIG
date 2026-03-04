import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Cliente Supabase sem cookies (endpoint público)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const toNum = (v: any) => (v === null || v === undefined ? 0 : Number(v));

function agregarMetricas(metricasArray: any[]) {
  const agregado = (metricasArray || []).reduce(
    (acc, m) => ({
      alcance: acc.alcance + toNum(m.alcance),
      impressoes: acc.impressoes + toNum(m.impressoes),
      cliques: acc.cliques + toNum(m.cliques),
      visualizacoes_pagina: acc.visualizacoes_pagina + toNum(m.visualizacoes_pagina),
      leads: acc.leads + toNum(m.leads),
      leads_whatsapp: acc.leads_whatsapp + toNum(m.leads_whatsapp),
      leads_messenger: acc.leads_messenger + toNum(m.leads_messenger),
      mensagens: acc.mensagens + toNum(m.mensagens),
      checkouts: acc.checkouts + toNum(m.checkouts),
      vendas: acc.vendas + toNum(m.vendas),
      investimento: acc.investimento + toNum(m.investimento),
      faturamento: acc.faturamento + toNum(m.faturamento),
      visitas_perfil: acc.visitas_perfil + toNum(m.visitas_perfil),
      video_views: acc.video_views + toNum(m.video_views),
    }),
    { alcance: 0, impressoes: 0, cliques: 0, visualizacoes_pagina: 0, leads: 0, leads_whatsapp: 0, leads_messenger: 0, mensagens: 0, checkouts: 0, vendas: 0, investimento: 0, faturamento: 0, visitas_perfil: 0, video_views: 0 }
  );

  // Combinar tudo em WhatsApp (dados antigos podem estar em leads_messenger)
  agregado.leads_whatsapp = agregado.leads_whatsapp + agregado.leads_messenger;
  agregado.leads_messenger = 0;
  agregado.mensagens = agregado.leads_whatsapp;

  // Derivadas
  const metricas: Record<string, number> = {
    ...agregado,
    roas: agregado.investimento > 0 ? parseFloat((agregado.faturamento / agregado.investimento).toFixed(2)) : 0,
    ctr: agregado.impressoes > 0 ? parseFloat(((agregado.cliques / agregado.impressoes) * 100).toFixed(2)) : 0,
    cpm: agregado.impressoes > 0 ? parseFloat(((agregado.investimento / agregado.impressoes) * 1000).toFixed(2)) : 0,
    cpc: agregado.cliques > 0 ? parseFloat((agregado.investimento / agregado.cliques).toFixed(2)) : 0,
    cpl: agregado.leads > 0 ? parseFloat((agregado.investimento / agregado.leads).toFixed(2)) : 0,
    custo_por_mensagem: agregado.mensagens > 0 ? parseFloat((agregado.investimento / agregado.mensagens).toFixed(2)) : 0,
    custo_por_visita_perfil: agregado.visitas_perfil > 0 ? parseFloat((agregado.investimento / agregado.visitas_perfil).toFixed(2)) : 0,
  };

  return metricas;
}

const SELECT_FIELDS = 'alcance, impressoes, cliques, visualizacoes_pagina, leads, leads_whatsapp, leads_messenger, mensagens, checkouts, vendas, investimento, faturamento, visitas_perfil, video_views';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Buscar empresa pelo slug
    const { data: empresa, error: empresaError } = await supabase
      .from('empresas')
      .select('id, nome, logo_url, slug_relatorio')
      .eq('slug_relatorio', slug)
      .single();

    if (empresaError || !empresa) {
      return NextResponse.json({ error: 'Relatório não encontrado' }, { status: 404 });
    }

    // 2. Buscar configuração de métricas visíveis
    const { data: configs } = await supabase
      .from('relatorio_config')
      .select('metrica_key, nome_display, visivel, ordem')
      .eq('empresa_id', empresa.id)
      .eq('visivel', true)
      .order('ordem', { ascending: true });

    // 3. Buscar campanhas da empresa
    const { data: campanhas } = await supabase
      .from('campanhas')
      .select('id')
      .eq('empresa_id', empresa.id);

    const campanhaIds = (campanhas || []).map(c => c.id);

    if (campanhaIds.length === 0) {
      return NextResponse.json({
        empresa: { nome: empresa.nome, logo_url: empresa.logo_url },
        metricas: {},
        metricas_anterior: null,
        configs: configs || [],
        periodo: { inicio: '', fim: '', dias: 0 },
      });
    }

    // 4. Período: query params ?inicio=YYYY-MM-DD&fim=YYYY-MM-DD ou ?periodo=N
    const inicioParam = request.nextUrl.searchParams.get('inicio');
    const fimParam = request.nextUrl.searchParams.get('fim');
    const periodoParam = request.nextUrl.searchParams.get('periodo') || '30';
    
    let dataInicio: string;
    let dataFim: string;
    let dias: number;

    if (inicioParam && fimParam) {
      dataInicio = inicioParam;
      dataFim = fimParam;
      const msPerDay = 24 * 60 * 60 * 1000;
      dias = Math.round((new Date(dataFim).getTime() - new Date(dataInicio).getTime()) / msPerDay) + 1;
    } else {
      dias = parseInt(periodoParam, 10) || 30;
      const hoje = new Date();
      const inicio = new Date(hoje);
      inicio.setDate(hoje.getDate() - dias + 1);
      dataInicio = inicio.toISOString().split('T')[0];
      dataFim = hoje.toISOString().split('T')[0];
    }

    // 5. Buscar métricas do período atual
    const { data: metricasArray } = await supabase
      .from('metricas')
      .select(SELECT_FIELDS)
      .eq('tipo', 'campanha')
      .in('referencia_id', campanhaIds)
      .gte('periodo_inicio', dataInicio)
      .lte('periodo_inicio', dataFim);

    const metricas = agregarMetricas(metricasArray || []);
    
    // Adicionar média diária de mensagens
    metricas.media_diaria_mensagens = dias > 0 ? parseFloat((metricas.mensagens / dias).toFixed(1)) : 0;

    // 6. Buscar métricas do período anterior (comparação)
    const msPerDay = 24 * 60 * 60 * 1000;
    const prevFim = new Date(new Date(dataInicio).getTime() - msPerDay);
    const prevInicio = new Date(prevFim.getTime() - (dias - 1) * msPerDay);
    const prevInicioStr = prevInicio.toISOString().split('T')[0];
    const prevFimStr = prevFim.toISOString().split('T')[0];

    const { data: metricasAntArray } = await supabase
      .from('metricas')
      .select(SELECT_FIELDS)
      .eq('tipo', 'campanha')
      .in('referencia_id', campanhaIds)
      .gte('periodo_inicio', prevInicioStr)
      .lte('periodo_inicio', prevFimStr);

    let metricas_anterior: Record<string, number> | null = null;
    if (metricasAntArray && metricasAntArray.length > 0) {
      metricas_anterior = agregarMetricas(metricasAntArray);
      metricas_anterior.media_diaria_mensagens = dias > 0 ? parseFloat((metricas_anterior.mensagens / dias).toFixed(1)) : 0;
    }

    // 7. Buscar feedbacks de performance que intersectem o período
    const { data: feedbacks } = await supabase
      .from('feedbacks_performance')
      .select('id, tipo, titulo, conteudo, periodo_inicio, periodo_fim, created_at')
      .eq('empresa_id', empresa.id)
      .lte('periodo_inicio', dataFim)
      .gte('periodo_fim', dataInicio)
      .order('periodo_inicio', { ascending: false });

    return NextResponse.json({
      empresa: { nome: empresa.nome, logo_url: empresa.logo_url },
      metricas,
      metricas_anterior,
      configs: configs || [],
      periodo: { inicio: dataInicio, fim: dataFim, dias },
      feedbacks: feedbacks || [],
    });

  } catch (error) {
    console.error('[API Relatorio Slug]', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
