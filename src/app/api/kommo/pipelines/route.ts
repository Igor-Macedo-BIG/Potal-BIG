/**
 * API Route: Kommo Pipelines Management
 * 
 * GET   - Lista pipelines de uma integração
 * POST  - Força re-sync de metadados das pipelines
 * PATCH - Atualiza mapeamento de departamentos e funil_id
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { getOrCreateUsuario } from '@/lib/get-usuario';
import { sincronizarPipelines } from '@/lib/kommo-sync';
import type { IntegracaoKommo } from '@/types/hierarchical';

// GET - Listar pipelines
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const usuario = await getOrCreateUsuario(supabase, session.user.id, session.user.email || '');
    if (!usuario) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });

    const { searchParams } = new URL(request.url);
    const integracaoId = searchParams.get('integracao_id');

    let query = supabase
      .from('kommo_pipelines')
      .select('*')
      .order('nome');

    if (integracaoId) {
      query = query.eq('integracao_id', integracaoId);
    }

    const { data: pipelines, error } = await query;

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ pipelines: pipelines || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Re-sync metadados das pipelines da Kommo
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const usuario = await getOrCreateUsuario(supabase, session.user.id, session.user.email || '');
    if (!usuario) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });

    const body = await request.json().catch(() => ({}));
    const { integracao_id } = body;

    if (!integracao_id) {
      return NextResponse.json({ error: 'integracao_id é obrigatório' }, { status: 400 });
    }

    // Buscar integração
    const { data: integracao, error: errInteg } = await supabase
      .from('integracoes_kommo')
      .select('*')
      .eq('id', integracao_id)
      .eq('empresa_id', usuario.empresa_id)
      .single();

    if (errInteg || !integracao) {
      return NextResponse.json({ error: 'Integração não encontrada' }, { status: 404 });
    }

    const result = await sincronizarPipelines(supabase, integracao as IntegracaoKommo);

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH - Atualizar mapeamento de departamentos ou funil_id
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const usuario = await getOrCreateUsuario(supabase, session.user.id, session.user.email || '');
    if (!usuario) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });

    const body = await request.json().catch(() => ({}));
    const { pipeline_id, mapeamento_departamentos, funil_id, ativo } = body;

    if (!pipeline_id) {
      return NextResponse.json({ error: 'pipeline_id é obrigatório' }, { status: 400 });
    }

    const updatePayload: Record<string, any> = { updated_at: new Date().toISOString() };

    if (mapeamento_departamentos !== undefined) {
      updatePayload.mapeamento_departamentos = mapeamento_departamentos;
    }
    if (funil_id !== undefined) {
      updatePayload.funil_id = funil_id || null;
    }
    if (ativo !== undefined) {
      updatePayload.ativo = ativo;
    }

    const { data, error } = await supabase
      .from('kommo_pipelines')
      .update(updatePayload)
      .eq('id', pipeline_id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ pipeline: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
