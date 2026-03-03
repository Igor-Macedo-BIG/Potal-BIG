/**
 * API Route: Meta Integration Credentials
 * 
 * GET - Lista todas as contas Meta conectadas
 * POST - Adiciona nova conta Meta (ou atualiza se mesmo ad_account_id)
 * DELETE - Remove uma conta específica (por integracaoId) ou todas
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { MetaClient } from '@/lib/meta-client';
import { getOrCreateUsuario, resolveEmpresaId } from '@/lib/get-usuario';

// GET - Listar todas as contas Meta conectadas
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

    const empresaId = resolveEmpresaId(usuario, request.url);
    if (!empresaId) return NextResponse.json({ integrado: false, contas: [], integracao: null });

    // Buscar TODAS as integrações da empresa
    const { data: integracoes, error } = await supabase
      .from('integracoes_meta')
      .select(`
        id,
        ad_account_id,
        business_id,
        ativo,
        ultima_sincronizacao,
        erro_sincronizacao,
        sincronizar_automaticamente,
        intervalo_sincronizacao,
        created_at
      `)
      .eq('empresa_id', empresaId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const contas = (integracoes || []).map(i => ({
      id: i.id,
      adAccountId: i.ad_account_id,
      businessId: i.business_id,
      ativo: i.ativo,
      ultimaSincronizacao: i.ultima_sincronizacao,
      erroSincronizacao: i.erro_sincronizacao,
      sincronizarAutomaticamente: i.sincronizar_automaticamente,
      intervaloSincronizacao: i.intervalo_sincronizacao,
      criadoEm: i.created_at
    }));

    // Compatibilidade: "integrado" = true se pelo menos 1 conta ativa
    const integrado = contas.some(c => c.ativo);

    return NextResponse.json({
      integrado,
      contas,
      // Compatibilidade legada: retorna a primeira conta ativa como "integracao"
      integracao: contas.find(c => c.ativo) || null
    });

  } catch (error) {
    console.error('[API Meta Credentials GET]', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// POST - Adicionar nova conta ou atualizar existente (match por ad_account_id)
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

    const empresaId = resolveEmpresaId(usuario, request.url);
    if (!empresaId) return NextResponse.json({ error: 'Selecione uma empresa' }, { status: 400 });

    const body = await request.json();
    const { accessToken, adAccountId, businessId } = body;

    if (!accessToken || !adAccountId) {
      return NextResponse.json(
        { error: 'Token de acesso e ID da conta de anúncios são obrigatórios' },
        { status: 400 }
      );
    }

    const formattedAccountId = adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`;

    // Validar token com a Meta API
    try {
      const client = new MetaClient({
        accessToken,
        adAccountId: formattedAccountId
      });

      const tokenInfo = await client.validateToken();
      if (!tokenInfo.isValid) {
        return NextResponse.json(
          { error: 'Token de acesso inválido. Verifique se o token está correto e não expirou.' },
          { status: 400 }
        );
      }

      const accountInfo = await client.getAdAccountInfo();
      if (!accountInfo.id) {
        return NextResponse.json(
          { error: 'Não foi possível acessar a conta de anúncios. Verifique as permissões.' },
          { status: 400 }
        );
      }
    } catch (validationError) {
      const message = validationError instanceof Error ? validationError.message : 'Erro de validação';
      return NextResponse.json(
        { error: `Erro ao validar credenciais: ${message}` },
        { status: 400 }
      );
    }

    // Verificar se já existe integração com o MESMO ad_account_id para esta empresa
    const { data: existing } = await supabase
      .from('integracoes_meta')
      .select('id')
      .eq('empresa_id', empresaId)
      .eq('ad_account_id', formattedAccountId)
      .maybeSingle();

    const payload = {
      empresa_id: empresaId,
      access_token: accessToken,
      ad_account_id: formattedAccountId,
      business_id: businessId || null,
      ativo: true,
      erro_sincronizacao: null,
      updated_at: new Date().toISOString()
    };

    let result;
    if (existing) {
      result = await supabase
        .from('integracoes_meta')
        .update(payload)
        .eq('id', existing.id)
        .select()
        .single();
    } else {
      result = await supabase
        .from('integracoes_meta')
        .insert(payload)
        .select()
        .single();
    }

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }

    return NextResponse.json({
      sucesso: true,
      mensagem: existing ? 'Conta atualizada com sucesso' : 'Nova conta adicionada com sucesso',
      integracaoId: result.data.id
    });

  } catch (error) {
    console.error('[API Meta Credentials POST]', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// DELETE - Remover uma conta específica ou todas
export async function DELETE(request: NextRequest) {
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

    const empresaId = resolveEmpresaId(usuario, request.url);
    if (!empresaId) return NextResponse.json({ error: 'Selecione uma empresa' }, { status: 400 });

    const { searchParams } = new URL(request.url);
    const integracaoId = searchParams.get('integracaoId');

    if (integracaoId) {
      // Deletar conta específica (verificando que pertence à empresa)
      const { error } = await supabase
        .from('integracoes_meta')
        .delete()
        .eq('id', integracaoId)
        .eq('empresa_id', empresaId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        sucesso: true,
        mensagem: 'Conta removida com sucesso'
      });
    } else {
      // Deletar TODAS as integrações da empresa
      const { error } = await supabase
        .from('integracoes_meta')
        .delete()
        .eq('empresa_id', empresaId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        sucesso: true,
        mensagem: 'Todas as integrações removidas com sucesso'
      });
    }

  } catch (error) {
    console.error('[API Meta Credentials DELETE]', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// PUT - Atualizar token de uma conta existente
export async function PUT(request: NextRequest) {
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

    const empresaId = resolveEmpresaId(usuario, request.url);
    if (!empresaId) return NextResponse.json({ error: 'Selecione uma empresa' }, { status: 400 });

    const body = await request.json();
    const { integracaoId, accessToken } = body;

    if (!integracaoId || !accessToken) {
      return NextResponse.json(
        { error: 'ID da integração e novo token são obrigatórios' },
        { status: 400 }
      );
    }

    // Buscar a integração para pegar o ad_account_id
    const { data: integracao } = await supabase
      .from('integracoes_meta')
      .select('ad_account_id')
      .eq('id', integracaoId)
      .eq('empresa_id', empresaId)
      .maybeSingle();

    if (!integracao) {
      return NextResponse.json({ error: 'Integração não encontrada' }, { status: 404 });
    }

    // Validar novo token
    try {
      const client = new MetaClient({
        accessToken,
        adAccountId: integracao.ad_account_id
      });
      const tokenInfo = await client.validateToken();
      if (!tokenInfo.isValid) {
        return NextResponse.json(
          { error: 'Novo token inválido ou expirado. Verifique e tente novamente.' },
          { status: 400 }
        );
      }
    } catch (validationError) {
      const message = validationError instanceof Error ? validationError.message : 'Erro de validação';
      return NextResponse.json(
        { error: `Erro ao validar token: ${message}` },
        { status: 400 }
      );
    }

    // Atualizar token
    const { error } = await supabase
      .from('integracoes_meta')
      .update({
        access_token: accessToken,
        ativo: true,
        erro_sincronizacao: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', integracaoId)
      .eq('empresa_id', empresaId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      sucesso: true,
      mensagem: 'Token atualizado com sucesso!'
    });

  } catch (error) {
    console.error('[API Meta Credentials PUT]', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
