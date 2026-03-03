'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useTheme } from '@/contexts/ThemeContext';
import { useEmpresa } from '@/contexts/EmpresaContext';
import {
  MessageSquareText,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  CalendarDays,
  FileText,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

interface Feedback {
  id: string;
  empresa_id: string;
  tipo: 'semanal' | 'mensal';
  titulo: string;
  conteudo: string;
  periodo_inicio: string;
  periodo_fim: string;
  created_at: string;
}

export function FeedbackPerformanceCard() {
  const { isClean } = useTheme();
  const { empresaSelecionada } = useEmpresa();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(false);
  const [formAberto, setFormAberto] = useState(false);
  const [editando, setEditando] = useState<Feedback | null>(null);
  const [expandido, setExpandido] = useState<string | null>(null);
  const [deletando, setDeletando] = useState<string | null>(null);

  // Form fields
  const [tipo, setTipo] = useState<'semanal' | 'mensal'>('semanal');
  const [titulo, setTitulo] = useState('');
  const [conteudo, setConteudo] = useState('');
  const [periodoInicio, setPeriodoInicio] = useState('');
  const [periodoFim, setPeriodoFim] = useState('');

  useEffect(() => {
    if (empresaSelecionada?.id) {
      carregarFeedbacks();
    }
  }, [empresaSelecionada?.id]);

  const carregarFeedbacks = async () => {
    if (!empresaSelecionada?.id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/feedbacks?empresa_id=${empresaSelecionada.id}`);
      if (res.ok) {
        const data = await res.json();
        setFeedbacks(data.feedbacks || []);
      }
    } catch (err) {
      console.error('Erro ao carregar feedbacks:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTipo('semanal');
    setTitulo('');
    setConteudo('');
    setPeriodoInicio('');
    setPeriodoFim('');
    setEditando(null);
    setFormAberto(false);
  };

  const abrirEdicao = (fb: Feedback) => {
    setEditando(fb);
    setTipo(fb.tipo);
    setTitulo(fb.titulo);
    setConteudo(fb.conteudo);
    setPeriodoInicio(fb.periodo_inicio);
    setPeriodoFim(fb.periodo_fim);
    setFormAberto(true);
  };

  const salvar = async () => {
    if (!titulo.trim() || !conteudo.trim() || !periodoInicio || !periodoFim) {
      toast.error('Preencha todos os campos');
      return;
    }

    try {
      if (editando) {
        const res = await fetch('/api/feedbacks', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editando.id,
            tipo,
            titulo: titulo.trim(),
            conteudo: conteudo.trim(),
            periodo_inicio: periodoInicio,
            periodo_fim: periodoFim,
          }),
        });
        if (res.ok) {
          toast.success('Feedback atualizado!');
          resetForm();
          carregarFeedbacks();
        } else {
          toast.error('Erro ao atualizar');
        }
      } else {
        const res = await fetch('/api/feedbacks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            empresa_id: empresaSelecionada!.id,
            tipo,
            titulo: titulo.trim(),
            conteudo: conteudo.trim(),
            periodo_inicio: periodoInicio,
            periodo_fim: periodoFim,
          }),
        });
        if (res.ok) {
          toast.success('Feedback criado!');
          resetForm();
          carregarFeedbacks();
        } else {
          toast.error('Erro ao criar');
        }
      }
    } catch (err) {
      toast.error('Erro de conexão');
    }
  };

  const deletar = async (id: string) => {
    setDeletando(id);
    try {
      const res = await fetch(`/api/feedbacks?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Feedback removido');
        setFeedbacks(prev => prev.filter(f => f.id !== id));
      } else {
        toast.error('Erro ao remover');
      }
    } catch {
      toast.error('Erro de conexão');
    } finally {
      setDeletando(null);
    }
  };

  const formatDate = (d: string) =>
    new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

  if (!empresaSelecionada) {
    return (
      <Card className={isClean ? 'bg-white border-gray-200' : 'bg-gray-800/50 border-gray-700'}>
        <CardContent className="py-8 text-center">
          <p className={isClean ? 'text-gray-500' : 'text-gray-400'}>
            Selecione uma empresa para gerenciar feedbacks
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header card */}
      <Card className={isClean ? 'bg-white border-gray-200 shadow-sm' : 'bg-gray-800/50 border-gray-700'}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className={`flex items-center gap-2 ${isClean ? 'text-gray-900' : 'text-white'}`}>
                <MessageSquareText className="h-5 w-5" />
                Feedbacks de Performance — {empresaSelecionada.nome}
              </CardTitle>
              <CardDescription className={isClean ? 'text-gray-500' : 'text-gray-400'}>
                Relatórios escritos que aparecem na página pública do cliente
              </CardDescription>
            </div>
            <Button
              onClick={() => { resetForm(); setFormAberto(true); }}
              size="sm"
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Novo Feedback
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Form card (criar/editar) */}
      {formAberto && (
        <Card className={isClean ? 'bg-white border-gray-200 shadow-sm' : 'bg-gray-800/50 border-gray-700'}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className={`text-base ${isClean ? 'text-gray-900' : 'text-white'}`}>
                {editando ? 'Editar Feedback' : 'Novo Feedback'}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={resetForm}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Tipo */}
            <div className="flex gap-2">
              <Button
                variant={tipo === 'semanal' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTipo('semanal')}
              >
                Semanal
              </Button>
              <Button
                variant={tipo === 'mensal' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTipo('mensal')}
              >
                Mensal
              </Button>
            </div>

            {/* Período */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className={isClean ? 'text-gray-700' : 'text-gray-300'}>Início do Período</Label>
                <Input
                  type="date"
                  value={periodoInicio}
                  onChange={(e) => setPeriodoInicio(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className={isClean ? 'text-gray-700' : 'text-gray-300'}>Fim do Período</Label>
                <Input
                  type="date"
                  value={periodoFim}
                  onChange={(e) => setPeriodoFim(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Título */}
            <div>
              <Label className={isClean ? 'text-gray-700' : 'text-gray-300'}>Título</Label>
              <Input
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex: Feedback Semana 1 — Março/2026"
                className="mt-1"
              />
            </div>

            {/* Conteúdo */}
            <div>
              <Label className={isClean ? 'text-gray-700' : 'text-gray-300'}>Conteúdo</Label>
              <textarea
                value={conteudo}
                onChange={(e) => setConteudo(e.target.value)}
                rows={6}
                placeholder="Escreva aqui o feedback de performance da campanha..."
                className={`mt-1 w-full px-3 py-2 rounded-md border text-sm resize-y ${
                  isClean
                    ? 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400'
                    : 'bg-gray-900 border-gray-700 text-white placeholder:text-gray-500'
                } focus:outline-none focus:ring-2 focus:ring-blue-500/50`}
              />
              <p className={`text-xs mt-1 ${isClean ? 'text-gray-400' : 'text-gray-500'}`}>
                Use linhas em branco para separar parágrafos
              </p>
            </div>

            {/* Ações */}
            <div className="flex gap-2 pt-2">
              <Button onClick={salvar} size="sm" className="gap-2">
                {editando ? 'Salvar Alterações' : 'Criar Feedback'}
              </Button>
              <Button variant="outline" size="sm" onClick={resetForm}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de feedbacks */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className={`h-6 w-6 animate-spin ${isClean ? 'text-gray-400' : 'text-gray-500'}`} />
        </div>
      ) : feedbacks.length === 0 ? (
        <Card className={isClean ? 'bg-white border-gray-200' : 'bg-gray-800/50 border-gray-700'}>
          <CardContent className="py-10 text-center">
            <FileText className={`h-10 w-10 mx-auto ${isClean ? 'text-gray-300' : 'text-gray-600'}`} />
            <p className={`mt-3 text-sm ${isClean ? 'text-gray-500' : 'text-gray-400'}`}>
              Nenhum feedback criado ainda
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {feedbacks.map((fb) => (
            <Card
              key={fb.id}
              className={`transition-all ${
                isClean
                  ? 'bg-white border-gray-200 hover:border-gray-300'
                  : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
              }`}
            >
              <div
                className="px-4 py-3 flex items-center gap-3 cursor-pointer"
                onClick={() => setExpandido(expandido === fb.id ? null : fb.id)}
              >
                <div className="flex-1 flex items-center gap-3">
                  <Badge
                    variant="outline"
                    className={
                      fb.tipo === 'mensal'
                        ? 'border-blue-500/50 text-blue-400 bg-blue-500/10'
                        : 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10'
                    }
                  >
                    {fb.tipo}
                  </Badge>
                  <span className={`text-sm font-medium ${isClean ? 'text-gray-900' : 'text-white'}`}>
                    {fb.titulo}
                  </span>
                  <span className={`text-xs ${isClean ? 'text-gray-400' : 'text-gray-500'}`}>
                    <CalendarDays className="h-3 w-3 inline mr-1" />
                    {formatDate(fb.periodo_inicio)} — {formatDate(fb.periodo_fim)}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); abrirEdicao(fb); }}
                    className="h-8 w-8 p-0"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); deletar(fb.id); }}
                    disabled={deletando === fb.id}
                    className="h-8 w-8 p-0 text-red-400 hover:text-red-300"
                  >
                    {deletando === fb.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  </Button>
                  {expandido === fb.id ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                </div>
              </div>
              {expandido === fb.id && (
                <div className={`px-4 pb-4 border-t ${isClean ? 'border-gray-100' : 'border-gray-700/50'}`}>
                  <div className={`mt-3 text-sm whitespace-pre-wrap leading-relaxed ${isClean ? 'text-gray-700' : 'text-gray-300'}`}>
                    {fb.conteudo}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
