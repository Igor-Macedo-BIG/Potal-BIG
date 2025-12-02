import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    
    // Verificar autenticação
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get('tipo');
    const referenciaId = searchParams.get('referencia_id');
    const periodoInicio = searchParams.get('periodo_inicio');
    const periodoFim = searchParams.get('periodo_fim');

    // Query base
    let query = supabase
      .from('metricas')
      .select('*')
      .order('periodo_inicio', { ascending: false });

    // Aplicar filtros
    if (tipo) query = query.eq('tipo', tipo);
    if (referenciaId) query = query.eq('referencia_id', referenciaId);
    if (periodoInicio) query = query.gte('periodo_inicio', periodoInicio);
    if (periodoFim) query = query.lte('periodo_fim', periodoFim);

    const { data: metricas, error } = await query;

    if (error) {
      console.error('Erro ao buscar métricas:', error);
      return NextResponse.json({ error: 'Erro ao buscar métricas' }, { status: 500 });
    }

    return NextResponse.json(metricas);

  } catch (error) {
    console.error('Erro na API métricas:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // Verificar autenticação
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const metricaData = await request.json();

    const {
      tipo,
      referencia_id,
      periodo_inicio,
      periodo_fim,
      alcance = 0,
      impressoes = 0,
      cliques = 0,
      visualizacoes_pagina = 0,
      leads = 0,
      checkouts = 0,
      vendas = 0,
      investimento = 0,
      faturamento = 0
    } = metricaData;

    if (!tipo || !referencia_id || !periodo_inicio || !periodo_fim) {
      return NextResponse.json({ 
        error: 'Tipo, referencia_id, periodo_inicio e periodo_fim são obrigatórios' 
      }, { status: 400 });
    }

    // Inserir ou atualizar métrica (upsert)
    const { data: metrica, error } = await supabase
      .from('metricas')
      .upsert({
        tipo,
        referencia_id,
        periodo_inicio,
        periodo_fim,
        alcance,
        impressoes,
        cliques,
        visualizacoes_pagina,
        leads,
        checkouts,
        vendas,
        investimento,
        faturamento
      }, {
        onConflict: 'tipo,referencia_id,periodo_inicio,periodo_fim'
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar/atualizar métrica:', error);
      return NextResponse.json({ error: 'Erro ao salvar métrica' }, { status: 500 });
    }

    return NextResponse.json(metrica, { status: 201 });

  } catch (error) {
    console.error('Erro na API métricas:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// Endpoint específico para inserção em lote (batch)
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Verificar autenticação
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { metricas } = await request.json();

    if (!Array.isArray(metricas) || metricas.length === 0) {
      return NextResponse.json({ error: 'Array de métricas é obrigatório' }, { status: 400 });
    }

    // Inserir métricas em lote
    const { data, error } = await supabase
      .from('metricas')
      .upsert(metricas, {
        onConflict: 'tipo,referencia_id,periodo_inicio,periodo_fim'
      })
      .select();

    if (error) {
      console.error('Erro ao inserir métricas em lote:', error);
      return NextResponse.json({ error: 'Erro ao salvar métricas' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: `${data?.length || 0} métricas salvas com sucesso`,
      data 
    });

  } catch (error) {
    console.error('Erro na API métricas (lote):', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
