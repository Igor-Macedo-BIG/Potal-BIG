'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  RefreshCw,
  CheckCircle2,
  XCircle,
  Loader2,
  Trash2,
  Plus,
  Pencil,
  Settings,
  Activity,
  Users,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Eye,
  EyeOff,
  Calendar,
  Save,
  X,
  Plug,
  GitBranch,
  BarChart3,
  ArrowRightLeft,
} from 'lucide-react';

// ============================================
// Tipos
// ============================================

interface KommoStage {
  id: number;
  name: string;
  sort: number;
  color: string;
  type?: number;
}

interface KommoPipeline {
  id: string;
  pipeline_id_kommo: number;
  nome: string;
  stages: KommoStage[];
  mapeamento_departamentos: {
    sdr?: number[];
    closer?: number[];
  };
  funil_id: string | null;
  ativo: boolean;
}

interface IntegracaoKommo {
  id: string;
  nome: string;
  subdominio: string;
  ativo: boolean;
  funil_id: string | null;
  ultima_sincronizacao: string | null;
  erro_sincronizacao: string | null;
  created_at: string;
  updated_at: string;
  pipelines: KommoPipeline[];
}

interface FunilOption {
  id: string;
  nome: string;
}

interface SyncLog {
  id: string;
  status: string;
  pipeline_id_kommo: number;
  periodo_inicio: string | null;
  periodo_fim: string | null;
  total_leads: number;
  leads_por_estagio: Array<{
    stage_id: number;
    stage_nome: string;
    quantidade: number;
    valor: number;
  }>;
  erro_detalhe: string | null;
  iniciado_em: string;
  finalizado_em: string | null;
}

// ============================================
// Componente Principal
// ============================================

export function KommoIntegrationCard({ empresaId }: { empresaId?: string }) {
  const { isClean } = useTheme();
  const [integracoes, setIntegracoes] = useState<IntegracaoKommo[]>([]);
  const [funis, setFunis] = useState<FunilOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [criandoNova, setCriandoNova] = useState(false);
  const [novaIntegracao, setNovaIntegracao] = useState({
    nome: '',
    subdominio: '',
    access_token: '',
    funil_id: '',
  });
  const [mostrarToken, setMostrarToken] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [sincronizandoId, setSincronizandoId] = useState<string | null>(null);
  const [testando, setTestando] = useState(false);
  const [testeResult, setTesteResult] = useState<{ valido: boolean; nome_conta?: string; erro?: string } | null>(null);

  // Pipeline mapping state
  const [mapeandoPipelineId, setMapeandoPipelineId] = useState<string | null>(null);
  const [mapeamentoTemp, setMapeamentoTemp] = useState<{ sdr: number[]; closer: number[] }>({ sdr: [], closer: [] });
  const [salvandoMapeamento, setSalvandoMapeamento] = useState(false);
  const [funilPipelineTemp, setFunilPipelineTemp] = useState<string>('');

  // Métricas config state
  const [metricasConfig, setMetricasConfig] = useState<any[]>([]);
  const [metricasConfigLoading, setMetricasConfigLoading] = useState(false);
  const [metricasConfigDept, setMetricasConfigDept] = useState<'sdr' | 'closer'>('sdr');
  const [editandoMetricaId, setEditandoMetricaId] = useState<string | null>(null);
  const [editTemp, setEditTemp] = useState<{ nome_display: string; descricao: string }>({ nome_display: '', descricao: '' });
  const [salvandoMetricaConfig, setSalvandoMetricaConfig] = useState(false);
  const [showMetricasConfig, setShowMetricasConfig] = useState(false);

  const buildUrl = useCallback((path: string) => {
    if (!empresaId) return path;
    const sep = path.includes('?') ? '&' : '?';
    return `${path}${sep}empresa_id=${empresaId}`;
  }, [empresaId]);

  const carregarIntegracoes = useCallback(async () => {
    try {
      const res = await fetch(buildUrl('/api/kommo/config'));
      if (!res.ok) throw new Error('Erro ao carregar');
      const data = await res.json();
      setIntegracoes(data.integracoes || []);
    } catch (error) {
      console.error('Erro ao carregar integrações Kommo:', error);
    } finally {
      setLoading(false);
    }
  }, [buildUrl]);

  const carregarFunis = useCallback(async () => {
    try {
      const res = await fetch(buildUrl('/api/funis'));
      if (!res.ok) return;
      const data = await res.json();
      setFunis((data.funis || []).map((f: any) => ({ id: f.id, nome: f.nome })));
    } catch (error) {
      console.error('Erro ao carregar funis:', error);
    }
  }, [buildUrl]);

  useEffect(() => {
    carregarIntegracoes();
    carregarFunis();
  }, [carregarIntegracoes, carregarFunis]);

  // ---- Testar conexão ----
  const testarConexao = async () => {
    if (!novaIntegracao.subdominio.trim() || !novaIntegracao.access_token.trim()) {
      toast.error('Subdomínio e token são obrigatórios');
      return;
    }
    setTestando(true);
    setTesteResult(null);
    try {
      const res = await fetch(buildUrl('/api/kommo/config'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test',
          subdominio: novaIntegracao.subdominio.trim(),
          access_token: novaIntegracao.access_token.trim(),
        }),
      });
      const data = await res.json();
      setTesteResult(data);
      if (data.valido) {
        toast.success(`Conectado! Conta: ${data.nome_conta}`);
        if (!novaIntegracao.nome) {
          setNovaIntegracao(prev => ({ ...prev, nome: `Kommo - ${data.nome_conta}` }));
        }
      } else {
        toast.error(`Falha: ${data.erro}`);
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setTestando(false);
    }
  };

  // ---- Criar integração ----
  const criarIntegracao = async () => {
    if (!novaIntegracao.subdominio.trim() || !novaIntegracao.access_token.trim()) {
      toast.error('Subdomínio e token são obrigatórios');
      return;
    }
    try {
      const res = await fetch(buildUrl('/api/kommo/config'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novaIntegracao),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erro ao criar');
      }
      const data = await res.json();
      toast.success(`Integração criada! ${data.pipelines?.length || 0} pipeline(s) encontrada(s)`);
      setCriandoNova(false);
      setNovaIntegracao({ nome: '', subdominio: '', access_token: '', funil_id: '' });
      setMostrarToken(false);
      setTesteResult(null);
      carregarIntegracoes();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  // ---- Toggle ativo ----
  const toggleAtivo = async (integ: IntegracaoKommo) => {
    try {
      await fetch(buildUrl('/api/kommo/config'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: integ.id, ativo: !integ.ativo }),
      });
      toast.success(integ.ativo ? 'Integração desativada' : 'Integração ativada');
      carregarIntegracoes();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  // ---- Remover ----
  const removerIntegracao = async (id: string) => {
    if (!confirm('Remover integração Kommo? Snapshots e logs serão excluídos.')) return;
    try {
      const res = await fetch(buildUrl(`/api/kommo/config?id=${id}`), { method: 'DELETE' });
      if (!res.ok) throw new Error('Erro ao remover');
      toast.success('Integração removida');
      carregarIntegracoes();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  // ---- Re-sync pipelines ----
  const resyncPipelines = async (integId: string) => {
    try {
      const res = await fetch(buildUrl('/api/kommo/pipelines'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ integracao_id: integId }),
      });
      if (!res.ok) throw new Error('Erro ao re-sincronizar');
      const data = await res.json();
      toast.success(`${data.pipelines?.length || 0} pipeline(s) atualizada(s)`);
      carregarIntegracoes();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  // ---- Sincronizar leads ----
  const sincronizarLeads = async (integId: string, pipelineId?: string) => {
    setSincronizandoId(integId);
    try {
      const res = await fetch(buildUrl('/api/kommo/sync'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          integracao_id: integId,
          pipeline_id: pipelineId || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erro ao sincronizar');
      }
      const data = await res.json();
      const total = data.resultados?.reduce((s: number, r: any) => s + r.total_leads, 0) || 0;
      toast.success(`Sincronizado! ${total} lead(s) encontrado(s)`);
      carregarIntegracoes();
      // Recarregar logs se expandido
      if (expandedId === integId) {
        carregarLogs(integId);
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSincronizandoId(null);
    }
  };

  // ---- Carregar logs ----
  const carregarLogs = async (integId: string) => {
    setLogsLoading(true);
    try {
      const res = await fetch(buildUrl(`/api/kommo/sync?integracao_id=${integId}&limit=10`));
      if (!res.ok) throw new Error('Erro');
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (error) {
      console.error('Erro ao carregar logs:', error);
    } finally {
      setLogsLoading(false);
    }
  };

  // ---- Expandir/recolher ----
  const toggleExpand = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      carregarLogs(id);
    }
  };

  // ---- Métricas Config ----
  const carregarMetricasConfig = async (dept?: 'sdr' | 'closer') => {
    setMetricasConfigLoading(true);
    try {
      const d = dept || metricasConfigDept;
      const res = await fetch(buildUrl(`/api/dashboard/metricas-config?departamento=${d}`));
      if (!res.ok) throw new Error('Erro');
      const data = await res.json();
      setMetricasConfig(data.configs || []);
    } catch (error) {
      console.error('Erro ao carregar métricas config:', error);
    } finally {
      setMetricasConfigLoading(false);
    }
  };

  const seedMetricasConfig = async () => {
    setMetricasConfigLoading(true);
    try {
      const res = await fetch(buildUrl('/api/dashboard/metricas-config'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'seed' }),
      });
      if (!res.ok) throw new Error('Erro ao criar');
      const data = await res.json();
      toast.success(`${data.total} métricas configuradas!`);
      carregarMetricasConfig();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setMetricasConfigLoading(false);
    }
  };

  const toggleMetricaVisivel = async (config: any) => {
    try {
      const res = await fetch(buildUrl('/api/dashboard/metricas-config'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: config.id, visivel: !config.visivel }),
      });
      if (!res.ok) throw new Error('Erro');
      carregarMetricasConfig();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const salvarEditMetrica = async (configId: string) => {
    setSalvandoMetricaConfig(true);
    try {
      const res = await fetch(buildUrl('/api/dashboard/metricas-config'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: configId,
          nome_display: editTemp.nome_display,
          descricao: editTemp.descricao,
        }),
      });
      if (!res.ok) throw new Error('Erro');
      toast.success('Métrica atualizada!');
      setEditandoMetricaId(null);
      carregarMetricasConfig();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSalvandoMetricaConfig(false);
    }
  };

  // ---- Mapeamento de departamentos ----
  const iniciarMapeamento = (pipeline: KommoPipeline) => {
    setMapeandoPipelineId(pipeline.id);
    setMapeamentoTemp({
      sdr: pipeline.mapeamento_departamentos?.sdr || [],
      closer: pipeline.mapeamento_departamentos?.closer || [],
    });
    setFunilPipelineTemp(pipeline.funil_id || '');
  };

  const toggleStageDepartamento = (stageId: number, dept: 'sdr' | 'closer') => {
    setMapeamentoTemp(prev => {
      const outro = dept === 'sdr' ? 'closer' : 'sdr';
      const current = prev[dept];
      const isIn = current.includes(stageId);

      return {
        ...prev,
        [dept]: isIn ? current.filter(id => id !== stageId) : [...current, stageId],
        // Remover do outro departamento se estiver lá
        [outro]: prev[outro].filter(id => id !== stageId),
      };
    });
  };

  const salvarMapeamento = async (pipelineId: string) => {
    setSalvandoMapeamento(true);
    try {
      const res = await fetch(buildUrl('/api/kommo/pipelines'), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pipeline_id: pipelineId,
          mapeamento_departamentos: mapeamentoTemp,
          funil_id: funilPipelineTemp || null,
        }),
      });
      if (!res.ok) throw new Error('Erro ao salvar');
      toast.success('Mapeamento de departamentos salvo!');
      setMapeandoPipelineId(null);
      carregarIntegracoes();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSalvandoMapeamento(false);
    }
  };

  // ---- Formato helpers ----
  const formatDate = (d: string | null) => {
    if (!d) return 'Nunca';
    return new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-emerald-500/20 text-emerald-400';
      case 'partial': return 'bg-yellow-500/20 text-yellow-400';
      case 'error': return 'bg-red-500/20 text-red-400';
      case 'running': return 'bg-blue-500/20 text-blue-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <Card className={isClean ? 'border-amber-200 bg-white' : 'border-purple-500/30 bg-gray-900/50'}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn('p-2 rounded-lg', isClean ? 'bg-amber-50' : 'bg-purple-500/20')}>
              <Plug className={cn('h-5 w-5', isClean ? 'text-amber-600' : 'text-purple-400')} />
            </div>
            <div>
              <CardTitle className={isClean ? 'text-gray-900' : 'text-white'}>Kommo CRM</CardTitle>
              <CardDescription className={isClean ? 'text-gray-500' : 'text-gray-400'}>
                Integração com o CRM para métricas de pipeline (SDR + Closer)
              </CardDescription>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCriandoNova(!criandoNova)}
            className={isClean ? 'border-amber-200 text-amber-600 hover:bg-amber-50' : 'border-purple-500/50 text-purple-400 hover:bg-purple-500/10'}
          >
            <Plus className="h-4 w-4 mr-1" />
            Nova Integração
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* ---- FORM NOVA INTEGRAÇÃO ---- */}
        {criandoNova && (
          <div className={cn('border rounded-lg p-4 space-y-4', isClean ? 'border-amber-200 bg-amber-50/50' : 'border-purple-500/30 bg-purple-500/5')}>
            <h4 className={cn('text-sm font-semibold flex items-center gap-2', isClean ? 'text-amber-700' : 'text-purple-300')}>
              <Settings className="h-4 w-4" /> Nova conexão Kommo
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className={cn('text-xs', isClean ? 'text-gray-600' : 'text-gray-300')}>Subdomínio Kommo *</Label>
                <div className="flex items-center gap-1">
                  <span className={cn('text-xs', isClean ? 'text-gray-400' : 'text-gray-500')}>https://</span>
                  <Input
                    value={novaIntegracao.subdominio}
                    onChange={(e) => setNovaIntegracao(prev => ({ ...prev, subdominio: e.target.value }))}
                    placeholder="lidiacabralconsultoria"
                    className={cn('text-sm', isClean ? 'bg-white border-gray-200 text-gray-700' : 'bg-gray-800 border-gray-700 text-white')}
                  />
                  <span className={cn('text-xs', isClean ? 'text-gray-400' : 'text-gray-500')}>.kommo.com</span>
                </div>
              </div>

              <div>
                <Label className={cn('text-xs', isClean ? 'text-gray-600' : 'text-gray-300')}>Nome (opcional)</Label>
                <Input
                  value={novaIntegracao.nome}
                  onChange={(e) => setNovaIntegracao(prev => ({ ...prev, nome: e.target.value }))}
                  placeholder="Kommo CRM Principal"
                  className={cn('text-sm', isClean ? 'bg-white border-gray-200 text-gray-700' : 'bg-gray-800 border-gray-700 text-white')}
                />
              </div>
            </div>

            <div>
              <Label className={cn('text-xs', isClean ? 'text-gray-600' : 'text-gray-300')}>Long-lived Token *</Label>
              <div className="flex items-center gap-2">
                <Input
                  type={mostrarToken ? 'text' : 'password'}
                  value={novaIntegracao.access_token}
                  onChange={(e) => setNovaIntegracao(prev => ({ ...prev, access_token: e.target.value }))}
                  placeholder="eyJ0eXAiOiJKV1QiLCJhbGciOi..."
                  className={cn('text-sm font-mono', isClean ? 'bg-white border-gray-200 text-gray-700' : 'bg-gray-800 border-gray-700 text-white')}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMostrarToken(!mostrarToken)}
                  className={isClean ? 'text-gray-500' : 'text-gray-400'}
                >
                  {mostrarToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className={cn('text-[10px] mt-1', isClean ? 'text-gray-400' : 'text-gray-500')}>
                Configurações → Integrações → Criar integração → Keys and scopes → Generate long-lived token
              </p>
            </div>

            {/* Resultado do teste */}
            {testeResult && (
              <div className={`flex items-center gap-2 p-2 rounded ${testeResult.valido ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                {testeResult.valido ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                <span className="text-xs">
                  {testeResult.valido ? `Conectado! Conta: ${testeResult.nome_conta}` : `Erro: ${testeResult.erro}`}
                </span>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={testarConexao}
                disabled={testando}
                className={isClean ? 'border-amber-200 text-amber-600' : 'border-purple-500/50 text-purple-300'}
              >
                {testando ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Activity className="h-3 w-3 mr-1" />}
                Testar Conexão
              </Button>

              <Button
                size="sm"
                onClick={criarIntegracao}
                disabled={!testeResult?.valido}
                className={isClean ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'bg-purple-600 hover:bg-purple-700 text-white'}
              >
                <Plus className="h-3 w-3 mr-1" />
                Criar e Sincronizar Pipelines
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setCriandoNova(false); setTesteResult(null); }}
                className={isClean ? 'text-gray-500' : 'text-gray-400'}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {/* ---- LOADING ---- */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className={cn('h-6 w-6 animate-spin', isClean ? 'text-amber-600' : 'text-purple-400')} />
          </div>
        )}

        {/* ---- LISTA VAZIA ---- */}
        {!loading && integracoes.length === 0 && !criandoNova && (
          <div className={cn('text-center py-8', isClean ? 'text-gray-400' : 'text-gray-500')}>
            <Plug className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhuma integração Kommo configurada</p>
            <p className="text-xs mt-1">Clique em &quot;Nova Integração&quot; para conectar seu CRM</p>
          </div>
        )}

        {/* ---- LISTA DE INTEGRAÇÕES ---- */}
        {integracoes.map((integ) => (
          <div key={integ.id} className={cn('border rounded-lg overflow-hidden', isClean ? 'border-gray-200' : 'border-gray-700/50')}>
            {/* Header da integração */}
            <div className={cn('flex items-center justify-between p-3', isClean ? 'bg-gray-50' : 'bg-gray-800/30')}>
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${integ.ativo ? 'bg-emerald-400' : 'bg-gray-500'}`} />
                <div>
                  <div className="flex items-center gap-2">
                    <span className={cn('text-sm font-medium', isClean ? 'text-gray-900' : 'text-white')}>{integ.nome}</span>
                    <Badge variant="outline" className={cn('text-[10px]', isClean ? 'border-amber-200 text-amber-600' : 'border-purple-500/30 text-purple-300')}>
                      {integ.subdominio}.kommo.com
                    </Badge>
                    {integ.pipelines.length > 0 && (
                      <Badge variant="outline" className="text-[10px] border-blue-500/30 text-blue-300">
                        <GitBranch className="h-3 w-3 mr-1" />
                        {integ.pipelines.length} pipeline(s)
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className={cn('text-[10px]', isClean ? 'text-gray-400' : 'text-gray-500')}>
                      Último sync: {formatDate(integ.ultima_sincronizacao)}
                    </span>
                    {integ.erro_sincronizacao && (
                      <span className="text-red-400 text-[10px]">⚠ {integ.erro_sincronizacao.substring(0, 60)}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => sincronizarLeads(integ.id)}
                  disabled={sincronizandoId === integ.id || !integ.ativo}
                  className={cn('h-7 px-2', isClean ? 'text-amber-600 hover:text-amber-700' : 'text-purple-400 hover:text-purple-300')}
                  title="Sincronizar leads"
                >
                  {sincronizandoId === integ.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5" />
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => resyncPipelines(integ.id)}
                  className="text-blue-400 hover:text-blue-300 h-7 px-2"
                  title="Re-sincronizar pipelines"
                >
                  <GitBranch className="h-3.5 w-3.5" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleAtivo(integ)}
                  className={`h-7 px-2 ${integ.ativo ? 'text-emerald-400' : 'text-gray-500'}`}
                  title={integ.ativo ? 'Desativar' : 'Ativar'}
                >
                  {integ.ativo ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleExpand(integ.id)}
                  className={cn('h-7 px-2', isClean ? 'text-gray-500' : 'text-gray-400')}
                >
                  {expandedId === integ.id ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removerIntegracao(integ.id)}
                  className="text-red-400 hover:text-red-300 h-7 px-2"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* ---- EXPANDED: Pipelines + Mapeamento + Logs ---- */}
            {expandedId === integ.id && (
              <div className={cn('border-t p-4 space-y-4', isClean ? 'border-gray-200' : 'border-gray-700/30')}>

                {/* Pipelines */}
                <div>
                  <h4 className={cn('text-xs font-semibold mb-2 flex items-center gap-2', isClean ? 'text-gray-600' : 'text-gray-300')}>
                    <GitBranch className="h-3.5 w-3.5 text-blue-400" />
                    Pipelines ({integ.pipelines.length})
                  </h4>

                  {integ.pipelines.length === 0 ? (
                    <p className={cn('text-xs', isClean ? 'text-gray-400' : 'text-gray-500')}>Nenhuma pipeline encontrada. Clique no ícone de pipeline para re-sincronizar.</p>
                  ) : (
                    <div className="space-y-3">
                      {integ.pipelines.map((pipeline) => (
                        <div key={pipeline.id} className={cn('border rounded-lg p-3', isClean ? 'border-gray-200 bg-gray-50' : 'border-gray-700/30 bg-gray-800/20')}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className={cn('text-sm font-medium', isClean ? 'text-gray-900' : 'text-white')}>{pipeline.nome}</span>
                              <Badge variant="outline" className="text-[10px]">
                                ID: {pipeline.pipeline_id_kommo}
                              </Badge>
                              <Badge variant="outline" className="text-[10px]">
                                {pipeline.stages.length} estágios
                              </Badge>
                              {pipeline.funil_id && (
                                <Badge className={cn('text-[10px]', isClean ? 'bg-amber-50 text-amber-600' : 'bg-cyan-500/20 text-cyan-300')}>
                                  Funil vinculado
                                </Badge>
                              )}
                              {(pipeline.mapeamento_departamentos?.sdr?.length || 0) > 0 && (
                                <Badge className="text-[10px] bg-blue-500/20 text-blue-300">
                                  SDR: {pipeline.mapeamento_departamentos.sdr!.length} estágios
                                </Badge>
                              )}
                              {(pipeline.mapeamento_departamentos?.closer?.length || 0) > 0 && (
                                <Badge className="text-[10px] bg-orange-500/20 text-orange-300">
                                  Closer: {pipeline.mapeamento_departamentos.closer!.length} estágios
                                </Badge>
                              )}
                            </div>

                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => sincronizarLeads(integ.id, pipeline.id)}
                                disabled={sincronizandoId === integ.id}
                                className={cn('h-6 px-2 text-[10px]', isClean ? 'text-amber-600' : 'text-purple-400')}
                              >
                                <RefreshCw className="h-3 w-3 mr-1" />
                                Sync
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  if (mapeandoPipelineId === pipeline.id) {
                                    setMapeandoPipelineId(null);
                                  } else {
                                    iniciarMapeamento(pipeline);
                                  }
                                }}
                                className={cn('h-6 px-2 text-[10px]', isClean ? 'text-amber-600' : 'text-cyan-400')}
                              >
                                <ArrowRightLeft className="h-3 w-3 mr-1" />
                                Mapear Departamentos
                              </Button>
                            </div>
                          </div>

                          {/* Estágios da pipeline (mini lista) */}
                          {mapeandoPipelineId !== pipeline.id && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {pipeline.stages
                                .sort((a, b) => a.sort - b.sort)
                                .map((stage) => {
                                  const isSdr = pipeline.mapeamento_departamentos?.sdr?.includes(stage.id);
                                  const isCloser = pipeline.mapeamento_departamentos?.closer?.includes(stage.id);
                                  return (
                                    <span
                                      key={stage.id}
                                      className={`text-[9px] px-1.5 py-0.5 rounded-full border ${
                                        isSdr
                                          ? 'border-blue-500/40 bg-blue-500/10 text-blue-300'
                                          : isCloser
                                            ? 'border-orange-500/40 bg-orange-500/10 text-orange-300'
                                            : 'border-gray-600/40 bg-gray-700/20 text-gray-400'
                                      }`}
                                    >
                                      {stage.name}
                                    </span>
                                  );
                                })}
                            </div>
                          )}

                          {/* ---- MAPEAMENTO DE DEPARTAMENTOS ---- */}
                          {mapeandoPipelineId === pipeline.id && (
                            <div className={cn('mt-3 border rounded-lg p-3 space-y-3', isClean ? 'border-amber-200 bg-amber-50/50' : 'border-cyan-500/30 bg-cyan-500/5')}>
                              <h5 className={cn('text-xs font-semibold', isClean ? 'text-amber-700' : 'text-cyan-300')}>
                                Mapear estágios → Departamentos
                              </h5>
                              <p className={cn('text-[10px]', isClean ? 'text-gray-500' : 'text-gray-400')}>
                                Clique nos botões SDR ou Closer para cada estágio. Estágios SDR alimentam a aba SDR; estágios Closer alimentam a aba Closer.
                              </p>

                              {/* Funil vinculado */}
                              <div>
                                <Label className={cn('text-[10px]', isClean ? 'text-gray-600' : 'text-gray-300')}>Funil interno vinculado</Label>
                                <select
                                  value={funilPipelineTemp}
                                  onChange={(e) => setFunilPipelineTemp(e.target.value)}
                                  className={cn('w-full mt-1 border rounded text-xs p-1.5', isClean ? 'bg-white border-gray-200 text-gray-700' : 'bg-gray-800 border-gray-700 text-white')}
                                >
                                  <option value="">Selecionar funil...</option>
                                  {funis.map((f) => (
                                    <option key={f.id} value={f.id}>{f.nome}</option>
                                  ))}
                                </select>
                              </div>

                              {/* Lista de estágios com botões */}
                              <div className="space-y-1">
                                {pipeline.stages
                                  .sort((a, b) => a.sort - b.sort)
                                  .map((stage) => {
                                    const isSdr = mapeamentoTemp.sdr.includes(stage.id);
                                    const isCloser = mapeamentoTemp.closer.includes(stage.id);
                                    return (
                                      <div key={stage.id} className={cn('flex items-center justify-between py-1 px-2 rounded', isClean ? 'bg-gray-50' : 'bg-gray-800/30')}>
                                        <span className={cn('text-xs', isClean ? 'text-gray-900' : 'text-white')}>{stage.name}</span>
                                        <div className="flex gap-1">
                                          <button
                                            onClick={() => toggleStageDepartamento(stage.id, 'sdr')}
                                            className={`text-[10px] px-2 py-0.5 rounded ${
                                              isSdr
                                                ? 'bg-blue-500 text-white'
                                                : isClean
                                                  ? 'bg-gray-100 text-gray-500 hover:bg-blue-50'
                                                  : 'bg-gray-700 text-gray-400 hover:bg-blue-500/20'
                                            }`}
                                          >
                                            SDR
                                          </button>
                                          <button
                                            onClick={() => toggleStageDepartamento(stage.id, 'closer')}
                                            className={`text-[10px] px-2 py-0.5 rounded ${
                                              isCloser
                                                ? 'bg-orange-500 text-white'
                                                : isClean
                                                  ? 'bg-gray-100 text-gray-500 hover:bg-orange-50'
                                                  : 'bg-gray-700 text-gray-400 hover:bg-orange-500/20'
                                            }`}
                                          >
                                            Closer
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                              </div>

                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => salvarMapeamento(pipeline.id)}
                                  disabled={salvandoMapeamento}
                                  className={cn('text-white text-xs h-7', isClean ? 'bg-amber-600 hover:bg-amber-700' : 'bg-cyan-600 hover:bg-cyan-700')}
                                >
                                  {salvandoMapeamento ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Save className="h-3 w-3 mr-1" />}
                                  Salvar Mapeamento
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setMapeandoPipelineId(null)}
                                  className={cn('text-xs h-7', isClean ? 'text-gray-500' : 'text-gray-400')}
                                >
                                  <X className="h-3 w-3 mr-1" /> Cancelar
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Logs de sincronização */}
                <div>
                  <h4 className={cn('text-xs font-semibold mb-2 flex items-center gap-2', isClean ? 'text-gray-600' : 'text-gray-300')}>
                    <Activity className={cn('h-3.5 w-3.5', isClean ? 'text-amber-600' : 'text-purple-400')} />
                    Histórico de Sincronizações
                  </h4>

                  {logsLoading ? (
                    <div className={cn('flex items-center gap-2 text-xs py-2', isClean ? 'text-gray-400' : 'text-gray-500')}>
                      <Loader2 className="h-3 w-3 animate-spin" /> Carregando...
                    </div>
                  ) : logs.length === 0 ? (
                    <p className={cn('text-xs', isClean ? 'text-gray-400' : 'text-gray-500')}>Nenhuma sincronização realizada</p>
                  ) : (
                    <div className="space-y-1 max-h-60 overflow-y-auto">
                      {logs.map((log) => (
                        <div key={log.id} className={cn('flex items-center justify-between py-1.5 px-2 rounded text-xs', isClean ? 'bg-gray-50' : 'bg-gray-800/20')}>
                          <div className="flex items-center gap-2">
                            <Badge className={`text-[9px] ${getStatusColor(log.status)}`}>
                              {log.status}
                            </Badge>
                            <span className={isClean ? 'text-gray-600' : 'text-gray-300'}>{log.total_leads} leads</span>
                            {log.leads_por_estagio && log.leads_por_estagio.length > 0 && (
                              <span className={isClean ? 'text-gray-400' : 'text-gray-500'}>
                                ({log.leads_por_estagio.length} estágios)
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={isClean ? 'text-gray-400' : 'text-gray-500'}>{formatDate(log.iniciado_em)}</span>
                            {log.erro_detalhe && (
                              <span className="text-red-400 text-[10px] max-w-[200px] truncate" title={log.erro_detalhe}>
                                ⚠ {log.erro_detalhe}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* ---- CONFIGURAR MÉTRICAS DO DASHBOARD ---- */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className={cn('text-xs font-semibold flex items-center gap-2', isClean ? 'text-gray-600' : 'text-gray-300')}>
                      <BarChart3 className={cn('h-3.5 w-3.5', isClean ? 'text-amber-600' : 'text-cyan-400')} />
                      Métricas do Dashboard
                    </h4>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (showMetricasConfig) {
                            setShowMetricasConfig(false);
                          } else {
                            setShowMetricasConfig(true);
                            carregarMetricasConfig();
                          }
                        }}
                        className={cn('h-6 px-2 text-[10px]', isClean ? 'text-amber-600' : 'text-cyan-400')}
                      >
                        <Settings className="h-3 w-3 mr-1" />
                        {showMetricasConfig ? 'Fechar' : 'Configurar'}
                      </Button>
                    </div>
                  </div>

                  {showMetricasConfig && (
                    <div className={cn('border rounded-lg p-3 space-y-3', isClean ? 'border-amber-200 bg-amber-50/50' : 'border-cyan-500/30 bg-cyan-500/5')}>
                      {/* Tabs SDR / Closer */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { setMetricasConfigDept('sdr'); carregarMetricasConfig('sdr'); }}
                          className={`text-xs px-3 py-1 rounded ${metricasConfigDept === 'sdr' ? 'bg-blue-500 text-white' : isClean ? 'bg-gray-100 text-gray-500 hover:bg-blue-50' : 'bg-gray-700 text-gray-400 hover:bg-blue-500/20'}`}
                        >
                          SDR
                        </button>
                        <button
                          onClick={() => { setMetricasConfigDept('closer'); carregarMetricasConfig('closer'); }}
                          className={`text-xs px-3 py-1 rounded ${metricasConfigDept === 'closer' ? 'bg-orange-500 text-white' : isClean ? 'bg-gray-100 text-gray-500 hover:bg-orange-50' : 'bg-gray-700 text-gray-400 hover:bg-orange-500/20'}`}
                        >
                          Closer
                        </button>
                        <div className="flex-1" />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={seedMetricasConfig}
                          disabled={metricasConfigLoading}
                          className="text-emerald-400 h-6 px-2 text-[10px]"
                        >
                          {metricasConfigLoading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Plus className="h-3 w-3 mr-1" />}
                          Detectar automaticamente
                        </Button>
                      </div>

                      <p className={cn('text-[10px]', isClean ? 'text-gray-500' : 'text-gray-400')}>
                        Renomeie métricas, adicione descrições e defina quais aparecem no dashboard. O nome &quot;Backend&quot; é técnico (read-only), o &quot;Dashboard&quot; é o que o cliente vê.
                      </p>

                      {metricasConfigLoading ? (
                        <div className={cn('flex items-center gap-2 py-4 text-xs justify-center', isClean ? 'text-gray-400' : 'text-gray-500')}>
                          <Loader2 className="h-3 w-3 animate-spin" /> Carregando...
                        </div>
                      ) : metricasConfig.length === 0 ? (
                        <div className={cn('text-center py-4 text-xs', isClean ? 'text-gray-400' : 'text-gray-500')}>
                          <p>Nenhuma métrica configurada.</p>
                          <p className="mt-1">Clique em &quot;Detectar automaticamente&quot; para criar as métricas padrão.</p>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {/* Header */}
                          <div className={cn('grid grid-cols-12 gap-2 text-[9px] uppercase tracking-wider px-2 pb-1 border-b', isClean ? 'text-gray-400 border-gray-200' : 'text-gray-500 border-gray-700/30')}>
                            <div className="col-span-1">Ativo</div>
                            <div className="col-span-3">Backend (técnico)</div>
                            <div className="col-span-4">Nome no Dashboard</div>
                            <div className="col-span-3">Descrição</div>
                            <div className="col-span-1">Ação</div>
                          </div>

                          {metricasConfig.map((config) => (
                            <div key={config.id} className={`grid grid-cols-12 gap-2 items-center py-1.5 px-2 rounded text-xs ${config.visivel ? (isClean ? 'bg-gray-50' : 'bg-gray-800/30') : (isClean ? 'bg-gray-50/50 opacity-60' : 'bg-gray-800/10 opacity-60')}`}>
                              {/* Toggle visível */}
                              <div className="col-span-1">
                                <button
                                  onClick={() => toggleMetricaVisivel(config)}
                                  className={`p-0.5 rounded ${config.visivel ? 'text-emerald-400' : 'text-gray-600'}`}
                                >
                                  {config.visivel ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                                </button>
                              </div>

                              {/* Nome backend (read-only) */}
                              <div className="col-span-3">
                                <span className={cn('font-mono text-[10px]', isClean ? 'text-gray-400' : 'text-gray-500')}>{config.metrica_key}</span>
                              </div>

                              {/* Nome display (editável) */}
                              <div className="col-span-4">
                                {editandoMetricaId === config.id ? (
                                  <Input
                                    value={editTemp.nome_display}
                                    onChange={(e) => setEditTemp(prev => ({ ...prev, nome_display: e.target.value }))}
                                    className={cn('text-[10px] h-6 px-1', isClean ? 'bg-white border-gray-200 text-gray-700' : 'bg-gray-800 border-gray-700 text-white')}
                                  />
                                ) : (
                                  <span className={cn('text-[11px]', isClean ? 'text-gray-900' : 'text-white')}>{config.nome_display}</span>
                                )}
                              </div>

                              {/* Descrição */}
                              <div className="col-span-3">
                                {editandoMetricaId === config.id ? (
                                  <Input
                                    value={editTemp.descricao}
                                    onChange={(e) => setEditTemp(prev => ({ ...prev, descricao: e.target.value }))}
                                    placeholder="Observação..."
                                    className={cn('text-[10px] h-6 px-1', isClean ? 'bg-white border-gray-200 text-gray-700' : 'bg-gray-800 border-gray-700 text-white')}
                                  />
                                ) : (
                                  <span className={cn('text-[10px] truncate block', isClean ? 'text-gray-400' : 'text-gray-500')} title={config.descricao}>
                                    {config.descricao || '—'}
                                  </span>
                                )}
                              </div>

                              {/* Ações */}
                              <div className="col-span-1 flex gap-0.5">
                                {editandoMetricaId === config.id ? (
                                  <>
                                    <button
                                      onClick={() => salvarEditMetrica(config.id)}
                                      disabled={salvandoMetricaConfig}
                                      className="text-emerald-400 p-0.5 rounded hover:bg-emerald-500/10"
                                    >
                                      {salvandoMetricaConfig ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                                    </button>
                                    <button
                                      onClick={() => setEditandoMetricaId(null)}
                                      className={cn('p-0.5 rounded', isClean ? 'text-gray-500 hover:bg-gray-100' : 'text-gray-400 hover:bg-gray-500/10')}
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setEditandoMetricaId(config.id);
                                      setEditTemp({ nome_display: config.nome_display, descricao: config.descricao || '' });
                                    }}
                                    className={cn('p-0.5 rounded', isClean ? 'text-amber-600 hover:bg-amber-50' : 'text-cyan-400 hover:bg-cyan-500/10')}
                                  >
                                    <Pencil className="h-3 w-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Link externo */}
                <div className={cn('flex items-center gap-2 pt-2 border-t', isClean ? 'border-gray-200' : 'border-gray-700/30')}>
                  <a
                    href={`https://${integ.subdominio}.kommo.com`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn('text-xs flex items-center gap-1', isClean ? 'text-amber-600 hover:text-amber-700' : 'text-purple-400 hover:text-purple-300')}
                  >
                    <ExternalLink className="h-3 w-3" /> Abrir Kommo CRM
                  </a>
                </div>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
