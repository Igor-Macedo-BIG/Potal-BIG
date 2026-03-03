'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useTheme } from '@/contexts/ThemeContext';
import { useEmpresa } from '@/contexts/EmpresaContext';
import {
  ExternalLink,
  Copy,
  Loader2,
  Eye,
  EyeOff,
  DollarSign,
  Users,
  MessageCircle,
  TrendingUp,
  MousePointer,
  Target,
  BarChart3,
  ShoppingCart,
  Megaphone,
} from 'lucide-react';
import { toast } from 'sonner';

interface RelatorioMetricaConfig {
  id: string;
  empresa_id: string;
  metrica_key: string;
  nome_display: string;
  visivel: boolean;
  ordem: number;
}

const ICONE_MAP: Record<string, any> = {
  investimento: DollarSign,
  leads: Users,
  mensagens: MessageCircle,
  cpl: DollarSign,
  ctr: MousePointer,
  roas: TrendingUp,
  alcance: Megaphone,
  impressoes: Eye,
  cliques: MousePointer,
  vendas: ShoppingCart,
  faturamento: DollarSign,
  cpm: BarChart3,
  cpc: Target,
  leads_whatsapp: MessageCircle,
  leads_messenger: Megaphone,
  custo_por_mensagem: DollarSign,
  media_diaria_mensagens: BarChart3,
};

export function RelatorioConfigCard() {
  const { isClean } = useTheme();
  const { empresaSelecionada } = useEmpresa();
  const [configs, setConfigs] = useState<RelatorioMetricaConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const linkRelatorio = empresaSelecionada?.slug_relatorio
    ? `${baseUrl}/relatorio/${empresaSelecionada.slug_relatorio}`
    : null;

  useEffect(() => {
    if (empresaSelecionada?.id) {
      carregarConfigs();
    }
  }, [empresaSelecionada?.id]);

  const carregarConfigs = async () => {
    if (!empresaSelecionada?.id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/relatorio/config?empresa_id=${empresaSelecionada.id}`);
      if (res.ok) {
        const data = await res.json();
        setConfigs(data.configs || []);
      }
    } catch (err) {
      console.error('Erro ao carregar config relatório:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleMetrica = async (config: RelatorioMetricaConfig) => {
    setUpdating(config.id);
    try {
      const res = await fetch('/api/relatorio/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: config.id, visivel: !config.visivel }),
      });
      if (res.ok) {
        setConfigs(prev =>
          prev.map(c => (c.id === config.id ? { ...c, visivel: !c.visivel } : c))
        );
        toast.success(`${config.nome_display} ${!config.visivel ? 'visível' : 'oculta'} no relatório`);
      }
    } catch (err) {
      toast.error('Erro ao atualizar');
    } finally {
      setUpdating(null);
    }
  };

  const copiarLink = () => {
    if (linkRelatorio) {
      const linkFinal = isClean ? `${linkRelatorio}?tema=light` : linkRelatorio;
      navigator.clipboard.writeText(linkFinal);
      toast.success('Link copiado!');
    }
  };

  if (!empresaSelecionada) {
    return (
      <Card className={isClean ? 'bg-white border-gray-200' : 'bg-gray-800/50 border-gray-700'}>
        <CardContent className="py-8 text-center">
          <p className={isClean ? 'text-gray-500' : 'text-gray-400'}>
            Selecione uma empresa para configurar o relatório externo
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Link do relatório */}
      <Card className={isClean ? 'bg-white border-gray-200 shadow-sm' : 'bg-gray-800/50 border-gray-700'}>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${isClean ? 'text-gray-900' : 'text-white'}`}>
            <ExternalLink className="h-5 w-5" />
            Link do Relatório — {empresaSelecionada.nome}
          </CardTitle>
          <CardDescription className={isClean ? 'text-gray-500' : 'text-gray-400'}>
            Envie este link para o cliente visualizar as métricas (sem login necessário)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {linkRelatorio ? (
            <div className="flex items-center gap-3">
              <div className={`flex-1 px-4 py-2.5 rounded-lg font-mono text-sm truncate ${isClean ? 'bg-gray-100 text-gray-700 border border-gray-200' : 'bg-gray-900 text-green-400 border border-gray-700'}`}>
                {isClean ? `${linkRelatorio}?tema=light` : linkRelatorio}
              </div>
              <Button onClick={copiarLink} variant="outline" size="sm" className="shrink-0 gap-2">
                <Copy className="h-4 w-4" />
                Copiar
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 gap-2"
                onClick={() => window.open(isClean ? `${linkRelatorio}?tema=light` : linkRelatorio!, '_blank')}
              >
                <ExternalLink className="h-4 w-4" />
                Abrir
              </Button>
            </div>
          ) : (
            <p className={isClean ? 'text-gray-500 text-sm' : 'text-gray-400 text-sm'}>
              Essa empresa ainda não tem um slug de relatório. Execute o script de migration para gerar.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Configuração das métricas */}
      <Card className={isClean ? 'bg-white border-gray-200 shadow-sm' : 'bg-gray-800/50 border-gray-700'}>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${isClean ? 'text-gray-900' : 'text-white'}`}>
            <Eye className="h-5 w-5" />
            Métricas Visíveis no Relatório
          </CardTitle>
          <CardDescription className={isClean ? 'text-gray-500' : 'text-gray-400'}>
            Escolha quais métricas o cliente verá na página de relatório
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className={`h-6 w-6 animate-spin ${isClean ? 'text-gray-400' : 'text-gray-500'}`} />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {configs.map(config => {
                const IconComp = ICONE_MAP[config.metrica_key] || BarChart3;
                return (
                  <div
                    key={config.id}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                      config.visivel
                        ? isClean
                          ? 'bg-green-50 border-green-200'
                          : 'bg-green-900/20 border-green-700/50'
                        : isClean
                        ? 'bg-gray-50 border-gray-200 opacity-60'
                        : 'bg-gray-900/30 border-gray-700/50 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <IconComp className={`h-4 w-4 ${config.visivel ? (isClean ? 'text-green-600' : 'text-green-400') : (isClean ? 'text-gray-400' : 'text-gray-600')}`} />
                      <div>
                        <p className={`text-sm font-medium ${isClean ? 'text-gray-900' : 'text-white'}`}>
                          {config.nome_display}
                        </p>
                        <p className={`text-xs ${isClean ? 'text-gray-500' : 'text-gray-400'}`}>
                          {config.metrica_key}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${
                          config.visivel
                            ? 'text-green-600 border-green-300'
                            : 'text-gray-400 border-gray-300'
                        }`}
                      >
                        {config.visivel ? 'Visível' : 'Oculta'}
                      </Badge>
                      {updating === config.id ? (
                        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                      ) : (
                        <Switch
                          checked={config.visivel}
                          onCheckedChange={() => toggleMetrica(config)}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
