/**
 * API Route: Kommo Funnel Data
 * 
 * GET - Retorna dados do funil para visualização no dashboard
 *       Agregação de snapshots por estágio com taxas de conversão
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { getOrCreateUsuario } from '@/lib/get-usuario';

// GET - Dados do funil
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const usuario = await getOrCreateUsuario(supabase, session.user.id, session.user.email || '');
    if (!usuario) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });

    const { searchParams } = new URL(request.url);
    const pipelineId = searchParams.get('pipeline_id');        // UUID do kommo_pipelines
    const pipelineKommoId = searchParams.get('pipeline_kommo_id'); // ID na Kommo
    const dataInicio = searchParams.get('data_inicio');
    const dataFim = searchParams.get('data_fim');
    const departamento = searchParams.get('departamento');      // 'sdr' | 'closer' | 'all'

    // Buscar pipeline
    let pipelineQuery = supabase
      .from('kommo_pipelines')
      .select('*');

    if (pipelineId) {
      pipelineQuery = pipelineQuery.eq('id', pipelineId);
    } else if (pipelineKommoId) {
      pipelineQuery = pipelineQuery.eq('pipeline_id_kommo', parseInt(pipelineKommoId));
    } else {
      // Pegar a primeira pipeline ativa da empresa
      const { data: integracoes } = await supabase
        .from('integracoes_kommo')
        .select('id')
        .eq('empresa_id', usuario.empresa_id)
        .eq('ativo', true);

      if (!integracoes || integracoes.length === 0) {
        return NextResponse.json({ error: 'Nenhuma integração Kommo encontrada' }, { status: 404 });
      }

      pipelineQuery = pipelineQuery
        .in('integracao_id', integracoes.map((i) => i.id))
        .eq('ativo', true)
        .limit(1);
    }

    const { data: pipelineData, error: errPipeline } = await pipelineQuery;

    if (errPipeline || !pipelineData || pipelineData.length === 0) {
      return NextResponse.json({ error: 'Pipeline não encontrada' }, { status: 404 });
    }

    const pipeline = pipelineData[0];
    const stages = pipeline.stages || [];
    const mapeamento = pipeline.mapeamento_departamentos || {};

    // Filtrar estágios por departamento se solicitado
    let stageIds: number[] | null = null;
    if (departamento === 'sdr' && mapeamento.sdr?.length > 0) {
      stageIds = mapeamento.sdr;
    } else if (departamento === 'closer' && mapeamento.closer?.length > 0) {
      stageIds = mapeamento.closer;
    }

    // Buscar snapshots — com o novo modelo, cada snapshot é por data de CRIAÇÃO do lead
    let snapshotQuery = supabase
      .from('kommo_snapshots')
      .select('stage_id_kommo, stage_nome, quantidade_leads, valor_total, nomes_leads, data_referencia')
      .eq('pipeline_ref_id', pipeline.id);

    if (dataInicio && dataFim) {
      // Filtrar snapshots cujos leads foram CRIADOS no período
      snapshotQuery = snapshotQuery
        .gte('data_referencia', dataInicio)
        .lte('data_referencia', dataFim);
    }

    const { data: snapshots, error: errSnap } = await snapshotQuery;

    if (errSnap) return NextResponse.json({ error: errSnap.message }, { status: 500 });

    // SOMAR quantidade e valor por stage_id (agregar todos os dias do período)
    const aggregatedByStage = new Map<number, {
      stage_nome: string;
      quantidade_leads: number;
      valor_total: number;
      nomes_leads: string[];
    }>();

    for (const snap of snapshots || []) {
      const existing = aggregatedByStage.get(snap.stage_id_kommo);
      if (existing) {
        existing.quantidade_leads += snap.quantidade_leads || 0;
        existing.valor_total += parseFloat(String(snap.valor_total || 0));
        if (snap.nomes_leads) {
          existing.nomes_leads.push(snap.nomes_leads);
        }
      } else {
        aggregatedByStage.set(snap.stage_id_kommo, {
          stage_nome: snap.stage_nome,
          quantidade_leads: snap.quantidade_leads || 0,
          valor_total: parseFloat(String(snap.valor_total || 0)),
          nomes_leads: snap.nomes_leads ? [snap.nomes_leads] : [],
        });
      }
    }

    // Construir dados do funil respeitando ordem dos stages
    const stagesOrdenados = stages
      .filter((s: any) => !stageIds || stageIds.includes(s.id))
      .sort((a: any, b: any) => a.sort - b.sort);

    const totalLeads = Array.from(aggregatedByStage.values()).reduce(
      (sum, s) => sum + (s.quantidade_leads || 0),
      0
    );

    let previousQuantidade = 0;
    const funnelData = stagesOrdenados.map((stage: any, index: number) => {
      const agg = aggregatedByStage.get(stage.id);
      const quantidade = agg?.quantidade_leads || 0;
      const valor = agg?.valor_total || 0;
      // Concatenar nomes de todos os dias, deduplicar
      const nomesArr = agg?.nomes_leads || [];
      const nomesSet = new Set<string>();
      for (const chunk of nomesArr) {
        for (const nome of chunk.split('\n').filter(Boolean)) {
          nomesSet.add(nome);
        }
      }
      const nomes = Array.from(nomesSet).join('\n');

      const percentualTotal = totalLeads > 0 ? (quantidade / totalLeads) * 100 : 0;
      const taxaConversao = index === 0
        ? 100
        : previousQuantidade > 0
          ? (quantidade / previousQuantidade) * 100
          : 0;

      previousQuantidade = quantidade;

      // Determinar tipo do estágio
      let tipo: 'active' | 'won' | 'lost' = 'active';
      if (stage.type === 1) tipo = 'won';
      if (stage.type === 2) tipo = 'lost';

      return {
        stage_id: stage.id,
        stage_nome: stage.name,
        quantidade,
        valor,
        nomes_leads: nomes,
        percentual_total: Math.round(percentualTotal * 10) / 10,
        taxa_conversao: Math.round(taxaConversao * 10) / 10,
        color: stage.color || '#666',
        tipo,
        sort: stage.sort,
      };
    });

    // Calcular taxa de conversão geral (primeiro → último estágio ativo)
    const primeirStage = funnelData.find((s: any) => s.tipo === 'active');
    const ultimoStage = [...funnelData].reverse().find((s: any) => s.tipo === 'active');
    const taxaGeralConversao = primeirStage && ultimoStage && primeirStage.quantidade > 0
      ? (ultimoStage.quantidade / primeirStage.quantidade) * 100
      : 0;

    // Buscar última sincronização
    const { data: ultimaSnap } = await supabase
      .from('kommo_snapshots')
      .select('sincronizado_em')
      .eq('pipeline_ref_id', pipeline.id)
      .order('sincronizado_em', { ascending: false })
      .limit(1);

    const ultimaSync = ultimaSnap?.[0]?.sincronizado_em || null;

    return NextResponse.json({
      pipeline: {
        id: pipeline.id,
        pipeline_id_kommo: pipeline.pipeline_id_kommo,
        nome: pipeline.nome,
      },
      funil: funnelData,
      resumo: {
        total_leads: totalLeads,
        total_estagios: funnelData.length,
        taxa_geral_conversao: Math.round(taxaGeralConversao * 10) / 10,
        departamento: departamento || 'all',
      },
      ultima_sync: ultimaSync,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
