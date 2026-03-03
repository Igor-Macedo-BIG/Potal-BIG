/**
 * API Route: Kommo Integration Config
 * 
 * GET    - Lista integrações Kommo da empresa
 * POST   - Cria/atualiza integração + testa conexão
 * DELETE - Remove integração
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { getOrCreateUsuario, resolveEmpresaId } from '@/lib/get-usuario';
import { validarConexao, sincronizarPipelines } from '@/lib/kommo-sync';
import type { IntegracaoKommo } from '@/types/hierarchical';

// GET - Listar integrações
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const usuario = await getOrCreateUsuario(supabase, session.user.id, session.user.email || '');
    if (!usuario) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });

    const empresaId = resolveEmpresaId(usuario, request.url);
    if (!empresaId) return NextResponse.json({ integracoes: [] });

    // Buscar integrações com pipelines vinculadas
    const { data: integracoes, error } = await supabase
      .from('integracoes_kommo')
      .select(`
        id, nome, subdominio, ativo, funil_id,
        ultima_sincronizacao, erro_sincronizacao,
        created_at, updated_at
      `)
      .eq('empresa_id', empresaId)
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Buscar pipelines de cada integração
    const integracoesComPipelines = [];
    for (const integ of integracoes || []) {
      const { data: pipelines } = await supabase
        .from('kommo_pipelines')
        .select('id, pipeline_id_kommo, nome, stages, mapeamento_departamentos, funil_id, ativo')
        .eq('integracao_id', integ.id)
        .order('nome');

      integracoesComPipelines.push({
        ...integ,
        pipelines: pipelines || [],
      });
    }

    return NextResponse.json({ integracoes: integracoesComPipelines });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Criar/atualizar integração ou testar conexão
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const usuario = await getOrCreateUsuario(supabase, session.user.id, session.user.email || '');
    if (!usuario) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });

    const empresaId = resolveEmpresaId(usuario, request.url);
    if (!empresaId) return NextResponse.json({ error: 'Selecione uma empresa' }, { status: 400 });

    const body = await request.json().catch(() => ({}));
    const { id, nome, subdominio, access_token, ativo, funil_id, action } = body;

    // Ação: testar conexão
    if (action === 'test') {
      if (!subdominio || !access_token) {
        return NextResponse.json(
          { error: 'subdominio e access_token são obrigatórios para teste' },
          { status: 400 }
        );
      }
      const result = await validarConexao(subdominio, access_token);
      return NextResponse.json(result);
    }

    // Atualizar existente
    if (id) {
      const updatePayload: Record<string, any> = { updated_at: new Date().toISOString() };
      if (nome !== undefined) updatePayload.nome = nome;
      if (subdominio !== undefined) updatePayload.subdominio = subdominio;
      if (access_token !== undefined) updatePayload.access_token = access_token;
      if (ativo !== undefined) updatePayload.ativo = ativo;
      if (funil_id !== undefined) updatePayload.funil_id = funil_id || null;

      const { data, error } = await supabase
        .from('integracoes_kommo')
        .update(updatePayload)
        .eq('id', id)
        .eq('empresa_id', empresaId)
        .select()
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      // Se atualizou token/subdominio, re-sync pipelines
      if (subdominio || access_token) {
        const integ = data as IntegracaoKommo;
        await sincronizarPipelines(supabase, integ);
      }

      return NextResponse.json({ integracao: data });
    }

    // Criar nova
    if (!subdominio || !access_token) {
      return NextResponse.json(
        { error: 'subdominio e access_token são obrigatórios' },
        { status: 400 }
      );
    }

    // Validar conexão primeiro
    const validacao = await validarConexao(subdominio, access_token);
    if (!validacao.valido) {
      return NextResponse.json(
        { error: `Falha na conexão: ${validacao.erro}` },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('integracoes_kommo')
      .insert({
        empresa_id: empresaId,
        nome: nome || `Kommo - ${validacao.nome_conta || subdominio}`,
        subdominio,
        access_token,
        funil_id: funil_id || null,
        ativo: true,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Sincronizar pipelines automaticamente ao criar
    const integ = data as IntegracaoKommo;
    const { pipelines, erros } = await sincronizarPipelines(supabase, integ);

    return NextResponse.json({
      integracao: data,
      pipelines,
      nome_conta: validacao.nome_conta,
      erros_pipelines: erros,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Remover integração
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const usuario = await getOrCreateUsuario(supabase, session.user.id, session.user.email || '');
    if (!usuario) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });

    const empresaId = resolveEmpresaId(usuario, request.url);
    if (!empresaId) return NextResponse.json({ error: 'Selecione uma empresa' }, { status: 400 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });

    // CASCADE deleta pipelines e snapshots
    const { error } = await supabase
      .from('integracoes_kommo')
      .delete()
      .eq('id', id)
      .eq('empresa_id', empresaId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
