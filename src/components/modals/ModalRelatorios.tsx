'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Calendar, FileText, Loader2, Trash2, Edit3, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useCliente } from '@/contexts/ClienteContext';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Relatorio {
  id: string;
  tipo_periodo: 'semanal' | 'mensal';
  data_inicio: string;
  data_fim: string;
  observacao: string;
  created_at: string;
}

export default function ModalRelatorios({ open, onOpenChange }: Props) {
  const { clienteSelecionado } = useCliente();
  const [loading, setLoading] = useState(false);
  const [relatorios, setRelatorios] = useState<Relatorio[]>([]);
  const [tipoPeriodo, setTipoPeriodo] = useState<'semanal' | 'mensal'>('semanal');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [observacao, setObservacao] = useState('');
  const [editandoId, setEditandoId] = useState<string | null>(null);

  // Carregar relatórios ao abrir modal
  useEffect(() => {
    if (open && clienteSelecionado) {
      carregarRelatorios();
    }
  }, [open, clienteSelecionado]);

  // Calcular automaticamente data fim quando selecionar data início
  useEffect(() => {
    if (dataInicio) {
      calcularDataFim(dataInicio, tipoPeriodo);
    }
  }, [dataInicio, tipoPeriodo]);

  const calcularDataFim = (inicio: string, tipo: 'semanal' | 'mensal') => {
    const dataInicioObj = new Date(inicio + 'T00:00:00');
    
    if (tipo === 'semanal') {
      // Calcular o domingo da mesma semana
      const diaSemana = dataInicioObj.getDay(); // 0 = domingo, 1 = segunda, etc
      const diasAtedomingo = diaSemana === 0 ? 0 : 7 - diaSemana;
      const dataFimObj = new Date(dataInicioObj);
      dataFimObj.setDate(dataFimObj.getDate() + diasAtedomingo);
      setDataFim(dataFimObj.toISOString().split('T')[0]);
    } else {
      // Último dia do mês
      const ultimoDia = new Date(dataInicioObj.getFullYear(), dataInicioObj.getMonth() + 1, 0);
      setDataFim(ultimoDia.toISOString().split('T')[0]);
    }
  };

  const carregarRelatorios = async () => {
    if (!clienteSelecionado?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('relatorios_periodo')
        .select('*')
        .eq('cliente_id', clienteSelecionado.id)
        .order('data_inicio', { ascending: false });

      if (error) throw error;

      setRelatorios(data || []);
    } catch (error) {
      console.error('Erro ao carregar relatórios:', error);
      toast.error('Erro ao carregar relatórios');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clienteSelecionado?.id) {
      toast.error('Nenhum cliente selecionado');
      return;
    }

    if (!dataInicio || !dataFim || !observacao.trim()) {
      toast.error('Preencha todos os campos');
      return;
    }

    setLoading(true);
    try {
      const dados = {
        cliente_id: clienteSelecionado.id,
        tipo_periodo: tipoPeriodo,
        data_inicio: dataInicio,
        data_fim: dataFim,
        observacao: observacao.trim()
      };

      if (editandoId) {
        // Atualizar
        const { error } = await supabase
          .from('relatorios_periodo')
          .update(dados)
          .eq('id', editandoId);

        if (error) throw error;
        toast.success('Relatório atualizado!');
      } else {
        // Inserir novo
        const { error } = await supabase
          .from('relatorios_periodo')
          .insert(dados);

        if (error) throw error;
        toast.success('Relatório criado!');
      }

      // Limpar form e recarregar
      limparFormulario();
      await carregarRelatorios();
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      if (error.code === '23505') {
        toast.error('Já existe um relatório para este período');
      } else {
        toast.error('Erro ao salvar relatório');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEditar = (relatorio: Relatorio) => {
    setEditandoId(relatorio.id);
    setTipoPeriodo(relatorio.tipo_periodo);
    setDataInicio(relatorio.data_inicio);
    setDataFim(relatorio.data_fim);
    setObservacao(relatorio.observacao);
  };

  const handleDeletar = async (id: string) => {
    if (!confirm('Deseja realmente deletar este relatório?')) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('relatorios_periodo')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Relatório deletado');
      await carregarRelatorios();
    } catch (error) {
      console.error('Erro ao deletar:', error);
      toast.error('Erro ao deletar relatório');
    } finally {
      setLoading(false);
    }
  };

  const limparFormulario = () => {
    setEditandoId(null);
    setTipoPeriodo('semanal');
    setDataInicio('');
    setDataFim('');
    setObservacao('');
  };

  const formatarData = (data: string) => {
    return new Date(data + 'T00:00:00').toLocaleDateString('pt-BR');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] bg-gray-900 border-gray-700 max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-white">
            <div className="h-8 w-8 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
              <FileText className="h-4 w-4 text-white" />
            </div>
            Relatórios e Observações
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Gerencie relatórios semanais e mensais para {clienteSelecionado?.nome}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6">
          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-4 bg-gray-800/50 p-4 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-200">
                {editandoId ? '✏️ Editar Relatório' : '➕ Novo Relatório'}
              </h3>
              {editandoId && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={limparFormulario}
                  className="text-gray-400 hover:text-white"
                >
                  Cancelar
                </Button>
              )}
            </div>

            {/* Tipo de Período */}
            <div className="space-y-2">
              <Label className="text-gray-300">Tipo de Período</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={tipoPeriodo === 'semanal' ? 'default' : 'outline'}
                  onClick={() => setTipoPeriodo('semanal')}
                  className={tipoPeriodo === 'semanal' ? 'bg-purple-600 hover:bg-purple-700' : 'border-gray-600'}
                  disabled={loading}
                >
                  📅 Semanal
                </Button>
                <Button
                  type="button"
                  variant={tipoPeriodo === 'mensal' ? 'default' : 'outline'}
                  onClick={() => setTipoPeriodo('mensal')}
                  className={tipoPeriodo === 'mensal' ? 'bg-purple-600 hover:bg-purple-700' : 'border-gray-600'}
                  disabled={loading}
                >
                  📆 Mensal
                </Button>
              </div>
            </div>

            {/* Datas */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="data_inicio" className="text-gray-300">
                  Data Início
                </Label>
                <input
                  id="data_inicio"
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 text-white px-3 py-2 rounded-md"
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="data_fim" className="text-gray-300">
                  Data Fim
                </Label>
                <input
                  id="data_fim"
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 text-white px-3 py-2 rounded-md"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Observação */}
            <div className="space-y-2">
              <Label htmlFor="observacao" className="text-gray-300">
                Relatório / Observações
              </Label>
              <textarea
                id="observacao"
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                placeholder="Descreva os principais acontecimentos, insights e alertas deste período..."
                className="w-full bg-gray-800 border border-gray-600 text-white px-3 py-2 rounded-md min-h-[120px] resize-y"
                disabled={loading}
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editandoId ? '💾 Atualizar' : '✅ Salvar Relatório'}
            </Button>
          </form>

          <Separator className="bg-gray-700" />

          {/* Lista de Relatórios */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-200">📋 Relatórios Cadastrados</h3>
            
            {loading && relatorios.length === 0 ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
              </div>
            ) : relatorios.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Nenhum relatório cadastrado ainda
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {relatorios.map((rel) => (
                  <div
                    key={rel.id}
                    className="bg-gray-800 p-4 rounded-lg border border-gray-700 hover:border-purple-600/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-1 rounded bg-purple-600/20 text-purple-400 font-medium">
                          {rel.tipo_periodo === 'semanal' ? '📅 Semanal' : '📆 Mensal'}
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatarData(rel.data_inicio)} → {formatarData(rel.data_fim)}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditar(rel)}
                          className="h-7 w-7 p-0 text-gray-400 hover:text-white"
                        >
                          <Edit3 className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeletar(rel.id)}
                          className="h-7 w-7 p-0 text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-300 whitespace-pre-wrap">{rel.observacao}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
