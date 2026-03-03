/**
 * API Route: Typebot Integration Config
 * 
 * GET  - Lista integracoes Typebot da empresa
 * POST - Cria/atualiza integracao Typebot
 * DELETE - Remove integracao Typebot
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { getOrCreateUsuario, resolveEmpresaId } from '@/lib/get-usuario';

// GET - Listar integracoes
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });

    const usuario = await getOrCreateUsuario(supabase, session.user.id, session.user.email || '');
    if (!usuario) return NextResponse.json({ error: 'Usuario nao encontrado' }, { status: 404 });

    const empresaId = resolveEmpresaId(usuario, request.url);
    if (!empresaId) return NextResponse.json({ integracoes: [] });

    const { data: integracoes, error } = await supabase
      .from('integracoes_typebot')
      .select(`
        id, nome, typebot_id, ativo,
        variavel_nome, variavel_email, base_url, funil_id,
        ultima_sincronizacao, erro_sincronizacao,
        total_sincronizados, created_at, updated_at
      `)
      .eq('empresa_id', empresaId)
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ integracoes: integracoes || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Criar ou atualizar integracao
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });

    const usuario = await getOrCreateUsuario(supabase, session.user.id, session.user.email || '');
    if (!usuario) return NextResponse.json({ error: 'Usuario nao encontrado' }, { status: 404 });

    const empresaId = resolveEmpresaId(usuario, request.url);
    if (!empresaId) return NextResponse.json({ error: 'Selecione uma empresa' }, { status: 400 });

    const body = await request.json().catch(() => ({}));
    const { id, nome, typebot_id, api_token, ativo, variavel_nome, variavel_email, base_url, funil_id } = body;

    if (id) {
      const updatePayload: Record<string, any> = { updated_at: new Date().toISOString() };
      if (nome !== undefined) updatePayload.nome = nome;
      if (typebot_id !== undefined) updatePayload.typebot_id = typebot_id;
      if (api_token !== undefined) updatePayload.api_token = api_token;
      if (ativo !== undefined) updatePayload.ativo = ativo;
      if (variavel_nome !== undefined) updatePayload.variavel_nome = variavel_nome;
      if (variavel_email !== undefined) updatePayload.variavel_email = variavel_email;
      if (base_url !== undefined) updatePayload.base_url = base_url || null;
      if (funil_id !== undefined) updatePayload.funil_id = funil_id || null;

      const { data, error } = await supabase
        .from('integracoes_typebot')
        .update(updatePayload)
        .eq('id', id)
        .eq('empresa_id', empresaId)
        .select()
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ integracao: data });
    } else {
      if (!typebot_id || !api_token) {
        return NextResponse.json(
          { error: 'typebot_id e api_token sao obrigatorios' },
          { status: 400 }
        );
      }

      const { data, error } = await supabase
        .from('integracoes_typebot')
        .insert({
          empresa_id: empresaId,
          nome: nome || 'Typebot Principal',
          typebot_id,
          api_token,
          base_url: base_url || null,
          funil_id: funil_id || null,
          ativo: true,
          variavel_nome: variavel_nome || 'Nome',
          variavel_email: variavel_email || 'Email',
        })
        .select()
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ integracao: data }, { status: 201 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Remover integracao
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });

    const usuario = await getOrCreateUsuario(supabase, session.user.id, session.user.email || '');
    if (!usuario) return NextResponse.json({ error: 'Usuario nao encontrado' }, { status: 404 });

    const empresaId = resolveEmpresaId(usuario, request.url);
    if (!empresaId) return NextResponse.json({ error: 'Selecione uma empresa' }, { status: 400 });

    const { searchParams } = new URL(request.url);
    const integracaoId = searchParams.get('id');

    if (!integracaoId) {
      return NextResponse.json({ error: 'ID da integracao e obrigatorio' }, { status: 400 });
    }

    const { error } = await supabase
      .from('integracoes_typebot')
      .delete()
      .eq('id', integracaoId)
      .eq('empresa_id', empresaId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
