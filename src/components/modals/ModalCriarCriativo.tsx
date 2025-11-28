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
import { Loader2, Palette, Image, Video, FileText } from 'lucide-react';
import { toast } from 'sonner';
import type { ConjuntoAnuncio } from '@/types/hierarchical';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conjunto?: ConjuntoAnuncio;
  conjuntoId?: string;
  onCriativoCriado?: () => void;
}

interface FormData {
  nome: string;
  tipo: 'imagem' | 'video' | 'carrossel' | 'texto';
  titulo_principal: string;
  texto_primario: string;
  texto_secundario: string;
  chamada_acao: string;
  url_destino: string;
  // Arquivos/URLs
  url_midia: string;
  url_thumbnail: string;
  // Configurações
  formato: string;
  dimensoes: string;
  duracao_video: string;
  // Métricas opcionais
  incluirMetricas: boolean;
  impressoes: string;
  cliques: string;
  ctr: string;
  cpc: string;
  conversoes: string;
  taxa_conversao: string;
  investimento: string;
  custo_conversao: string;
}

const tiposCreativo = [
  { value: 'imagem', label: 'Imagem', icon: Image },
  { value: 'video', label: 'Vídeo', icon: Video },
  { value: 'carrossel', label: 'Carrossel', icon: Palette },
  { value: 'texto', label: 'Texto', icon: FileText },
];

const formatosImagem = [
  '1080x1080 (Quadrado)',
  '1200x628 (Landscape)',
  '1080x1350 (Portrait)',
  '1920x1080 (Story)',
  'Personalizado',
];

const chamadasAcao = [
  'Saiba Mais',
  'Comprar Agora',
  'Inscrever-se',
  'Baixar',
  'Entrar em Contato',
  'Ver Mais',
  'Começar',
  'Solicitar Orçamento',
  'Personalizada',
];

export default function ModalCriarCriativo({ 
  open, 
  onOpenChange, 
  conjunto, 
  conjuntoId, 
  onCriativoCriado 
}: Props) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    nome: '',
    tipo: 'imagem',
    titulo_principal: '',
    texto_primario: '',
    texto_secundario: '',
    chamada_acao: '',
    url_destino: '',
    url_midia: '',
    url_thumbnail: '',
    formato: '',
    dimensoes: '',
    duracao_video: '',
    incluirMetricas: false,
    impressoes: '',
    cliques: '',
    ctr: '',
    cpc: '',
    conversoes: '',
    taxa_conversao: '',
    investimento: '',
    custo_conversao: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome || !formData.titulo_principal) {
      toast.error('Nome e título principal são obrigatórios');
      return;
    }

    setLoading(true);

    try {
      // Criar criativo
      const response = await fetch('/api/criativos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome: formData.nome,
          conjunto_id: conjuntoId,
          tipo: formData.tipo,
          titulo_principal: formData.titulo_principal,
          texto_primario: formData.texto_primario,
          texto_secundario: formData.texto_secundario,
          chamada_acao: formData.chamada_acao,
          url_destino: formData.url_destino,
          url_midia: formData.url_midia,
          url_thumbnail: formData.url_thumbnail,
          formato: formData.formato,
          dimensoes: formData.dimensoes,
          duracao_video: formData.duracao_video ? parseInt(formData.duracao_video) : null,
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao criar criativo');
      }

      const criativo = await response.json();

      // Criar métricas se fornecidas
      if (formData.incluirMetricas && hasMetricas()) {
        await criarMetricas(criativo.id);
      }

      toast.success('Criativo criado com sucesso!');
      resetForm();
      onOpenChange(false);
      onCriativoCriado?.();

    } catch (error) {
      console.error('Erro ao criar criativo:', error);
      toast.error('Erro ao criar criativo');
    } finally {
      setLoading(false);
    }
  };

  const criarMetricas = async (criativoId: string) => {
    try {
      const metricas = {
        criativo_id: criativoId,
        data_inicio: new Date().toISOString().split('T')[0],
        data_fim: new Date().toISOString().split('T')[0],
        impressoes: parseInt(formData.impressoes) || 0,
        cliques: parseInt(formData.cliques) || 0,
        ctr: parseFloat(formData.ctr) || 0,
        cpc: parseFloat(formData.cpc) || 0,
        conversoes: parseInt(formData.conversoes) || 0,
        taxa_conversao: parseFloat(formData.taxa_conversao) || 0,
        investimento: parseFloat(formData.investimento) || 0,
        custo_conversao: parseFloat(formData.custo_conversao) || 0,
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
    return formData.impressoes || formData.cliques || formData.ctr || 
           formData.cpc || formData.conversoes || formData.taxa_conversao || 
           formData.investimento || formData.custo_conversao;
  };

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      tipo: 'imagem',
      titulo_principal: '',
      texto_primario: '',
      texto_secundario: '',
      chamada_acao: '',
      url_destino: '',
      url_midia: '',
      url_thumbnail: '',
      formato: '',
      dimensoes: '',
      duracao_video: '',
      incluirMetricas: false,
      impressoes: '',
      cliques: '',
      ctr: '',
      cpc: '',
      conversoes: '',
      taxa_conversao: '',
      investimento: '',
      custo_conversao: '',
    });
  };

  const TipoIcon = tiposCreativo.find(t => t.value === formData.tipo)?.icon || Image;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TipoIcon className="h-5 w-5" />
            Criar Criativo
          </DialogTitle>
          <DialogDescription>
            Configure o material criativo e suas especificações
            {conjunto && (
              <span className="block mt-1 font-medium text-primary">
                Conjunto: {conjunto.nome}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações básicas */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome do Criativo *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => handleInputChange('nome', e.target.value)}
                  placeholder="Ex: Criativo Principal V1"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Tipo de Criativo *</Label>
                <Select value={formData.tipo} onValueChange={(value) => handleInputChange('tipo', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposCreativo.map((tipo) => {
                      const Icon = tipo.icon;
                      return (
                        <SelectItem key={tipo.value} value={tipo.value}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            {tipo.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Conteúdo do anúncio */}
          <div className="space-y-4 border-t pt-4">
            <h4 className="font-medium">Conteúdo do Anúncio</h4>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="titulo_principal">Título Principal *</Label>
                <Input
                  id="titulo_principal"
                  value={formData.titulo_principal}
                  onChange={(e) => handleInputChange('titulo_principal', e.target.value)}
                  placeholder="Título principal do anúncio"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="texto_primario">Texto Primário</Label>
                <Textarea
                  id="texto_primario"
                  value={formData.texto_primario}
                  onChange={(e) => handleInputChange('texto_primario', e.target.value)}
                  placeholder="Texto principal do anúncio..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="texto_secundario">Texto Secundário</Label>
                <Textarea
                  id="texto_secundario"
                  value={formData.texto_secundario}
                  onChange={(e) => handleInputChange('texto_secundario', e.target.value)}
                  placeholder="Texto adicional ou descrição..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Chamada para Ação</Label>
                  <Select value={formData.chamada_acao} onValueChange={(value) => handleInputChange('chamada_acao', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma CTA" />
                    </SelectTrigger>
                    <SelectContent>
                      {chamadasAcao.map((cta) => (
                        <SelectItem key={cta} value={cta}>{cta}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="url_destino">URL de Destino</Label>
                  <Input
                    id="url_destino"
                    type="url"
                    value={formData.url_destino}
                    onChange={(e) => handleInputChange('url_destino', e.target.value)}
                    placeholder="https://exemplo.com"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Mídia e especificações */}
          <div className="space-y-4 border-t pt-4">
            <h4 className="font-medium">Mídia e Especificações</h4>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="url_midia">URL da Mídia</Label>
                <Input
                  id="url_midia"
                  type="url"
                  value={formData.url_midia}
                  onChange={(e) => handleInputChange('url_midia', e.target.value)}
                  placeholder="https://exemplo.com/imagem.jpg"
                />
              </div>

              {formData.tipo === 'video' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="url_thumbnail">URL da Thumbnail</Label>
                    <Input
                      id="url_thumbnail"
                      type="url"
                      value={formData.url_thumbnail}
                      onChange={(e) => handleInputChange('url_thumbnail', e.target.value)}
                      placeholder="https://exemplo.com/thumbnail.jpg"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="duracao_video">Duração do Vídeo (segundos)</Label>
                    <Input
                      id="duracao_video"
                      type="number"
                      value={formData.duracao_video}
                      onChange={(e) => handleInputChange('duracao_video', e.target.value)}
                      placeholder="Ex: 30"
                    />
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Formato</Label>
                  <Select value={formData.formato} onValueChange={(value) => handleInputChange('formato', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o formato" />
                    </SelectTrigger>
                    <SelectContent>
                      {formatosImagem.map((formato) => (
                        <SelectItem key={formato} value={formato}>{formato}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dimensoes">Dimensões Personalizadas</Label>
                  <Input
                    id="dimensoes"
                    value={formData.dimensoes}
                    onChange={(e) => handleInputChange('dimensoes', e.target.value)}
                    placeholder="Ex: 1200x630"
                    disabled={formData.formato !== 'Personalizado'}
                  />
                </div>
              </div>
            </div>
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

                <div className="space-y-2">
                  <Label htmlFor="conversoes">Conversões</Label>
                  <Input
                    id="conversoes"
                    type="number"
                    value={formData.conversoes}
                    onChange={(e) => handleInputChange('conversoes', e.target.value)}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="taxa_conversao">Taxa de Conversão (%)</Label>
                  <Input
                    id="taxa_conversao"
                    type="number"
                    step="0.01"
                    value={formData.taxa_conversao}
                    onChange={(e) => handleInputChange('taxa_conversao', e.target.value)}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="investimento">Investimento (R$)</Label>
                  <Input
                    id="investimento"
                    type="number"
                    step="0.01"
                    value={formData.investimento}
                    onChange={(e) => handleInputChange('investimento', e.target.value)}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="custo_conversao">Custo por Conversão (R$)</Label>
                  <Input
                    id="custo_conversao"
                    type="number"
                    step="0.01"
                    value={formData.custo_conversao}
                    onChange={(e) => handleInputChange('custo_conversao', e.target.value)}
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
                <span>Criar Criativo</span>
              </div>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
