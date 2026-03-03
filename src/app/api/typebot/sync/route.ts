/**
 * API Route: Typebot Sync
 * 
 * POST - Sincroniza resultados do Typebot para o período especificado
 * GET  - Lista histórico de sincronizações
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { syncTypebotToSupabase, IntegracaoTypebot } from '@/lib/typebot-sync';
import { getOrCreateUsuario, resolveEmpresaId } from '@/lib/get-usuario';

// POST - Executar sincronização
export async function POST(request: NextRequest) {
  const iniciadoEm = new Date().toISOString();

  try {
    const supabase = await createClient();

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const usuario = await getOrCreateUsuario(supabase, session.user.id, session.user.email || '');
    if (!usuario) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const empresaId = resolveEmpresaId(usuario, request.url);
    if (!empresaId) return NextResponse.json({ error: 'Selecione uma empresa' }, { status: 400 });

    const body = await request.json().catch(() => ({}));
    const { integracaoId, dataInicio, dataFim } = body;

    if (!dataInicio || !dataFim) {
      return NextResponse.json(
        { error: 'dataInicio e dataFim são obrigatórios (formato YYYY-MM-DD)' },
        { status: 400 }
      );
    }

    // Buscar integração(ões)
    let integracoes: IntegracaoTypebot[] = [];

    if (integracaoId) {
      const { data, error } = await supabase
        .from('integracoes_typebot')
        .select('*')
        .eq('id', integracaoId)
        .eq('empresa_id', empresaId)
        .eq('ativo', true)
        .single();

      if (error || !data) {
        return NextResponse.json({ error: 'Integração não encontrada' }, { status: 404 });
      }
      integracoes = [data];
    } else {
      const { data, error } = await supabase
        .from('integracoes_typebot')
        .select('*')
        .eq('empresa_id', empresaId)
        .eq('ativo', true);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      integracoes = data || [];
    }

    if (integracoes.length === 0) {
      return NextResponse.json(
        { error: 'Nenhuma integração Typebot ativa encontrada' },
        { status: 404 }
      );
    }

    // Executar sync para cada integração
    const resultados = [];

    for (const integracao of integracoes) {
      // Criar log de início
      const { data: logInserido } = await supabase
        .from('sync_logs_typebot')
        .insert({
          empresa_id: empresaId,
          integracao_id: integracao.id,
          status: 'running',
          periodo_inicio: dataInicio,
          periodo_fim: dataFim,
          iniciado_em: iniciadoEm,
        })
        .select('id')
        .single();

      const logId = logInserido?.id;

      try {
        const resultado = await syncTypebotToSupabase(supabase, integracao, {
          dataInicio,
          dataFim,
        });

        // Atualizar log com sucesso
        if (logId) {
          await supabase
            .from('sync_logs_typebot')
            .update({
              status: resultado.erros.length > 0 ? 'partial' : 'success',
              total_resultados: resultado.total_resultados,
              iniciados: resultado.iniciados,
              concluidos: resultado.concluidos,
              erro_detalhe: resultado.erros.length > 0 ? resultado.erros.join('; ') : null,
              detalhes: {
                nomes_concluidos_count: resultado.nomes_concluidos.length,
              },
              finalizado_em: new Date().toISOString(),
            })
            .eq('id', logId);
        }

        resultados.push({
          integracao_nome: integracao.nome,
          integracao_id: integracao.id,
          ...resultado,
        });
      } catch (syncError: any) {
        if (logId) {
          await supabase
            .from('sync_logs_typebot')
            .update({
              status: 'error',
              erro_detalhe: syncError.message,
              finalizado_em: new Date().toISOString(),
            })
            .eq('id', logId);
        }

        resultados.push({
          integracao_nome: integracao.nome,
          integracao_id: integracao.id,
          iniciados: 0,
          concluidos: 0,
          total_resultados: 0,
          erros: [syncError.message],
        });
      }
    }

    return NextResponse.json({ resultados });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET - Histórico de sincronizações
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const usuario = await getOrCreateUsuario(supabase, session.user.id, session.user.email || '');
    if (!usuario) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const empresaId = resolveEmpresaId(usuario, request.url);
    if (!empresaId) return NextResponse.json({ logs: [] });

    const { searchParams } = new URL(request.url);
    const integracaoId = searchParams.get('integracaoId');
    const limit = parseInt(searchParams.get('limit') || '20');

    let query = supabase
      .from('sync_logs_typebot')
      .select(`
        id,
        integracao_id,
        status,
        periodo_inicio,
        periodo_fim,
        total_resultados,
        iniciados,
        concluidos,
        erro_detalhe,
        iniciado_em,
        finalizado_em
      `)
      .eq('empresa_id', empresaId)
      .order('iniciado_em', { ascending: false })
      .limit(limit);

    if (integracaoId) {
      query = query.eq('integracao_id', integracaoId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ logs: data || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
