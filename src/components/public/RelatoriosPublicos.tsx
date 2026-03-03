'use client';

import { useState, useEffect } from 'react';
import { Bell, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Relatorio {
  id: string;
  tipo_periodo: 'semanal' | 'mensal';
  data_inicio: string;
  data_fim: string;
  observacao: string;
}

interface Props {
  clienteId: string;
  dataInicio: string;
  dataFim: string;
}

export default function RelatoriosPublicos({ clienteId, dataInicio, dataFim }: Props) {
  const [relatorios, setRelatorios] = useState<Relatorio[]>([]);
  const [relatorioAtual, setRelatorioAtual] = useState(0);
  const [expandido, setExpandido] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (clienteId && dataInicio && dataFim) {
      carregarRelatorios();
    }
  }, [clienteId, dataInicio, dataFim]);

  const carregarRelatorios = async () => {
    if (!clienteId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('relatorios_periodo')
        .select('*')
        .eq('cliente_id', clienteId)
        .or(`and(data_inicio.lte.${dataFim},data_fim.gte.${dataInicio})`)
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
    return `${dataInicio.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} - ${dataFim.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}`;
  };

  const proximoRelatorio = () => {
    setRelatorioAtual((prev) => (prev + 1) % relatorios.length);
  };

  const relatorioAnterior = () => {
    setRelatorioAtual((prev) => (prev - 1 + relatorios.length) % relatorios.length);
  };

  if (relatorios.length === 0) return null;

  const relatorio = relatorios[relatorioAtual];

  return (
    <>
      {/* Card de Relatório Compacto/Expansível */}
      <div className="relative">
        {/* Card Principal */}
        <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-2 border-yellow-500/30 rounded-xl relative overflow-hidden group">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-yellow-400/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          
          {/* Header Compacto - sempre visível */}
          <div 
            onClick={() => setExpandido(!expandido)}
            className="relative flex items-center justify-between p-3 sm:p-4 cursor-pointer hover:bg-yellow-500/5 transition-colors"
          >
            <div className="flex items-center gap-2">
              <div className="relative">
                <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400 animate-pulse" />
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-yellow-500 rounded-full flex items-center justify-center">
                  <span className="text-[8px] font-bold text-black">{relatorios.length}</span>
                </span>
              </div>
              <span className="text-xs sm:text-sm font-semibold text-yellow-400 uppercase tracking-wide">
                Relatório Importante
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Contador de Slides com Dots */}
              {relatorios.length > 1 && expandido && (
                <div className="flex items-center gap-1.5">
                  {relatorios.map((_, idx) => (
                    <div
                      key={idx}
                      className={`h-1.5 rounded-full transition-all ${
                        idx === relatorioAtual
                          ? 'w-4 bg-yellow-400'
                          : 'w-1.5 bg-yellow-400/30'
                      }`}
                    />
                  ))}
                </div>
              )}
              
              {/* Botão Expandir/Recolher */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setExpandido(!expandido);
                }}
                className="p-1 rounded-full bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/30 transition-all"
                aria-label={expandido ? 'Recolher' : 'Expandir'}
              >
                {expandido ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Conteúdo Expandido */}
          {expandido && (
            <div className="px-3 sm:px-4 pb-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
              {/* Badge do Tipo */}
              <div className="relative">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                  relatorio.tipo_periodo === 'mensal'
                    ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                    : 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                }`}>
                  {relatorio.tipo_periodo === 'mensal' ? '📆' : '📅'}
                  {relatorio.tipo_periodo === 'mensal' ? 'Mensal' : 'Semanal'}
                  <span className="text-yellow-400/70">•</span>
                  <span className="text-xs">{formatarPeriodo(relatorio.data_inicio, relatorio.data_fim)}</span>
                </span>
              </div>

              {/* Conteúdo do Relatório com Navegação Embutida */}
              <div className="relative flex items-center gap-2">
                {/* Botão Anterior (embutido à esquerda) */}
                {relatorios.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      relatorioAnterior();
                    }}
                    className="flex-shrink-0 p-1.5 sm:p-2 rounded-full bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/30 transition-all active:scale-95"
                    aria-label="Relatório anterior"
                  >
                    <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                  </button>
                )}

                {/* Texto do Relatório */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm sm:text-base text-gray-200 leading-relaxed">
                    {relatorio.observacao}
                  </p>
                </div>

                {/* Botão Próximo (embutido à direita) */}
                {relatorios.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      proximoRelatorio();
                    }}
                    className="flex-shrink-0 p-1.5 sm:p-2 rounded-full bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/30 transition-all active:scale-95"
                    aria-label="Próximo relatório"
                  >
                    <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                  </button>
                )}
              </div>

              {/* Footer - Ver todos */}
              <div className="relative pt-2 border-t border-yellow-500/20">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setModalAberto(true);
                  }}
                  className="flex items-center gap-2 text-xs text-yellow-400/80 font-medium hover:text-yellow-300 transition-colors group/btn"
                >
                  <FileText className="h-4 w-4 text-yellow-400/60 group-hover/btn:text-yellow-400 transition-colors" />
                  <span>Ver todos ({relatorios.length})</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Grid de Relatórios Expandido - removido, não é mais necessário */}
      </div>

      {/* Modal com TODOS os Relatórios */}
      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="sm:max-w-[700px] bg-gray-900 border-yellow-500/30 max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl text-white">
              <div className="h-8 w-8 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center">
                <Bell className="h-4 w-4 text-white" />
              </div>
              Relatórios e Observações
            </DialogTitle>
            <p className="text-sm text-gray-400">
              {relatorios.length} relatório{relatorios.length !== 1 ? 's' : ''} do período selecionado
            </p>
          </DialogHeader>

          {/* Lista de Todos os Relatórios */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {relatorios.map((rel) => (
              <div
                key={rel.id}
                className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-lg p-4"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-xs px-3 py-1 rounded-full font-bold ${
                    rel.tipo_periodo === 'mensal'
                      ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40'
                      : 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                  }`}>
                    {rel.tipo_periodo === 'mensal' ? '📆 Relatório Mensal' : '📅 Relatório Semanal'}
                  </span>
                  <span className="text-xs text-gray-400 font-medium">
                    {formatarPeriodo(rel.data_inicio, rel.data_fim)}
                  </span>
                </div>
                <p className="text-sm text-gray-200 whitespace-pre-wrap leading-relaxed">
                  {rel.observacao}
                </p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
