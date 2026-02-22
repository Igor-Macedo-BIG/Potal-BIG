/**
 * API Route: Meta Campaigns
 * 
 * GET - Lista campanhas sincronizadas (com status de vinculação)
 * POST - Vincula campanha a um funil
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { getOrCreateUsuario } from '@/lib/get-usuario';

// GET - Listar campanhas sincronizadas da Meta
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

    // Buscar TODAS as campanhas com meta_id (sincronizadas da Meta) para esta empresa
    const { data: campanhas, error: campanhasError } = await supabase
      .from('campanhas')
      .select('id, nome, meta_id, plataforma, ativo, funil_id, created_at')
      .eq('empresa_id', usuario.empresa_id)
      .not('meta_id', 'is', null)
      .order('created_at', { ascending: false });

    if (campanhasError) {
      console.error('[API Meta Campaigns GET - Campanhas Error]', campanhasError);
      return NextResponse.json(
        { error: `Erro ao buscar campanhas: ${campanhasError.message}` },
        { status: 500 }
      );
    }

    // Separar campanhas vinculadas (com funil_id) e não vinculadas (sem funil)
    const campanhasVinculadas = (campanhas || []).filter(c => c.funil_id);
    const campanhasNaoVinculadas = (campanhas || []).filter(c => !c.funil_id);

    // Buscar nomes dos funis das campanhas vinculadas (lookup separado, sem FK)
    const funilIdSet = [...new Set(campanhasVinculadas.map(c => c.funil_id).filter(Boolean))];
    let funilNomes: Record<string, string> = {};
    if (funilIdSet.length > 0) {
      const { data: funisData } = await supabase
        .from('funis')
        .select('id, nome')
        .in('id', funilIdSet);
      (funisData || []).forEach(f => { funilNomes[f.id] = f.nome; });
    }

    // Buscar funis disponíveis para vincular
    const { data: funisDisponiveis, error: funisError } = await supabase
      .from('funis')
      .select('id, nome')
      .eq('empresa_id', usuario.empresa_id)
      .order('nome');

    if (funisError) {
      console.error('[API Meta Campaigns GET - Funis Error]', funisError);
      return NextResponse.json(
        { error: `Erro ao buscar funis: ${funisError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      campanhas: campanhasVinculadas?.map(c => ({
        id: c.id,
        nome: c.nome,
        metaId: c.meta_id,
        plataforma: c.plataforma,
        ativo: c.ativo,
        vinculada: true,
        funil: c.funil_id ? { id: c.funil_id, nome: funilNomes[c.funil_id] || '' } : null,
        criadoEm: c.created_at
      })) || [],
      campanhasNaoVinculadas: campanhasNaoVinculadas?.map(c => ({
        id: c.id,
        nome: c.nome,
        metaId: c.meta_id,
        plataforma: c.plataforma,
        ativo: c.ativo,
        criadoEm: c.created_at
      })) || [],
      funisDisponiveis: funisDisponiveis?.map(f => ({
        id: f.id,
        nome: f.nome
      })) || [],
      resumo: {
        totalCampanhas: (campanhas || []).length,
        campanhasVinculadas: campanhasVinculadas.length,
        campanhasNaoVinculadas: campanhasNaoVinculadas.length
      }
    });

  } catch (error) {
    console.error('[API Meta Campaigns GET]', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Vincular campanha(s) a funil
// Aceita { campanhaId, funilId } para uma campanha
// ou { campanhaIds: string[], funilId, vincularTodas: true } para vinculação em massa
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

    const body = await request.json();
    const { campanhaId, campanhaIds, funilId, vincularTodas } = body;

    if (!funilId) {
      return NextResponse.json(
        { error: 'ID do funil é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se o funil pertence à empresa do usuário
    const { data: funil, error: funilError } = await supabase
      .from('funis')
      .select('id, empresa_id')
      .eq('id', funilId)
      .eq('empresa_id', usuario.empresa_id)
      .single();

    if (funilError || !funil) {
      return NextResponse.json(
        { error: 'Funil não encontrado ou não pertence à sua empresa' },
        { status: 400 }
      );
    }

    const updatePayload = {
      funil_id: funilId,
      updated_at: new Date().toISOString()
    };

    // Modo: vincular TODAS as orphans da empresa
    if (vincularTodas) {
      const { error, count } = await supabase
        .from('campanhas')
        .update(updatePayload)
        .eq('empresa_id', usuario.empresa_id)
        .is('funil_id', null)
        .not('meta_id', 'is', null);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        sucesso: true,
        atualizadas: count || 0,
        mensagem: `Todas as campanhas sem funil foram vinculadas com sucesso`
      });
    }

    // Modo: vincular lista de IDs
    if (campanhaIds && Array.isArray(campanhaIds) && campanhaIds.length > 0) {
      const { error, count } = await supabase
        .from('campanhas')
        .update(updatePayload)
        .in('id', campanhaIds)
        .eq('empresa_id', usuario.empresa_id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        sucesso: true,
        atualizadas: count || campanhaIds.length,
        mensagem: `${campanhaIds.length} campanha(s) vinculada(s) com sucesso`
      });
    }

    // Modo: vincular uma única campanha
    if (!campanhaId) {
      return NextResponse.json(
        { error: 'Informe campanhaId, campanhaIds ou vincularTodas=true' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('campanhas')
      .update(updatePayload)
      .eq('id', campanhaId)
      .eq('empresa_id', usuario.empresa_id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      sucesso: true,
      mensagem: 'Campanha vinculada ao funil com sucesso'
    });

  } catch (error) {
    console.error('[API Meta Campaigns POST]', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
