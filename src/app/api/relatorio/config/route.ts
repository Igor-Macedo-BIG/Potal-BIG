import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { getOrCreateUsuario } from '@/lib/get-usuario';

const METRICAS_PADRAO = [
  { metrica_key: 'investimento', nome_display: 'Investimento', ordem: 10 },
  { metrica_key: 'leads', nome_display: 'Leads de Páginas', ordem: 20 },
  { metrica_key: 'leads_whatsapp', nome_display: 'Leads WhatsApp', ordem: 25 },
  { metrica_key: 'leads_messenger', nome_display: 'Leads Messenger/Instagram', ordem: 26 },
  { metrica_key: 'mensagens', nome_display: 'Mensagens (Total)', ordem: 30 },
  { metrica_key: 'cpl', nome_display: 'Custo por Lead', ordem: 40 },
  { metrica_key: 'custo_por_mensagem', nome_display: 'Custo por Mensagem', ordem: 35 },
  { metrica_key: 'media_diaria_mensagens', nome_display: 'Média Diária de Mensagens', ordem: 36 },
  { metrica_key: 'ctr', nome_display: 'CTR', ordem: 50 },
  { metrica_key: 'roas', nome_display: 'ROAS', ordem: 60 },
  { metrica_key: 'alcance', nome_display: 'Alcance', ordem: 70 },
  { metrica_key: 'impressoes', nome_display: 'Impressões', ordem: 80 },
  { metrica_key: 'cliques', nome_display: 'Cliques', ordem: 90 },
  { metrica_key: 'vendas', nome_display: 'Vendas', ordem: 100 },
  { metrica_key: 'faturamento', nome_display: 'Faturamento', ordem: 110 },
  { metrica_key: 'cpm', nome_display: 'CPM', ordem: 120 },
  { metrica_key: 'cpc', nome_display: 'CPC', ordem: 130 },
];

// GET: Listar configuração de métricas do relatório de uma empresa
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

    // Buscar configs existentes
    const { data: configs, error } = await supabase
      .from('relatorio_config')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('ordem', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Se não existir config, fazer seed com padrões
    if (!configs || configs.length === 0) {
      const seedData = METRICAS_PADRAO.map(m => ({
        empresa_id: empresaId,
        ...m,
        visivel: true,
      }));

      const { data: seeded, error: seedError } = await supabase
        .from('relatorio_config')
        .insert(seedData)
        .select();

      if (seedError) {
        return NextResponse.json({ error: seedError.message }, { status: 500 });
      }

      return NextResponse.json({ configs: seeded || [] });
    }

    return NextResponse.json({ configs });

  } catch (error) {
    console.error('[API Relatorio Config GET]', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// PUT: Atualizar visibilidade/nome de uma métrica
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

    const { id, visivel, nome_display } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'id é obrigatório' }, { status: 400 });
    }

    const updateData: any = { updated_at: new Date().toISOString() };
    if (typeof visivel === 'boolean') updateData.visivel = visivel;
    if (nome_display !== undefined) updateData.nome_display = nome_display;

    const { data, error } = await supabase
      .from('relatorio_config')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('[API Relatorio Config PUT]', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
