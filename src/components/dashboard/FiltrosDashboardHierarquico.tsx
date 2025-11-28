'use client';

import { useState, useEffect } from 'react';
import { Calendar, Filter, TrendingUp, Eye } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import type { FiltrosDashboard, Funil, Campanha } from '@/types/hierarchical';

interface Props {
  filtros: FiltrosDashboard;
  onFiltrosChange: (novosFiltros: FiltrosDashboard) => void;
  isLoading?: boolean;
}

export default function FiltrosDashboardHierarquico({ 
  filtros, 
  onFiltrosChange, 
  isLoading = false 
}: Props) {
  const [funis, setFunis] = useState<Funil[]>([]);
  const [campanhas, setCampanhas] = useState<Campanha[]>([]);
  const [loadingFunis, setLoadingFunis] = useState(false);
  const [loadingCampanhas, setLoadingCampanhas] = useState(false);

  // Carregar funis ao montar o componente
  useEffect(() => {
    carregarFunis();
  }, []);

  // Carregar campanhas quando funil for selecionado
  useEffect(() => {
    if (filtros.funil_id) {
      carregarCampanhas(filtros.funil_id);
    } else {
      setCampanhas([]);
    }
  }, [filtros.funil_id]);

  const carregarFunis = async () => {
    setLoadingFunis(true);
    try {
      // Temporariamente usando dados mock até as APIs estarem prontas
      const mockFunis = [
        { id: 'f1111111-1111-1111-1111-111111111111', nome: 'Masterclass de Vendas' },
        { id: 'f2222222-2222-2222-2222-222222222222', nome: 'Funil de Aplicação' },
        { id: 'f3333333-3333-3333-3333-333333333333', nome: 'Lançamento Digital' },
      ];
      setFunis(mockFunis as any);
      
      // const response = await fetch('/api/funis');
      // if (response.ok) {
      //   const data = await response.json();
      //   setFunis(data);
      // }
    } catch (error) {
      console.error('Erro ao carregar funis:', error);
    } finally {
      setLoadingFunis(false);
    }
  };

  const carregarCampanhas = async (funilId: string) => {
    setLoadingCampanhas(true);
    try {
      // Temporariamente usando dados mock
      const mockCampanhas: any = {
        'f1111111-1111-1111-1111-111111111111': [
          { id: 'c1111111-1111-1111-1111-111111111111', nome: 'Campanha Masterclass Março' },
        ],
        'f2222222-2222-2222-2222-222222222222': [
          { id: 'c2222222-2222-2222-2222-222222222222', nome: 'Campanha Aplicação Q1' },
        ],
        'f3333333-3333-3333-3333-333333333333': [
          { id: 'c3333333-3333-3333-3333-333333333333', nome: 'Pré-Lançamento' },
        ],
      };
      setCampanhas(mockCampanhas[funilId] || []);
      
      // const response = await fetch(`/api/campanhas?funil_id=${funilId}`);
      // if (response.ok) {
      //   const data = await response.json();
      //   setCampanhas(data);
      // }
    } catch (error) {
      console.error('Erro ao carregar campanhas:', error);
    } finally {
      setLoadingCampanhas(false);
    }
  };

  const atualizarFiltro = (campo: keyof FiltrosDashboard, valor: string | undefined) => {
    const novosFiltros = { ...filtros, [campo]: valor };

    // Resetar filtros dependentes quando mudança hierárquica acontece
    if (campo === 'funil_id') {
      novosFiltros.campanha_id = undefined;
      novosFiltros.conjunto_id = undefined;
      novosFiltros.criativo_id = undefined;
    } else if (campo === 'campanha_id') {
      novosFiltros.conjunto_id = undefined;
      novosFiltros.criativo_id = undefined;
    } else if (campo === 'conjunto_id') {
      novosFiltros.criativo_id = undefined;
    }

    onFiltrosChange(novosFiltros);
  };

  const resetarFiltros = () => {
    onFiltrosChange({
      periodo_inicio: getDateDaysAgo(30),
      periodo_fim: getCurrentDate(),
    });
  };

  const aplicarPeriodoPreset = (dias: number) => {
    atualizarFiltro('periodo_inicio', getDateDaysAgo(dias));
    atualizarFiltro('periodo_fim', getCurrentDate());
  };

  // Calcular nível atual dos filtros
  const getNivelAtual = () => {
    if (filtros.criativo_id) return { nivel: 'criativo', icon: Eye };
    if (filtros.conjunto_id) return { nivel: 'conjunto', icon: TrendingUp };
    if (filtros.campanha_id) return { nivel: 'campanha', icon: TrendingUp };
    if (filtros.funil_id) return { nivel: 'funil', icon: Filter };
    return { nivel: 'geral', icon: Filter };
  };

  const nivelAtual = getNivelAtual();

  return (
    <Card className="border-0 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-green-500/10 backdrop-blur-xl">
      <CardContent className="p-6">
        {/* Header com nível atual */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
              <nivelAtual.icon className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Filtros do Dashboard</h3>
              <Badge variant="secondary" className="mt-1">
                Visualizando: {nivelAtual.nivel}
              </Badge>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={resetarFiltros}
            className="border-gray-600 hover:bg-gray-800"
          >
            Resetar
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Período */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Período</label>
            <div className="flex gap-2">
              <Input
                type="date"
                value={filtros.periodo_inicio}
                onChange={(e) => atualizarFiltro('periodo_inicio', e.target.value)}
                className="bg-gray-800/50 border-gray-600"
              />
              <Input
                type="date"
                value={filtros.periodo_fim}
                onChange={(e) => atualizarFiltro('periodo_fim', e.target.value)}
                className="bg-gray-800/50 border-gray-600"
              />
            </div>
            
            {/* Presets de período */}
            <div className="flex gap-2 flex-wrap">
              {[7, 15, 30, 90].map(dias => (
                <Button
                  key={dias}
                  variant="ghost"
                  size="sm"
                  onClick={() => aplicarPeriodoPreset(dias)}
                  className="text-xs h-6 px-2 hover:bg-purple-600/20"
                >
                  {dias}d
                </Button>
              ))}
            </div>
          </div>

          {/* Funil */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-300">Funil</label>
              {filtros.funil_id && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => atualizarFiltro('funil_id', undefined)}
                  className="h-6 px-2 text-xs text-gray-400 hover:text-white"
                >
                  Limpar
                </Button>
              )}
            </div>
            <Select
              value={filtros.funil_id || undefined}
              onValueChange={(value: string) => atualizarFiltro('funil_id', value)}
              disabled={loadingFunis}
            >
              <SelectTrigger className="bg-gray-800/50 border-gray-600">
                <SelectValue placeholder="Todos os funis" />
              </SelectTrigger>
              <SelectContent>
                {funis.map(funil => (
                  <SelectItem key={funil.id} value={funil.id}>
                    {funil.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Campanha */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-300">Campanha</label>
              {filtros.campanha_id && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => atualizarFiltro('campanha_id', undefined)}
                  className="h-6 px-2 text-xs text-gray-400 hover:text-white"
                >
                  Limpar
                </Button>
              )}
            </div>
            <Select
              value={filtros.campanha_id || undefined}
              onValueChange={(value: string) => atualizarFiltro('campanha_id', value)}
              disabled={!filtros.funil_id || loadingCampanhas}
            >
              <SelectTrigger className="bg-gray-800/50 border-gray-600">
                <SelectValue placeholder="Todas as campanhas" />
              </SelectTrigger>
              <SelectContent>
                {campanhas.map(campanha => (
                  <SelectItem key={campanha.id} value={campanha.id}>
                    {campanha.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Placeholder para conjunto (implementar depois) */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Conjunto</label>
            <Select
              value={filtros.conjunto_id || undefined}
              onValueChange={(value: string) => atualizarFiltro('conjunto_id', value)}
              disabled={!filtros.campanha_id}
            >
              <SelectTrigger className="bg-gray-800/50 border-gray-600">
                <SelectValue placeholder="Todos os conjuntos" />
              </SelectTrigger>
              <SelectContent>
                {/* TODO: Carregar conjuntos da campanha selecionada */}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Breadcrumb hierárquico */}
        {(filtros.funil_id || filtros.campanha_id) && (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span>Visualizando:</span>
            {filtros.funil_id && (
              <>
                <Badge variant="outline" className="border-purple-500 text-purple-400">
                  {funis.find(f => f.id === filtros.funil_id)?.nome || 'Funil'}
                </Badge>
                {filtros.campanha_id && <span>→</span>}
              </>
            )}
            {filtros.campanha_id && (
              <Badge variant="outline" className="border-blue-500 text-blue-400">
                {campanhas.find(c => c.id === filtros.campanha_id)?.nome || 'Campanha'}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Utilitários
function getCurrentDate(): string {
  return new Date().toISOString().split('T')[0];
}

function getDateDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
}