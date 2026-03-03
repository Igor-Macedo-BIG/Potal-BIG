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
  Bot,
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
} from 'lucide-react';

// ============================================
// Tipos
// ============================================

interface IntegracaoTypebot {
  id: string;
  nome: string;
  typebot_id: string;
  ativo: boolean;
  variavel_nome: string;
  variavel_email: string;
  base_url: string | null;
  funil_id: string | null;
  ultima_sincronizacao: string | null;
  erro_sincronizacao: string | null;
  total_sincronizados: number;
  created_at: string;
}

interface FunilOption {
  id: string;
  nome: string;
}

interface SyncLog {
  id: string;
  status: string;
  periodo_inicio: string;
  periodo_fim: string;
  total_resultados: number;
  iniciados: number;
  concluidos: number;
  erro_detalhe: string | null;
  iniciado_em: string;
  finalizado_em: string | null;
}

interface NovaIntegracao {
  nome: string;
  typebot_id: string;
  api_token: string;
  base_url: string;
  funil_id: string;
  variavel_nome: string;
  variavel_email: string;
}

// ============================================
// Componente Principal
// ============================================

export function TypebotIntegrationCard({ empresaId }: { empresaId?: string }) {
  const { isClean } = useTheme();
  const [integracoes, setIntegracoes] = useState<IntegracaoTypebot[]>([]);
  const [funis, setFunis] = useState<FunilOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [criandoNova, setCriandoNova] = useState(false);
  const [novaIntegracao, setNovaIntegracao] = useState<NovaIntegracao>({
    nome: 'Formulario de Diagnostico',
    typebot_id: '',
    api_token: '',
    base_url: '',
    funil_id: '',
    variavel_nome: 'Nome',
    variavel_email: 'Email',
  });
  const [mostrarToken, setMostrarToken] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [sincronizandoId, setSincronizandoId] = useState<string | null>(null);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<NovaIntegracao>({
    nome: '', typebot_id: '', api_token: '', base_url: '', funil_id: '', variavel_nome: '', variavel_email: '',
  });
  const [editMostrarToken, setEditMostrarToken] = useState(false);
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);
  // Inicializar com strings vazias para evitar hydration mismatch (new Date() difere server/client)
  const [syncPeriodo, setSyncPeriodo] = useState({ dataInicio: '', dataFim: '' });

  // Hidratar datas apenas no client
  useEffect(() => {
    const hoje = new Date();
    const seteDias = new Date(hoje);
    seteDias.setDate(hoje.getDate() - 6);
    setSyncPeriodo({
      dataInicio: seteDias.toISOString().split('T')[0],
      dataFim: hoje.toISOString().split('T')[0],
    });
  }, []);

  const buildUrl = useCallback((path: string) => {
    if (!empresaId) return path;
    const sep = path.includes('?') ? '&' : '?';
    return `${path}${sep}empresa_id=${empresaId}`;
  }, [empresaId]);

  const carregarIntegracoes = useCallback(async () => {
    try {
      const res = await fetch(buildUrl('/api/typebot/config'));
      if (!res.ok) throw new Error('Erro ao carregar');
      const data = await res.json();
      setIntegracoes(data.integracoes || []);
    } catch (error) {
      console.error('Erro ao carregar integracoes Typebot:', error);
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

  const criarIntegracao = async () => {
    if (!novaIntegracao.typebot_id.trim() || !novaIntegracao.api_token.trim()) {
      toast.error('Typebot ID e API Token sao obrigatorios');
      return;
    }
    if (!novaIntegracao.funil_id) {
      toast.error('Selecione um funil para vincular as metricas SDR');
      return;
    }
    try {
      const res = await fetch(buildUrl('/api/typebot/config'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novaIntegracao),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erro ao criar');
      }
      toast.success('Integracao Typebot criada!');
      setCriandoNova(false);
      setNovaIntegracao({ nome: 'Formulario de Diagnostico', typebot_id: '', api_token: '', base_url: '', funil_id: '', variavel_nome: 'Nome', variavel_email: 'Email' });
      setMostrarToken(false);
      carregarIntegracoes();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const toggleAtivo = async (integracao: IntegracaoTypebot) => {
    try {
      await fetch(buildUrl('/api/typebot/config'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: integracao.id, ativo: !integracao.ativo }),
      });
      toast.success(integracao.ativo ? 'Integracao desativada' : 'Integracao ativada');
      carregarIntegracoes();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const iniciarEdicao = (integracao: IntegracaoTypebot) => {
    setEditandoId(integracao.id);
    setEditForm({
      nome: integracao.nome,
      typebot_id: integracao.typebot_id,
      api_token: '', // nao preenche por seguranca
      base_url: integracao.base_url || '',
      funil_id: integracao.funil_id || '',
      variavel_nome: integracao.variavel_nome,
      variavel_email: integracao.variavel_email,
    });
    setEditMostrarToken(false);
    // Expandir se nao estiver expandido
    if (expandedId !== integracao.id) setExpandedId(integracao.id);
  };

  const cancelarEdicao = () => {
    setEditandoId(null);
    setEditMostrarToken(false);
  };

  const salvarEdicao = async () => {
    if (!editandoId) return;
    if (!editForm.typebot_id.trim()) {
      toast.error('Typebot ID e obrigatorio');
      return;
    }
    if (!editForm.funil_id) {
      toast.error('Selecione um funil para vincular as metricas SDR');
      return;
    }
    setSalvandoEdicao(true);
    try {
      const payload: Record<string, any> = {
        id: editandoId,
        nome: editForm.nome,
        typebot_id: editForm.typebot_id,
        base_url: editForm.base_url,
        funil_id: editForm.funil_id,
        variavel_nome: editForm.variavel_nome,
        variavel_email: editForm.variavel_email,
      };
      // So envia token se o usuario digitou um novo
      if (editForm.api_token.trim()) {
        payload.api_token = editForm.api_token;
      }
      const res = await fetch(buildUrl('/api/typebot/config'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erro ao salvar');
      }
      toast.success('Integracao atualizada!');
      setEditandoId(null);
      setEditMostrarToken(false);
      carregarIntegracoes();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSalvandoEdicao(false);
    }
  };

  const removerIntegracao = async (id: string) => {
    if (!confirm('Remover esta integracao?')) return;
    try {
      await fetch(buildUrl(`/api/typebot/config?id=${id}`), { method: 'DELETE' });
      toast.success('Integracao removida');
      carregarIntegracoes();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const sincronizar = async (integracaoId: string, nome: string) => {
    setSincronizandoId(integracaoId);
    try {
      const res = await fetch(buildUrl('/api/typebot/sync'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          integracaoId,
          dataInicio: syncPeriodo.dataInicio,
          dataFim: syncPeriodo.dataFim,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao sincronizar');

      const resultado = data.resultados?.[0];
      if (resultado) {
        if (resultado.erros?.length > 0) {
          toast.error(`${nome}: ${resultado.erros[0]}`);
        } else {
          toast.success(
            `${nome}: ${resultado.iniciados} iniciados, ${resultado.concluidos} concluidos`
          );
        }
      }
      carregarIntegracoes();
      if (expandedId === integracaoId) carregarLogs(integracaoId);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSincronizandoId(null);
    }
  };

  const carregarLogs = async (integracaoId: string) => {
    setLogsLoading(true);
    try {
      const res = await fetch(buildUrl(`/api/typebot/sync?integracaoId=${integracaoId}&limit=10`));
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (error) {
      console.error('Erro ao carregar logs:', error);
    } finally {
      setLogsLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      carregarLogs(id);
    }
  };

  const formatarData = (data: string | null) => {
    if (!data) return 'Nunca';
    return new Date(data).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const statusCorLog = (status: string) => {
    if (status === 'success') return 'text-green-400';
    if (status === 'error') return 'text-red-400';
    if (status === 'partial') return 'text-yellow-400';
    return 'text-gray-400';
  };

  return (
    <Card className={isClean ? 'bg-white border-gray-200' : 'bg-gray-900/70 border-gray-700 backdrop-blur-xl'}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
              <Bot className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <CardTitle className={isClean ? 'text-gray-900 text-lg' : 'text-white text-lg'}>Integracao Typebot</CardTitle>
              <CardDescription className={isClean ? 'text-gray-500' : 'text-gray-400'}>
                Sincronize resultados do Typebot.io para metricas SDR
              </CardDescription>
            </div>
          </div>
          {!criandoNova && (
            <Button
              size="sm"
              onClick={() => setCriandoNova(true)}
              className={isClean ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'bg-purple-600 hover:bg-purple-700 text-white'}
            >
              <Plus className="h-4 w-4 mr-1" />
              Adicionar
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Formulario nova integracao */}
        {criandoNova && (
          <div className={isClean ? 'border border-amber-200 rounded-xl p-4 bg-amber-50 space-y-3' : 'border border-purple-500/30 rounded-xl p-4 bg-purple-500/5 space-y-3'}>
            <h4 className={isClean ? 'text-sm font-semibold text-amber-700 flex items-center gap-2' : 'text-sm font-semibold text-purple-300 flex items-center gap-2'}>
              <Plus className="h-4 w-4" />
              Nova Integracao Typebot
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label className={isClean ? 'text-gray-500 text-xs' : 'text-gray-400 text-xs'}>Nome da Integracao</Label>
                <Input value={novaIntegracao.nome}
                  onChange={(e) => setNovaIntegracao({ ...novaIntegracao, nome: e.target.value })}
                  placeholder="Ex: Formulario de Diagnostico"
                  className={isClean ? 'bg-white border-gray-200 text-gray-700 mt-1 text-sm' : 'bg-gray-800 border-gray-600 text-white mt-1 text-sm'} />
              </div>
              <div>
                <Label className={isClean ? 'text-gray-500 text-xs' : 'text-gray-400 text-xs'}>
                  Typebot ID
                  <a href="https://docs.typebot.io/api-reference/how-to#how-to-find-my-typebotid"
                    target="_blank" rel="noopener noreferrer"
                    className={isClean ? 'ml-1 text-amber-600 hover:text-amber-700' : 'ml-1 text-purple-400 hover:text-purple-300'}>
                    <ExternalLink className="h-3 w-3 inline" />
                  </a>
                </Label>
                <Input value={novaIntegracao.typebot_id}
                  onChange={(e) => setNovaIntegracao({ ...novaIntegracao, typebot_id: e.target.value })}
                  placeholder="Ex: meu-formulario-abc123"
                  className={isClean ? 'bg-white border-gray-200 text-gray-700 mt-1 text-sm' : 'bg-gray-800 border-gray-600 text-white mt-1 text-sm'} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label className={isClean ? 'text-gray-500 text-xs' : 'text-gray-400 text-xs'}>
                  URL do Typebot (self-hosted)
                </Label>
                <Input value={novaIntegracao.base_url}
                  onChange={(e) => setNovaIntegracao({ ...novaIntegracao, base_url: e.target.value })}
                  placeholder="Ex: https://typeboot.meudominio.com"
                  className={isClean ? 'bg-white border-gray-200 text-gray-700 mt-1 text-sm' : 'bg-gray-800 border-gray-600 text-white mt-1 text-sm'} />
                <p className="text-[10px] text-gray-600 mt-0.5">Deixe vazio se usa app.typebot.io</p>
              </div>
              <div>
                <Label className={isClean ? 'text-gray-500 text-xs' : 'text-gray-400 text-xs'}>
                  Vincular ao Funil <span className="text-red-400">*</span>
                </Label>
                <select
                  value={novaIntegracao.funil_id}
                  onChange={(e) => setNovaIntegracao({ ...novaIntegracao, funil_id: e.target.value })}
                  className={isClean ? 'w-full bg-white border border-gray-200 text-gray-700 mt-1 text-sm rounded-md px-3 py-2' : 'w-full bg-gray-800 border border-gray-600 text-white mt-1 text-sm rounded-md px-3 py-2'}
                >
                  <option value="">Selecione um funil...</option>
                  {funis.map((f) => (
                    <option key={f.id} value={f.id}>{f.nome}</option>
                  ))}
                </select>
                <p className="text-[10px] text-gray-600 mt-0.5">As metricas SDR serao gravadas neste funil</p>
              </div>
            </div>

            <div>
                <Label className={isClean ? 'text-gray-500 text-xs' : 'text-gray-400 text-xs'}>
                API Token
                <a href="https://app.typebot.io/typebots" target="_blank" rel="noopener noreferrer"
                  className={isClean ? 'ml-1 text-amber-600 hover:text-amber-700 text-[10px]' : 'ml-1 text-purple-400 hover:text-purple-300 text-[10px]'}>
                  (Settings &amp; Members &rarr; My account &rarr; API tokens)
                </a>
              </Label>
              <div className="relative mt-1">
                <Input
                  type={mostrarToken ? 'text' : 'password'}
                  value={novaIntegracao.api_token}
                  onChange={(e) => setNovaIntegracao({ ...novaIntegracao, api_token: e.target.value })}
                  placeholder="Seu token de API do Typebot.io"
                  className={isClean ? 'bg-white border-gray-200 text-gray-700 text-sm pr-10' : 'bg-gray-800 border-gray-600 text-white text-sm pr-10'} />
                <button type="button" onClick={() => setMostrarToken(!mostrarToken)}
                  className={isClean ? 'absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700' : 'absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white'}>
                  {mostrarToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className={isClean ? 'text-gray-500 text-xs' : 'text-gray-400 text-xs'}>Variavel do Nome no Typebot</Label>
                <Input value={novaIntegracao.variavel_nome}
                  onChange={(e) => setNovaIntegracao({ ...novaIntegracao, variavel_nome: e.target.value })}
                  placeholder="Nome"
                  className={isClean ? 'bg-white border-gray-200 text-gray-700 mt-1 text-sm' : 'bg-gray-800 border-gray-600 text-white mt-1 text-sm'} />
              </div>
              <div>
                <Label className={isClean ? 'text-gray-500 text-xs' : 'text-gray-400 text-xs'}>Variavel do Email no Typebot</Label>
                <Input value={novaIntegracao.variavel_email}
                  onChange={(e) => setNovaIntegracao({ ...novaIntegracao, variavel_email: e.target.value })}
                  placeholder="Email"
                  className={isClean ? 'bg-white border-gray-200 text-gray-700 mt-1 text-sm' : 'bg-gray-800 border-gray-600 text-white mt-1 text-sm'} />
              </div>
            </div>

            <p className="text-[10px] text-gray-500">
              As variaveis precisam ter o mesmo nome que voce deu no editor do Typebot (case-insensitive).
            </p>

            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="ghost" onClick={() => { setCriandoNova(false); setMostrarToken(false); }}
                className={isClean ? 'text-gray-500' : 'text-gray-400'}>
                Cancelar
              </Button>
              <Button size="sm" onClick={criarIntegracao}
                className={isClean ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'bg-purple-600 hover:bg-purple-700 text-white'}>
                Salvar Integracao
              </Button>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
            <span className={isClean ? 'ml-2 text-gray-500 text-sm' : 'ml-2 text-gray-400 text-sm'}>Carregando...</span>
          </div>
        )}

        {/* Vazio */}
        {!loading && integracoes.length === 0 && !criandoNova && (
          <div className="text-center py-8 space-y-2">
            <Bot className="h-12 w-12 text-gray-600 mx-auto" />
            <p className="text-gray-500 text-sm">Nenhuma integracao Typebot configurada</p>
            <p className="text-gray-600 text-xs">
              Adicione seu Typebot ID e API Token para sincronizar os dados de formulario
            </p>
          </div>
        )}

        {/* Seletor de Periodo (global para todas as integracoes) */}
        {integracoes.length > 0 && (
          <div className={isClean ? 'flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200' : 'flex items-center gap-2 p-3 bg-gray-800/40 rounded-xl border border-gray-700/40'}>
            <Calendar className={isClean ? 'h-4 w-4 text-amber-600 flex-shrink-0' : 'h-4 w-4 text-purple-400 flex-shrink-0'} />
            <span className={isClean ? 'text-xs text-gray-500' : 'text-xs text-gray-400'}>Periodo para sincronizacao:</span>
            <input type="date" value={syncPeriodo.dataInicio}
              onChange={(e) => setSyncPeriodo({ ...syncPeriodo, dataInicio: e.target.value })}
              className={isClean ? 'bg-white border border-gray-200 text-gray-700 text-xs rounded px-2 py-1' : 'bg-gray-700 border border-gray-600 text-white text-xs rounded px-2 py-1'} />
            <span className={isClean ? 'text-gray-400 text-xs' : 'text-gray-500 text-xs'}>ate</span>
            <input type="date" value={syncPeriodo.dataFim}
              onChange={(e) => setSyncPeriodo({ ...syncPeriodo, dataFim: e.target.value })}
              className={isClean ? 'bg-white border border-gray-200 text-gray-700 text-xs rounded px-2 py-1' : 'bg-gray-700 border border-gray-600 text-white text-xs rounded px-2 py-1'} />
          </div>
        )}

        {/* Lista de integracoes */}
        {integracoes.map((integracao) => (
          <div key={integracao.id}
            className={`border rounded-xl overflow-hidden transition-all ${
              integracao.ativo
                ? (isClean ? 'border-amber-200 bg-amber-50' : 'border-purple-500/30 bg-purple-500/5')
                : (isClean ? 'border-gray-200 bg-gray-50' : 'border-gray-700/50 bg-gray-800/30')
            }`}>
            {/* Header */}
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${integracao.ativo ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`} />
                  <div>
                    <h4 className={isClean ? 'text-sm font-semibold text-gray-900' : 'text-sm font-semibold text-white'}>{integracao.nome}</h4>
                    <p className={isClean ? 'text-[10px] text-gray-500 mt-0.5' : 'text-[10px] text-gray-500 mt-0.5'}>
                      ID: <code className={isClean ? 'text-amber-700' : 'text-purple-300'}>{integracao.typebot_id}</code>
                      {'  '}Ultima sync: {formatarData(integracao.ultima_sincronizacao)}
                      {integracao.funil_id && (
                        <>
                          {'  '}Funil: <span className={isClean ? 'text-amber-600' : 'text-cyan-300'}>{funis.find(f => f.id === integracao.funil_id)?.nome || 'Vinculado'}</span>
                        </>
                      )}
                      {!integracao.funil_id && (
                        <span className="text-yellow-400 ml-2">⚠ Sem funil vinculado</span>
                      )}
                    </p>
                    {integracao.erro_sincronizacao && (
                      <p className="text-[10px] text-red-400 mt-0.5 truncate max-w-xs" title={integracao.erro_sincronizacao}>
                         {integracao.erro_sincronizacao}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge variant={integracao.ativo ? 'default' : 'secondary'} className="text-[10px]">
                    {integracao.ativo ? 'Ativa' : 'Inativa'}
                  </Badge>

                  {/* Botao Sincronizar */}
                  <Button size="sm"
                    onClick={() => sincronizar(integracao.id, integracao.nome)}
                    disabled={sincronizandoId === integracao.id || !integracao.ativo}
                    className={isClean ? 'h-7 px-3 bg-amber-600 hover:bg-amber-700 text-white text-[11px]' : 'h-7 px-3 bg-purple-600 hover:bg-purple-700 text-white text-[11px]'}>
                    {sincronizandoId === integracao.id
                      ? <Loader2 className="h-3 w-3 animate-spin" />
                      : <RefreshCw className="h-3 w-3" />}
                    <span className="ml-1">Sincronizar</span>
                  </Button>

                  <Button size="sm" variant="ghost"
                    onClick={() => iniciarEdicao(integracao)}
                    className={isClean ? 'h-7 w-7 p-0 text-gray-400 hover:text-gray-700' : 'h-7 w-7 p-0 text-gray-400 hover:text-white'}
                    title="Editar">
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>

                  <Button size="sm" variant="ghost"
                    onClick={() => toggleAtivo(integracao)}
                    className={isClean ? 'h-7 w-7 p-0 text-gray-400 hover:text-gray-700' : 'h-7 w-7 p-0 text-gray-400 hover:text-white'}
                    title={integracao.ativo ? 'Desativar' : 'Ativar'}>
                    {integracao.ativo
                      ? <CheckCircle2 className="h-4 w-4 text-green-400" />
                      : <XCircle className="h-4 w-4" />}
                  </Button>

                  <Button size="sm" variant="ghost"
                    onClick={() => toggleExpand(integracao.id)}
                    className={isClean ? 'h-7 w-7 p-0 text-gray-400 hover:text-gray-700' : 'h-7 w-7 p-0 text-gray-400 hover:text-white'}>
                    {expandedId === integracao.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>

                  <Button size="sm" variant="ghost"
                    onClick={() => removerIntegracao(integracao.id)}
                    className="h-7 w-7 p-0 text-red-400 hover:text-red-300">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Metricas rapidas */}
              {integracao.total_sincronizados > 0 && (
                <div className="flex items-center gap-2 mt-3">
                  <div className={isClean ? 'flex items-center gap-1.5 bg-gray-100 rounded-lg px-2.5 py-1' : 'flex items-center gap-1.5 bg-gray-800/60 rounded-lg px-2.5 py-1'}>
                    <Users className="h-3 w-3 text-blue-400" />
                    <span className={isClean ? 'text-[11px] text-gray-500' : 'text-[11px] text-gray-400'}>{integracao.total_sincronizados} resultados sincronizados</span>
                  </div>
                </div>
              )}
            </div>

            {/* Detalhes expandidos */}
            {expandedId === integracao.id && (
              <div className={isClean ? 'border-t border-gray-200 p-4 space-y-4' : 'border-t border-gray-700/50 p-4 space-y-4'}>
                {/* Formulario de edicao */}
                {editandoId === integracao.id && (
                  <div className={isClean ? 'border border-amber-200 rounded-xl p-4 bg-amber-50 space-y-3' : 'border border-cyan-500/30 rounded-xl p-4 bg-cyan-500/5 space-y-3'}>
                    <h4 className={isClean ? 'text-sm font-semibold text-amber-700 flex items-center gap-2' : 'text-sm font-semibold text-cyan-300 flex items-center gap-2'}>
                      <Pencil className="h-4 w-4" />
                      Editar Integracao
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label className={isClean ? 'text-gray-500 text-xs' : 'text-gray-400 text-xs'}>Nome da Integracao</Label>
                        <Input value={editForm.nome}
                          onChange={(e) => setEditForm({ ...editForm, nome: e.target.value })}
                          placeholder="Ex: Formulario de Diagnostico"
                          className={isClean ? 'bg-white border-gray-200 text-gray-700 mt-1 text-sm' : 'bg-gray-800 border-gray-600 text-white mt-1 text-sm'} />
                      </div>
                      <div>
                        <Label className={isClean ? 'text-gray-500 text-xs' : 'text-gray-400 text-xs'}>Typebot ID</Label>
                        <Input value={editForm.typebot_id}
                          onChange={(e) => setEditForm({ ...editForm, typebot_id: e.target.value })}
                          placeholder="Ex: meu-formulario-abc123"
                          className={isClean ? 'bg-white border-gray-200 text-gray-700 mt-1 text-sm' : 'bg-gray-800 border-gray-600 text-white mt-1 text-sm'} />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label className={isClean ? 'text-gray-500 text-xs' : 'text-gray-400 text-xs'}>URL do Typebot (self-hosted)</Label>
                        <Input value={editForm.base_url}
                          onChange={(e) => setEditForm({ ...editForm, base_url: e.target.value })}
                          placeholder="Ex: https://typeboot.meudominio.com"
                          className={isClean ? 'bg-white border-gray-200 text-gray-700 mt-1 text-sm' : 'bg-gray-800 border-gray-600 text-white mt-1 text-sm'} />
                        <p className="text-[10px] text-gray-600 mt-0.5">Deixe vazio se usa app.typebot.io</p>
                      </div>
                      <div>
                        <Label className={isClean ? 'text-gray-500 text-xs' : 'text-gray-400 text-xs'}>
                          Vincular ao Funil <span className="text-red-400">*</span>
                        </Label>
                        <select
                          value={editForm.funil_id}
                          onChange={(e) => setEditForm({ ...editForm, funil_id: e.target.value })}
                          className={isClean ? 'w-full bg-white border border-gray-200 text-gray-700 mt-1 text-sm rounded-md px-3 py-2' : 'w-full bg-gray-800 border border-gray-600 text-white mt-1 text-sm rounded-md px-3 py-2'}
                        >
                          <option value="">Selecione um funil...</option>
                          {funis.map((f) => (
                            <option key={f.id} value={f.id}>{f.nome}</option>
                          ))}
                        </select>
                        <p className="text-[10px] text-gray-600 mt-0.5">As metricas SDR serao gravadas neste funil</p>
                      </div>
                    </div>

                    <div>
                      <Label className={isClean ? 'text-gray-500 text-xs' : 'text-gray-400 text-xs'}>
                        API Token <span className="text-[10px] text-gray-600">(deixe vazio para manter o atual)</span>
                      </Label>
                      <div className="relative mt-1">
                        <Input
                          type={editMostrarToken ? 'text' : 'password'}
                          value={editForm.api_token}
                          onChange={(e) => setEditForm({ ...editForm, api_token: e.target.value })}
                          placeholder="Novo token (deixe vazio para manter)"
                          className={isClean ? 'bg-white border-gray-200 text-gray-700 text-sm pr-10' : 'bg-gray-800 border-gray-600 text-white text-sm pr-10'} />
                        <button type="button" onClick={() => setEditMostrarToken(!editMostrarToken)}
                          className={isClean ? 'absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700' : 'absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white'}>
                          {editMostrarToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className={isClean ? 'text-gray-500 text-xs' : 'text-gray-400 text-xs'}>Variavel do Nome</Label>
                        <Input value={editForm.variavel_nome}
                          onChange={(e) => setEditForm({ ...editForm, variavel_nome: e.target.value })}
                          className={isClean ? 'bg-white border-gray-200 text-gray-700 mt-1 text-sm' : 'bg-gray-800 border-gray-600 text-white mt-1 text-sm'} />
                      </div>
                      <div>
                        <Label className={isClean ? 'text-gray-500 text-xs' : 'text-gray-400 text-xs'}>Variavel do Email</Label>
                        <Input value={editForm.variavel_email}
                          onChange={(e) => setEditForm({ ...editForm, variavel_email: e.target.value })}
                          className={isClean ? 'bg-white border-gray-200 text-gray-700 mt-1 text-sm' : 'bg-gray-800 border-gray-600 text-white mt-1 text-sm'} />
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end">
                      <Button size="sm" variant="ghost" onClick={cancelarEdicao}
                        className={isClean ? 'text-gray-500' : 'text-gray-400'}>
                        <X className="h-3.5 w-3.5 mr-1" />
                        Cancelar
                      </Button>
                      <Button size="sm" onClick={salvarEdicao}
                        disabled={salvandoEdicao}
                        className={isClean ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'bg-cyan-600 hover:bg-cyan-700 text-white'}>
                        {salvandoEdicao
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                          : <Save className="h-3.5 w-3.5 mr-1" />}
                        Salvar
                      </Button>
                    </div>
                  </div>
                )}

                {/* Como encontrar o Typebot ID */}
                <div className={isClean ? 'bg-amber-50 border border-amber-200 rounded-lg p-3' : 'bg-purple-500/5 border border-purple-500/20 rounded-lg p-3'}>
                  <h5 className={isClean ? 'text-xs font-semibold text-amber-700 mb-1' : 'text-xs font-semibold text-purple-300 mb-1'}>Como encontrar o Typebot ID</h5>
                  <p className={isClean ? 'text-[11px] text-gray-600' : 'text-[11px] text-gray-400'}>
                    No editor do Typebot, o ID aparece na URL: <br />
                    <code className={isClean ? 'text-amber-700' : 'text-purple-300'}>app.typebot.io/typebots/<span className="text-yellow-300">SEU-TYPEBOT-ID</span>/edit</code>
                  </p>
                  <a href="https://docs.typebot.io/api-reference/how-to#how-to-find-my-typebotid"
                    target="_blank" rel="noopener noreferrer"
                    className={isClean ? 'text-[10px] text-amber-600 hover:text-amber-700 flex items-center gap-1 mt-2' : 'text-[10px] text-purple-400 hover:text-purple-300 flex items-center gap-1 mt-2'}>
                    <ExternalLink className="h-3 w-3" />
                    Documentacao oficial
                  </a>
                </div>

                {/* Historico de sincronizacoes */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h5 className={isClean ? 'text-xs font-semibold text-gray-600 flex items-center gap-1.5' : 'text-xs font-semibold text-gray-300 flex items-center gap-1.5'}>
                      <Activity className="h-3.5 w-3.5 text-cyan-400" />
                      Historico de Sincronizacoes
                    </h5>
                    <Button size="sm" variant="ghost"
                      onClick={() => carregarLogs(integracao.id)}
                      className={isClean ? 'h-6 text-[10px] text-gray-400 hover:text-gray-700' : 'h-6 text-[10px] text-gray-400 hover:text-white'}>
                      <RefreshCw className={`h-3 w-3 mr-1 ${logsLoading ? 'animate-spin' : ''}`} />
                      Atualizar
                    </Button>
                  </div>

                  {logsLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className={isClean ? 'h-4 w-4 animate-spin text-gray-500' : 'h-4 w-4 animate-spin text-gray-400'} />
                    </div>
                  ) : logs.length === 0 ? (
                    <p className="text-[11px] text-gray-600 text-center py-4">
                      Nenhuma sincronizacao realizada ainda
                    </p>
                  ) : (
                    <div className="space-y-1.5 max-h-60 overflow-y-auto">
                      {logs.map((log) => (
                        <div key={log.id}
                          className={isClean ? 'flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2' : 'flex items-center justify-between bg-gray-800/60 rounded-lg px-3 py-2'}>
                          <div className="flex items-center gap-3">
                            <span className={`text-[11px] font-semibold ${statusCorLog(log.status)}`}>
                              {log.status === 'success' ? '' : log.status === 'error' ? '' : '~'} {log.status}
                            </span>
                            <span className="text-[10px] text-gray-500">
                              {log.periodo_inicio} - {log.periodo_fim}
                            </span>
                            {log.status !== 'error' && (
                              <span className={isClean ? 'text-[10px] text-gray-500' : 'text-[10px] text-gray-400'}>
                                {log.iniciados} iniciados / {log.concluidos} concluidos
                              </span>
                            )}
                            {log.erro_detalhe && (
                              <span className="text-[10px] text-red-400 truncate max-w-xs" title={log.erro_detalhe}>
                                {log.erro_detalhe}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-gray-600 flex-shrink-0">
                            {formatarData(log.iniciado_em)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
