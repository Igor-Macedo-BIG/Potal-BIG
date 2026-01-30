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

export interface FiltroData {
  tipo: 'hoje' | 'ontem' | 'semana' | 'mes' | 'mes-passado' | 'trimestre' | 'ano' | 'personalizado';
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
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 mb-2">
        <Calendar className="h-3.5 w-3.5 text-cyan-400" />
        <h3 className="text-xs font-semibold text-slate-300">Período</h3>
      </div>

      <div className="flex flex-col gap-2">
        {/* Botões de período pré-definido - Compactos */}
        <div className="flex flex-wrap gap-1.5">
          {[
            { valor: 'hoje', label: 'Hoje' },
            { valor: 'ontem', label: 'Ontem' },
            { valor: 'semana', label: 'Semana' },
            { valor: 'mes', label: 'Mês' },
            { valor: 'trimestre', label: '3M' },
          ].map((opcao) => (
            <Button
              key={opcao.valor}
              variant="ghost"
              size="sm"
              className={cn(
                "text-xs px-2 py-1 h-7 border transition-all duration-200",
                filtroAtual.tipo === opcao.valor
                  ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                  : "border-slate-600 text-slate-400 hover:border-slate-500 hover:text-white"
              )}
              onClick={() => handleTipoChange(opcao.valor as FiltroData['tipo'])}
            >
              {opcao.label}
            </Button>
          ))}
          
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "text-xs px-2 py-1 h-7 border transition-all duration-200",
              filtroAtual.tipo === 'personalizado'
                ? "bg-purple-500/20 text-purple-300 border-purple-500/40"
                : "border-slate-600 text-slate-400 hover:border-slate-500 hover:text-white"
            )}
            onClick={() => handleTipoChange('personalizado')}
          >
            Custom
          </Button>
        </div>

        {/* Campos de data personalizada - Inline */}
        {showCustom && (
          <div className="flex gap-2">
            <Input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              onBlur={handleCustomDateChange}
              className="bg-slate-800 border-slate-600 text-white text-xs h-7 px-2"
            />
            <Input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              onBlur={handleCustomDateChange}
              className="bg-slate-800 border-slate-600 text-white text-xs h-7 px-2"
            />
          </div>
        )}

        {/* Info do período - Minimalista */}
        <div className="text-[10px] text-slate-500">
          {filtroAtual.dataInicio.split('-').reverse().join('/')} → {filtroAtual.dataFim.split('-').reverse().join('/')}
        </div>
      </div>
    </div>
  );
}
