import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Verificar autenticação
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Obter empresa do usuário
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('empresa_id')
      .eq('id', session.user.id)
      .single();

    if (!usuario) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Buscar funis com campanhas relacionadas
    const { data: funis, error } = await supabase
      .from('funis')
      .select(`
        id,
        nome,
        descricao,
        empresa_id,
        ativo,
        created_at,
        updated_at,
        campanhas (
          id,
          nome,
          tipo,
          plataforma,
          ativo,
          created_at
        )
      `)
      .eq('empresa_id', usuario.empresa_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar funis:', error);
      return NextResponse.json({ error: 'Erro ao buscar funis' }, { status: 500 });
    }

    return NextResponse.json(funis);

  } catch (error) {
    console.error('Erro na API funis:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Verificar autenticação
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Obter empresa do usuário
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('empresa_id')
      .eq('id', session.user.id)
      .single();

    if (!usuario) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const { nome, descricao } = await request.json();

    if (!nome) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });
    }

    // Criar funil
    const { data: funil, error } = await supabase
      .from('funis')
      .insert({
        nome,
        descricao,
        empresa_id: usuario.empresa_id,
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar funil:', error);
      return NextResponse.json({ error: 'Erro ao criar funil' }, { status: 500 });
    }

    return NextResponse.json(funil, { status: 201 });

  } catch (error) {
    console.error('Erro na API funis:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
