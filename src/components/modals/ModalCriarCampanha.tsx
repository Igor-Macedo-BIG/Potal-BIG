'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Plus, Zap, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import type { Funil } from '@/types/hierarchical';

interface Props {
  funil?: Funil;
  funilId?: string;
  onCampanhaCriada?: () => void;
  trigger?: React.ReactNode;
}

interface FormData {
  nome: string;
  tipo: 'vendas' | 'leads' | 'awareness';
  plataforma: string;
  // Métricas opcionais
  incluirMetricas: boolean;
  alcance: string;
  impressoes: string;
  cliques: string;
  leads: string;
  vendas: string;
  investimento: string;
  faturamento: string;
  periodo: 'diario' | 'semanal' | 'mensal' | 'total';
}

export default function ModalCriarCampanha({ funil, funilId, onCampanhaCriada, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [etapaAtual, setEtapaAtual] = useState<'campanha' | 'conjuntos' | 'criativos'>('campanha');
  const [campanhaId, setCampanhaId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<FormData>({
    nome: '',
    tipo: 'leads',
    plataforma: 'Meta Ads',
    incluirMetricas: false,
    alcance: '',
    impressoes: '',
    cliques: '',
    leads: '',
    vendas: '',
    investimento: '',
    faturamento: '',
    periodo: 'total',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome.trim()) {
      toast.error('Nome da campanha é obrigatório');
      return;
    }

    setLoading(true);
    
    try {
      // Conectar diretamente com o Supabase
      const { data: campanha, error } = await supabase
        .from('campanhas')
        .insert({
          nome: formData.nome.trim(),
          tipo: formData.tipo,
          funil_id: funilId || funil?.id,
          plataforma: formData.plataforma,
        })
        .select()
        .single();

      if (error) {
        console.error('Erro do Supabase:', error);
        toast.error(`Erro ao criar campanha: ${error.message}`);
        return;
      }

      setCampanhaId(campanha.id);
      toast.success(`Campanha "${campanha.nome}" criada com sucesso!`);

      // Limpar formulário e fechar
      setFormData({
        nome: '',
        tipo: 'leads',
        plataforma: 'Meta Ads',
        incluirMetricas: false,
        alcance: '',
        impressoes: '',
        cliques: '',
        leads: '',
        vendas: '',
        investimento: '',
        faturamento: '',
        periodo: 'total',
      });

      setOpen(false);
      setEtapaAtual('campanha');
      onCampanhaCriada?.();
    } catch (error) {
      console.error('Erro ao criar campanha:', error);
      toast.error('Erro interno. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const criarMetricas = async (campanhaId: string) => {
    try {
      const metricas = {
        tipo: 'campanha',
        referencia_id: campanhaId,
        periodo_inicio: getPeriodoInicio(),
        periodo_fim: getPeriodoFim(),
        alcance: parseInt(formData.alcance) || 0,
        impressoes: parseInt(formData.impressoes) || 0,
        cliques: parseInt(formData.cliques) || 0,
        leads: parseInt(formData.leads) || 0,
        vendas: parseInt(formData.vendas) || 0,
        investimento: parseFloat(formData.investimento) || 0,
        faturamento: parseFloat(formData.faturamento) || 0,
      };

      await fetch('/api/metricas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(metricas),
      });

      toast.success('Métricas adicionadas com sucesso!');
    } catch (error) {
      console.error('Erro ao criar métricas:', error);
      toast.error('Erro ao adicionar métricas');
    }
  };

  const getPeriodoInicio = () => {
    const hoje = new Date();
    switch (formData.periodo) {
      case 'diario':
        return hoje.toISOString().split('T')[0];
      case 'semanal':
        const inicioSemana = new Date(hoje);
        inicioSemana.setDate(hoje.getDate() - 7);
        return inicioSemana.toISOString().split('T')[0];
      case 'mensal':
        const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        return inicioMes.toISOString().split('T')[0];
      default:
        const inicio = new Date(hoje);
        inicio.setDate(hoje.getDate() - 30);
        return inicio.toISOString().split('T')[0];
    }
  };

  const getPeriodoFim = () => {
    return new Date().toISOString().split('T')[0];
  };

  const hasMetricas = () => {
    return formData.alcance || formData.impressoes || formData.cliques || 
           formData.leads || formData.vendas || formData.investimento || 
           formData.faturamento;
  };

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button 
            size="sm" 
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Campanha
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[600px] bg-gray-900 border-gray-700 max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-white">
            <div className="h-8 w-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Zap className="h-4 w-4 text-white" />
            </div>
            Criar Nova Campanha
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {funil ? `Campanha para o funil "${funil.nome}"` : 'Crie uma nova campanha de tráfego pago'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações básicas */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">
              Informações Básicas
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome" className="text-gray-300">
                  Nome da Campanha *
                </Label>
                <Input
                  id="nome"
                  placeholder="Ex: Campanha Março 2025"
                  value={formData.nome}
                  onChange={(e) => handleInputChange('nome', e.target.value)}
                  className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipo" className="text-gray-300">
                  Tipo de Campanha
                </Label>
                <Select
                  value={formData.tipo}
                  onValueChange={(value: any) => handleInputChange('tipo', value)}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="leads">Geração de Leads</SelectItem>
                    <SelectItem value="vendas">Vendas Diretas</SelectItem>
                    <SelectItem value="awareness">Conhecimento da Marca</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="plataforma" className="text-gray-300">
                Plataforma
              </Label>
              <Select
                value={formData.plataforma}
                onValueChange={(value) => handleInputChange('plataforma', value)}
              >
                <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Meta Ads">Meta Ads (Facebook/Instagram)</SelectItem>
                  <SelectItem value="Google Ads">Google Ads</SelectItem>
                  <SelectItem value="TikTok Ads">TikTok Ads</SelectItem>
                  <SelectItem value="LinkedIn Ads">LinkedIn Ads</SelectItem>
                  <SelectItem value="YouTube Ads">YouTube Ads</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Métricas opcionais */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="incluirMetricas"
                checked={formData.incluirMetricas}
                onCheckedChange={(checked: boolean) => handleInputChange('incluirMetricas', checked)}
              />
              <Label htmlFor="incluirMetricas" className="text-gray-300">
                Adicionar métricas iniciais (opcional)
              </Label>
            </div>

            <div 
              className="space-y-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700"
              style={{ display: formData.incluirMetricas ? 'block' : 'none' }}
            >
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-white">Métricas da Campanha</h4>
                  <Select
                    value={formData.periodo}
                    onValueChange={(value: any) => handleInputChange('periodo', value)}
                  >
                    <SelectTrigger className="w-32 bg-gray-800 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="diario">Hoje</SelectItem>
                      <SelectItem value="semanal">Esta Semana</SelectItem>
                      <SelectItem value="mensal">Este Mês</SelectItem>
                      <SelectItem value="total">Total Geral</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-300 text-sm">Alcance</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={formData.alcance}
                      onChange={(e) => handleInputChange('alcance', e.target.value)}
                      className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-300 text-sm">Impressões</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={formData.impressoes}
                      onChange={(e) => handleInputChange('impressoes', e.target.value)}
                      className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-300 text-sm">Cliques</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={formData.cliques}
                      onChange={(e) => handleInputChange('cliques', e.target.value)}
                      className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-300 text-sm">Leads</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={formData.leads}
                      onChange={(e) => handleInputChange('leads', e.target.value)}
                      className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-300 text-sm">Vendas</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={formData.vendas}
                      onChange={(e) => handleInputChange('vendas', e.target.value)}
                      className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-300 text-sm">Investimento (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.investimento}
                      onChange={(e) => handleInputChange('investimento', e.target.value)}
                      className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-gray-300 text-sm">Faturamento (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.faturamento}
                      onChange={(e) => handleInputChange('faturamento', e.target.value)}
                      className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
                    />
                  </div>
                </div>
              </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.nome.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <div className="flex items-center">
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <span>Criar Campanha</span>
              </div>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
