'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Settings,
  Link2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  ExternalLink,
  Trash2,
  Pencil,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Layers,
  Target,
  Activity,
  RotateCcw
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

// ============================================
// Tipos
// ============================================

interface ContaMeta {
  id: string;
  adAccountId: string;
  businessId?: string;
  ativo: boolean;
  ultimaSincronizacao?: string;
  erroSincronizacao?: string;
  sincronizarAutomaticamente: boolean;
  intervaloSincronizacao: number;
  criadoEm: string;
}

interface IntegracaoStatus {
  integrado: boolean;
  contas: ContaMeta[];
  integracao: ContaMeta | null;
}

interface SyncLogDetails {
  campanhas?: { processadas: number; criadas: number; atualizadas: number };
  conjuntos?: { processados: number; criados: number; atualizados: number };
  anuncios?: { processados: number; criados: number; atualizados: number };
  metricas?: { processadas: number; inseridas: number };
  erros?: string[];
  ad_account_id?: string;
  duracao_ms?: number;
}

interface SyncLog {
  id: string;
  tipo: string;
  status: string;
  integracaoId?: string;
  adAccountId?: string;
  registrosProcessados: number;
  registrosCriados: number;
  registrosAtualizados: number;
  erroDetalhe?: string;
  iniciadoEm: string;
  finalizadoEm?: string;
}

interface CampanhaMeta {
  id: string;
  nome: string;
  metaId: string;
  plataforma: string;
  ativo: boolean;
  vinculada: boolean;
  funil?: { id: string; nome: string };
  criadoEm: string;
}

interface FunilDisponivel {
  id: string;
  nome: string;
}

// ============================================
// Componente Principal
// ============================================

export function MetaIntegrationCard() {
  const { isClean } = useTheme();

  // Estado
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [bulkLinking, setBulkLinking] = useState(false);
  const [funilBulk, setFunilBulk] = useState<string>('none');
  const [integracaoStatus, setIntegracaoStatus] = useState<IntegracaoStatus | null>(null);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [campanhas, setCampanhas] = useState<CampanhaMeta[]>([]);
  const [campanhasNaoVinculadas, setCampanhasNaoVinculadas] = useState<CampanhaMeta[]>([]);
  const [funisDisponiveis, setFunisDisponiveis] = useState<FunilDisponivel[]>([]);
  const [activeTab, setActiveTab] = useState('credenciais');
  const [showAddForm, setShowAddForm] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<{ campanhas: { processadas: number; criadas: number; atualizadas: number }; conjuntos: { processados: number; criados: number; atualizados: number }; anuncios: { processados: number; criados: number; atualizados: number }; metricas: { processadas: number; inseridas: number }; duracao: string } | null>(null);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  // Edit token state
  const [editingContaId, setEditingContaId] = useState<string | null>(null);
  const [editToken, setEditToken] = useState('');
  const [updatingToken, setUpdatingToken] = useState(false);

  // Form state
  const [accessToken, setAccessToken] = useState('');
  const [adAccountId, setAdAccountId] = useState('');
  const [businessId, setBusinessId] = useState('');

  // Sync options
  const [syncDatePreset, setSyncDatePreset] = useState('last_30d');
  const [funilPadrao, setFunilPadrao] = useState<string>('none');

  // Carregar dados
  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = useCallback(async () => {
    setLoading(true);
    try {
      const [statusRes, logsRes, campanhasRes] = await Promise.all([
        fetch('/api/meta/credentials'),
        fetch('/api/meta/sync?limit=10'),
        fetch('/api/meta/campaigns')
      ]);

      if (statusRes.ok) {
        const status = await statusRes.json();
        setIntegracaoStatus(status);
      }

      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setSyncLogs(logsData.logs || []);
      }

      if (campanhasRes.ok) {
        const campanhasData = await campanhasRes.json();
        setCampanhas(campanhasData.campanhas || []);
        setCampanhasNaoVinculadas(campanhasData.campanhasNaoVinculadas || []);
        setFunisDisponiveis(campanhasData.funisDisponiveis || []);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Salvar credenciais
  async function salvarCredenciais() {
    if (!accessToken.trim() || !adAccountId.trim()) {
      toast.error('Preencha o Token de Acesso e ID da Conta de Anúncios');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/meta/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken: accessToken.trim(),
          adAccountId: adAccountId.trim(),
          businessId: businessId.trim() || undefined
        })
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Erro ao salvar credenciais');
        return;
      }

      toast.success(data.mensagem || 'Credenciais salvas com sucesso!');
      setAccessToken('');
      setAdAccountId('');
      setBusinessId('');
      setShowAddForm(false);
      carregarDados();
    } catch (error) {
      toast.error('Erro ao salvar credenciais');
    } finally {
      setSaving(false);
    }
  }

  // Atualizar token de uma conta existente
  async function atualizarToken(contaId: string) {
    if (!editToken.trim()) {
      toast.error('Preencha o novo token');
      return;
    }

    setUpdatingToken(true);
    try {
      const res = await fetch('/api/meta/credentials', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          integracaoId: contaId,
          accessToken: editToken.trim()
        })
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Erro ao atualizar token');
        return;
      }

      toast.success(data.mensagem || 'Token atualizado com sucesso!');
      setEditingContaId(null);
      setEditToken('');
      carregarDados();
    } catch (error) {
      toast.error('Erro ao atualizar token');
    } finally {
      setUpdatingToken(false);
    }
  }

  // Remover uma conta específica
  async function removerConta(contaId: string, adAccountId: string) {
    if (!confirm(`Tem certeza que deseja remover a conta ${adAccountId}?`)) {
      return;
    }

    setRemovingId(contaId);
    try {
      const res = await fetch(`/api/meta/credentials?integracaoId=${contaId}`, { method: 'DELETE' });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Erro ao remover conta');
        return;
      }

      toast.success('Conta removida com sucesso');
      carregarDados();
    } catch (error) {
      toast.error('Erro ao remover conta');
    } finally {
      setRemovingId(null);
    }
  }

  // Executar sincronização
  async function executarSincronizacao() {
    setSyncing(true);
    setLastSyncResult(null);
    try {
      const hoje = new Date();
      let periodoInicio: string;

      if (syncDatePreset === 'last_month') {
        periodoInicio = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1).toISOString().split('T')[0];
      } else {
        periodoInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0];
      }

      const res = await fetch('/api/meta/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          datePreset: syncDatePreset,
          funilPadrao: funilPadrao && funilPadrao !== 'none' ? funilPadrao : undefined,
          periodo_inicio: periodoInicio
        })
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Erro na sincronização');
        return;
      }

      if (data.sucesso) {
        const r = data.resultado;
        if (r) {
          setLastSyncResult(r);
        }
        const resumo = r
          ? `${r.campanhas?.processadas || 0} campanhas · ${r.conjuntos?.processados || 0} conjuntos · ${r.anuncios?.processados || 0} anúncios · ${r.metricas?.inseridas || 0} métricas`
          : '';
        toast.success(`Sincronização concluída em ${r?.duracao || '?'}! ${resumo}`, { duration: 8000 });

        if (data.erros && data.erros.length > 0) {
          const erroMigration = (data.erros as string[]).find(
            (e: string) => e.includes('meta_id') || e.includes('migration') || e.includes('⚠️')
          );
          if (erroMigration) {
            toast.error(erroMigration, { duration: 10000 });
          } else {
            toast.warning(`${data.erros.length} avisos durante sincronização`);
          }
        }
      } else {
        toast.error('Sincronização completada com erros');
      }

      carregarDados();
    } catch (error) {
      toast.error('Erro ao executar sincronização');
    } finally {
      setSyncing(false);
    }
  }

  // Vincular uma campanha a um funil
  async function vincularCampanha(campanhaId: string, funilId: string) {
    try {
      const res = await fetch('/api/meta/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campanhaId, funilId })
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Erro ao vincular campanha');
        return;
      }

      toast.success('Campanha vinculada com sucesso!');
      carregarDados();
    } catch (error) {
      toast.error('Erro ao vincular campanha');
    }
  }

  // Vincular TODAS as campanhas sem funil de uma vez
  async function vincularTodasAoFunil() {
    if (!funilBulk || funilBulk === 'none') {
      toast.error('Selecione um funil antes de vincular');
      return;
    }

    setBulkLinking(true);
    try {
      const res = await fetch('/api/meta/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ funilId: funilBulk, vincularTodas: true })
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Erro ao vincular campanhas');
        return;
      }

      toast.success(`${data.atualizadas || campanhasNaoVinculadas.length} campanha(s) vinculada(s) com sucesso! \uD83C\uDF89`);
      toast.info('Atualize o dashboard para ver os dados');
      setFunilBulk('none');
      carregarDados();
    } catch (error) {
      toast.error('Erro ao vincular campanhas');
    } finally {
      setBulkLinking(false);
    }
  }

  // Helper: parse detalhes do log
  function parseLogDetails(log: SyncLog): SyncLogDetails | null {
    if (!log.erroDetalhe) return null;
    try {
      const parsed = JSON.parse(log.erroDetalhe);
      if (parsed && (parsed.campanhas || parsed.conjuntos || parsed.anuncios)) {
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  }

  // Helper: formatar duração
  function formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  }

  // Loading state
  if (loading) {
    return (
      <Card className={isClean ? 'bg-white border-gray-200' : 'bg-gray-800/50 border-gray-700'}>
        <CardContent className="py-8 text-center">
          <Loader2 className={`h-8 w-8 animate-spin mx-auto ${isClean ? 'text-gray-500' : 'text-gray-400'}`} />
          <p className={isClean ? 'text-gray-500 mt-2' : 'text-gray-400 mt-2'}>Carregando configurações...</p>
        </CardContent>
      </Card>
    );
  }

  const contas = integracaoStatus?.contas || [];

  return (
    <Card className={isClean ? 'bg-white border-gray-200' : 'bg-gray-800/50 border-gray-700'}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className={`flex items-center gap-2 ${isClean ? 'text-gray-900' : 'text-white'}`}>
              <Settings className="h-5 w-5" />
              Integração Meta Ads (Facebook/Instagram)
            </CardTitle>
            <CardDescription className={isClean ? 'text-gray-500' : 'text-gray-400'}>
              Conecte suas contas do Meta Business para sincronizar campanhas automaticamente
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            className={isClean ? 'border-gray-200 text-gray-600 hover:text-gray-900 hover:border-gray-300' : 'border-gray-600 text-gray-300 hover:text-white hover:border-gray-500'}
            onClick={carregarDados}
            disabled={loading}
          >
            <RotateCcw className={`h-4 w-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className={isClean ? 'bg-gray-50 border-gray-200' : 'bg-gray-900 border-gray-700'}>
            <TabsTrigger value="credenciais" className={isClean ? 'data-[state=active]:bg-amber-50' : 'data-[state=active]:bg-gray-700'}>
              <Link2 className="h-4 w-4 mr-2" />
              Contas ({contas.length})
            </TabsTrigger>
            <TabsTrigger value="sincronizar" className={isClean ? 'data-[state=active]:bg-amber-50' : 'data-[state=active]:bg-gray-700'}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Sincronizar
            </TabsTrigger>
            <TabsTrigger value="campanhas" className={isClean ? 'data-[state=active]:bg-amber-50' : 'data-[state=active]:bg-gray-700'}>
              <Settings className="h-4 w-4 mr-2" />
              Campanhas
            </TabsTrigger>
          </TabsList>

          {/* Tab: Credenciais / Contas */}
          <TabsContent value="credenciais" className="space-y-4">
            {/* Lista de contas conectadas */}
            {contas.length > 0 && (
              <div className={isClean ? 'bg-gray-50 rounded-lg p-4 border border-gray-200' : 'bg-gray-900/50 rounded-lg p-4 border border-gray-700'}>
                <h4 className={`font-medium mb-3 ${isClean ? 'text-gray-900' : 'text-white'}`}>Contas Conectadas</h4>
                <div className="space-y-3">
                  {contas.map((conta) => (
                    <div
                      key={conta.id}
                      className={isClean ? 'p-3 bg-white rounded-lg border border-gray-200' : 'p-3 bg-gray-800/50 rounded-lg border border-gray-700/50'}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {conta.ativo ? (
                            <CheckCircle2 className="h-5 w-5 text-green-400" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-400" />
                          )}
                          <div>
                            <p className={`font-medium text-sm font-mono ${isClean ? 'text-gray-900' : 'text-white'}`}>
                              {conta.adAccountId}
                            </p>
                            <p className="text-gray-500 text-xs">
                              Adicionada em {new Date(conta.criadoEm).toLocaleDateString('pt-BR')}
                              {conta.ultimaSincronizacao && (
                                <> · Último sync: {new Date(conta.ultimaSincronizacao).toLocaleString('pt-BR')}</>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={
                              conta.ativo
                                ? 'border-green-500/50 text-green-400'
                                : 'border-red-500/50 text-red-400'
                            }
                          >
                            {conta.ativo ? 'Ativa' : 'Inativa'}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-blue-400 border-blue-400/50 hover:bg-blue-400/10"
                            onClick={() => {
                              if (editingContaId === conta.id) {
                                setEditingContaId(null);
                                setEditToken('');
                              } else {
                                setEditingContaId(conta.id);
                                setEditToken('');
                              }
                            }}
                            title="Atualizar Token"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-400 border-red-400/50 hover:bg-red-400/10"
                            onClick={() => removerConta(conta.id, conta.adAccountId)}
                            disabled={removingId === conta.id}
                            title="Remover Conta"
                          >
                            {removingId === conta.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      {conta.erroSincronizacao && (
                        <div className="mt-2 p-2 bg-red-900/20 rounded border border-red-800/50">
                          <div className="flex items-center gap-2 text-red-400 text-xs">
                            <AlertCircle className="h-3 w-3 flex-shrink-0" />
                            <span>{conta.erroSincronizacao}</span>
                          </div>
                        </div>
                      )}

                      {editingContaId === conta.id && (
                        <div className="mt-3 p-3 bg-blue-900/20 rounded border border-blue-800/50">
                          <p className="text-blue-300 text-xs font-medium mb-2">
                            Atualizar Token de Acesso
                          </p>
                          <div className="flex gap-2">
                            <Input
                              type="password"
                              value={editToken}
                              onChange={(e) => setEditToken(e.target.value)}
                              className={isClean ? 'bg-white border-gray-200 text-gray-700 text-sm flex-1' : 'bg-gray-800 border-gray-600 text-white text-sm flex-1'}
                              placeholder="Cole o novo token aqui..."
                            />
                            <Button
                              size="sm"
                              onClick={() => atualizarToken(conta.id)}
                              disabled={updatingToken || !editToken.trim()}
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              {updatingToken ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                'Salvar'
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => { setEditingContaId(null); setEditToken(''); }}
                              className={isClean ? 'text-gray-500' : 'text-gray-400'}
                            >
                              Cancelar
                            </Button>
                          </div>
                          <p className="text-gray-500 text-xs mt-1.5">
                            Gere um novo token em{' '}
                            <a
                              href="https://developers.facebook.com/tools/explorer/"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:underline"
                            >
                              Graph API Explorer <ExternalLink className="h-3 w-3 inline" />
                            </a>
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Botão para adicionar nova conta */}
            {!showAddForm && (
              <Button
                variant="outline"
                className={isClean ? 'w-full border-dashed border-gray-200 text-gray-500 hover:text-gray-900 hover:border-amber-500' : 'w-full border-dashed border-gray-600 text-gray-400 hover:text-white hover:border-purple-500'}
                onClick={() => setShowAddForm(true)}
              >
                + Adicionar Conta Meta Ads
              </Button>
            )}

            {/* Formulário de credenciais */}
            {(showAddForm || contas.length === 0) && (
              <div className={isClean ? 'bg-gray-50 rounded-lg p-4 border border-gray-200' : 'bg-gray-900/50 rounded-lg p-4 border border-gray-700'}>
                <div className="flex items-center justify-between mb-4">
                  <h4 className={`font-medium ${isClean ? 'text-gray-900' : 'text-white'}`}>
                    Conectar Nova Conta
                  </h4>
                  {contas.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className={isClean ? 'text-gray-500' : 'text-gray-400'}
                      onClick={() => { setShowAddForm(false); setAccessToken(''); setAdAccountId(''); setBusinessId(''); }}
                    >
                      Cancelar
                    </Button>
                  )}
                </div>
              
              <div className="space-y-4">
                <div>
                  <Label className={isClean ? 'text-gray-600' : 'text-gray-300'}>Token de Acesso *</Label>
                  <Input
                    type="password"
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                    className={isClean ? 'bg-white border-gray-200 text-gray-700' : 'bg-gray-800 border-gray-600 text-white'}
                    placeholder="EAAxxxxxxx..."
                  />
                  <p className="text-gray-500 text-xs mt-1">
                    Gere em{' '}
                    <a
                      href="https://developers.facebook.com/tools/explorer/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={isClean ? 'text-amber-600 hover:underline' : 'text-purple-400 hover:underline'}
                    >
                      Graph API Explorer
                      <ExternalLink className="h-3 w-3 inline ml-1" />
                    </a>
                  </p>
                </div>

                <div>
                  <Label className={isClean ? 'text-gray-600' : 'text-gray-300'}>ID da Conta de Anúncios *</Label>
                  <Input
                    value={adAccountId}
                    onChange={(e) => setAdAccountId(e.target.value)}
                    className={isClean ? 'bg-white border-gray-200 text-gray-700' : 'bg-gray-800 border-gray-600 text-white'}
                    placeholder="act_123456789 ou 123456789"
                  />
                  <p className="text-gray-500 text-xs mt-1">
                    Encontre em{' '}
                    <a
                      href="https://business.facebook.com/settings/ad-accounts"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={isClean ? 'text-amber-600 hover:underline' : 'text-purple-400 hover:underline'}
                    >
                      Gerenciador de Negócios
                      <ExternalLink className="h-3 w-3 inline ml-1" />
                    </a>
                  </p>
                </div>

                <div>
                  <Label className={isClean ? 'text-gray-600' : 'text-gray-300'}>ID do Business (Opcional)</Label>
                  <Input
                    value={businessId}
                    onChange={(e) => setBusinessId(e.target.value)}
                    className={isClean ? 'bg-white border-gray-200 text-gray-700' : 'bg-gray-800 border-gray-600 text-white'}
                    placeholder="123456789"
                  />
                </div>

                <Button
                  onClick={salvarCredenciais}
                  disabled={saving}
                  className={isClean ? 'w-full bg-amber-600 hover:bg-amber-700 text-white' : 'w-full bg-purple-600 hover:bg-purple-700'}
                >
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Conectar Conta
                </Button>
              </div>
            </div>
            )}
          </TabsContent>

          {/* Tab: Sincronizar */}
          <TabsContent value="sincronizar" className="space-y-4">
            {contas.length === 0 ? (
              <div className={isClean ? 'text-center py-8 text-gray-500' : 'text-center py-8 text-gray-400'}>
                <AlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-500" />
                <p>Configure suas credenciais primeiro</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setActiveTab('credenciais')}
                >
                  Ir para Credenciais
                </Button>
              </div>
            ) : (
              <>
                {/* Opções de sincronização */}
                <div className={isClean ? 'bg-gray-50 rounded-lg p-4 border border-gray-200' : 'bg-gray-900/50 rounded-lg p-4 border border-gray-700'}>
                  <h4 className={`font-medium mb-4 ${isClean ? 'text-gray-900' : 'text-white'}`}>Opções de Sincronização</h4>

                  {/* Info: contas que serão sincronizadas */}
                  <div className={isClean ? 'mb-4 p-3 bg-white rounded-lg border border-gray-200' : 'mb-4 p-3 bg-gray-800/50 rounded-lg border border-gray-700/50'}>
                    <p className={`text-sm font-medium mb-2 ${isClean ? 'text-gray-600' : 'text-gray-300'}`}>
                      {contas.filter(c => c.ativo).length} conta(s) ativa(s) serão sincronizadas:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {contas.filter(c => c.ativo).map(c => (
                        <Badge key={c.id} variant="outline" className={isClean ? 'text-xs border-amber-200 text-amber-700 font-mono' : 'text-xs border-purple-500/50 text-purple-300 font-mono'}>
                          {c.adAccountId}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Info: Critério de filtro */}
                  <div className="mb-4 p-3 bg-blue-900/20 rounded-lg border border-blue-800/50">
                    <div className="flex gap-2">
                      <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-blue-400" />
                      <div className="text-sm">
                        <p className="font-medium text-blue-300">Apenas campanhas com gasto</p>
                        <p className="text-blue-200/70 text-xs mt-1">
                          Filtra apenas campanhas que tiveram gastos no período selecionado
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label className={isClean ? 'text-gray-600' : 'text-gray-300'}>Período das Métricas</Label>
                      <Select value={syncDatePreset} onValueChange={setSyncDatePreset}>
                        <SelectTrigger className={isClean ? 'bg-white border-gray-200 text-gray-700' : 'bg-gray-800 border-gray-600 text-white'}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className={isClean ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-600'}>
                          <SelectItem value="last_7d">Últimos 7 dias</SelectItem>
                          <SelectItem value="last_14d">Últimos 14 dias</SelectItem>
                          <SelectItem value="last_30d">Últimos 30 dias</SelectItem>
                          <SelectItem value="last_90d">Últimos 90 dias</SelectItem>
                          <SelectItem value="this_month">Este mês (1º até hoje)</SelectItem>
                          <SelectItem value="last_month">Mês passado (completo)</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-gray-500 text-xs mt-1">
                        {syncDatePreset === 'this_month' && `Período: 01/${String(new Date().getMonth() + 1).padStart(2, '0')} até hoje`}
                        {syncDatePreset === 'last_month' && (() => {
                          const d = new Date();
                          const inicio = new Date(d.getFullYear(), d.getMonth() - 1, 1);
                          const fim = new Date(d.getFullYear(), d.getMonth(), 0);
                          return `Período: ${inicio.toLocaleDateString('pt-BR')} até ${fim.toLocaleDateString('pt-BR')}`;
                        })()}
                        {syncDatePreset.startsWith('last_') && syncDatePreset !== 'last_month' && `Métricas dos últimos ${syncDatePreset.replace('last_', '').replace('d', '')} dias`}
                      </p>
                    </div>

                    <div>
                      <Label className={isClean ? 'text-gray-600' : 'text-gray-300'}>Funil Padrão (novas campanhas)</Label>
                      <Select value={funilPadrao} onValueChange={setFunilPadrao}>
                        <SelectTrigger className={isClean ? 'bg-white border-gray-200 text-gray-700' : 'bg-gray-800 border-gray-600 text-white'}>
                          <SelectValue placeholder="Selecione um funil" />
                        </SelectTrigger>
                        <SelectContent className={isClean ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-600'}>
                          <SelectItem value="none">Não vincular automaticamente</SelectItem>
                          {funisDisponiveis.map((funil) => (
                            <SelectItem key={funil.id} value={funil.id}>
                              {funil.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-gray-500 text-xs mt-1">
                        Novas campanhas serão vinculadas a este funil
                      </p>
                    </div>
                  </div>

                  <Button
                    onClick={executarSincronizacao}
                    disabled={syncing}
                    className={isClean ? 'w-full mt-4 bg-amber-600 hover:bg-amber-700 text-white' : 'w-full mt-4 bg-purple-600 hover:bg-purple-700'}
                  >
                    {syncing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sincronizando...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Sincronizar Agora
                      </>
                    )}
                  </Button>
                </div>

                {/* Resultado da última sincronização */}
                {lastSyncResult && (
                  <div className={isClean ? 'bg-green-50 rounded-lg p-4 border border-green-200' : 'bg-green-900/20 rounded-lg p-4 border border-green-700/50'}>
                    <h4 className={isClean ? 'text-green-700 font-medium mb-3 flex items-center gap-2' : 'text-green-300 font-medium mb-3 flex items-center gap-2'}>
                      <CheckCircle2 className="h-4 w-4" />
                      Última Sincronização — {lastSyncResult.duracao}
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className={isClean ? 'bg-gray-50 rounded-lg p-3 text-center border border-gray-200' : 'bg-gray-800/50 rounded-lg p-3 text-center'}>
                        <Target className="h-4 w-4 text-blue-400 mx-auto mb-1" />
                        <p className={`font-bold text-lg ${isClean ? 'text-gray-900' : 'text-white'}`}>{lastSyncResult.campanhas.processadas}</p>
                        <p className={isClean ? 'text-gray-500 text-xs' : 'text-gray-400 text-xs'}>Campanhas</p>
                        <p className="text-green-400 text-[10px]">
                          {lastSyncResult.campanhas.criadas} novas · {lastSyncResult.campanhas.atualizadas} atualizadas
                        </p>
                      </div>
                      <div className={isClean ? 'bg-gray-50 rounded-lg p-3 text-center border border-gray-200' : 'bg-gray-800/50 rounded-lg p-3 text-center'}>
                        <Layers className={isClean ? 'h-4 w-4 text-amber-600 mx-auto mb-1' : 'h-4 w-4 text-purple-400 mx-auto mb-1'} />
                        <p className={`font-bold text-lg ${isClean ? 'text-gray-900' : 'text-white'}`}>{lastSyncResult.conjuntos.processados}</p>
                        <p className={isClean ? 'text-gray-500 text-xs' : 'text-gray-400 text-xs'}>Conjuntos</p>
                        <p className="text-green-400 text-[10px]">
                          {lastSyncResult.conjuntos.criados} novos · {lastSyncResult.conjuntos.atualizados} atualizados
                        </p>
                      </div>
                      <div className={isClean ? 'bg-gray-50 rounded-lg p-3 text-center border border-gray-200' : 'bg-gray-800/50 rounded-lg p-3 text-center'}>
                        <BarChart3 className="h-4 w-4 text-orange-400 mx-auto mb-1" />
                        <p className={`font-bold text-lg ${isClean ? 'text-gray-900' : 'text-white'}`}>{lastSyncResult.anuncios.processados}</p>
                        <p className={isClean ? 'text-gray-500 text-xs' : 'text-gray-400 text-xs'}>Anúncios</p>
                        <p className="text-green-400 text-[10px]">
                          {lastSyncResult.anuncios.criados} novos · {lastSyncResult.anuncios.atualizados} atualizados
                        </p>
                      </div>
                      <div className={isClean ? 'bg-gray-50 rounded-lg p-3 text-center border border-gray-200' : 'bg-gray-800/50 rounded-lg p-3 text-center'}>
                        <Activity className={isClean ? 'h-4 w-4 text-amber-600 mx-auto mb-1' : 'h-4 w-4 text-cyan-400 mx-auto mb-1'} />
                        <p className={`font-bold text-lg ${isClean ? 'text-gray-900' : 'text-white'}`}>{lastSyncResult.metricas.inseridas}</p>
                        <p className={isClean ? 'text-gray-500 text-xs' : 'text-gray-400 text-xs'}>Métricas</p>
                        <p className="text-green-400 text-[10px]">
                          {lastSyncResult.metricas.processadas} processadas
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Histórico de sincronizações */}
                <div className={isClean ? 'bg-gray-50 rounded-lg p-4 border border-gray-200' : 'bg-gray-900/50 rounded-lg p-4 border border-gray-700'}>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className={`font-medium ${isClean ? 'text-gray-900' : 'text-white'}`}>Histórico de Sincronizações</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={isClean ? 'text-gray-500 hover:text-gray-900 h-7' : 'text-gray-400 hover:text-white h-7'}
                      onClick={carregarDados}
                    >
                      <RotateCcw className="h-3 w-3 mr-1" />
                      <span className="text-xs">Atualizar</span>
                    </Button>
                  </div>
                  
                  {syncLogs.length === 0 ? (
                    <p className={isClean ? 'text-gray-500 text-sm text-center py-4' : 'text-gray-400 text-sm text-center py-4'}>
                      Nenhuma sincronização realizada ainda
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {syncLogs.map((log) => {
                        const details = parseLogDetails(log);
                        const isExpanded = expandedLogId === log.id;
                        const accountId = details?.ad_account_id || log.adAccountId;
                        
                        return (
                          <div
                            key={log.id}
                            className={isClean ? 'bg-white rounded-lg border border-gray-200 overflow-hidden' : 'bg-gray-800/50 rounded-lg border border-gray-700/50 overflow-hidden'}
                          >
                            <button
                              onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                              className={`w-full flex items-center justify-between p-3 transition-colors text-left ${isClean ? 'hover:bg-gray-50' : 'hover:bg-gray-700/30'}`}
                            >
                              <div className="flex items-center gap-3">
                                {log.status === 'sucesso' ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />
                                ) : log.status === 'erro' ? (
                                  <XCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
                                ) : (
                                  <Loader2 className="h-4 w-4 text-yellow-400 flex-shrink-0 animate-spin" />
                                )}
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <p className={`text-sm ${isClean ? 'text-gray-900' : 'text-white'}`}>
                                      {new Date(log.iniciadoEm).toLocaleString('pt-BR')}
                                    </p>
                                    {accountId && (
                                      <Badge variant="outline" className={isClean ? 'text-[10px] border-gray-200 text-gray-500 font-mono px-1.5 py-0' : 'text-[10px] border-gray-600 text-gray-400 font-mono px-1.5 py-0'}>
                                        {accountId}
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-3 mt-0.5">
                                    {details ? (
                                      <p className={isClean ? 'text-gray-500 text-xs' : 'text-gray-400 text-xs'}>
                                        <span className="text-blue-400">{details.campanhas?.processadas || 0}</span> camp
                                        {' · '}
                                        <span className={isClean ? 'text-amber-600' : 'text-purple-400'}>{details.conjuntos?.processados || 0}</span> conj
                                        {' · '}
                                        <span className="text-orange-400">{details.anuncios?.processados || 0}</span> anún
                                        {' · '}
                                        <span className={isClean ? 'text-amber-600' : 'text-cyan-400'}>{details.metricas?.inseridas || 0}</span> métr
                                        {details.duracao_ms && (
                                          <span className="text-gray-500"> · {formatDuration(details.duracao_ms)}</span>
                                        )}
                                      </p>
                                    ) : (
                                      <p className={isClean ? 'text-gray-500 text-xs' : 'text-gray-400 text-xs'}>
                                        {log.registrosCriados} criados, {log.registrosAtualizados} atualizados
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <Badge
                                  variant={log.status === 'sucesso' ? 'default' : 'destructive'}
                                  className={
                                    log.status === 'sucesso'
                                      ? 'bg-green-500/20 text-green-400 text-xs'
                                      : log.status === 'em_andamento'
                                      ? 'bg-yellow-500/20 text-yellow-400 text-xs'
                                      : 'bg-red-500/20 text-red-400 text-xs'
                                  }
                                >
                                  {log.status === 'em_andamento' ? 'em andamento' : log.status}
                                </Badge>
                                {(details || log.erroDetalhe) && (
                                  isExpanded ? 
                                    <ChevronUp className="h-4 w-4 text-gray-500" /> : 
                                    <ChevronDown className="h-4 w-4 text-gray-500" />
                                )}
                              </div>
                            </button>

                            {isExpanded && details && (
                              <div className={`px-3 pb-3 border-t ${isClean ? 'border-gray-200' : 'border-gray-700/50'}`}>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
                                  {details.campanhas && (
                                    <div className={isClean ? 'bg-gray-50 p-2 rounded text-center border border-gray-200' : 'bg-gray-900/50 p-2 rounded text-center'}>
                                      <p className="text-xs text-gray-500">Campanhas</p>
                                      <p className={`font-medium ${isClean ? 'text-gray-900' : 'text-white'}`}>{details.campanhas.processadas}</p>
                                      <p className="text-[10px] text-gray-500">
                                        +{details.campanhas.criadas} novas / ~{details.campanhas.atualizadas} atual.
                                      </p>
                                    </div>
                                  )}
                                  {details.conjuntos && (
                                    <div className={isClean ? 'bg-gray-50 p-2 rounded text-center border border-gray-200' : 'bg-gray-900/50 p-2 rounded text-center'}>
                                      <p className="text-xs text-gray-500">Conjuntos</p>
                                      <p className={`font-medium ${isClean ? 'text-gray-900' : 'text-white'}`}>{details.conjuntos.processados}</p>
                                      <p className="text-[10px] text-gray-500">
                                        +{details.conjuntos.criados} novos / ~{details.conjuntos.atualizados} atual.
                                      </p>
                                    </div>
                                  )}
                                  {details.anuncios && (
                                    <div className={isClean ? 'bg-gray-50 p-2 rounded text-center border border-gray-200' : 'bg-gray-900/50 p-2 rounded text-center'}>
                                      <p className="text-xs text-gray-500">Anúncios</p>
                                      <p className={`font-medium ${isClean ? 'text-gray-900' : 'text-white'}`}>{details.anuncios.processados}</p>
                                      <p className="text-[10px] text-gray-500">
                                        +{details.anuncios.criados} novos / ~{details.anuncios.atualizados} atual.
                                      </p>
                                    </div>
                                  )}
                                  {details.metricas && (
                                    <div className={isClean ? 'bg-gray-50 p-2 rounded text-center border border-gray-200' : 'bg-gray-900/50 p-2 rounded text-center'}>
                                      <p className="text-xs text-gray-500">Métricas</p>
                                      <p className={`font-medium ${isClean ? 'text-gray-900' : 'text-white'}`}>{details.metricas.inseridas}</p>
                                      <p className="text-[10px] text-gray-500">
                                        de {details.metricas.processadas} processadas
                                      </p>
                                    </div>
                                  )}
                                </div>
                                {details.erros && details.erros.length > 0 && (
                                  <div className="mt-2 p-2 bg-red-900/20 rounded border border-red-800/50">
                                    <p className="text-red-400 text-xs font-medium mb-1">
                                      {details.erros.length} aviso(s):
                                    </p>
                                    <ul className="text-red-300/80 text-xs space-y-0.5">
                                      {details.erros.slice(0, 5).map((e, i) => (
                                        <li key={i} className="truncate">• {e}</li>
                                      ))}
                                      {details.erros.length > 5 && (
                                        <li className="text-gray-500">...e mais {details.erros.length - 5}</li>
                                      )}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            )}

                            {isExpanded && !details && log.erroDetalhe && (
                              <div className={`px-3 pb-3 border-t ${isClean ? 'border-gray-200' : 'border-gray-700/50'}`}>
                                <div className="mt-2 p-2 bg-red-900/20 rounded border border-red-800/50">
                                  <p className="text-red-400 text-xs">{log.erroDetalhe}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}
          </TabsContent>

          {/* Tab: Campanhas */}
          <TabsContent value="campanhas" className="space-y-4">
            {contas.length === 0 ? (
              <div className={isClean ? 'text-center py-8 text-gray-500' : 'text-center py-8 text-gray-400'}>
                <AlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-500" />
                <p>Configure suas credenciais primeiro</p>
              </div>
            ) : (
              <>
                {/* BULK ASSIGN: campanhas sem funil */}
                {campanhasNaoVinculadas.length > 0 && (
                  <div className={isClean ? 'bg-amber-50 rounded-lg p-4 border border-amber-200' : 'bg-orange-900/20 rounded-lg p-4 border border-orange-700/60'}>
                    <h4 className={isClean ? 'text-amber-700 font-semibold mb-1 flex items-center gap-2' : 'text-orange-300 font-semibold mb-1 flex items-center gap-2'}>
                      <AlertCircle className="h-5 w-5" />
                      {campanhasNaoVinculadas.length} campanha(s) sem funil — dados não aparecem no dashboard!
                    </h4>
                    <p className={isClean ? 'text-gray-500 text-sm mb-4' : 'text-gray-400 text-sm mb-4'}>
                      Vincule ao funil para que as métricas apareçam no painel de resultados.
                    </p>

                    {/* Bulk assign */}
                    <div className={isClean ? 'bg-white rounded-lg p-3 border border-gray-200 mb-4' : 'bg-gray-900/60 rounded-lg p-3 border border-gray-700 mb-4'}>
                      <p className={`text-sm font-medium mb-2 ${isClean ? 'text-gray-900' : 'text-white'}`}>Vincular todas de uma vez:</p>
                      <div className="flex items-center gap-3">
                        <Select value={funilBulk} onValueChange={setFunilBulk}>
                          <SelectTrigger className={isClean ? 'bg-white border-gray-200 text-gray-700 flex-1' : 'bg-gray-800 border-gray-600 text-white flex-1'}>
                            <SelectValue placeholder="Escolha o funil..." />
                          </SelectTrigger>
                          <SelectContent className={isClean ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-600'}>
                            <SelectItem value="none">Selecione um funil...</SelectItem>
                            {funisDisponiveis.map((funil) => (
                              <SelectItem key={funil.id} value={funil.id}>
                                {funil.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          onClick={vincularTodasAoFunil}
                          disabled={bulkLinking || funilBulk === 'none'}
                          className={isClean ? 'bg-amber-600 hover:bg-amber-700 text-white whitespace-nowrap' : 'bg-orange-600 hover:bg-orange-700 text-white whitespace-nowrap'}
                        >
                          {bulkLinking ? (
                            <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Vinculando...</>
                          ) : (
                            <>Vincular todas ({campanhasNaoVinculadas.length})</>
                          )}
                        </Button>
                      </div>
                      {funisDisponiveis.length === 0 && (
                        <p className="text-red-400 text-xs mt-2">
                          Nenhum funil encontrado. Crie um funil antes de vincular.
                        </p>
                      )}
                    </div>

                    {/* Lista individual (colapsada se muitas) */}
                    <details className="mt-2">
                      <summary className={isClean ? 'text-gray-500 text-sm cursor-pointer hover:text-gray-900' : 'text-gray-400 text-sm cursor-pointer hover:text-white'}>
                        Ver lista individual de campanhas...
                      </summary>
                      <div className="space-y-2 mt-3 max-h-64 overflow-y-auto pr-1">
                        {campanhasNaoVinculadas.map((campanha) => (
                          <div
                            key={campanha.id}
                            className={isClean ? 'flex items-center justify-between p-2 bg-white rounded-lg border border-gray-200' : 'flex items-center justify-between p-2 bg-gray-800/50 rounded-lg'}
                          >
                            <div>
                              <p className={`text-xs ${isClean ? 'text-gray-900' : 'text-white'}`}>{campanha.nome}</p>
                              <p className="text-gray-500 text-xs">ID: {campanha.metaId}</p>
                            </div>
                            <Select
                              onValueChange={(funilId) => vincularCampanha(campanha.id, funilId)}
                            >
                              <SelectTrigger className={isClean ? 'w-[160px] bg-white border-gray-200 text-gray-700 text-xs h-8' : 'w-[160px] bg-gray-800 border-gray-600 text-white text-xs h-8'}>
                                <SelectValue placeholder="Selecionar funil" />
                              </SelectTrigger>
                              <SelectContent className={isClean ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-600'}>
                                {funisDisponiveis.map((funil) => (
                                  <SelectItem key={funil.id} value={funil.id} className="text-xs">
                                    {funil.nome}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        ))}
                      </div>
                    </details>
                  </div>
                )}

                {/* Campanhas vinculadas */}
                <div className={isClean ? 'bg-gray-50 rounded-lg p-4 border border-gray-200' : 'bg-gray-900/50 rounded-lg p-4 border border-gray-700'}>
                  <h4 className={`font-medium mb-4 ${isClean ? 'text-gray-900' : 'text-white'}`}>
                    Campanhas Vinculadas ({campanhas.length})
                    {campanhas.length > 0 && (
                      <span className="text-green-400 text-sm font-normal ml-2">✓ Visíveis no dashboard</span>
                    )}
                  </h4>
                  
                  {campanhas.length === 0 ? (
                    <p className={isClean ? 'text-gray-500 text-sm text-center py-4' : 'text-gray-400 text-sm text-center py-4'}>
                      {campanhasNaoVinculadas.length > 0
                        ? 'Vincule as campanhas acima a um funil para que apareçam aqui e no dashboard.'
                        : 'Nenhuma campanha sincronizada ainda. Execute uma sincronização primeiro.'}
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                      {campanhas.map((campanha) => (
                        <div
                          key={campanha.id}
                          className={isClean ? 'flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200' : 'flex items-center justify-between p-3 bg-gray-800/50 rounded-lg'}
                        >
                          <div className="flex items-center gap-3">
                            {campanha.ativo ? (
                              <CheckCircle2 className="h-4 w-4 text-green-400" />
                            ) : (
                              <XCircle className="h-4 w-4 text-gray-400" />
                            )}
                            <div>
                              <p className={`text-sm ${isClean ? 'text-gray-900' : 'text-white'}`}>{campanha.nome}</p>
                              <p className="text-gray-500 text-xs">
                                Funil: {campanha.funil?.nome || 'Não vinculado'}
                              </p>
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className={
                              campanha.ativo
                                ? 'border-green-500/50 text-green-400'
                                : 'border-gray-500/50 text-gray-400'
                            }
                          >
                            {campanha.ativo ? 'Ativa' : 'Pausada'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
