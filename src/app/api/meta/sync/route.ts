/**
 * API Route: Meta Sync
 * 
 * POST - Executa sincronização com Meta Marketing API
 *        Aceita integracaoId para sincronizar conta específica, ou sincroniza todas
 * GET - Busca status/histórico de sincronizações
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { syncMetaToSupabase, IntegracaoMeta } from '@/lib/meta-sync';
import { getOrCreateUsuario } from '@/lib/get-usuario';

// POST - Executar sincronização (uma conta específica ou todas)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const usuario = await getOrCreateUsuario(supabase, session.user.id, session.user.email || '');
    if (!usuario) {
      return NextResponse.json({ error: 'Não foi possível identificar o usuário' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const {
      integracaoId,
      syncCampaigns = true,
      syncAdSets = true,
      syncAds = true,
      syncInsights = true,
      datePreset = 'last_30d',
      timeRange,
      funilPadrao
    } = body;

    // Buscar integração(ões) ativa(s)
    let integracoes: IntegracaoMeta[] = [];

    if (integracaoId) {
      // Sincronizar conta específica
      const { data, error } = await supabase
        .from('integracoes_meta')
        .select('*')
        .eq('id', integracaoId)
        .eq('empresa_id', usuario.empresa_id)
        .eq('ativo', true)
        .maybeSingle();

      if (error || !data) {
        return NextResponse.json(
          { error: 'Integração não encontrada ou inativa.' },
          { status: 400 }
        );
      }
      integracoes = [data as IntegracaoMeta];
    } else {
      // Sincronizar TODAS as contas ativas
      const { data, error } = await supabase
        .from('integracoes_meta')
        .select('*')
        .eq('empresa_id', usuario.empresa_id)
        .eq('ativo', true);

      if (error || !data || data.length === 0) {
        return NextResponse.json(
          { error: 'Nenhuma integração com Meta configurada. Configure em Configurações > Meta Ads.' },
          { status: 400 }
        );
      }
      integracoes = data as IntegracaoMeta[];
    }

    const syncOptions = {
      syncCampaigns,
      syncAdSets,
      syncAds,
      syncInsights,
      datePreset,
      timeRange,
      funilPadrao,
      periodo_inicio: timeRange?.since || undefined
    };

    // Executar sincronização para cada conta
    const resultados = [];
    for (const integracao of integracoes) {
      try {
        const result = await syncMetaToSupabase(integracao, syncOptions);
        resultados.push({
          integracaoId: integracao.id,
          adAccountId: integracao.ad_account_id,
          sucesso: result.sucesso,
          resultado: {
            campanhas: result.campanhas,
            conjuntos: result.conjuntos,
            anuncios: result.anuncios,
            metricas: result.metricas,
            duracao: `${(result.duracao / 1000).toFixed(1)}s`
          },
          erros: result.erros.length > 0 ? result.erros : undefined
        });
      } catch (syncError) {
        const msg = syncError instanceof Error ? syncError.message : 'Erro desconhecido';
        resultados.push({
          integracaoId: integracao.id,
          adAccountId: integracao.ad_account_id,
          sucesso: false,
          erro: msg
        });
      }
    }

    const todosComSucesso = resultados.every(r => r.sucesso);

    // Se apenas 1 conta, retornar formato compatível com UI legada
    if (resultados.length === 1) {
      const r = resultados[0];
      return NextResponse.json({
        sucesso: r.sucesso,
        resultado: r.resultado || null,
        erros: r.erros || (r.erro ? [r.erro] : undefined)
      });
    }

    return NextResponse.json({
      sucesso: todosComSucesso,
      contasSincronizadas: resultados.length,
      resultados
    });

  } catch (error) {
    console.error('[API Meta Sync POST]', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// GET - Buscar histórico de sincronizações
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const usuario = await getOrCreateUsuario(supabase, session.user.id, session.user.email || '');
    if (!usuario) {
      return NextResponse.json({ error: 'Não foi possível identificar o usuário' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const integracaoId = searchParams.get('integracaoId');

    let query = supabase
      .from('sync_logs_meta')
      .select('*, integracoes_meta:integracao_id(ad_account_id)')
      .eq('empresa_id', usuario.empresa_id)
      .order('iniciado_em', { ascending: false })
      .limit(limit);

    // Filtrar por integração específica se fornecido
    if (integracaoId) {
      query = query.eq('integracao_id', integracaoId);
    }

    const { data: logs, error } = await query;

    if (error) {
      // Fallback sem join se falhar
      const { data: logsFallback, error: error2 } = await supabase
        .from('sync_logs_meta')
        .select('*')
        .eq('empresa_id', usuario.empresa_id)
        .order('iniciado_em', { ascending: false })
        .limit(limit);

      if (error2) {
        return NextResponse.json({ error: error2.message }, { status: 500 });
      }

      return NextResponse.json({
        logs: (logsFallback || []).map(log => ({
          id: log.id,
          tipo: log.tipo,
          status: log.status,
          integracaoId: log.integracao_id,
          adAccountId: null,
          registrosProcessados: log.registros_processados,
          registrosCriados: log.registros_criados,
          registrosAtualizados: log.registros_atualizados,
          erroDetalhe: log.erro_detalhe,
          iniciadoEm: log.iniciado_em,
          finalizadoEm: log.finalizado_em
        }))
      });
    }

    return NextResponse.json({
      logs: (logs || []).map((log: any) => ({
        id: log.id,
        tipo: log.tipo,
        status: log.status,
        integracaoId: log.integracao_id,
        adAccountId: log.integracoes_meta?.ad_account_id || null,
        registrosProcessados: log.registros_processados,
        registrosCriados: log.registros_criados,
        registrosAtualizados: log.registros_atualizados,
        erroDetalhe: log.erro_detalhe,
        iniciadoEm: log.iniciado_em,
        finalizadoEm: log.finalizado_em
      }))
    });

  } catch (error) {
    console.error('[API Meta Sync GET]', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
