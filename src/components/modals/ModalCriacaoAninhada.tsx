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
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowRight, 
  CheckCircle, 
  Circle, 
  Layers,
  Target,
  Palette,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import ModalCriarCampanha from './ModalCriarCampanha';
import ModalCriarConjunto from './ModalCriarConjunto';
import ModalCriarCriativo from './ModalCriarCriativo';
import type { Funil, Campanha, ConjuntoAnuncio } from '@/types/hierarchical';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  funil?: Funil;
  funilId?: string;
  onConcluido?: () => void;
}

type EtapaCriacao = 'selecao' | 'campanha' | 'conjuntos' | 'criativos' | 'concluido';

interface FluxoCriacao {
  criarCampanha: boolean;
  criarConjuntos: boolean;
  quantidadeConjuntos: number;
  criarCriativos: boolean;
  quantidadeCriativos: number;
}

interface DadosCriados {
  campanha?: Campanha;
  conjuntos: ConjuntoAnuncio[];
  criativos: any[];
}

export default function ModalCriacaoAninhada({ 
  open, 
  onOpenChange, 
  funil, 
  funilId, 
  onConcluido 
}: Props) {
  const [etapaAtual, setEtapaAtual] = useState<EtapaCriacao>('selecao');
  const [fluxo, setFluxo] = useState<FluxoCriacao>({
    criarCampanha: true,
    criarConjuntos: false,
    quantidadeConjuntos: 1,
    criarCriativos: false,
    quantidadeCriativos: 1,
  });
  const [dadosCriados, setDadosCriados] = useState<DadosCriados>({
    conjuntos: [],
    criativos: [],
  });
  const [conjuntoAtualIndex, setConjuntoAtualIndex] = useState(0);
  const [criativoAtualIndex, setCriativoAtualIndex] = useState(0);
  const [conjuntoAtualId, setConjuntoAtualId] = useState<string>('');

  const etapas = [
    { id: 'campanha', nome: 'Campanha', icon: Zap, ativo: fluxo.criarCampanha },
    { id: 'conjuntos', nome: 'Conjuntos', icon: Target, ativo: fluxo.criarConjuntos },
    { id: 'criativos', nome: 'Criativos', icon: Palette, ativo: fluxo.criarCriativos },
  ];

  const handleFluxoChange = (campo: keyof FluxoCriacao, valor: boolean | number) => {
    setFluxo(prev => ({ ...prev, [campo]: valor }));
  };

  const iniciarFluxo = () => {
    if (!fluxo.criarCampanha) {
      toast.error('É necessário criar pelo menos uma campanha');
      return;
    }
    setEtapaAtual('campanha');
  };

  const handleCampanhaCriada = () => {
    // Campanhas criadas com sucesso, prosseguir no fluxo
    if (fluxo.criarConjuntos) {
      setEtapaAtual('conjuntos');
    } else {
      finalizarCriacao();
    }
  };

  const handleConjuntoCriado = () => {
    const proximoConjunto = conjuntoAtualIndex + 1;
    
    if (proximoConjunto < fluxo.quantidadeConjuntos) {
      setConjuntoAtualIndex(proximoConjunto);
      // Continua na mesma etapa para criar o próximo conjunto
    } else if (fluxo.criarCriativos) {
      setEtapaAtual('criativos');
    } else {
      finalizarCriacao();
    }
  };

  const onCriativoCriado = () => {
    const novosCriativos = [...dadosCriados.criativos];
    novosCriativos.push({ conjuntoIndex: conjuntoAtualIndex, criativoIndex: criativoAtualIndex });
    setDadosCriados(prev => ({ ...prev, criativos: novosCriativos }));

    const proximoCriativo = criativoAtualIndex + 1;
    
    if (proximoCriativo < fluxo.quantidadeCriativos) {
      setCriativoAtualIndex(proximoCriativo);
      // Continua na mesma etapa para criar o próximo criativo
    } else {
      // Verifica se há mais conjuntos para criar criativos
      const proximoConjunto = conjuntoAtualIndex + 1;
      if (proximoConjunto < dadosCriados.conjuntos.length) {
        setConjuntoAtualIndex(proximoConjunto);
        setCriativoAtualIndex(0);
        setConjuntoAtualId(dadosCriados.conjuntos[proximoConjunto].id);
        // Continua criando criativos para o próximo conjunto
      } else {
        finalizarCriacao();
      }
    }
  };

  const finalizarCriacao = () => {
    setEtapaAtual('concluido');
    toast.success('Estrutura criada com sucesso!');
    
    setTimeout(() => {
      resetar();
      onConcluido?.();
      onOpenChange(false);
    }, 2000);
  };

  const resetar = () => {
    setEtapaAtual('selecao');
    setFluxo({
      criarCampanha: true,
      criarConjuntos: false,
      quantidadeConjuntos: 1,
      criarCriativos: false,
      quantidadeCriativos: 1,
    });
    setDadosCriados({ conjuntos: [], criativos: [] });
    setConjuntoAtualIndex(0);
    setCriativoAtualIndex(0);
    setConjuntoAtualId('');
  };

  const renderSelecaoFluxo = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Escolha o que deseja criar:</h3>
        <div className="space-y-4">
          {/* Campanha */}
          <div className="flex items-start space-x-3 p-4 border rounded-lg">
            <Checkbox
              id="criarCampanha"
              checked={fluxo.criarCampanha}
              onCheckedChange={(checked) => handleFluxoChange('criarCampanha', checked as boolean)}
              disabled // Sempre obrigatório
            />
            <div className="flex-1">
              <Label htmlFor="criarCampanha" className="flex items-center gap-2 font-medium">
                <Zap className="h-4 w-4" />
                Campanha (Obrigatório)
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Crie a campanha principal com métricas e configurações
              </p>
            </div>
          </div>

          {/* Conjuntos */}
          <div className="flex items-start space-x-3 p-4 border rounded-lg">
            <Checkbox
              id="criarConjuntos"
              checked={fluxo.criarConjuntos}
              onCheckedChange={(checked) => handleFluxoChange('criarConjuntos', checked as boolean)}
            />
            <div className="flex-1">
              <Label htmlFor="criarConjuntos" className="flex items-center gap-2 font-medium">
                <Target className="h-4 w-4" />
                Conjuntos de Anúncios
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Defina públicos-alvo e configurações de licitação
              </p>
              {fluxo.criarConjuntos && (
                <div className="mt-3">
                  <Label className="text-xs text-muted-foreground">Quantidade de conjuntos:</Label>
                  <select
                    value={fluxo.quantidadeConjuntos}
                    onChange={(e) => handleFluxoChange('quantidadeConjuntos', parseInt(e.target.value))}
                    className="ml-2 px-2 py-1 text-sm border rounded"
                  >
                    {[1, 2, 3, 4, 5].map(num => (
                      <option key={num} value={num}>{num}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Criativos */}
          <div className="flex items-start space-x-3 p-4 border rounded-lg">
            <Checkbox
              id="criarCriativos"
              checked={fluxo.criarCriativos}
              onCheckedChange={(checked) => handleFluxoChange('criarCriativos', checked as boolean)}
              disabled={!fluxo.criarConjuntos}
            />
            <div className="flex-1">
              <Label htmlFor="criarCriativos" className="flex items-center gap-2 font-medium">
                <Palette className="h-4 w-4" />
                Criativos
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Adicione imagens, vídeos e textos dos anúncios
                {!fluxo.criarConjuntos && <span className="text-amber-600"> (requer conjuntos)</span>}
              </p>
              {fluxo.criarCriativos && (
                <div className="mt-3">
                  <Label className="text-xs text-muted-foreground">Criativos por conjunto:</Label>
                  <select
                    value={fluxo.quantidadeCriativos}
                    onChange={(e) => handleFluxoChange('quantidadeCriativos', parseInt(e.target.value))}
                    className="ml-2 px-2 py-1 text-sm border rounded"
                  >
                    {[1, 2, 3, 4, 5].map(num => (
                      <option key={num} value={num}>{num}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Preview do fluxo */}
      <div>
        <h4 className="font-medium mb-3">Fluxo de criação:</h4>
        <div className="flex items-center space-x-2 text-sm">
          {etapas.map((etapa, index) => {
            const Icon = etapa.icon;
            const isAtivo = etapa.ativo;
            
            return (
              <div key={etapa.id} className="flex items-center">
                <div className={`flex items-center gap-1 px-2 py-1 rounded ${
                  isAtivo ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}>
                  <Icon className="h-3 w-3" />
                  {etapa.nome}
                </div>
                {index < etapas.length - 1 && isAtivo && etapas[index + 1].ativo && (
                  <ArrowRight className="h-3 w-3 mx-1 text-muted-foreground" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderProgresso = () => {
    const etapasCriadas = [];
    if (dadosCriados.campanha) etapasCriadas.push('Campanha');
    if (dadosCriados.conjuntos.length > 0) etapasCriadas.push(`${dadosCriados.conjuntos.length} Conjuntos`);
    if (dadosCriados.criativos.length > 0) etapasCriadas.push(`${dadosCriados.criativos.length} Criativos`);

    return (
      <div className="mb-4 p-3 bg-muted rounded-lg">
        <div className="flex items-center gap-2 text-sm">
          <Layers className="h-4 w-4" />
          <span>Progresso:</span>
          {etapasCriadas.map((etapa, index) => (
            <span key={index} className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-green-600" />
              {etapa}
              {index < etapasCriadas.length - 1 && <ArrowRight className="h-3 w-3 mx-1" />}
            </span>
          ))}
        </div>
      </div>
    );
  };

  const renderConcluido = () => (
    <div className="text-center py-8">
      <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
      <h3 className="text-xl font-semibold mb-2">Estrutura Criada!</h3>
      <div className="text-sm text-muted-foreground space-y-1">
        {dadosCriados.campanha && <p>✓ 1 Campanha criada</p>}
        {dadosCriados.conjuntos.length > 0 && <p>✓ {dadosCriados.conjuntos.length} Conjuntos criados</p>}
        {dadosCriados.criativos.length > 0 && <p>✓ {dadosCriados.criativos.length} Criativos criados</p>}
      </div>
    </div>
  );

  return (
    <>
      <Dialog open={open && etapaAtual === 'selecao'} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Criação em Sequência</DialogTitle>
            <DialogDescription>
              Crie toda a estrutura da sua campanha em um fluxo organizado
              {funil && (
                <span className="block mt-1 font-medium text-primary">
                  Funil: {funil.nome}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {renderSelecaoFluxo()}

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={iniciarFluxo}>
              Iniciar Criação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal da Campanha */}
      {etapaAtual === 'campanha' && (
        <ModalCriarCampanha
          funil={funil}
          funilId={funilId}
          onCampanhaCriada={handleCampanhaCriada}
          trigger={<div />} // Trigger obrigatório mas não usado
        />
      )}

      {/* Modal dos Conjuntos */}
      {etapaAtual === 'conjuntos' && (
        <ModalCriarConjunto
          open={true}
          onOpenChange={(open: boolean) => !open && setEtapaAtual('selecao')}
          campanha={dadosCriados.campanha}
          campanhaId={dadosCriados.campanha?.id}
          onConjuntoCriado={handleConjuntoCriado}
        />
      )}

      {/* Modal dos Criativos */}
      <ModalCriarCriativo
        open={etapaAtual === 'criativos'}
        onOpenChange={(open) => !open && setEtapaAtual('selecao')}
        conjunto={dadosCriados.conjuntos[conjuntoAtualIndex]}
        conjuntoId={conjuntoAtualId}
        onCriativoCriado={onCriativoCriado}
      />

      {/* Dialog de conclusão */}
      <Dialog open={etapaAtual === 'concluido'} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Concluído!</DialogTitle>
          </DialogHeader>
          {renderProgresso()}
          {renderConcluido()}
        </DialogContent>
      </Dialog>
    </>
  );
}