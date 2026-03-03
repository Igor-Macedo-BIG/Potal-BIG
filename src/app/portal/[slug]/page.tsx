'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, MousePointerClick, TrendingUp, Users, DollarSign, Target, BarChart3 } from 'lucide-react';
import bcrypt from 'bcryptjs';

interface Portal {
  id: string;
  cliente_id: string;
  titulo: string;
  slug: string;
  senha_hash: string | null;
  metricas_visiveis: string[];
  data_expiracao: string | null;
  cor_primaria: string;
  cor_secundaria: string;
  ativo: boolean;
}

interface Metricas {
  impressoes: number;
  cliques: number;
  ctr: number;
  leads: number;
  cpl: number;
  taxa_conversao: number;
  investimento: number;
}

export default function PortalPublico() {
  const params = useParams();
  const slug = params.slug as string;

  const [portal, setPortal] = useState<Portal | null>(null);
  const [autenticado, setAutenticado] = useState(false);
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState('30d');
  const [metricas, setMetricas] = useState<Metricas>({
    impressoes: 0,
    cliques: 0,
    ctr: 0,
    leads: 0,
    cpl: 0,
    taxa_conversao: 0,
    investimento: 0,
  });

  useEffect(() => {
    carregarPortal();
  }, [slug]);

  useEffect(() => {
    if (autenticado && portal) {
      carregarMetricas();
    }
  }, [periodo, autenticado, portal]);

  const carregarPortal = async () => {
    try {
      const { data, error } = await supabase
        .from('portais_clientes')
        .select('*')
        .eq('slug', slug)
        .eq('ativo', true)
        .single();

      if (error) throw error;

      if (data.data_expiracao && new Date(data.data_expiracao) < new Date()) {
        setErro('Este portal expirou.');
        setLoading(false);
        return;
      }

      setPortal(data);

      // Incrementar visualizações e registrar acesso
      await supabase
        .from('portais_clientes')
        .update({
          visualizacoes: (data.visualizacoes || 0) + 1,
          ultimo_acesso: new Date().toISOString(),
        })
        .eq('id', data.id);

      await supabase.from('portal_acessos').insert({
        portal_id: data.id,
        ip_address: 'unknown',
        user_agent: navigator.userAgent,
      });

      if (!data.senha_hash) {
        setAutenticado(true);
      }

      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar portal:', error);
      setErro('Portal não encontrado.');
      setLoading(false);
    }
  };

  const carregarMetricas = async () => {
    if (!portal) return;

    const diasMap: Record<string, number> = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '365d': 365,
    };

    const dias = diasMap[periodo];
    const dataInicio = new Date();
    dataInicio.setDate(dataInicio.getDate() - dias);

    try {
      // Buscar campanhas vinculadas ao portal
      const { data: campanhas, error: errorCampanhas } = await supabase
        .from('portal_campanhas')
        .select('campanha_id')
        .eq('portal_id', portal.id);

      if (errorCampanhas) throw errorCampanhas;

      const campanhaIds = campanhas?.map((c) => c.campanha_id) || [];

      if (campanhaIds.length === 0) {
        return;
      }

      // Buscar métricas das campanhas
      const { data: metricasData, error: errorMetricas } = await supabase
        .from('metricas')
        .select('*')
        .eq('tipo', 'campanha')
        .in('referencia_id', campanhaIds)
        .gte('periodo_inicio', dataInicio.toISOString());

      if (errorMetricas) throw errorMetricas;

      // Agregar métricas
      const totais = metricasData?.reduce(
        (acc, m) => ({
          impressoes: acc.impressoes + (m.impressoes || 0),
          cliques: acc.cliques + (m.cliques || 0),
          leads: acc.leads + (m.leads || 0),
          investimento: acc.investimento + (m.investimento || 0),
        }),
        { impressoes: 0, cliques: 0, leads: 0, investimento: 0 }
      ) || { impressoes: 0, cliques: 0, leads: 0, investimento: 0 };

      const ctr = totais.impressoes > 0 ? (totais.cliques / totais.impressoes) * 100 : 0;
      const cpl = totais.leads > 0 ? totais.investimento / totais.leads : 0;
      const taxa_conversao = totais.cliques > 0 ? (totais.leads / totais.cliques) * 100 : 0;

      setMetricas({
        ...totais,
        ctr,
        cpl,
        taxa_conversao,
      });
    } catch (error) {
      console.error('Erro ao carregar métricas:', error);
    }
  };

  const handleLogin = async () => {
    if (!portal?.senha_hash) return;

    const valido = await bcrypt.compare(senha, portal.senha_hash);

    if (valido) {
      setAutenticado(true);
      setErro('');
    } else {
      setErro('Senha incorreta.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-pink-600">
        <div className="text-white text-xl">Carregando...</div>
      </div>
    );
  }

  if (erro && !portal) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-pink-600">
        <Card className="w-96">
          <CardContent className="pt-6">
            <p className="text-center text-red-600">{erro}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!autenticado && portal?.senha_hash) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-pink-600">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-center">{portal.titulo}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="password"
              placeholder="Digite a senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
            />
            {erro && <p className="text-sm text-red-600">{erro}</p>}
            <Button onClick={handleLogin} className="w-full">
              Entrar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Garantir que metricas_visiveis seja sempre um array
  const metricasVisiveis = Array.isArray(portal?.metricas_visiveis) 
    ? portal.metricas_visiveis 
    : [];

  return (
    <div
      className="min-h-screen py-12 px-4"
      style={{
        background: `linear-gradient(to bottom right, ${portal?.cor_primaria || '#9333ea'}, ${portal?.cor_secundaria || '#ec4899'})`,
      }}
    >
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center text-white">
          <h1 className="text-4xl font-bold mb-2">{portal?.titulo}</h1>
          <p className="text-lg opacity-90">Métricas de Performance</p>
        </div>

        <div className="flex justify-center">
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-48 bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="90d">Últimos 90 dias</SelectItem>
              <SelectItem value="365d">Último ano</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {metricasVisiveis.includes('impressoes') && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Impressões</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metricas.impressoes.toLocaleString()}</div>
              </CardContent>
            </Card>
          )}

          {metricasVisiveis.includes('cliques') && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Cliques</CardTitle>
                <MousePointerClick className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metricas.cliques.toLocaleString()}</div>
              </CardContent>
            </Card>
          )}

          {metricasVisiveis.includes('ctr') && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">CTR</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metricas.ctr.toFixed(2)}%</div>
              </CardContent>
            </Card>
          )}

          {metricasVisiveis.includes('leads') && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Leads</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metricas.leads.toLocaleString()}</div>
              </CardContent>
            </Card>
          )}

          {metricasVisiveis.includes('cpl') && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">CPL</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">R$ {metricas.cpl.toFixed(2)}</div>
              </CardContent>
            </Card>
          )}

          {metricasVisiveis.includes('taxa_conversao') && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metricas.taxa_conversao.toFixed(2)}%</div>
              </CardContent>
            </Card>
          )}

          {metricasVisiveis.includes('investimento') && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Investimento</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">R$ {metricas.investimento.toFixed(2)}</div>
              </CardContent>
            </Card>
          )}
        </div>

        <footer className="text-center text-white mt-12 py-6">
          <p className="text-sm opacity-80">Powered by Portal do Tráfego - Igor Macedo</p>
        </footer>
      </div>
    </div>
  );
}
