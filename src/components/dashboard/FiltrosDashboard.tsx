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
      <div className="flex items-center gap-1 mb-1.5">
        <Calendar className="h-3 w-3 text-cyan-400" />
        <h3 className="text-[10px] font-semibold text-slate-300 tracking-tight">Período</h3>
      </div>

      <div className="flex flex-col gap-2">
        {/* Botões de período pré-definido - Compactos */}
        <div className="flex flex-wrap gap-1.5">
          {[
            { valor: 'semana', label: 'Semana' },
            { valor: 'mes', label: 'Mês' },
            { valor: 'mes-passado', label: 'Mês passado' },
            { valor: 'personalizado', label: 'Custom' },
          ].map((opcao) => (
            <Button
              key={opcao.valor}
              variant="ghost"
              size="sm"
              className={cn(
                "text-[11px] px-1.5 py-0.5 h-6 border transition-all duration-200",
                filtroAtual.tipo === opcao.valor
                  ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                  : "border-slate-600 text-slate-400 hover:border-slate-500 hover:text-white"
              )}
              onClick={() => handleTipoChange(opcao.valor as FiltroData['tipo'])}
            >
              {opcao.label}
            </Button>
          ))}
        </div>

        {/* Campos de data personalizada - Inline */}
        {showCustom && (
          <div className="flex gap-2">
            <Input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              onBlur={handleCustomDateChange}
              className="bg-slate-800 border-slate-600 text-white text-[11px] h-6 px-1"
            />
            <Input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              onBlur={handleCustomDateChange}
              className="bg-slate-800 border-slate-600 text-white text-[11px] h-6 px-1"
            />
          </div>
        )}

        {/* Info do período - Minimalista */}
        <div className="text-[9px] text-slate-500 tracking-tight">
          {filtroAtual.dataInicio.split('-').reverse().join('/')} → {filtroAtual.dataFim.split('-').reverse().join('/')}
        </div>
      </div>
    </div>
  );
}
