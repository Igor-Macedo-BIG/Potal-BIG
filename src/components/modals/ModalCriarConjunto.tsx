'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Target, Users, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import type { Campanha } from '@/types/hierarchical';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campanha?: Campanha;
  campanhaId?: string;
  onConjuntoCriado?: () => void;
}

interface FormData {
  nome: string;
  publico_alvo: string;
  localizacao: string;
  idade_min: string;
  idade_max: string;
  genero: 'todos' | 'masculino' | 'feminino';
  interesses: string;
  comportamentos: string;
  // Configurações de orçamento
  orcamento_diario: string;
  tipo_licitacao: 'menor_custo' | 'limite_custo' | 'valor_maximo';
  lance_maximo: string;
  // Métricas opcionais
  incluirMetricas: boolean;
  alcance: string;
  impressoes: string;
  cliques: string;
  ctr: string;
  cpm: string;
  cpc: string;
  investimento: string;
}

export default function ModalCriarConjunto({ 
  open, 
  onOpenChange, 
  campanha, 
  campanhaId, 
  onConjuntoCriado 
}: Props) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    nome: '',
    publico_alvo: '',
    localizacao: '',
    idade_min: '18',
    idade_max: '65',
    genero: 'todos',
    interesses: '',
    comportamentos: '',
    orcamento_diario: '',
    tipo_licitacao: 'menor_custo',
    lance_maximo: '',
    incluirMetricas: false,
    alcance: '',
    impressoes: '',
    cliques: '',
    ctr: '',
    cpm: '',
    cpc: '',
    investimento: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome || !formData.publico_alvo) {
      toast.error('Nome e público-alvo são obrigatórios');
      return;
    }

    setLoading(true);

    try {
      // Criar conjunto de anúncios
      const response = await fetch('/api/conjuntos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome: formData.nome,
          campanha_id: campanhaId,
          publico_alvo: formData.publico_alvo,
          localizacao: formData.localizacao,
          idade_min: parseInt(formData.idade_min) || 18,
          idade_max: parseInt(formData.idade_max) || 65,
          genero: formData.genero,
          interesses: formData.interesses,
          comportamentos: formData.comportamentos,
          orcamento_diario: parseFloat(formData.orcamento_diario) || 0,
          tipo_licitacao: formData.tipo_licitacao,
          lance_maximo: parseFloat(formData.lance_maximo) || 0,
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao criar conjunto de anúncios');
      }

      const conjunto = await response.json();

      // Criar métricas se fornecidas
      if (formData.incluirMetricas && hasMetricas()) {
        await criarMetricas(conjunto.id);
      }

      toast.success('Conjunto de anúncios criado com sucesso!');
      resetForm();
      onOpenChange(false);
      onConjuntoCriado?.();

    } catch (error) {
      console.error('Erro ao criar conjunto:', error);
      toast.error('Erro ao criar conjunto de anúncios');
    } finally {
      setLoading(false);
    }
  };

  const criarMetricas = async (conjuntoId: string) => {
    try {
      const metricas = {
        conjunto_id: conjuntoId,
        data_inicio: new Date().toISOString().split('T')[0],
        data_fim: new Date().toISOString().split('T')[0],
        alcance: parseInt(formData.alcance) || 0,
        impressoes: parseInt(formData.impressoes) || 0,
        cliques: parseInt(formData.cliques) || 0,
        ctr: parseFloat(formData.ctr) || 0,
        cpm: parseFloat(formData.cpm) || 0,
        cpc: parseFloat(formData.cpc) || 0,
        investimento: parseFloat(formData.investimento) || 0,
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

  const hasMetricas = () => {
    return formData.alcance || formData.impressoes || formData.cliques || 
           formData.ctr || formData.cpm || formData.cpc || formData.investimento;
  };

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      publico_alvo: '',
      localizacao: '',
      idade_min: '18',
      idade_max: '65',
      genero: 'todos',
      interesses: '',
      comportamentos: '',
      orcamento_diario: '',
      tipo_licitacao: 'menor_custo',
      lance_maximo: '',
      incluirMetricas: false,
      alcance: '',
      impressoes: '',
      cliques: '',
      ctr: '',
      cpm: '',
      cpc: '',
      investimento: '',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Criar Conjunto de Anúncios
          </DialogTitle>
          <DialogDescription>
            Defina o público-alvo e configurações para esta campanha
            {campanha && (
              <span className="block mt-1 font-medium text-primary">
                Campanha: {campanha.nome}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações básicas */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="nome">Nome do Conjunto *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => handleInputChange('nome', e.target.value)}
                placeholder="Ex: Conjunto Principal - Homens 25-40"
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="publico_alvo">Descrição do Público-Alvo *</Label>
              <Textarea
                id="publico_alvo"
                value={formData.publico_alvo}
                onChange={(e) => handleInputChange('publico_alvo', e.target.value)}
                placeholder="Descreva o público-alvo para este conjunto..."
                rows={3}
                required
              />
            </div>
          </div>

          {/* Segmentação demográfica */}
          <div className="space-y-4 border-t pt-4">
            <h4 className="font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Segmentação Demográfica
            </h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="idade_min">Idade Mínima</Label>
                <Input
                  id="idade_min"
                  type="number"
                  value={formData.idade_min}
                  onChange={(e) => handleInputChange('idade_min', e.target.value)}
                  min="13"
                  max="65"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="idade_max">Idade Máxima</Label>
                <Input
                  id="idade_max"
                  type="number"
                  value={formData.idade_max}
                  onChange={(e) => handleInputChange('idade_max', e.target.value)}
                  min="13"
                  max="65"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Gênero</Label>
                <Select value={formData.genero} onValueChange={(value) => handleInputChange('genero', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="masculino">Masculino</SelectItem>
                    <SelectItem value="feminino">Feminino</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="localizacao">
                  <MapPin className="inline h-4 w-4 mr-1" />
                  Localização
                </Label>
                <Input
                  id="localizacao"
                  value={formData.localizacao}
                  onChange={(e) => handleInputChange('localizacao', e.target.value)}
                  placeholder="Ex: Brasil, São Paulo"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="interesses">Interesses</Label>
              <Textarea
                id="interesses"
                value={formData.interesses}
                onChange={(e) => handleInputChange('interesses', e.target.value)}
                placeholder="Ex: Marketing digital, Empreendedorismo..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="comportamentos">Comportamentos</Label>
              <Textarea
                id="comportamentos"
                value={formData.comportamentos}
                onChange={(e) => handleInputChange('comportamentos', e.target.value)}
                placeholder="Ex: Compradores online frequentes..."
                rows={2}
              />
            </div>
          </div>

          {/* Configurações de orçamento */}
          <div className="space-y-4 border-t pt-4">
            <h4 className="font-medium">Orçamento e Licitação</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="orcamento_diario">Orçamento Diário (R$)</Label>
                <Input
                  id="orcamento_diario"
                  type="number"
                  step="0.01"
                  value={formData.orcamento_diario}
                  onChange={(e) => handleInputChange('orcamento_diario', e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label>Tipo de Licitação</Label>
                <Select value={formData.tipo_licitacao} onValueChange={(value) => handleInputChange('tipo_licitacao', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="menor_custo">Menor Custo</SelectItem>
                    <SelectItem value="limite_custo">Limite de Custo</SelectItem>
                    <SelectItem value="valor_maximo">Valor Máximo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {(formData.tipo_licitacao === 'limite_custo' || formData.tipo_licitacao === 'valor_maximo') && (
              <div className="space-y-2">
                <Label htmlFor="lance_maximo">Lance Máximo (R$)</Label>
                <Input
                  id="lance_maximo"
                  type="number"
                  step="0.01"
                  value={formData.lance_maximo}
                  onChange={(e) => handleInputChange('lance_maximo', e.target.value)}
                  placeholder="0.00"
                />
              </div>
            )}
          </div>

          {/* Métricas opcionais */}
          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="incluirMetricas"
                checked={formData.incluirMetricas}
                onCheckedChange={(checked) => handleInputChange('incluirMetricas', checked as boolean)}
              />
              <Label htmlFor="incluirMetricas">Incluir métricas de performance (opcional)</Label>
            </div>

            {formData.incluirMetricas && (
              <div className="grid grid-cols-2 gap-4 pl-6 border-l-2 border-muted">
                <div className="space-y-2">
                  <Label htmlFor="alcance">Alcance</Label>
                  <Input
                    id="alcance"
                    type="number"
                    value={formData.alcance}
                    onChange={(e) => handleInputChange('alcance', e.target.value)}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="impressoes">Impressões</Label>
                  <Input
                    id="impressoes"
                    type="number"
                    value={formData.impressoes}
                    onChange={(e) => handleInputChange('impressoes', e.target.value)}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cliques">Cliques</Label>
                  <Input
                    id="cliques"
                    type="number"
                    value={formData.cliques}
                    onChange={(e) => handleInputChange('cliques', e.target.value)}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ctr">CTR (%)</Label>
                  <Input
                    id="ctr"
                    type="number"
                    step="0.01"
                    value={formData.ctr}
                    onChange={(e) => handleInputChange('ctr', e.target.value)}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cpm">CPM (R$)</Label>
                  <Input
                    id="cpm"
                    type="number"
                    step="0.01"
                    value={formData.cpm}
                    onChange={(e) => handleInputChange('cpm', e.target.value)}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cpc">CPC (R$)</Label>
                  <Input
                    id="cpc"
                    type="number"
                    step="0.01"
                    value={formData.cpc}
                    onChange={(e) => handleInputChange('cpc', e.target.value)}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2 col-span-2">
                  <Label htmlFor="investimento">Investimento Total (R$)</Label>
                  <Input
                    id="investimento"
                    type="number"
                    step="0.01"
                    value={formData.investimento}
                    onChange={(e) => handleInputChange('investimento', e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              <div className="flex items-center">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <span>Criar Conjunto</span>
              </div>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
