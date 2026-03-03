import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { getOrCreateUsuario } from '@/lib/get-usuario';

// GET: Listar todas as empresas (admin vê todas)
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

    if (usuario.is_admin) {
      // Admin vê todas as empresas
      const { data: empresas, error } = await supabase
        .from('empresas')
        .select('*')
        .order('nome', { ascending: true });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ empresas: empresas || [] });
    } else {
      // Usuário comum vê só sua empresa
      if (!usuario.empresa_id) {
        return NextResponse.json({ empresas: [] });
      }
      const { data: empresa } = await supabase
        .from('empresas')
        .select('*')
        .eq('id', usuario.empresa_id)
        .single();

      return NextResponse.json({ empresas: empresa ? [empresa] : [] });
    }

  } catch (error) {
    console.error('[API Empresas GET]', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// POST: Criar nova empresa (só admin)
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

    const { nome, logo_url } = await request.json();

    if (!nome) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });
    }

    // Gerar slug automático: nomesemacentos-XXX
    const gerarSlug = (name: string): string => {
      const base = name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // remove acentos
        .replace(/[^a-z0-9]/g, '');      // remove caracteres especiais
      const num = Math.floor(Math.random() * 900 + 100); // 100-999
      return `${base}-${num}`;
    };

    const slug_relatorio = gerarSlug(nome);

    const { data: empresa, error } = await supabase
      .from('empresas')
      .insert({ nome, logo_url, slug_relatorio })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(empresa, { status: 201 });

  } catch (error) {
    console.error('[API Empresas POST]', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// DELETE: Excluir empresa (só admin)
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

    const { searchParams } = new URL(request.url);
    const empresaId = searchParams.get('id');

    if (!empresaId) {
      return NextResponse.json({ error: 'ID da empresa é obrigatório' }, { status: 400 });
    }

    const { error } = await supabase
      .from('empresas')
      .delete()
      .eq('id', empresaId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('[API Empresas DELETE]', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
