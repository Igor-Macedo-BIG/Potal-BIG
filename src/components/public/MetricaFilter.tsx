'use client';

import { useCliente } from '@/contexts/ClienteContext';
import { ReactNode } from 'react';

interface MetricaFilterProps {
  metricaKey: string;
  children: ReactNode;
}

/**
 * Componente que esconde métricas não habilitadas para o cliente
 * Usado apenas no dashboard público
 */
export function MetricaFilter({ metricaKey, children }: MetricaFilterProps) {
  const { clienteSelecionado } = useCliente();

  // Se não houver configuração, mostra tudo temporariamente
  // (evita flickering durante carregamento inicial)
  if (!clienteSelecionado?.metricas_visiveis) {
    return <>{children}</>;
  }

  // Verifica se a métrica está habilitada
  const isVisible = (clienteSelecionado.metricas_visiveis as any)?.[metricaKey] === true;

  // Se não visível, retorna null (esconde o card)
  if (!isVisible) {
    return null;
  }

  return <>{children}</>;
}
