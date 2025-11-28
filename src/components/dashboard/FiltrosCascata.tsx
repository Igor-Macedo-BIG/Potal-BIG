'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, Filter, X, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface FilterOption {
  id: string;
  name: string;
  count?: number;
}

interface FilterState {
  funil: FilterOption | null;
  campanha: FilterOption | null;
  publico: FilterOption | null;
  criativo: FilterOption | null;
}

interface Props {
  onFiltersChange: (filters: FilterState) => void;
  className?: string;
}

export function FiltrosCascata({ onFiltersChange, className = '' }: Props) {
  // Carregar filtros do localStorage
  const [filters, setFilters] = useState<FilterState>(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('filtrosCampanhaAtivos');
        if (saved) {
          const parsed = JSON.parse(saved);
          console.log('🔄 Filtros carregados do localStorage:', parsed);
          return parsed;
        }
      }
    } catch (err) {
      console.error('Erro ao carregar filtros do localStorage:', err);
    }
    return {
      funil: null,
      campanha: null,
      publico: null,
      criativo: null,
    };
  });

  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Estados para dados reais do Supabase
  const [funis, setFunis] = useState<FilterOption[]>([]);
  const [campanhas, setCampanhas] = useState<FilterOption[]>([]);
  const [publicos, setPublicos] = useState<FilterOption[]>([]);
  const [criativos, setCriativos] = useState<FilterOption[]>([]);

  // Notificar pai quando filtros carregam do localStorage (primeira montagem)
  useEffect(() => {
    if (filters.funil || filters.campanha || filters.publico || filters.criativo) {
      console.log('🔄 Restaurando filtros salvos para o pai:', filters);
      onFiltersChange(filters);
    }
  }, []); // Executar apenas na montagem

  // Carregar funis do Supabase
  useEffect(() => {
    const timer = setTimeout(() => {
      carregarFunis();
    }, 1000); // Aguardar 1 segundo para garantir que outros componentes carregaram

    return () => clearTimeout(timer);
  }, []);

  // Carregar campanhas quando funil é selecionado
  useEffect(() => {
    if (filters.funil) {
      carregarCampanhas(filters.funil.id);
    } else {
      setCampanhas([]);
    }
  }, [filters.funil]);

  // Carregar públicos e criativos quando campanha é selecionada
  useEffect(() => {
    if (filters.campanha) {
      carregarPublicos(filters.campanha.id);
      carregarCriativos(filters.campanha.id);
    } else {
      setPublicos([]);
      setCriativos([]);
    }
  }, [filters.campanha]);

  const carregarFunis = async () => {
    try {
      setLoading(true);
      
      console.log('Iniciando carregamento de funis...');
      
      // Primeiro, vamos tentar buscar TODOS os funis para debug
      const { data: todosFunis, error: errorTodos } = await supabase
        .from('funis')
        .select('*');
      
      console.log('TODOS os funis no banco:', todosFunis);
      console.log('Erro ao buscar todos os funis:', errorTodos);

      // Agora carregar funis igual ao SidebarComFunis
      const { data: funisData, error: errorFunis } = await supabase
        .from('funis')
        .select('*')
        .eq('empresa_id', '550e8400-e29b-41d4-a716-446655440000')
        .order('created_at', { ascending: false });

      if (errorFunis) {
        console.error('Erro ao carregar funis (FiltrosCascata):', errorFunis);
        // Usar dados de exemplo em caso de erro
        const funisExemplo = [
          { id: 'exemplo-1', name: 'Funil Masterclass (Demo)', count: 3 },
          { id: 'exemplo-2', name: 'Funil Aplicação (Demo)', count: 2 },
          { id: 'exemplo-3', name: 'Funil Captação (Demo)', count: 5 },
        ];
        setFunis(funisExemplo);
        return;
      }

      console.log('Dados brutos dos funis filtrados:', funisData);
      
      let funisParaUsar = funisData;
      
      // Se não encontrou com empresa_id, tentar todos os funis
      if (!funisData || funisData.length === 0) {
        console.log('Nenhum funil encontrado com empresa_id, tentando buscar todos...');
        funisParaUsar = todosFunis || [];
      }

      // Carregar campanhas para contar quantas tem cada funil
      const { data: campanhasData, error: errorCampanhas } = await supabase
        .from('campanhas')
        .select('funil_id')
        .in('funil_id', funisParaUsar?.map((f: any) => f.id) || []);

      if (errorCampanhas) {
        console.error('Erro ao carregar campanhas para contagem:', errorCampanhas);
      }

      console.log('Campanhas encontradas:', campanhasData);

      // Contar campanhas por funil
      const campanhasPorFunil: Record<string, number> = {};
      campanhasData?.forEach((campanha: any) => {
        campanhasPorFunil[campanha.funil_id] = (campanhasPorFunil[campanha.funil_id] || 0) + 1;
      });

      const funisFormatados = funisParaUsar?.map((funil: any) => ({
        id: funil.id,
        name: funil.nome,
        count: campanhasPorFunil[funil.id] || 0
      })) || [];

      console.log('Funis formatados para filtros:', funisFormatados);
      
      // Se não há funis no banco, usar dados de exemplo baseados nos funis do sistema
      if (funisFormatados.length === 0) {
        const funisExemplo = [
          { id: 'real-1', name: 'Funil de Vendas Lídia Cabral', count: 3 },
          { id: 'real-2', name: 'Funil de Captação', count: 2 },
          { id: 'real-3', name: 'Funil de Reativação', count: 5 },
          { id: 'real-4', name: 'Funil Masterclass', count: 1 },
        ];
        console.log('Nenhum funil encontrado no Supabase, usando funis de exemplo baseados no sistema:', funisExemplo);
        setFunis(funisExemplo);
      } else {
        console.log('✅ Funis carregados com sucesso do Supabase!');
        setFunis(funisFormatados);
      }
    } catch (error) {
      console.error('Erro ao carregar funis:', error);
    } finally {
      setLoading(false);
    }
  };

  const carregarCampanhas = async (funilId: string) => {
    try {
      const { data: campanhasData, error } = await supabase
        .from('campanhas')
        .select('id, nome')
        .eq('funil_id', funilId);

      if (error) {
        console.error('Erro ao carregar campanhas:', error);
        return;
      }

      const campanhasFormatadas = campanhasData?.map((campanha: any) => ({
        id: campanha.id,
        name: campanha.nome,
        count: Math.floor(Math.random() * 1000) + 100 // Temporário até termos métricas reais
      })) || [];

      console.log('Campanhas carregadas do Supabase:', campanhasFormatadas);
      
      // Se não há campanhas no banco, usar dados de exemplo baseados no funil
      if (campanhasFormatadas.length === 0) {
        const campanhasExemplo = [
          { id: `exemplo-${funilId}-1`, name: 'Campanha Black Friday (Demo)', count: 1250 },
          { id: `exemplo-${funilId}-2`, name: 'Campanha Lançamento (Demo)', count: 890 },
          { id: `exemplo-${funilId}-3`, name: 'Campanha Evergreen (Demo)', count: 2100 },
        ];
        console.log('Usando campanhas de exemplo:', campanhasExemplo);
        setCampanhas(campanhasExemplo);
      } else {
        setCampanhas(campanhasFormatadas);
      }
    } catch (error) {
      console.error('Erro ao carregar campanhas:', error);
    }
  };

  const carregarPublicos = async (campanhaId: string) => {
    try {
      // Buscar conjuntos de anúncio da campanha diretamente
      const { data: conjuntos, error } = await supabase
        .from('conjuntos_anuncio')
        .select('publico, nome')
        .eq('campanha_id', campanhaId);

      if (error) {
        console.error('Erro ao buscar conjuntos da campanha para públicos:', error);
        setPublicos([]);
        return;
      }

      if (!conjuntos || conjuntos.length === 0) {
        setPublicos([]);
        return;
      }

      // Normalizar e extrair públicos únicos (usando nome do conjunto como público)
      const mapaPublicos: Record<string, FilterOption> = {};
      conjuntos.forEach((conjunto) => {
        const publico = conjunto?.publico || conjunto?.nome;
        if (!publico) return;

        // Usar o valor do público como string
        const publicoStr = String(publico);
        mapaPublicos[publicoStr] = { id: publicoStr, name: publicoStr };
      });

      const listaPublicos = Object.values(mapaPublicos);

      setPublicos(listaPublicos);
    } catch (error) {
      console.error('Erro ao carregar públicos:', error);
      setPublicos([]);
    }
  };

  const carregarCriativos = async (campanhaId: string) => {
    try {
      // Buscar anúncios (criativos) através dos conjuntos de anúncio da campanha
      const { data: conjuntosData, error: errorConjuntos } = await supabase
        .from('conjuntos_anuncio')
        .select('id')
        .eq('campanha_id', campanhaId);

      if (errorConjuntos) {
        console.error('Erro ao buscar conjuntos da campanha:', errorConjuntos);
        setCriativos([]);
        return;
      }

      if (!conjuntosData || conjuntosData.length === 0) {
        setCriativos([]);
        return;
      }

      const conjuntoIds = conjuntosData.map(c => c.id);

      // Buscar anúncios dos conjuntos
      const { data: anunciosData, error: errorAnuncios } = await supabase
        .from('anuncios')
        .select('id, nome, tipo')
        .in('conjunto_anuncio_id', conjuntoIds);

      if (errorAnuncios) {
        console.error('Erro ao buscar anúncios:', errorAnuncios);
        setCriativos([]);
        return;
      }

      const mapaCriativos: Record<string, FilterOption> = {};

      anunciosData?.forEach((anuncio) => {
        if (!anuncio) return;
        const id = anuncio.id;
        const name = `${anuncio.nome}${anuncio.tipo ? ` (${anuncio.tipo})` : ''}`;
        mapaCriativos[id] = { id, name };
      });

      const listaCriativos = Object.values(mapaCriativos);
      setCriativos(listaCriativos);
    } catch (error) {
      console.error('Erro ao carregar criativos:', error);
      setCriativos([]);
    }
  };

  const handleFilterSelect = (filterType: keyof FilterState, option: FilterOption) => {
    const newFilters = { ...filters };
    
    if (filterType === 'funil') {
      newFilters.funil = option;
      newFilters.campanha = null;
      newFilters.publico = null;
      newFilters.criativo = null;
    } else if (filterType === 'campanha') {
      newFilters.campanha = option;
      newFilters.publico = null;
      newFilters.criativo = null;
    } else {
      newFilters[filterType] = option;
    }
    
    setFilters(newFilters);
    setOpenDropdown(null);
  };

  const clearFilters = () => {
    const clearedFilters = {
      funil: null,
      campanha: null,
      publico: null,
      criativo: null,
    };
    setFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const applyFilters = () => {
    onFiltersChange(filters);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-dropdown]')) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const renderDropdown = (
    type: keyof FilterState,
    options: FilterOption[],
    placeholder: string,
    disabled = false
  ) => (
    <div className="relative z-20" data-dropdown>
      <button
        onClick={() => setOpenDropdown(openDropdown === type ? null : type)}
        disabled={disabled}
        className={`
          w-full flex items-center justify-between px-4 py-2 rounded-lg border transition-all duration-200
          ${disabled 
            ? 'bg-slate-800/30 border-slate-700/30 text-slate-500 cursor-not-allowed' 
            : 'bg-slate-800/50 border-slate-600/50 text-white hover:border-cyan-500/50 hover:bg-slate-700/50'
          }
          ${openDropdown === type ? 'border-cyan-500/70 bg-slate-700/50' : ''}
        `}
      >
        <span className="text-sm">
          {filters[type]?.name || placeholder}
        </span>
        <ChevronDown className={`h-4 w-4 transition-transform ${
          openDropdown === type ? 'rotate-180' : ''
        }`} />
      </button>

      {openDropdown === type && !disabled && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800/95 backdrop-blur-xl border border-slate-600/50 rounded-lg shadow-2xl z-[100] max-h-60 overflow-y-auto">
          {options.map((option) => (
            <button
              key={option.id}
              onClick={() => handleFilterSelect(type, option)}
              className="w-full px-4 py-3 text-left text-sm text-white hover:bg-slate-700/50 transition-colors flex items-center justify-between group"
            >
              <span>{option.name}</span>
              {option.count && (
                <span className="text-xs text-slate-400 group-hover:text-cyan-400">
                  {option.count.toLocaleString()}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className={`relative z-10 ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-purple-500/5 to-pink-500/5 blur-2xl" />
      <div className="relative bg-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-4 z-10">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg">
              <Filter className="h-4 w-4 text-white" />
            </div>
            <h3 className="text-base font-bold text-white bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Filtros de Campanha
            </h3>
          </div>
        </div>

        {/* Filtros em Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          
          {/* Funil */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 uppercase tracking-wider">
              Funil {loading && <span className="text-cyan-400">(Carregando...)</span>}
            </label>
            {renderDropdown('funil', funis, 'Selecionar funil', loading)}
          </div>

          {/* Campanha */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 uppercase tracking-wider">
              Campanha
            </label>
            {renderDropdown('campanha', campanhas, 'Selecionar campanha', !filters.funil)}
          </div>

          {/* Público */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 uppercase tracking-wider">
              Público-Alvo
            </label>
            {renderDropdown('publico', publicos, 'Selecionar público', !filters.campanha)}
          </div>

          {/* Criativo */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 uppercase tracking-wider">
              Criativo
            </label>
            {renderDropdown('criativo', criativos, 'Selecionar criativo', !filters.campanha)}
          </div>

        </div>

        {/* Filtros Ativos */}
        {(filters.funil || filters.campanha || filters.publico || filters.criativo) && (
          <div className="mb-4">
            <div className="flex items-center space-x-2 text-xs text-slate-400 mb-2">
              <span>Filtros ativos:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {filters.funil && (
                <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs flex items-center space-x-1">
                  <span>📊 {filters.funil.name}</span>
                  <button onClick={() => handleFilterSelect('funil', filters.funil!)} className="hover:text-white">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {filters.campanha && (
                <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-xs flex items-center space-x-1">
                  <span>📈 {filters.campanha.name}</span>
                  <button onClick={() => handleFilterSelect('campanha', filters.campanha!)} className="hover:text-white">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {filters.publico && (
                <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs flex items-center space-x-1">
                  <span>👥 {filters.publico.name}</span>
                  <button onClick={() => setFilters({...filters, publico: null})} className="hover:text-white">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {filters.criativo && (
                <span className="px-3 py-1 bg-orange-500/20 text-orange-300 rounded-full text-xs flex items-center space-x-1">
                  <span>🎨 {filters.criativo.name}</span>
                  <button onClick={() => setFilters({...filters, criativo: null})} className="hover:text-white">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
            </div>
          </div>
        )}

        {/* Botões de Ação */}
        <div className="flex items-center justify-between">
          <button
            onClick={clearFilters}
            className="flex items-center space-x-2 px-4 py-2 text-slate-400 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
            <span className="text-sm">Limpar filtros</span>
          </button>

          <button
            onClick={applyFilters}
            className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-lg font-medium hover:from-cyan-600 hover:to-purple-600 transition-all duration-200"
          >
            <Check className="h-4 w-4" />
            <span className="text-sm">Aplicar filtros</span>
          </button>
        </div>

      </div>
    </div>
  );
}