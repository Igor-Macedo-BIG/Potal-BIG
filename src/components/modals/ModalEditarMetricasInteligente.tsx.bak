'use client';

import { useState, useEffect } from 'react';
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
import { Plus, Calendar, Loader2, BarChart3, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useCampanhaContext } from '@/contexts/CampanhaContext';

interface MetricasData {
  id?: string;
  alcance: number;
  impressoes: number;
  cliques: number;
  visualizacoes_pagina: number;
  leads: number;
  checkouts: number;
  vendas: number;
  investimento: number;
  faturamento: number;
  periodo_inicio: string;
  periodo_fim: string;
}

interface Props {
  trigger?: React.ReactNode;
  onMetricasAlteradas?: () => void;
}

export default function ModalEditarMetricasInteligente({ trigger, onMetricasAlteradas }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingDados, setLoadingDados] = useState(false);
  const [metricasExistentes, setMetricasExistentes] = useState<MetricasData | null>(null);
  
  const { campanhaAtiva } = useCampanhaContext();
  
  const [formData, setFormData] = useState<MetricasData>({
    alcance: 0,
    impressoes: 0,
    cliques: 0,
    visualizacoes_pagina: 0,
    leads: 0,
    checkouts: 0,
    vendas: 0,
    investimento: 0,
    faturamento: 0,
    periodo_inicio: new Date().toISOString().split('T')[0],
    periodo_fim: new Date().toISOString().split('T')[0],
  });

  // Buscar métricas existentes quando o período muda
  const buscarMetricasExistentes = async () => {
    if (!campanhaAtiva || !formData.periodo_inicio || !formData.periodo_fim) return;

    setLoadingDados(true);
    try {
      const { data, error } = await supabase
        .from('metricas')
        .select('*')
        .eq('referencia_id', campanhaAtiva.id)
        .eq('tipo', 'campanha')
        .eq('periodo_inicio', formData.periodo_inicio)
        .eq('periodo_fim', formData.periodo_fim)
        .single();

      if (data) {
        setMetricasExistentes(data);
        // Preencher formulário com dados existentes
        setFormData(prev => ({
          ...prev,
          id: data.id,
          alcance: data.alcance || 0,
          impressoes: data.impressoes || 0,
          cliques: data.cliques || 0,
          visualizacoes_pagina: data.visualizacoes_pagina || 0,
          leads: data.leads || 0,
          checkouts: data.checkouts || 0,
          vendas: data.vendas || 0,
          investimento: data.investimento || 0,
          faturamento: data.faturamento || 0,
        }));
        toast.success('Dados existentes carregados!');
      } else {
        setMetricasExistentes(null);
        // Limpar dados quando não há métricas existentes
        setFormData(prev => ({
          ...prev,
          id: undefined,
          alcance: 0,
          impressoes: 0,
          cliques: 0,
          visualizacoes_pagina: 0,
          leads: 0,
          checkouts: 0,
          vendas: 0,
          investimento: 0,
          faturamento: 0,
        }));
      }
    } catch (error) {
      console.error('Erro ao buscar métricas:', error);
      setMetricasExistentes(null);
    } finally {
      setLoadingDados(false);
    }
  };

  // Buscar métricas quando período muda
  useEffect(() => {
    if (open && formData.periodo_inicio && formData.periodo_fim) {
      const timer = setTimeout(() => {
        buscarMetricasExistentes();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [formData.periodo_inicio, formData.periodo_fim, open, campanhaAtiva]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!campanhaAtiva) {
      toast.error('Selecione uma campanha primeiro');
      return;
    }

    if (!formData.periodo_inicio || !formData.periodo_fim) {
      toast.error('Período é obrigatório');
      return;
    }

    setLoading(true);
    
    try {
      // Calcular métricas derivadas
      const roas = formData.investimento > 0 ? formData.faturamento / formData.investimento : 0;
      const ctr = formData.impressoes > 0 ? (formData.cliques / formData.impressoes) * 100 : 0;
      const cpm = formData.impressoes > 0 ? (formData.investimento / formData.impressoes) * 1000 : 0;
      const cpc = formData.cliques > 0 ? formData.investimento / formData.cliques : 0;
      const cpl = formData.leads > 0 ? formData.investimento / formData.leads : 0;
      const taxa_conversao = formData.leads > 0 ? (formData.vendas / formData.leads) * 100 : 0;

      const dadosParaSalvar = {
        tipo: 'campanha',
        referencia_id: campanhaAtiva.id,
        periodo_inicio: formData.periodo_inicio,
        periodo_fim: formData.periodo_fim,
        alcance: formData.alcance,
        impressoes: formData.impressoes,
        cliques: formData.cliques,
        visualizacoes_pagina: formData.visualizacoes_pagina,
        leads: formData.leads,
        checkouts: formData.checkouts,
        vendas: formData.vendas,
        investimento: formData.investimento,
        faturamento: formData.faturamento,
        roas: Number(roas.toFixed(2)),
        ctr: Number(ctr.toFixed(2)),
        cpm: Number(cpm.toFixed(2)),
        cpc: Number(cpc.toFixed(2)),
        cpl: Number(cpl.toFixed(2)),
        taxa_conversao: Number(taxa_conversao.toFixed(2)),
        updated_at: new Date().toISOString(),
      };

      let result;
      
      if (metricasExistentes) {
        // Atualizar métricas existentes
        result = await supabase
          .from('metricas')
          .update(dadosParaSalvar)
          .eq('id', metricasExistentes.id)
          .select()
          .single();
      } else {
        // Criar novas métricas
        result = await supabase
          .from('metricas')
          .insert(dadosParaSalvar)
          .select()
          .single();
      }

      const { error } = result;

      if (error) {
        console.error('Erro ao salvar métricas:', error);
        toast.error(`Erro ao salvar: ${error.message}`);
        return;
      }

      toast.success(
        metricasExistentes 
          ? 'Métricas atualizadas com sucesso!' 
          : 'Métricas criadas com sucesso!'
      );
      
      setOpen(false);
      onMetricasAlteradas?.();

    } catch (error) {
      console.error('Erro ao salvar métricas:', error);
      toast.error('Erro interno. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!metricasExistentes) return;
    
    if (!confirm('Tem certeza que deseja excluir estas métricas?')) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('metricas')
        .delete()
        .eq('id', metricasExistentes.id);

      if (error) throw error;

      toast.success('Métricas excluídas com sucesso!');
      setOpen(false);
      onMetricasAlteradas?.();
    } catch (error) {
      console.error('Erro ao excluir métricas:', error);
      toast.error('Erro ao excluir métricas');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof MetricasData, value: string | number) => {
    setFormData(prev => ({ 
      ...prev, 
      [field]: typeof value === 'string' && field !== 'periodo_inicio' && field !== 'periodo_fim' 
        ? Number(value) || 0 
        : value 
    }));
  };

  const resetarFormulario = () => {
    setFormData({
      alcance: 0,
      impressoes: 0,
      cliques: 0,
      visualizacoes_pagina: 0,
      leads: 0,
      checkouts: 0,
      vendas: 0,
      investimento: 0,
      faturamento: 0,
      periodo_inicio: new Date().toISOString().split('T')[0],
      periodo_fim: new Date().toISOString().split('T')[0],
    });
    setMetricasExistentes(null);
  };

  useEffect(() => {
    if (!open) {
      resetarFormulario();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button 
            size="sm" 
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Dados
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[800px] bg-gray-900 border-gray-700 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-white">
            <div className="h-8 w-8 bg-gradient-to-br from-green-600 to-emerald-600 rounded-lg flex items-center justify-center">
              <BarChart3 className="h-4 w-4 text-white" />
            </div>
            {metricasExistentes ? 'Editar' : 'Adicionar'} Métricas
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {campanhaAtiva ? `Campanha: "${campanhaAtiva.nome}"` : 'Selecione uma campanha primeiro'}
          </DialogDescription>
        </DialogHeader>

        {!campanhaAtiva ? (
          <div className="text-center py-8">
            <p className="text-gray-400">Selecione uma campanha no dashboard para adicionar métricas.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Seleção de Período */}
            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-600/50">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="h-4 w-4 text-cyan-400" />
                <h3 className="text-sm font-medium text-white">Período das Métricas</h3>
                {loadingDados && <div className="ml-2 h-4 w-4 border border-cyan-400 border-t-transparent rounded-full animate-spin" />}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="data-inicio" className="text-gray-300 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Data das Métricas *
                  </Label>
                  <Input
                    id="data-inicio"
                    type="date"
                    value={formData.periodo_inicio}
                    onChange={(e) => handleInputChange('periodo_inicio', e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="data-fim" className="text-gray-300 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Data Final
                  </Label>
                  <Input
                    id="data-fim"
                    type="date"
                    value={formData.periodo_fim}
                    onChange={(e) => handleInputChange('periodo_fim', e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white"
                    required
                  />
                </div>
              </div>

              {metricasExistentes && (
                <div className="mt-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <p className="text-green-400 text-sm font-medium">
                    ✅ Dados existentes encontrados para este período! Você pode editá-los.
                  </p>
                </div>
              )}
            </div>

            {/* Métricas do Funil */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Métricas do Funil</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="impressoes" className="text-gray-300">Impressões</Label>
                  <Input
                    id="impressoes"
                    type="number"
                    min="0"
                    value={formData.impressoes}
                    onChange={(e) => handleInputChange('impressoes', e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white"
                    placeholder="Ex: 50000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="alcance" className="text-gray-300">Alcance</Label>
                  <Input
                    id="alcance"
                    type="number"
                    min="0"
                    value={formData.alcance}
                    onChange={(e) => handleInputChange('alcance', e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white"
                    placeholder="Ex: 25000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cliques" className="text-gray-300">Cliques</Label>
                  <Input
                    id="cliques"
                    type="number"
                    min="0"
                    value={formData.cliques}
                    onChange={(e) => handleInputChange('cliques', e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white"
                    placeholder="Ex: 1250"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="visualizacoes" className="text-gray-300">Visualizações de Página</Label>
                  <Input
                    id="visualizacoes"
                    type="number"
                    min="0"
                    value={formData.visualizacoes_pagina}
                    onChange={(e) => handleInputChange('visualizacoes_pagina', e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white"
                    placeholder="Ex: 800"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="checkouts" className="text-gray-300">Checkouts</Label>
                  <Input
                    id="checkouts"
                    type="number"
                    min="0"
                    value={formData.checkouts}
                    onChange={(e) => handleInputChange('checkouts', e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white"
                    placeholder="Ex: 120"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="leads" className="text-gray-300">Leads</Label>
                  <Input
                    id="leads"
                    type="number"
                    min="0"
                    value={formData.leads}
                    onChange={(e) => handleInputChange('leads', e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white"
                    placeholder="Ex: 80"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vendas" className="text-gray-300">Vendas</Label>
                  <Input
                    id="vendas"
                    type="number"
                    min="0"
                    value={formData.vendas}
                    onChange={(e) => handleInputChange('vendas', e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white"
                    placeholder="Ex: 15"
                  />
                </div>
              </div>
            </div>

            {/* Métricas Financeiras */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Métricas Financeiras</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="investimento" className="text-gray-300">Investimento (R$)</Label>
                  <Input
                    id="investimento"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.investimento}
                    onChange={(e) => handleInputChange('investimento', e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white"
                    placeholder="Ex: 2500.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="faturamento" className="text-gray-300">Faturamento (R$)</Label>
                  <Input
                    id="faturamento"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.faturamento}
                    onChange={(e) => handleInputChange('faturamento', e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white"
                    placeholder="Ex: 7500.00"
                  />
                </div>
              </div>
            </div>

            {/* Preview de métricas calculadas */}
            {(formData.investimento > 0 || formData.impressoes > 0) && (
              <div className="bg-gray-800/30 p-4 rounded-lg border border-gray-600/30">
                <h4 className="text-sm font-medium text-white mb-3">📊 Métricas Calculadas (Preview)</h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-xs">
                  <div>
                    <span className="text-gray-400">ROAS:</span>
                    <span className="text-white ml-2 font-semibold">
                      {formData.investimento > 0 ? (formData.faturamento / formData.investimento).toFixed(2) : '0.00'}x
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">CTR:</span>
                    <span className="text-white ml-2 font-semibold">
                      {formData.impressoes > 0 ? ((formData.cliques / formData.impressoes) * 100).toFixed(2) : '0.00'}%
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">CPL:</span>
                    <span className="text-white ml-2 font-semibold">
                      R$ {formData.leads > 0 ? (formData.investimento / formData.leads).toFixed(2) : '0.00'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">CPC:</span>
                    <span className="text-white ml-2 font-semibold">
                      R$ {formData.cliques > 0 ? (formData.investimento / formData.cliques).toFixed(2) : '0.00'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Conv.:</span>
                    <span className="text-white ml-2 font-semibold">
                      {formData.leads > 0 ? ((formData.vendas / formData.leads) * 100).toFixed(1) : '0.0'}%
                    </span>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="gap-2">
              {metricasExistentes && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={loading}
                  className="mr-auto"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </Button>
              )}
              
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
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <Save className="h-4 w-4 mr-2" />
                <span>{metricasExistentes ? 'Atualizar' : 'Salvar'} Métricas</span>
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}