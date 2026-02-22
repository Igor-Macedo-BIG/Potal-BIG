/**
 * API Route: Dashboard Métricas Config
 * 
 * GET  - Lista configurações de métricas por departamento
 * POST - Cria/atualiza configurações (bulk upsert ou seed automático)
 * PUT  - Atualiza uma config individual
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { getOrCreateUsuario } from '@/lib/get-usuario';

// Métricas padrão por departamento
const METRICAS_PADRAO: Record<string, Array<{
  metrica_key: string;
  nome_original: string;
  icone: string;
  cor: string;
  gradiente: string;
  fonte: string; // 'typebot' | 'kommo' | 'calc'
}>> = {
  sdr: [
    { metrica_key: 'comecou_diagnostico', nome_original: 'Lead começou preencher diagnóstico', icone: 'Edit3', cor: 'text-cyan-400', gradiente: 'from-cyan-500/20 to-blue-500/20', fonte: 'typebot' },
    { metrica_key: 'chegaram_crm_kommo', nome_original: 'Leads que chegaram ao CRM Kommo', icone: 'Users', cor: 'text-blue-400', gradiente: 'from-blue-500/20 to-indigo-500/20', fonte: 'typebot' },
    { metrica_key: 'qualificados_para_mentoria', nome_original: 'Leads qualificados para Mentoria', icone: 'UserCheck', cor: 'text-emerald-400', gradiente: 'from-emerald-500/20 to-teal-500/20', fonte: 'kommo' },
    { metrica_key: 'para_downsell', nome_original: 'Leads para Downsell', icone: 'TrendingDown', cor: 'text-orange-400', gradiente: 'from-orange-500/20 to-amber-500/20', fonte: 'kommo' },
    { metrica_key: 'agendados_diagnostico', nome_original: 'Agendados para Diagnóstico', icone: 'Calendar', cor: 'text-purple-400', gradiente: 'from-purple-500/20 to-pink-500/20', fonte: 'kommo' },
    { metrica_key: 'agendados_mentoria', nome_original: 'Agendados para Mentoria', icone: 'Phone', cor: 'text-yellow-400', gradiente: 'from-yellow-500/20 to-orange-500/20', fonte: 'kommo' },
    { metrica_key: 'nomes_qualificados', nome_original: 'Nomes dos leads qualificados', icone: 'MessageCircle', cor: 'text-pink-400', gradiente: 'from-pink-500/20 to-purple-500/20', fonte: 'kommo' },
    { metrica_key: 'taxa_conversao', nome_original: 'Taxa de Conversão (qualificados / preencheram)', icone: 'TrendingUp', cor: 'text-purple-400', gradiente: 'from-pink-500/20 to-purple-500/20', fonte: 'calc' },
  ],
  closer: [
    { metrica_key: 'calls_realizadas', nome_original: 'Call realizadas', icone: 'Phone', cor: 'text-blue-400', gradiente: 'from-blue-500/20 to-cyan-500/20', fonte: 'manual' },
    { metrica_key: 'nao_compareceram', nome_original: 'Não compareceu a call', icone: 'TrendingDown', cor: 'text-red-400', gradiente: 'from-red-500/20 to-pink-500/20', fonte: 'kommo' },
    { metrica_key: 'vendas_mentoria', nome_original: 'Vendas da Mentoria', icone: 'Handshake', cor: 'text-emerald-400', gradiente: 'from-emerald-500/20 to-teal-500/20', fonte: 'kommo' },
    { metrica_key: 'vendas_downsell', nome_original: 'Vendas Downsell', icone: 'TrendingDown', cor: 'text-orange-400', gradiente: 'from-orange-500/20 to-amber-500/20', fonte: 'kommo' },
    { metrica_key: 'em_negociacao', nome_original: 'Em negociação', icone: 'Clock', cor: 'text-purple-400', gradiente: 'from-purple-500/20 to-pink-500/20', fonte: 'kommo' },
    { metrica_key: 'em_followup', nome_original: 'Em Follow-up', icone: 'Clock', cor: 'text-yellow-400', gradiente: 'from-yellow-500/20 to-orange-500/20', fonte: 'kommo' },
    { metrica_key: 'vendas_perdidas', nome_original: 'Vendas perdidas', icone: 'TrendingDown', cor: 'text-red-400', gradiente: 'from-red-500/20 to-pink-500/20', fonte: 'kommo' },
    { metrica_key: 'lead_desqualificado', nome_original: 'Leads Desqualificados', icone: 'Users', cor: 'text-gray-400', gradiente: 'from-slate-500/20 to-gray-500/20', fonte: 'kommo' },
    { metrica_key: 'nomes_vendas', nome_original: 'Nomes das Vendas', icone: 'MessageCircle', cor: 'text-emerald-400', gradiente: 'from-emerald-500/20 to-teal-500/20', fonte: 'kommo' },
  ],
};

// GET - Lista configs
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const usuario = await getOrCreateUsuario(supabase, session.user.id, session.user.email || '');
    if (!usuario) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });

    const { searchParams } = new URL(request.url);
    const departamento = searchParams.get('departamento'); // 'sdr' | 'closer' | null (ambos)

    let query = supabase
      .from('dashboard_metricas_config')
      .select('*')
      .eq('empresa_id', usuario.empresa_id)
      .order('ordem', { ascending: true });

    if (departamento) {
      query = query.eq('departamento', departamento);
    }

    const { data, error } = await query;

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({
      configs: data || [],
      defaults: METRICAS_PADRAO,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Criar/atualizar configs (bulk upsert) ou seed automático
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const usuario = await getOrCreateUsuario(supabase, session.user.id, session.user.email || '');
    if (!usuario) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });

    const body = await request.json().catch(() => ({}));
    const { action, departamento, configs } = body;

    // ---- SEED: criar configs padrão ----
    if (action === 'seed') {
      const deps = departamento ? [departamento] : ['sdr', 'closer'];
      let total = 0;

      for (const dept of deps) {
        const defaults = METRICAS_PADRAO[dept] || [];

        for (let i = 0; i < defaults.length; i++) {
          const def = defaults[i];
          const { error } = await supabase
            .from('dashboard_metricas_config')
            .upsert(
              {
                empresa_id: usuario.empresa_id,
                departamento: dept,
                metrica_key: def.metrica_key,
                nome_original: def.nome_original,
                nome_display: def.nome_original, // Começa igual ao original
                descricao: `Fonte: ${def.fonte}`,
                visivel: true,
                ordem: i * 10,
                icone: def.icone,
                cor: def.cor,
                gradiente: def.gradiente,
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'empresa_id,departamento,metrica_key' }
            );

          if (!error) total++;
        }
      }

      return NextResponse.json({ message: `${total} métricas configuradas`, total });
    }

    // ---- BULK UPSERT ----
    if (configs && Array.isArray(configs)) {
      let ok = 0;
      let fail = 0;

      for (const config of configs) {
        const { error } = await supabase
          .from('dashboard_metricas_config')
          .upsert(
            {
              empresa_id: usuario.empresa_id,
              departamento: config.departamento,
              metrica_key: config.metrica_key,
              nome_original: config.nome_original || config.metrica_key,
              nome_display: config.nome_display || config.nome_original || config.metrica_key,
              descricao: config.descricao || '',
              visivel: config.visivel !== false,
              ordem: config.ordem ?? 0,
              icone: config.icone || 'BarChart3',
              cor: config.cor || 'text-blue-400',
              gradiente: config.gradiente || 'from-blue-500/20 to-cyan-500/20',
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'empresa_id,departamento,metrica_key' }
          );

        if (error) fail++;
        else ok++;
      }

      return NextResponse.json({ ok, fail });
    }

    return NextResponse.json({ error: 'Nenhuma ação válida' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Atualizar config individual
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const usuario = await getOrCreateUsuario(supabase, session.user.id, session.user.email || '');
    if (!usuario) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });

    const body = await request.json().catch(() => ({}));
    const { id, nome_display, descricao, visivel, ordem } = body;

    if (!id) return NextResponse.json({ error: 'id é obrigatório' }, { status: 400 });

    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    if (nome_display !== undefined) updates.nome_display = nome_display;
    if (descricao !== undefined) updates.descricao = descricao;
    if (visivel !== undefined) updates.visivel = visivel;
    if (ordem !== undefined) updates.ordem = ordem;

    const { error } = await supabase
      .from('dashboard_metricas_config')
      .update(updates)
      .eq('id', id)
      .eq('empresa_id', usuario.empresa_id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ message: 'Atualizado' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
