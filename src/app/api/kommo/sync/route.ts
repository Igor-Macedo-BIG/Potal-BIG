/**
 * API Route: Kommo Sync
 * 
 * POST - Dispara sincronização de leads
 * GET  - Lista histórico de logs de sincronização
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { getOrCreateUsuario } from '@/lib/get-usuario';
import { syncKommoToSupabase } from '@/lib/kommo-sync';
import type { IntegracaoKommo, KommoPipeline } from '@/types/hierarchical';

// POST - Executar sincronização
export async function POST(request: NextRequest) {
  const iniciadoEm = new Date().toISOString();

  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const usuario = await getOrCreateUsuario(supabase, session.user.id, session.user.email || '');
    if (!usuario) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });

    const body = await request.json().catch(() => ({}));
    const { integracao_id, pipeline_id, dataInicio, dataFim } = body;

    if (!integracao_id) {
      return NextResponse.json({ error: 'integracao_id é obrigatório' }, { status: 400 });
    }

    // Buscar integração
    const { data: integracao, error: errInteg } = await supabase
      .from('integracoes_kommo')
      .select('*')
      .eq('id', integracao_id)
      .eq('empresa_id', usuario.empresa_id)
      .eq('ativo', true)
      .single();

    if (errInteg || !integracao) {
      return NextResponse.json({ error: 'Integração não encontrada ou inativa' }, { status: 404 });
    }

    // Buscar pipelines ativas para sincronizar
    let queryPipelines = supabase
      .from('kommo_pipelines')
      .select('*')
      .eq('integracao_id', integracao_id)
      .eq('ativo', true);

    if (pipeline_id) {
      queryPipelines = queryPipelines.eq('id', pipeline_id);
    }

    const { data: pipelines, error: errPipelines } = await queryPipelines;

    if (errPipelines || !pipelines || pipelines.length === 0) {
      return NextResponse.json(
        { error: 'Nenhuma pipeline ativa encontrada' },
        { status: 404 }
      );
    }

    const resultados = [];

    for (const pipeline of pipelines) {
      // Criar log de início
      const { data: logInserido } = await supabase
        .from('sync_logs_kommo')
        .insert({
          empresa_id: usuario.empresa_id,
          integracao_id: integracao_id,
          pipeline_id_kommo: pipeline.pipeline_id_kommo,
          status: 'running',
          periodo_inicio: dataInicio || null,
          periodo_fim: dataFim || null,
          iniciado_em: iniciadoEm,
        })
        .select('id')
        .single();

      const logId = logInserido?.id;

      try {
        const options = dataInicio && dataFim ? { dataInicio, dataFim } : undefined;

        const resultado = await syncKommoToSupabase(
          supabase,
          integracao as IntegracaoKommo,
          pipeline as KommoPipeline,
          options
        );

        // Atualizar log com sucesso
        if (logId) {
          await supabase
            .from('sync_logs_kommo')
            .update({
              status: resultado.erros.length > 0 ? 'partial' : 'success',
              total_leads: resultado.total_leads,
              leads_por_estagio: resultado.leads_por_estagio.map((e) => ({
                stage_id: e.stage_id,
                stage_nome: e.stage_nome,
                quantidade: e.quantidade,
                valor: e.valor,
              })),
              erro_detalhe: resultado.erros.length > 0 ? resultado.erros.join('; ') : null,
              detalhes: {
                erros_departamento: resultado.erros_departamento,
              },
              finalizado_em: new Date().toISOString(),
            })
            .eq('id', logId);
        }

        resultados.push({
          pipeline: pipeline.nome,
          pipeline_id_kommo: pipeline.pipeline_id_kommo,
          ...resultado,
        });
      } catch (err: any) {
        // Atualizar log com erro
        if (logId) {
          await supabase
            .from('sync_logs_kommo')
            .update({
              status: 'error',
              erro_detalhe: err.message,
              finalizado_em: new Date().toISOString(),
            })
            .eq('id', logId);
        }

        resultados.push({
          pipeline: pipeline.nome,
          pipeline_id_kommo: pipeline.pipeline_id_kommo,
          total_leads: 0,
          leads_por_estagio: [],
          erros: [err.message],
          erros_departamento: [],
        });
      }
    }

    return NextResponse.json({
      resultados,
      total_pipelines: pipelines.length,
      sincronizado_em: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET - Histórico de logs
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const usuario = await getOrCreateUsuario(supabase, session.user.id, session.user.email || '');
    if (!usuario) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });

    const { searchParams } = new URL(request.url);
    const integracaoId = searchParams.get('integracao_id');
    const limite = parseInt(searchParams.get('limit') || '20');

    let query = supabase
      .from('sync_logs_kommo')
      .select('*')
      .eq('empresa_id', usuario.empresa_id)
      .order('iniciado_em', { ascending: false })
      .limit(limite);

    if (integracaoId) {
      query = query.eq('integracao_id', integracaoId);
    }

    const { data: logs, error } = await query;

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ logs: logs || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
