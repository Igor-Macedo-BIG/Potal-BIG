'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';

interface MetricasConfig {
  total_leads: boolean;
  media_diaria_leads: boolean;
  custo_por_lead: boolean;
  investimento: boolean;
  faturamento: boolean;
  roas: boolean;
  leads: boolean;
  vendas: boolean;
  alcance: boolean;
  cliques: boolean;
  impressoes: boolean;
  visualizacoes: boolean;
  checkouts: boolean;
}

interface MetricasConfiguratorProps {
  value: MetricasConfig;
  onChange: (config: MetricasConfig) => void;
}

const METRICAS_DISPONIVEIS = [
  { key: 'total_leads', label: 'Total de Leads', description: 'Total acumulado de leads capturados' },
  { key: 'media_diaria_leads', label: 'Média Diária de Leads', description: 'Média de leads por dia' },
  { key: 'custo_por_lead', label: 'Custo por Lead', description: 'Investimento ÷ Leads' },
  { key: 'investimento', label: 'Investimento', description: 'Total investido em campanhas' },
  { key: 'faturamento', label: 'Faturamento', description: 'Receita total gerada' },
  { key: 'roas', label: 'ROAS', description: 'Retorno sobre investimento' },
  { key: 'leads', label: 'Leads', description: 'Total de leads capturados' },
  { key: 'vendas', label: 'Vendas', description: 'Número de vendas confirmadas' },
  { key: 'alcance', label: 'Alcance', description: 'Pessoas alcançadas' },
  { key: 'cliques', label: 'Cliques', description: 'Total de cliques nos anúncios' },
  { key: 'impressoes', label: 'Impressões', description: 'Visualizações de anúncios' },
  { key: 'visualizacoes', label: 'Visualizações', description: 'Views de conteúdo' },
  { key: 'checkouts', label: 'Checkouts', description: 'Checkouts iniciados' },
] as const;

export function MetricasConfigurator({ value, onChange }: MetricasConfiguratorProps) {
  // Garantir que value não seja null/undefined
  const config = value || {};
  
  const toggleMetrica = (key: keyof MetricasConfig) => {
    onChange({
      ...config,
      [key]: !config[key],
    });
  };

  const selecionarTodas = () => {
    const todasAtivas = Object.fromEntries(
      METRICAS_DISPONIVEIS.map(m => [m.key, true])
    ) as MetricasConfig;
    onChange(todasAtivas);
  };

  const deselecionarTodas = () => {
    const todasInativas = Object.fromEntries(
      METRICAS_DISPONIVEIS.map(m => [m.key, false])
    ) as MetricasConfig;
    onChange(todasInativas);
  };

  const ativasCount = Object.values(config).filter(Boolean).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">Métricas Visíveis no Dashboard Público</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {ativasCount} de {METRICAS_DISPONIVEIS.length} métricas selecionadas
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={selecionarTodas}
            className="px-3 py-1.5 text-xs bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 rounded-md transition-colors"
          >
            Selecionar Todas
          </button>
          <button
            type="button"
            onClick={deselecionarTodas}
            className="px-3 py-1.5 text-xs bg-gray-700/50 hover:bg-gray-700/70 text-gray-300 rounded-md transition-colors"
          >
            Limpar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {METRICAS_DISPONIVEIS.map((metrica) => {
          const isActive = config[metrica.key as keyof MetricasConfig] !== false;
          
          return (
            <button
              key={metrica.key}
              type="button"
              onClick={() => toggleMetrica(metrica.key as keyof MetricasConfig)}
              className={`
                relative flex items-start gap-3 p-3 rounded-lg border transition-all text-left
                ${isActive 
                  ? 'bg-purple-600/10 border-purple-500/30 hover:bg-purple-600/15' 
                  : 'bg-gray-800/30 border-gray-700/30 hover:bg-gray-800/50'
                }
              `}
            >
              <div className={`
                flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5
                ${isActive 
                  ? 'bg-purple-600 border-purple-500' 
                  : 'bg-transparent border-gray-600'
                }
              `}>
                {isActive && <Check className="w-3 h-3 text-white" />}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white">
                  {metrica.label}
                </div>
                <div className="text-xs text-gray-400 mt-0.5">
                  {metrica.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="bg-blue-600/10 border border-blue-500/20 rounded-lg p-3">
        <p className="text-xs text-blue-300">
          💡 <strong>Dica:</strong> Apenas as métricas selecionadas aparecerão no dashboard público do cliente. 
          Isso permite que você personalize a experiência para cada cliente.
        </p>
      </div>
    </div>
  );
}
