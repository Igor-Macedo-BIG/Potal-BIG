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

    const { searchParams } = new URL(request.url);
    const funilId = searchParams.get('funil_id');
    const empresaIdParam = searchParams.get('empresa_id');

    // Obter empresa do usuário
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('empresa_id, role')
      .eq('id', session.user.id)
      .single();

    if (!usuario) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Admin pode ver qualquer empresa
    const isAdmin = usuario.role === 'admin' || usuario.role === 'gestor';
    const empresaIdFinal = isAdmin && empresaIdParam ? empresaIdParam : usuario.empresa_id;
    
    if (!empresaIdFinal) {
      return NextResponse.json([]);
    }

    // Query base
    let query = supabase
      .from('campanhas')
      .select(`
        id,
        nome,
        tipo,
        funil_id,
        plataforma,
        ativo,
        created_at,
        updated_at,
        funil:funis (
          id,
          nome,
          empresa_id
        ),
        conjuntos_anuncio (
          id,
          nome,
          publico,
          ativo
        )
      `)
      .order('created_at', { ascending: false });

    // Filtrar por funil se especificado
    if (funilId) {
      query = query.eq('funil_id', funilId);
    }

    const { data: campanhas, error } = await query;

    if (error) {
      console.error('Erro ao buscar campanhas:', error);
      return NextResponse.json({ error: 'Erro ao buscar campanhas' }, { status: 500 });
    }

    // Filtrar apenas campanhas da empresa
    const campanhasFiltradas = campanhas?.filter(
      campanha => (campanha.funil as any)?.empresa_id === empresaIdFinal
    );

    return NextResponse.json(campanhasFiltradas);

  } catch (error) {
    console.error('Erro na API campanhas:', error);
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

    const { nome, tipo, funil_id, plataforma } = await request.json();

    if (!nome || !funil_id) {
      return NextResponse.json({ error: 'Nome e funil são obrigatórios' }, { status: 400 });
    }

    // Verificar se o funil pertence à empresa do usuário
    const { data: usuarioPost } = await supabase
      .from('usuarios')
      .select('empresa_id, role')
      .eq('id', session.user.id)
      .single();

    if (!usuarioPost) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const { data: funil } = await supabase
      .from('funis')
      .select('empresa_id')
      .eq('id', funil_id)
      .single();

    const isAdminPost = usuarioPost.role === 'admin' || usuarioPost.role === 'gestor';
    if (!funil || (!isAdminPost && funil.empresa_id !== usuarioPost.empresa_id)) {
      return NextResponse.json({ error: 'Funil não encontrado ou sem permissão' }, { status: 403 });
    }

    // Criar campanha
    const { data: campanha, error } = await supabase
      .from('campanhas')
      .insert({
        nome,
        tipo: tipo || 'leads',
        funil_id,
        plataforma: plataforma || 'Meta Ads',
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar campanha:', error);
      return NextResponse.json({ error: 'Erro ao criar campanha' }, { status: 500 });
    }

    return NextResponse.json(campanha, { status: 201 });

  } catch (error) {
    console.error('Erro na API campanhas:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
