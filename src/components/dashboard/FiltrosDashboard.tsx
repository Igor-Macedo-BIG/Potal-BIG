'use client';

import { useState, useEffect } from 'react';
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
import { Calendar, Filter, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';

export interface FiltroData {
  tipo: 'hoje' | 'ontem' | 'semana' | 'semana-passada' | 'semana1' | 'semana2' | 'semana3' | 'semana4' | 'mes' | 'mes-passado' | 'trimestre' | 'ano' | 'personalizado';
  dataInicio: string;
  dataFim: string;
}

interface Props {
  onFiltroChange: (filtro: FiltroData) => void;
  filtroAtual: FiltroData;
  campanhaAtiva?: { id: string; nome: string } | null;
  onMetricasAtualizadas?: () => void;
}

export default function FiltrosDashboard({ onFiltroChange, filtroAtual, campanhaAtiva, onMetricasAtualizadas }: Props) {
  const { isClean } = useTheme();
  const [showCustom, setShowCustom] = useState(false);
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  // Calcular datas baseadas no tipo
  const calcularDatas = (tipo: FiltroData['tipo']): { inicio: string; fim: string } => {
    const hoje = new Date();
    const ontem = new Date(hoje);
    ontem.setDate(hoje.getDate() - 1);

    const inicioSemana = new Date(hoje);
    inicioSemana.setDate(hoje.getDate() - hoje.getDay());

    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    
  // "Últimos 3 meses": do primeiro dia de M-2 até hoje (ex.: ago+set+out)
  const inicioTrimestre = new Date(hoje.getFullYear(), hoje.getMonth() - 2, 1);
    
    const inicioAno = new Date(hoje.getFullYear(), 0, 1);

    const formatarData = (data: Date) => data.toISOString().split('T')[0];

    switch (tipo) {
      case 'hoje':
        return {
          inicio: formatarData(hoje),
          fim: formatarData(hoje)
        };
      case 'ontem':
        return {
          inicio: formatarData(ontem),
          fim: formatarData(ontem)
        };
      case 'semana':
        return {
          inicio: formatarData(inicioSemana),
          fim: formatarData(hoje)
        };
      case 'semana-passada': {
        const inicioSemPassada = new Date(inicioSemana);
        inicioSemPassada.setDate(inicioSemPassada.getDate() - 7);
        const fimSemPassada = new Date(inicioSemana);
        fimSemPassada.setDate(fimSemPassada.getDate() - 1);
        return {
          inicio: formatarData(inicioSemPassada),
          fim: formatarData(fimSemPassada)
        };
      }
      case 'mes':
        return {
          inicio: formatarData(inicioMes),
          fim: formatarData(hoje)
        };
      case 'mes-passado': {
        const mesPassado = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
        const ultimoDiaMesPassado = new Date(hoje.getFullYear(), hoje.getMonth(), 0);
        return {
          inicio: formatarData(mesPassado),
          fim: formatarData(ultimoDiaMesPassado)
        };
      }
      case 'semana1': {
        const inicioS1 = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        const fimS1 = new Date(hoje.getFullYear(), hoje.getMonth(), 7);
        return { inicio: formatarData(inicioS1), fim: formatarData(fimS1 > hoje ? hoje : fimS1) };
      }
      case 'semana2': {
        const inicioS2 = new Date(hoje.getFullYear(), hoje.getMonth(), 8);
        const fimS2 = new Date(hoje.getFullYear(), hoje.getMonth(), 14);
        return { inicio: formatarData(inicioS2), fim: formatarData(fimS2 > hoje ? hoje : fimS2) };
      }
      case 'semana3': {
        const inicioS3 = new Date(hoje.getFullYear(), hoje.getMonth(), 15);
        const fimS3 = new Date(hoje.getFullYear(), hoje.getMonth(), 21);
        return { inicio: formatarData(inicioS3), fim: formatarData(fimS3 > hoje ? hoje : fimS3) };
      }
      case 'semana4': {
        const inicioS4 = new Date(hoje.getFullYear(), hoje.getMonth(), 22);
        const ultimoDia = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
        return { inicio: formatarData(inicioS4), fim: formatarData(ultimoDia > hoje ? hoje : ultimoDia) };
      }
      case 'trimestre':
        return {
          inicio: formatarData(inicioTrimestre),
          fim: formatarData(hoje)
        };
      case 'ano':
        return {
          inicio: formatarData(inicioAno),
          fim: formatarData(hoje)
        };
      default:
        return {
          inicio: dataInicio || formatarData(hoje),
          fim: dataFim || formatarData(hoje)
        };
    }
  };

  const handleTipoChange = (tipo: FiltroData['tipo']) => {
    setShowCustom(tipo === 'personalizado');
    
    if (tipo !== 'personalizado') {
      const datas = calcularDatas(tipo);
      onFiltroChange({
        tipo,
        dataInicio: datas.inicio,
        dataFim: datas.fim
      });
    }
  };

  const handleCustomDateChange = () => {
    if (dataInicio && dataFim) {
      onFiltroChange({
        tipo: 'personalizado',
        dataInicio,
        dataFim
      });
    }
  };

  // Resetar para hoje
  const resetarFiltro = () => {
    const datas = calcularDatas('hoje');
    onFiltroChange({
      tipo: 'hoje',
      dataInicio: datas.inicio,
      dataFim: datas.fim
    });
    setShowCustom(false);
    setDataInicio('');
    setDataFim('');
  };

  useEffect(() => {
    if (filtroAtual.tipo === 'personalizado') {
      setDataInicio(filtroAtual.dataInicio);
      setDataFim(filtroAtual.dataFim);
      setShowCustom(true);
    }
  }, [filtroAtual]);

  return (
    <div className="filter-section space-y-2">
      <div className="flex items-center gap-1.5 mb-2">
        <Calendar className={cn('filter-icon h-3.5 w-3.5', isClean ? 'text-amber-600' : 'text-cyan-400')} />
        <h3 className={cn('filter-label text-xs font-semibold', isClean ? 'text-gray-600' : 'text-slate-300')}>Período</h3>
      </div>

      <div className="flex flex-col gap-2">
        {/* Botões de período pré-definido - Compactos */}
        <div className="flex flex-wrap gap-1.5">
          {[
            { valor: 'hoje', label: 'Hoje' },
            { valor: 'ontem', label: 'Ontem' },
            { valor: 'semana', label: 'Semana' },
            { valor: 'semana-passada', label: 'Sem. Ant.' },
            { valor: 'semana1', label: 'S1' },
            { valor: 'semana2', label: 'S2' },
            { valor: 'semana3', label: 'S3' },
            { valor: 'semana4', label: 'S4' },
            { valor: 'mes', label: 'Mês' },
            { valor: 'mes-passado', label: 'Mês Ant.' },
            { valor: 'trimestre', label: '3M' },
          ].map((opcao) => (
            <Button
              key={opcao.valor}
              variant="ghost"
              size="sm"
              className={cn(
                "filter-btn text-xs px-2 py-1 h-7 border transition-all duration-200",
                filtroAtual.tipo === opcao.valor
                  ? (isClean
                    ? "active bg-amber-50 text-amber-700 border-amber-200 shadow-sm"
                    : "active bg-cyan-500/20 text-cyan-300 border-cyan-500/40")
                  : (isClean
                    ? "border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700 hover:bg-gray-50"
                    : "border-slate-600 text-slate-400 hover:border-slate-500 hover:text-white")
              )}
              onClick={() => handleTipoChange(opcao.valor as FiltroData['tipo'])}
            >
              {opcao.label}
            </Button>
          ))}
        </div>

        {/* Campos de data - sempre visíveis para ajuste manual */}
        <div className="flex gap-2">
          <Input
            type="date"
            value={filtroAtual.dataInicio}
            onChange={(e) => {
              setDataInicio(e.target.value);
              if (e.target.value && filtroAtual.dataFim) {
                onFiltroChange({
                  tipo: 'personalizado',
                  dataInicio: e.target.value,
                  dataFim: filtroAtual.dataFim
                });
              }
            }}
            className={cn(
              'date-input text-xs h-7 px-2',
              isClean ? 'bg-white border-gray-200 text-gray-700' : 'bg-slate-800 border-slate-600 text-white'
            )}
          />
          <Input
            type="date"
            value={filtroAtual.dataFim}
            onChange={(e) => {
              setDataFim(e.target.value);
              if (filtroAtual.dataInicio && e.target.value) {
                onFiltroChange({
                  tipo: 'personalizado',
                  dataInicio: filtroAtual.dataInicio,
                  dataFim: e.target.value
                });
              }
            }}
            className={cn(
              'date-input text-xs h-7 px-2',
              isClean ? 'bg-white border-gray-200 text-gray-700' : 'bg-slate-800 border-slate-600 text-white'
            )}
          />
        </div>

        {/* Info do período - Minimalista */}
        <div className={cn('text-[10px]', isClean ? 'text-gray-400' : 'text-slate-500')}>
          {filtroAtual.dataInicio.split('-').reverse().join('/')} → {filtroAtual.dataFim.split('-').reverse().join('/')}
        </div>
      </div>
    </div>
  );
}
