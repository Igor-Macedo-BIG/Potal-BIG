import { useState, useEffect } from 'react';
import type { FiltrosDashboard, DashboardResponse } from '@/types/hierarchical';

interface UseDashboardResult {
  data: DashboardResponse | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useDashboard(filtros: FiltrosDashboard): UseDashboardResult {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      
      if (filtros.empresa_id) params.set('empresa_id', filtros.empresa_id);
      if (filtros.funil_id) params.set('funil_id', filtros.funil_id);
      if (filtros.campanha_id) params.set('campanha_id', filtros.campanha_id);
      if (filtros.conjunto_id) params.set('conjunto_id', filtros.conjunto_id);
      if (filtros.criativo_id) params.set('criativo_id', filtros.criativo_id);
      params.set('periodo_inicio', filtros.periodo_inicio);
      params.set('periodo_fim', filtros.periodo_fim);

      const response = await fetch(`/api/dashboard?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('Erro ao buscar dados do dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    fetchDashboard();
  };

  useEffect(() => {
    fetchDashboard();
  }, [
    filtros.empresa_id,
    filtros.funil_id,
    filtros.campanha_id,
    filtros.conjunto_id,
    filtros.criativo_id,
    filtros.periodo_inicio,
    filtros.periodo_fim
  ]);

  return { data, loading, error, refetch };
}