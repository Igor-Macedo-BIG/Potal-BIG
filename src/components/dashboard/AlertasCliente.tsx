'use client';

import { useState, useEffect } from 'react';
import { Bell, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useCliente } from '@/contexts/ClienteContext';
import { useCampanhaContext } from '@/contexts/CampanhaContext';

interface Relatorio {
  id: string;
  tipo_periodo: 'semanal' | 'mensal';
  data_inicio: string;
  data_fim: string;
  observacao: string;
}

export function AlertasCliente() {
  const { clienteSelecionado } = useCliente();
  const { filtroData } = useCampanhaContext();
  const [relatorios, setRelatorios] = useState<Relatorio[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (clienteSelecionado) {
      carregarRelatorios();
    }
  }, [clienteSelecionado, filtroData]);

  const carregarRelatorios = async () => {
    if (!clienteSelecionado) return;

    setLoading(true);
    try {
      // Buscar relatórios que se sobrepõem ao período filtrado
      // Incluir: relatório mensal do mês + todas as semanas dentro do período
      const { data, error } = await supabase
        .from('relatorios_periodo')
        .select('*')
        .eq('cliente_id', clienteSelecionado.id)
        .or(`and(data_inicio.lte.${filtroData.dataFim},data_fim.gte.${filtroData.dataInicio})`)
        .order('tipo_periodo', { ascending: false }) // Mensal primeiro
        .order('data_inicio', { ascending: true });

      if (error) throw error;
      setRelatorios(data || []);
    } catch (error) {
      console.error('Erro ao carregar relatórios:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatarPeriodo = (inicio: string, fim: string) => {
    const dataInicio = new Date(inicio + 'T00:00:00');
    const dataFim = new Date(fim + 'T00:00:00');
    return `${dataInicio.toLocaleDateString('pt-BR')} - ${dataFim.toLocaleDateString('pt-BR')}`;
  };

  if (!clienteSelecionado || relatorios.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-lg mb-6">
      <div className="p-4">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between text-left hover:opacity-80 transition-opacity"
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <Bell className="h-5 w-5 text-purple-400 animate-pulse" />
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-purple-500 rounded-full flex items-center justify-center text-[10px] font-bold">
                {relatorios.length}
              </span>
            </div>
            <div>
              <h3 className="text-white font-semibold flex items-center gap-2">
                Relatórios e Observações
                {!expanded && relatorios.length > 0 && (
                  <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">
                    {relatorios.length} {relatorios.length === 1 ? 'relatório' : 'relatórios'}
                  </span>
                )}
              </h3>
              <p className="text-sm text-gray-400">
                {expanded ? 'Clique para ocultar' : 'Clique para ver os relatórios do período'}
              </p>
            </div>
          </div>
          {expanded ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </button>

        {expanded && (
          <div className="mt-4 space-y-3 border-t border-purple-500/20 pt-4">
            {relatorios.map((rel) => (
              <div
                key={rel.id}
                className="bg-black/30 border border-purple-500/20 rounded-lg p-4 hover:border-purple-500/40 transition-colors"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs px-2 py-1 rounded font-medium ${
                    rel.tipo_periodo === 'mensal' 
                      ? 'bg-purple-600/20 text-purple-400' 
                      : 'bg-blue-600/20 text-blue-400'
                  }`}>
                    {rel.tipo_periodo === 'mensal' ? '📆 Relatório Mensal' : '📅 Relatório Semanal'}
                  </span>
                  <span className="text-xs text-gray-400">
                    {formatarPeriodo(rel.data_inicio, rel.data_fim)}
                  </span>
                </div>
                <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {rel.observacao}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
