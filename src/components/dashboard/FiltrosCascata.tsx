'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, Filter, X, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useCliente } from '@/contexts/ClienteContext';

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
  const { clienteSelecionado } = useCliente();
  
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

  // ✅ CONSOLIDADO: Gerenciar TUDO quando cliente mudar
  useEffect(() => {
    if (clienteSelecionado) {
      console.log('🔄 Cliente mudou, limpando e recarregando...');
      
      // 1. Limpar filtros
      setFilters({
        funil: null,
        campanha: null,
        publico: null,
        criativo: null,
      });

      // 2. Carregar dados (sem limpar antes - deixa a query preencher)
      const timer = setTimeout(() => {
        carregarFunis();
        carregarCampanhas('');
        carregarPublicos('');
        carregarCriativos('');
      }, 100); // Pequeno delay para evitar race condition

      return () => clearTimeout(timer);
    } else {
      // Cliente desmarcado - limpar tudo
      setCampanhas([]);
      setPublicos([]);
      setCriativos([]);
    }
  }, [clienteSelecionado]);


  //  Recarregar campanhas quando FUNIL mudar
  useEffect(() => {
    if (filters.funil && clienteSelecionado) {
      console.log(' Funil mudou, recarregando campanhas filtradas...', {
        funil: filters.funil.name,
        funilId: filters.funil.id
      });
      carregarCampanhas(filters.funil.id);
      carregarPublicos('');
      carregarCriativos('');
    } else if (!filters.funil && clienteSelecionado) {
      console.log(' Funil desmarcado, mostrando todas campanhas do cliente');
      carregarCampanhas('');
    }
  }, [filters.funil, clienteSelecionado]);
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
      let query = supabase
        .from('funis')
        .select('*')
        .eq('empresa_id', '550e8400-e29b-41d4-a716-446655440000');
      
      // Filtrar por cliente se houver um selecionado
      if (clienteSelecionado) {
        console.log('✅ Filtrando funis por cliente:', clienteSelecionado.nome);
        query = query.eq('cliente_id', clienteSelecionado.id);
      }
      
      const { data: funisData, error: errorFunis } = await query.order('created_at', { ascending: false });

      if (errorFunis) {
        console.error('Erro ao carregar funis (FiltrosCascata):', errorFunis);
        // Usar dados de exemplo em caso de erro
        const funisExemplo = [
          { id: 'exemplo-1', name: 'Funil Masterclass (Demo)', count: 3 },
          { id: 'exemplo-2', name: 'Funil Aplicaçeo (Demo)', count: 2 },
          { id: 'exemplo-3', name: 'Funil Captaçeo (Demo)', count: 5 },
        ];
        setFunis(funisExemplo);
        return;
      }

      console.log('Dados brutos dos funis filtrados:', funisData);
      
      let funisParaUsar = funisData;
      
      // Se neo encontrou com empresa_id, tentar todos os funis
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
      
      // Se neo há funis no banco, usar dados de exemplo baseados nos funis do sistema
      if (funisFormatados.length === 0) {
        const funisExemplo = [
          { id: 'real-1', name: 'Funil de Vendas Lídia Cabral', count: 3 },
          { id: 'real-2', name: 'Funil de Captaçeo', count: 2 },
          { id: 'real-3', name: 'Funil de Reativaçeo', count: 5 },
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
      console.log(' Carregando campanhas...', { funilId, cliente: clienteSelecionado?.nome });
      
      //  BUSCAR campanhas com DOIS filtros:
      // 1. Por funil_id (se selecionado)
      // 2. Por cliente_id (sempre)
      
      let query = supabase
        .from('campanhas')
        .select('id, nome, funil_id, cliente_id');
      
      //  SEMPRE filtrar por cliente
      if (clienteSelecionado) {
        query = query.eq('cliente_id', clienteSelecionado.id);
      }
      
      //  Se tiver funil selecionado, filtrar tamb�m por funil
      if (funilId) {
        query = query.eq('funil_id', funilId);
      }
      
      const { data: campanhasData, error } = await query;

      if (error) {
        console.error(' Erro ao carregar campanhas:', error);
        setCampanhas([]);
        return;
      }

      console.log(' Campanhas encontradas:', {
        total: campanhasData?.length || 0,
        cliente: clienteSelecionado?.nome,
        funil: funilId || 'todos',
        campanhas: campanhasData
      });

      const campanhasFormatadas = campanhasData?.map((campanha: any) => ({
        id: campanha.id,
        name: campanha.nome,
        count: Math.floor(Math.random() * 1000) + 100
      })) || [];

      console.log(' Campanhas formatadas:', campanhasFormatadas);

      setCampanhas(campanhasFormatadas);
    } catch (error) {
      console.error(' Erro ao carregar campanhas:', error);
      setCampanhas([]);
    }
  };

  const carregarPublicos = async (campanhaId: string) => {
    try {
      // Buscar públicos independentes (neo relacionados à campanha)
      let queryPublicos = supabase
        .from('publicos')
        .select('id, nome');

      // Filtrar por cliente se houver um selecionado
      if (clienteSelecionado) {
        queryPublicos = queryPublicos.eq('cliente_id', clienteSelecionado.id);
      }

      const { data: publicos, error } = await queryPublicos;

      if (error) {
        // Tabela publicos pode neo existir ainda, neo é erro crítico
        console.log('ℹ️ Tabela publicos neo encontrada ou vazia');
        setPublicos([]);
        return;
      }

      if (!publicos || publicos.length === 0) {
        setPublicos([]);
        return;
      }

      // Formatar públicos
      const publicosFormatados = publicos.map((publico: any) => ({
        id: publico.id,
        name: publico.nome,
      }));

      console.log('👥 Públicos carregados:', publicosFormatados);
      setPublicos(publicosFormatados);
    } catch (error) {
      // Neo logar como erro, apenas avisar
      console.log('ℹ️ Públicos neo disponíveis');
      setPublicos([]);
    }
  };

  const carregarCriativosPorPublico = async (publicoId: string) => {
    try {
      console.log('🎨 Carregando criativos (independentes de público)...');

      // Buscar anúncios (independentes)
      let queryAnuncios = supabase
        .from('anuncios')
        .select('id, nome');

      // Filtrar por cliente se houver um selecionado
      if (clienteSelecionado) {
        queryAnuncios = queryAnuncios.eq('cliente_id', clienteSelecionado.id);
      }

      const { data: anunciosData, error: errorAnuncios } = await queryAnuncios;

      if (errorAnuncios) {
        console.error('Erro ao buscar anúncios:', errorAnuncios);
        setCriativos([]);
        return;
      }

      const criativosFormatados = anunciosData?.map((anuncio: any) => ({
        id: anuncio.id,
        name: anuncio.nome,
      })) || [];

      console.log('✅ Criativos carregados:', criativosFormatados.length);
      setCriativos(criativosFormatados);
    } catch (error) {
      console.error('Erro ao carregar criativos:', error);
      setCriativos([]);
    }
  };

  const carregarCriativos = async (campanhaId: string) => {
    try {
      console.log('🎨 Carregando anúncios (independentes de campanha)...');

      // Buscar anúncios diretamente (neo relacionados a campanha)
      let queryAnuncios = supabase
        .from('anuncios')
        .select('id, nome');

      // Filtrar por cliente se houver um selecionado
      if (clienteSelecionado) {
        queryAnuncios = queryAnuncios.eq('cliente_id', clienteSelecionado.id);
      }

      const { data: anunciosData, error: errorAnuncios } = await queryAnuncios;

      if (errorAnuncios) {
        console.error('Erro ao buscar anúncios:', errorAnuncios);
        setCriativos([]);
        return;
      }

      if (!anunciosData || anunciosData.length === 0) {
        setCriativos([]);
        return;
      }

      const criativosFormatados = anunciosData.map((anuncio: any) => ({
        id: anuncio.id,
        name: anuncio.nome,
      }));

      console.log('✅ Criativos carregados:', criativosFormatados.length);
      setCriativos(criativosFormatados);
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

  const renderDropdown = (
    type: keyof FilterState,
    options: FilterOption[],
    placeholder: string,
    disabled = false
  ) => {
    const isOpen = openDropdown === type;
    
    return (
      <div className={`relative ${isOpen ? 'z-[9999]' : 'z-10'}`} data-dropdown>
        <button
          onClick={() => setOpenDropdown(openDropdown === type ? null : type)}
          disabled={disabled}
          className={`
            w-full flex items-center justify-between px-3 sm:px-1.5 py-2 sm:py-0.5 text-sm sm:text-xs rounded-md border transition-all duration-200 h-11 sm:h-7 relative bg-slate-800
            ${disabled
              ? 'bg-slate-800/30 border-slate-700/30 text-slate-500 cursor-not-allowed'
              : 'bg-slate-800 border-slate-600/50 text-white hover:border-cyan-500/50 hover:bg-slate-700/50 active:bg-slate-700'
            }
            ${isOpen ? 'border-cyan-500/70 bg-slate-700/50' : ''}
          `}
        >
          <span className="text-sm sm:text-[11px] truncate">
            {filters[type]?.name || placeholder}
          </span>
          <ChevronDown className={`h-4 w-4 sm:h-3 sm:w-3 transition-transform flex-shrink-0 ${
            isOpen ? 'rotate-180' : ''
          }`} />
        </button>

        {isOpen && !disabled && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800/95 backdrop-blur-xl border border-slate-600/50 rounded-md shadow-2xl max-h-60 overflow-y-auto">
            {options.map((option) => (
              <button
                key={option.id}
                onClick={() => handleFilterSelect(type, option)}
                className="w-full px-3 sm:px-2 py-2.5 sm:py-1 text-left text-sm sm:text-[11px] text-white hover:bg-slate-700/50 active:bg-slate-700 transition-colors flex items-center justify-between group"
              >
                <span className="truncate">{option.name}</span>
                {option.count && (
                  <span className="text-xs sm:text-[10px] text-slate-400 group-hover:text-cyan-400 flex-shrink-0 ml-2">
                    {option.count.toLocaleString()}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`space-y-2 relative ${className}`}>
      <div className="flex items-center gap-1 mb-1.5">
        <Filter className="h-4 sm:h-3 w-4 sm:w-3 text-purple-400" />
        <h3 className="text-xs sm:text-[10px] font-semibold text-slate-300 tracking-tight">Filtros de Campanha</h3>
      </div>

      {/* Filtros em Grid Compacto */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-2 relative">
        
        {/* Funil */}
        <div>
          <label className="block text-xs sm:text-[9px] font-medium text-slate-400 mb-1 sm:mb-0.5 tracking-tight">
            FUNIL
          </label>
          {renderDropdown('funil', funis, 'Todos os funis', loading)}
        </div>

        {/* Campanha */}
        <div>
          <label className="block text-xs sm:text-[10px] font-medium text-slate-400 mb-1">
            CAMPANHA
          </label>
          {renderDropdown('campanha', campanhas, 'Todas campanhas', !filters.funil)}
        </div>

        {/* Público */}
        <div>
          <label className="block text-xs sm:text-[10px] font-medium text-slate-400 mb-1">
            PÚBLICO
          </label>
          {renderDropdown('publico', publicos, 'Todos públicos', !filters.campanha)}
        </div>

        {/* Criativo */}
        <div>
          <label className="block text-xs sm:text-[10px] font-medium text-slate-400 mb-1">
            CRIATIVO
          </label>
          {renderDropdown('criativo', criativos, 'Todos criativos', !filters.campanha)}
        </div>

      </div>

      {/* Boteo Limpar - Minimalista */}
      {(filters.funil || filters.campanha || filters.publico || filters.criativo) && (
        <div className="flex items-center justify-end">
          <button
            onClick={clearFilters}
            className="flex items-center space-x-1 px-2 py-1 text-[10px] text-slate-400 hover:text-red-400 transition-colors"
          >
            <X className="h-3 w-3" />
            <span>Limpar</span>
          </button>
        </div>
      )}
    </div>
  );
}
