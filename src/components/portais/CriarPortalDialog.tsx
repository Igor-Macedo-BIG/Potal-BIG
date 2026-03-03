'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import bcrypt from 'bcryptjs';

interface Cliente {
  id: string;
  nome: string;
}

interface Campanha {
  id: string;
  nome: string;
}

interface Props {
  aberto: boolean;
  onFechar: () => void;
  onSucesso: () => void;
}

const metricasDisponiveis = [
  { id: 'impressoes', label: 'Impressões' },
  { id: 'cliques', label: 'Cliques' },
  { id: 'ctr', label: 'CTR' },
  { id: 'leads', label: 'Leads' },
  { id: 'cpl', label: 'CPL' },
  { id: 'taxa_conversao', label: 'Taxa de Conversão' },
  { id: 'investimento', label: 'Investimento' },
];

export default function CriarPortalDialog({ aberto, onFechar, onSucesso }: Props) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [campanhas, setCampanhas] = useState<Campanha[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    cliente_id: '',
    titulo: '',
    slug: '',
    senha: '',
    data_expiracao: '',
    cor_primaria: '#9333ea',
    cor_secundaria: '#ec4899',
  });

  const [campanhasSelecionadas, setCampanhasSelecionadas] = useState<string[]>([]);
  const [metricasSelecionadas, setMetricasSelecionadas] = useState<string[]>([
    'impressoes',
    'cliques',
    'ctr',
    'leads',
  ]);

  useEffect(() => {
    if (aberto) {
      carregarClientes();
      carregarCampanhas();
    }
  }, [aberto]);

  const carregarClientes = async () => {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('id, nome')
        .order('nome');

      if (error) throw error;
      setClientes(data || []);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    }
  };

  const carregarCampanhas = async () => {
    try {
      const { data, error } = await supabase
        .from('campanhas')
        .select('id, nome')
        .order('nome');

      if (error) throw error;
      setCampanhas(data || []);
    } catch (error) {
      console.error('Erro ao carregar campanhas:', error);
    }
  };

  const gerarSlug = (titulo: string) => {
    return titulo
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleTituloChange = (titulo: string) => {
    setFormData({
      ...formData,
      titulo,
      slug: gerarSlug(titulo),
    });
  };

  const toggleCampanha = (campanhaId: string) => {
    setCampanhasSelecionadas((prev) =>
      prev.includes(campanhaId)
        ? prev.filter((id) => id !== campanhaId)
        : [...prev, campanhaId]
    );
  };

  const toggleMetrica = (metricaId: string) => {
    setMetricasSelecionadas((prev) =>
      prev.includes(metricaId)
        ? prev.filter((id) => id !== metricaId)
        : [...prev, metricaId]
    );
  };

  const handleSubmit = async () => {
    if (!formData.cliente_id || !formData.titulo || !formData.slug) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    if (campanhasSelecionadas.length === 0) {
      toast({
        title: 'Erro',
        description: 'Selecione pelo menos uma campanha.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // Hash da senha se fornecida
      let senha_hash = null;
      if (formData.senha) {
        senha_hash = await bcrypt.hash(formData.senha, 10);
      }

      // Inserir portal
      const { data: portal, error: errorPortal } = await supabase
        .from('portais_clientes')
        .insert({
          cliente_id: formData.cliente_id,
          titulo: formData.titulo,
          slug: formData.slug,
          senha_hash,
          data_expiracao: formData.data_expiracao || null,
          cor_primaria: formData.cor_primaria,
          cor_secundaria: formData.cor_secundaria,
          metricas_visiveis: metricasSelecionadas,
          ativo: true,
        })
        .select()
        .single();

      if (errorPortal) throw errorPortal;

      // Inserir relacionamentos com campanhas
      const relacionamentos = campanhasSelecionadas.map((campanha_id) => ({
        portal_id: portal.id,
        campanha_id,
      }));

      const { error: errorRelacionamentos } = await supabase
        .from('portal_campanhas')
        .insert(relacionamentos);

      if (errorRelacionamentos) throw errorRelacionamentos;

      toast({
        title: 'Portal criado!',
        description: 'O portal foi criado com sucesso.',
      });

      // Resetar formulário
      setFormData({
        cliente_id: '',
        titulo: '',
        slug: '',
        senha: '',
        data_expiracao: '',
        cor_primaria: '#9333ea',
        cor_secundaria: '#ec4899',
      });
      setCampanhasSelecionadas([]);
      setMetricasSelecionadas(['impressoes', 'cliques', 'ctr', 'leads']);

      onSucesso();
    } catch (error) {
      console.error('Erro ao criar portal:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar o portal.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={aberto} onOpenChange={onFechar}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Novo Portal</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="cliente">Cliente *</Label>
            <Select
              value={formData.cliente_id}
              onValueChange={(value) => setFormData({ ...formData, cliente_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um cliente" />
              </SelectTrigger>
              <SelectContent>
                {clientes.map((cliente) => (
                  <SelectItem key={cliente.id} value={cliente.id}>
                    {cliente.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="titulo">Título *</Label>
            <Input
              id="titulo"
              value={formData.titulo}
              onChange={(e) => handleTituloChange(e.target.value)}
              placeholder="Ex: Portal de Métricas - Empresa X"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Slug *</Label>
            <Input
              id="slug"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              placeholder="portal-empresa-x"
            />
            <p className="text-xs text-muted-foreground">
              URL: {typeof window !== 'undefined' ? window.location.origin : ''}/portal/{formData.slug || '...'}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Campanhas *</Label>
            <div className="border rounded-md p-4 max-h-48 overflow-y-auto space-y-2">
              {campanhas.map((campanha) => (
                <div key={campanha.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`campanha-${campanha.id}`}
                    checked={campanhasSelecionadas.includes(campanha.id)}
                    onCheckedChange={() => toggleCampanha(campanha.id)}
                  />
                  <Label htmlFor={`campanha-${campanha.id}`} className="font-normal">
                    {campanha.nome}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Métricas Visíveis</Label>
            <div className="border rounded-md p-4 space-y-2">
              {metricasDisponiveis.map((metrica) => (
                <div key={metrica.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`metrica-${metrica.id}`}
                    checked={metricasSelecionadas.includes(metrica.id)}
                    onCheckedChange={() => toggleMetrica(metrica.id)}
                  />
                  <Label htmlFor={`metrica-${metrica.id}`} className="font-normal">
                    {metrica.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="senha">Senha (opcional)</Label>
            <Input
              id="senha"
              type="password"
              value={formData.senha}
              onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
              placeholder="Deixe em branco para portal público"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="data_expiracao">Data de Expiração (opcional)</Label>
            <Input
              id="data_expiracao"
              type="date"
              value={formData.data_expiracao}
              onChange={(e) => setFormData({ ...formData, data_expiracao: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cor_primaria">Cor Primária</Label>
              <div className="flex gap-2">
                <Input
                  id="cor_primaria"
                  type="color"
                  value={formData.cor_primaria}
                  onChange={(e) => setFormData({ ...formData, cor_primaria: e.target.value })}
                  className="w-16 h-10"
                />
                <Input
                  type="text"
                  value={formData.cor_primaria}
                  onChange={(e) => setFormData({ ...formData, cor_primaria: e.target.value })}
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cor_secundaria">Cor Secundária</Label>
              <div className="flex gap-2">
                <Input
                  id="cor_secundaria"
                  type="color"
                  value={formData.cor_secundaria}
                  onChange={(e) => setFormData({ ...formData, cor_secundaria: e.target.value })}
                  className="w-16 h-10"
                />
                <Input
                  type="text"
                  value={formData.cor_secundaria}
                  onChange={(e) => setFormData({ ...formData, cor_secundaria: e.target.value })}
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onFechar} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Criando...' : 'Criar Portal'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
