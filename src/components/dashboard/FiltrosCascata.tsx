'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, Filter, X, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useCampanhaContext } from '@/contexts/CampanhaContext';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

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
  const { isClean } = useTheme();
  const { filtroData } = useCampanhaContext();

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
      // Carregar públicos de TODAS as campanhas do funil quando nenhuma campanha é selecionada
      if (!filters.campanha) {
        carregarPublicosPorFunil(filters.funil.id);
        carregarCriativosPorFunil(filters.funil.id);
      }
    } else {
      setCampanhas([]);
      setPublicos([]);
      setCriativos([]);
    }
  }, [filters.funil]);

  // Carregar públicos quando campanha é selecionada
  useEffect(() => {
    if (filters.campanha) {
      carregarPublicos(filters.campanha.id);
      // Só carrega criativos se NÃO tiver público selecionado
      if (!filters.publico) {
        carregarCriativos(filters.campanha.id);
      }
    } else if (filters.funil) {
      // Se desmarcar campanha, volta a mostrar públicos/criativos do funil
      carregarPublicosPorFunil(filters.funil.id);
      carregarCriativosPorFunil(filters.funil.id);
    } else {
      setPublicos([]);
      setCriativos([]);
    }
  }, [filters.campanha]);

  // Carregar criativos quando público é selecionado
  useEffect(() => {
    if (filters.publico) {
      carregarCriativosPorPublico(filters.publico.id);
    } else if (filters.campanha) {
      // Se desmarcar público, volta a mostrar criativos da campanha
      carregarCriativos(filters.campanha.id);
    } else {
      setCriativos([]);
    }
  }, [filters.publico]);

  // Recarregar conjuntos/criativos quando o período muda (para filtrar apenas os com dados)
  useEffect(() => {
    if (!filters.funil) return;
    if (filters.campanha) {
      carregarPublicos(filters.campanha.id);
      if (!filters.publico) carregarCriativos(filters.campanha.id);
    } else {
      carregarPublicosPorFunil(filters.funil.id);
      carregarCriativosPorFunil(filters.funil.id);
    }
  }, [filtroData.dataInicio, filtroData.dataFim]);

  const carregarFunis = async () => {
    try {
      setLoading(true);
      
      console.log('Iniciando carregamento de funis via API...');
      
      const response = await fetch('/api/funis');
      
      if (!response.ok) {
        throw new Error('Erro ao carregar funis');
      }

      const data = await response.json();
      
      const funisFormatados = (data.funis || []).map((funil: any) => ({
        id: funil.id,
        name: funil.nome,
        count: funil.campanhas_count || 0
      }));

      console.log('✅ Funis carregados com sucesso via API!', funisFormatados);
      setFunis(funisFormatados);
    } catch (error) {
      console.error('Erro ao carregar funis:', error);
      // Usar dados de exemplo em caso de erro
      const funisExemplo = [
        { id: 'exemplo-1', name: 'Funil Masterclass (Demo)', count: 3 },
        { id: 'exemplo-2', name: 'Funil Aplicação (Demo)', count: 2 },
        { id: 'exemplo-3', name: 'Funil Captação (Demo)', count: 5 },
      ];
      setFunis(funisExemplo);
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
      })) || [];

      console.log('Campanhas carregadas do Supabase:', campanhasFormatadas.length);
      setCampanhas(campanhasFormatadas);
    } catch (error) {
      console.error('Erro ao carregar campanhas:', error);
    }
  };

  // Carregar públicos de um funil, filtrados pelo período selecionado
  const carregarPublicosPorFunil = async (funilId: string) => {
    try {
      const { data: campanhasFunil, error: errCampanhas } = await supabase
        .from('campanhas')
        .select('id')
        .eq('funil_id', funilId);

      if (errCampanhas || !campanhasFunil || campanhasFunil.length === 0) {
        setPublicos([]);
        return;
      }

      const campanhaIds = campanhasFunil.map(c => c.id);

      // Buscar conjuntos de TODAS as campanhas do funil
      const { data: conjuntos, error } = await supabase
        .from('conjuntos_anuncio')
        .select('id, publico, nome')
        .in('campanha_id', campanhaIds);

      if (error || !conjuntos || conjuntos.length === 0) {
        setPublicos([]);
        return;
      }

      // Filtrar apenas conjuntos que têm métricas no período selecionado
      const conjuntoIds = conjuntos.map(c => c.id);
      const { data: metricasComDados } = await supabase
        .from('metricas')
        .select('referencia_id')
        .eq('tipo', 'conjunto')
        .in('referencia_id', conjuntoIds)
        .gte('periodo_inicio', filtroData.dataInicio)
        .lte('periodo_fim', filtroData.dataFim);

      const idsComDados = new Set((metricasComDados || []).map(m => m.referencia_id));

      const mapaPublicos: Record<string, FilterOption> = {};
      conjuntos.forEach((conjunto) => {
        if (!conjunto?.id || !conjunto?.nome) return;
        if (!idsComDados.has(conjunto.id)) return; // Pular conjuntos sem dados no período
        mapaPublicos[conjunto.id] = { id: conjunto.id, name: String(conjunto.nome) };
      });

      console.log('📋 Conjuntos com dados no período:', Object.keys(mapaPublicos).length, '/', conjuntos.length);
      setPublicos(Object.values(mapaPublicos));
    } catch (error) {
      console.error('Erro ao carregar públicos por funil:', error);
      setPublicos([]);
    }
  };

  // Carregar criativos de um funil, filtrados pelo período selecionado
  const carregarCriativosPorFunil = async (funilId: string) => {
    try {
      const { data: campanhasFunil } = await supabase
        .from('campanhas')
        .select('id')
        .eq('funil_id', funilId);

      if (!campanhasFunil || campanhasFunil.length === 0) {
        setCriativos([]);
        return;
      }

      const campanhaIds = campanhasFunil.map(c => c.id);

      const { data: conjuntos } = await supabase
        .from('conjuntos_anuncio')
        .select('id')
        .in('campanha_id', campanhaIds);

      if (!conjuntos || conjuntos.length === 0) {
        setCriativos([]);
        return;
      }

      const conjuntoIds = conjuntos.map(c => c.id);

      const { data: anunciosData } = await supabase
        .from('anuncios')
        .select('id, nome, tipo')
        .in('conjunto_anuncio_id', conjuntoIds);

      if (!anunciosData || anunciosData.length === 0) {
        setCriativos([]);
        return;
      }

      // Filtrar apenas anúncios que têm métricas no período selecionado
      const anuncioIds = anunciosData.map(a => a.id);
      const { data: metricasComDados } = await supabase
        .from('metricas')
        .select('referencia_id')
        .eq('tipo', 'anuncio')
        .in('referencia_id', anuncioIds)
        .gte('periodo_inicio', filtroData.dataInicio)
        .lte('periodo_fim', filtroData.dataFim);

      const idsComDados = new Set((metricasComDados || []).map(m => m.referencia_id));

      const mapaCriativos: Record<string, FilterOption> = {};
      anunciosData.forEach((anuncio) => {
        if (!anuncio) return;
        if (!idsComDados.has(anuncio.id)) return;
        mapaCriativos[anuncio.id] = { id: anuncio.id, name: `${anuncio.nome}${anuncio.tipo ? ` (${anuncio.tipo})` : ''}` };
      });

      console.log('🎨 Criativos com dados no período:', Object.keys(mapaCriativos).length, '/', anunciosData.length);
      setCriativos(Object.values(mapaCriativos));
    } catch (error) {
      console.error('Erro ao carregar criativos por funil:', error);
      setCriativos([]);
    }
  };

  const carregarPublicos = async (campanhaId: string) => {
    try {
      const { data: conjuntos, error } = await supabase
        .from('conjuntos_anuncio')
        .select('id, publico, nome')
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

      // Filtrar apenas conjuntos que têm métricas no período selecionado
      const conjuntoIds = conjuntos.map(c => c.id);
      const { data: metricasComDados } = await supabase
        .from('metricas')
        .select('referencia_id')
        .eq('tipo', 'conjunto')
        .in('referencia_id', conjuntoIds)
        .gte('periodo_inicio', filtroData.dataInicio)
        .lte('periodo_fim', filtroData.dataFim);

      const idsComDados = new Set((metricasComDados || []).map(m => m.referencia_id));

      const mapaPublicos: Record<string, FilterOption> = {};
      conjuntos.forEach((conjunto) => {
        if (!conjunto?.id || !conjunto?.nome) return;
        if (!idsComDados.has(conjunto.id)) return;
        mapaPublicos[conjunto.id] = { id: conjunto.id, name: String(conjunto.nome) };
      });

      setPublicos(Object.values(mapaPublicos));
    } catch (error) {
      console.error('Erro ao carregar públicos:', error);
      setPublicos([]);
    }
  };

  const carregarCriativosPorPublico = async (publicoId: string) => {
    try {
      console.log('🎨 Carregando criativos do público:', publicoId);
      
      const { data: anunciosData, error: errorAnuncios } = await supabase
        .from('anuncios')
        .select('id, nome, tipo')
        .eq('conjunto_anuncio_id', publicoId);

      if (errorAnuncios) {
        console.error('Erro ao buscar anúncios do público:', errorAnuncios);
        setCriativos([]);
        return;
      }

      if (!anunciosData || anunciosData.length === 0) {
        setCriativos([]);
        return;
      }

      // Filtrar apenas anúncios que têm métricas no período selecionado
      const anuncioIds = anunciosData.map(a => a.id);
      const { data: metricasComDados } = await supabase
        .from('metricas')
        .select('referencia_id')
        .eq('tipo', 'anuncio')
        .in('referencia_id', anuncioIds)
        .gte('periodo_inicio', filtroData.dataInicio)
        .lte('periodo_fim', filtroData.dataFim);

      const idsComDados = new Set((metricasComDados || []).map(m => m.referencia_id));

      const mapaCriativos: Record<string, FilterOption> = {};
      anunciosData.forEach((anuncio) => {
        if (!anuncio) return;
        if (!idsComDados.has(anuncio.id)) return;
        const id = anuncio.id;
        const name = `${anuncio.nome}${anuncio.tipo ? ` (${anuncio.tipo})` : ''}`;
        mapaCriativos[id] = { id, name };
      });

      setCriativos(Object.values(mapaCriativos));
      console.log('✅ Criativos com dados no período:', Object.keys(mapaCriativos).length, '/', anunciosData.length);
    } catch (error) {
      console.error('Erro ao carregar criativos do público:', error);
      setCriativos([]);
    }
  };

  const carregarCriativos = async (campanhaId: string) => {
    try {
      console.log('🎨 Carregando criativos da campanha:', campanhaId);
      
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

      const { data: anunciosData, error: errorAnuncios } = await supabase
        .from('anuncios')
        .select('id, nome, tipo')
        .in('conjunto_anuncio_id', conjuntoIds);

      if (errorAnuncios) {
        console.error('Erro ao buscar anúncios:', errorAnuncios);
        setCriativos([]);
        return;
      }

      if (!anunciosData || anunciosData.length === 0) {
        setCriativos([]);
        return;
      }

      // Filtrar apenas anúncios que têm métricas no período selecionado
      const anuncioIds = anunciosData.map(a => a.id);
      const { data: metricasComDados } = await supabase
        .from('metricas')
        .select('referencia_id')
        .eq('tipo', 'anuncio')
        .in('referencia_id', anuncioIds)
        .gte('periodo_inicio', filtroData.dataInicio)
        .lte('periodo_fim', filtroData.dataFim);

      const idsComDados = new Set((metricasComDados || []).map(m => m.referencia_id));

      const mapaCriativos: Record<string, FilterOption> = {};
      anunciosData.forEach((anuncio) => {
        if (!anuncio) return;
        if (!idsComDados.has(anuncio.id)) return;
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
    
    // Aplicar filtros automaticamente quando seleciona
    onFiltersChange(newFilters);
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

  const removeFilter = (filterType: keyof FilterState) => {
    const newFilters = { ...filters };
    newFilters[filterType] = null;
    
    // Se remover funil, limpar campanha, público e criativo
    if (filterType === 'funil') {
      newFilters.campanha = null;
      newFilters.publico = null;
      newFilters.criativo = null;
    }
    // Se remover campanha, limpar público e criativo
    else if (filterType === 'campanha') {
      newFilters.publico = null;
      newFilters.criativo = null;
    }
    
    setFilters(newFilters);
    onFiltersChange(newFilters);
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

  // Contagem de filtros ativos para badge
  const activeFilterCount = [filters.funil, filters.campanha, filters.publico, filters.criativo].filter(Boolean).length;

  const renderDropdown = (
    type: keyof FilterState,
    options: FilterOption[],
    placeholder: string,
    disabled = false
  ) => {
    const isSelected = !!filters[type];
    const todosLabel = type === 'funil' ? 'Todos os funis' 
      : type === 'campanha' ? 'Todas as campanhas'
      : type === 'publico' ? 'Todos os conjuntos'
      : 'Todos os criativos';

    return (
    <div className={`relative ${openDropdown === type ? 'z-40' : 'z-10'}`} data-dropdown>
      <button
        onClick={() => setOpenDropdown(openDropdown === type ? null : type)}
        disabled={disabled}
        className={`
          filter-btn w-full flex items-center justify-between px-3 py-1.5 text-sm rounded-md border transition-all duration-200
          ${disabled 
            ? (isClean ? 'bg-gray-50 border-gray-200 text-gray-300 cursor-not-allowed' : 'bg-slate-800/30 border-slate-700/30 text-slate-500 cursor-not-allowed')
            : isSelected
              ? (isClean ? 'active bg-amber-50 border-amber-200 text-gray-900 ring-1 ring-amber-200' : 'active bg-slate-700/60 border-cyan-500/50 text-white ring-1 ring-cyan-500/20')
              : (isClean ? 'bg-white border-gray-200 text-gray-700 hover:border-amber-200 hover:bg-gray-50' : 'bg-slate-800/50 border-slate-600/50 text-white hover:border-cyan-500/50 hover:bg-slate-700/50')
          }
          ${openDropdown === type ? (isClean ? 'border-amber-300 bg-amber-50/50' : 'border-cyan-500/70 bg-slate-700/50') : ''}
        `}
      >
        <span className={`text-xs truncate ${isSelected ? (isClean ? 'text-amber-700 font-medium' : 'text-cyan-300 font-medium') : ''}`}>
          {filters[type]?.name || placeholder}
        </span>
        <div className="flex items-center gap-1 flex-shrink-0">
          {isSelected && (
            <span
              role="button"
              onClick={(e) => {
                e.stopPropagation();
                removeFilter(type);
              }}
              className={cn('p-0.5 rounded transition-colors cursor-pointer', isClean ? 'hover:bg-red-50' : 'hover:bg-red-500/20')}
              title="Limpar filtro"
            >
              <X className={cn('h-3 w-3', isClean ? 'text-gray-400 hover:text-red-500' : 'text-slate-400 hover:text-red-400')} />
            </span>
          )}
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${
            openDropdown === type ? 'rotate-180' : ''
          }`} />
        </div>
      </button>

      {openDropdown === type && !disabled && (
        <div className={cn(
          'filter-dropdown absolute top-full left-0 right-0 mt-1 rounded-md shadow-2xl z-40 max-h-60 overflow-y-auto',
          isClean ? 'bg-white border border-gray-200' : 'bg-slate-800/95 backdrop-blur-xl border border-slate-600/50'
        )}>
          {/* Opção "Todos" no topo */}
          <button
            onClick={() => {
              removeFilter(type);
              setOpenDropdown(null);
            }}
            className={cn(
              'w-full px-3 py-2 text-left text-xs transition-colors flex items-center justify-between',
              isClean ? 'border-b border-gray-100' : 'border-b border-slate-700/50',
              !isSelected 
                ? (isClean ? 'text-amber-700 bg-amber-50 font-medium' : 'text-cyan-400 bg-slate-700/30 font-medium')
                : (isClean ? 'text-gray-600 hover:bg-gray-50' : 'text-slate-300 hover:bg-slate-700/50')
            )}
          >
            <span>{todosLabel}</span>
            {!isSelected && <Check className={cn('h-3 w-3', isClean ? 'text-amber-600' : 'text-cyan-400')} />}
          </button>
          {options.map((option) => (
            <button
              key={option.id}
              onClick={() => handleFilterSelect(type, option)}
              className={cn(
                'w-full px-3 py-2 text-left text-xs transition-colors flex items-center justify-between group',
                filters[type]?.id === option.id 
                  ? (isClean ? 'text-amber-700 bg-amber-50 font-medium' : 'text-cyan-400 bg-cyan-500/10 font-medium')
                  : (isClean ? 'text-gray-700 hover:bg-gray-50' : 'text-white hover:bg-slate-700/50')
              )}
            >
              <span className="truncate">{option.name}</span>
              <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                {option.count && (
                  <span className={cn(
                    'text-[10px]',
                    isClean ? 'text-gray-400 group-hover:text-amber-600' : 'text-slate-400 group-hover:text-cyan-400'
                  )}>
                    {option.count.toLocaleString()}
                  </span>
                )}
                {filters[type]?.id === option.id && <Check className={cn('h-3 w-3', isClean ? 'text-amber-600' : 'text-cyan-400')} />}
              </div>
            </button>
          ))}
          {options.length === 0 && (
            <div className={cn('px-3 py-3 text-xs text-center', isClean ? 'text-gray-400' : 'text-slate-500')}>
              Nenhuma opção disponível
            </div>
          )}
        </div>
      )}
    </div>
  );
  };

  return (
    <div className={`filter-section space-y-2 relative z-30 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Filter className={cn('filter-icon h-3.5 w-3.5', isClean ? 'text-amber-600' : 'text-purple-400')} />
          <h3 className={cn('filter-label text-xs font-semibold', isClean ? 'text-gray-600' : 'text-slate-300')}>Filtros de Campanha</h3>
          {activeFilterCount > 0 && (
            <span className={cn(
              'inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold rounded-full',
              isClean ? 'text-white bg-amber-600' : 'text-white bg-cyan-500'
            )}>
              {activeFilterCount}
            </span>
          )}
        </div>
        {activeFilterCount > 0 && (
          <button
            onClick={clearFilters}
            className={cn(
              'flex items-center space-x-1 px-2 py-0.5 text-[10px] transition-colors rounded',
              isClean ? 'text-gray-400 hover:text-red-500 hover:bg-red-50' : 'text-slate-400 hover:text-red-400 hover:bg-red-500/10'
            )}
          >
            <X className="h-3 w-3" />
            <span>Limpar tudo</span>
          </button>
        )}
      </div>

      {/* Filtros em Grid Compacto */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 relative z-30">
        
        {/* Funil */}
        <div className={`relative ${openDropdown === 'funil' ? 'z-40' : 'z-10'}`}>
          <label className={cn('filter-label block text-[10px] font-medium mb-1', isClean ? 'text-gray-400' : 'text-slate-400')}>
            FUNIL
          </label>
          {renderDropdown('funil', funis, 'Todos os funis', loading)}
        </div>

        {/* Campanha */}
        <div className={`relative ${openDropdown === 'campanha' ? 'z-40' : 'z-10'}`}>
          <label className={cn('filter-label block text-[10px] font-medium mb-1', isClean ? 'text-gray-400' : 'text-slate-400')}>
            CAMPANHA
          </label>
          {renderDropdown('campanha', campanhas, 'Todas campanhas', !filters.funil)}
        </div>

        {/* Público */}
        <div className={`relative ${openDropdown === 'publico' ? 'z-40' : 'z-10'}`}>
          <label className={cn('filter-label block text-[10px] font-medium mb-1', isClean ? 'text-gray-400' : 'text-slate-400')}>
            CONJUNTO
          </label>
          {renderDropdown('publico', publicos, 'Todos conjuntos', !filters.funil)}
        </div>

        {/* Criativo */}
        <div className={`relative ${openDropdown === 'criativo' ? 'z-40' : 'z-10'}`}>
          <label className={cn('filter-label block text-[10px] font-medium mb-1', isClean ? 'text-gray-400' : 'text-slate-400')}>
            CRIATIVO
          </label>
          {renderDropdown('criativo', criativos, 'Todos criativos', !filters.funil)}
        </div>

      </div>

      {/* Breadcrumb dos filtros ativos */}
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap pt-1">
          <span className={cn('text-[10px]', isClean ? 'text-gray-400' : 'text-slate-500')}>Filtrando por:</span>
          {filters.funil && (
            <span className={cn(
              'inline-flex items-center gap-1 px-2 py-0.5 text-[10px] rounded-full border',
              isClean ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-blue-500/15 text-blue-300 border-blue-500/20'
            )}>
              📊 {filters.funil.name}
              <button onClick={() => removeFilter('funil')} className="hover:text-red-400 transition-colors">
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          )}
          {filters.campanha && (
            <span className={cn(
              'inline-flex items-center gap-1 px-2 py-0.5 text-[10px] rounded-full border',
              isClean ? 'bg-green-50 text-green-600 border-green-200' : 'bg-green-500/15 text-green-300 border-green-500/20'
            )}>
              📈 {filters.campanha.name}
              <button onClick={() => removeFilter('campanha')} className="hover:text-red-400 transition-colors">
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          )}
          {filters.publico && (
            <span className={cn(
              'inline-flex items-center gap-1 px-2 py-0.5 text-[10px] rounded-full border',
              isClean ? 'bg-purple-50 text-purple-600 border-purple-200' : 'bg-purple-500/15 text-purple-300 border-purple-500/20'
            )}>
              👥 {filters.publico.name}
              <button onClick={() => removeFilter('publico')} className="hover:text-red-400 transition-colors">
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          )}
          {filters.criativo && (
            <span className={cn(
              'inline-flex items-center gap-1 px-2 py-0.5 text-[10px] rounded-full border',
              isClean ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-orange-500/15 text-orange-300 border-orange-500/20'
            )}>
              🎨 {filters.criativo.name}
              <button onClick={() => removeFilter('criativo')} className="hover:text-red-400 transition-colors">
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}