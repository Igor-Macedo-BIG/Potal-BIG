import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { getOrCreateUsuario } from '@/lib/get-usuario';

// GET: Listar feedbacks de uma empresa
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const usuario = await getOrCreateUsuario(supabase, session.user.id, session.user.email || '');
    if (!usuario || !usuario.is_admin) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    const empresaId = request.nextUrl.searchParams.get('empresa_id');
    if (!empresaId) {
      return NextResponse.json({ error: 'empresa_id é obrigatório' }, { status: 400 });
    }

    const { data: feedbacks, error } = await supabase
      .from('feedbacks_performance')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('periodo_inicio', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ feedbacks: feedbacks || [] });
  } catch (error) {
    console.error('[API Feedbacks GET]', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// POST: Criar novo feedback
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const usuario = await getOrCreateUsuario(supabase, session.user.id, session.user.email || '');
    if (!usuario || !usuario.is_admin) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    const { empresa_id, tipo, titulo, conteudo, periodo_inicio, periodo_fim } = await request.json();

    if (!empresa_id || !tipo || !titulo || !conteudo || !periodo_inicio || !periodo_fim) {
      return NextResponse.json({ error: 'Todos os campos são obrigatórios' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('feedbacks_performance')
      .insert({ empresa_id, tipo, titulo, conteudo, periodo_inicio, periodo_fim })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ feedback: data });
  } catch (error) {
    console.error('[API Feedbacks POST]', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// PUT: Atualizar feedback
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const usuario = await getOrCreateUsuario(supabase, session.user.id, session.user.email || '');
    if (!usuario || !usuario.is_admin) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    const { id, titulo, conteudo, tipo, periodo_inicio, periodo_fim } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'id é obrigatório' }, { status: 400 });
    }

    const updateData: Record<string, any> = {};
    if (titulo !== undefined) updateData.titulo = titulo;
    if (conteudo !== undefined) updateData.conteudo = conteudo;
    if (tipo !== undefined) updateData.tipo = tipo;
    if (periodo_inicio !== undefined) updateData.periodo_inicio = periodo_inicio;
    if (periodo_fim !== undefined) updateData.periodo_fim = periodo_fim;

    const { data, error } = await supabase
      .from('feedbacks_performance')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ feedback: data });
  } catch (error) {
    console.error('[API Feedbacks PUT]', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// DELETE: Remover feedback
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const usuario = await getOrCreateUsuario(supabase, session.user.id, session.user.email || '');
    if (!usuario || !usuario.is_admin) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    const id = request.nextUrl.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'id é obrigatório' }, { status: 400 });
    }

    const { error } = await supabase
      .from('feedbacks_performance')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API Feedbacks DELETE]', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
