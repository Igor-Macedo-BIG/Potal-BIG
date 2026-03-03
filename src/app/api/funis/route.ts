import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { getOrCreateUsuario } from '@/lib/get-usuario';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Verificar autenticação
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Obter (ou criar) usuário
    const usuario = await getOrCreateUsuario(supabase, session.user.id, session.user.email || '');
    if (!usuario) {
      return NextResponse.json({ error: 'Não foi possível identificar o usuário' }, { status: 404 });
    }

    // Admin pode passar empresa_id via query param para ver dados de qualquer empresa
    const { searchParams } = new URL(request.url);
    const empresaIdParam = searchParams.get('empresa_id');
    const empresaId = usuario.is_admin && empresaIdParam ? empresaIdParam : usuario.empresa_id;

    // Se não tem empresa selecionada, retornar vazio (admin sem empresa selecionada)
    if (!empresaId) {
      return NextResponse.json({
        funis: [],
        campanhas: [],
        campanhasPorFunil: {},
        resumo: { totalFunis: 0, totalCampanhas: 0 }
      });
    }

    // 1. Buscar funis da empresa
    const { data: funis, error: funisError } = await supabase
      .from('funis')
      .select('id, nome, descricao, ativo, created_at, empresa_id')
      .eq('empresa_id', empresaId)
      .order('created_at', { ascending: false });

    if (funisError) {
      console.error('[API Funis GET - Funis Error]', funisError);
      return NextResponse.json(
        { error: `Erro ao buscar funis: ${funisError.message}` },
        { status: 500 }
      );
    }

    const funilIds = (funis || []).map(f => f.id);

    // 2. Buscar campanhas associadas aos funis
    let campanhas: any[] = [];
    if (funilIds.length > 0) {
      const { data: campanhasData, error: campanhasError } = await supabase
        .from('campanhas')
        .select('id, nome, tipo, plataforma, ativo, funil_id, created_at')
        .in('funil_id', funilIds)
        .order('created_at', { ascending: false });

      if (campanhasError) {
        console.error('[API Funis GET - Campanhas Error]', campanhasError);
      } else {
        campanhas = campanhasData || [];
      }
    }

    // 3. Agrupar campanhas por funil e contar
    const campanhasPorFunil: Record<string, any[]> = {};
    campanhas.forEach(campanha => {
      if (!campanhasPorFunil[campanha.funil_id]) {
        campanhasPorFunil[campanha.funil_id] = [];
      }
      campanhasPorFunil[campanha.funil_id].push(campanha);
    });

    // 4. Adicionar contagem de campanhas aos funis
    const funisComContagem = (funis || []).map(funil => ({
      ...funil,
      campanhas_count: campanhasPorFunil[funil.id]?.length || 0
    }));

    return NextResponse.json({
      funis: funisComContagem,
      campanhas,
      campanhasPorFunil,
      resumo: {
        totalFunis: funisComContagem.length,
        totalCampanhas: campanhas.length
      }
    });

  } catch (error) {
    console.error('[API Funis GET]', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
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

    // Obter (ou criar) usuário
    const usuario = await getOrCreateUsuario(supabase, session.user.id, session.user.email || '');
    if (!usuario) {
      return NextResponse.json({ error: 'Não foi possível identificar o usuário' }, { status: 404 });
    }

    const { nome, descricao, empresa_id: bodyEmpresaId } = await request.json();

    if (!nome) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });
    }

    // Admin pode especificar empresa_id no body
    const empresaId = usuario.is_admin && bodyEmpresaId ? bodyEmpresaId : usuario.empresa_id;
    if (!empresaId) {
      return NextResponse.json({ error: 'Selecione uma empresa primeiro' }, { status: 400 });
    }

    // Criar funil
    const { data: funil, error } = await supabase
      .from('funis')
      .insert({
        nome,
        descricao,
        empresa_id: empresaId,
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
