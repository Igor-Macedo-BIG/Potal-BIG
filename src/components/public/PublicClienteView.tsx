'use client';

import { useEffect } from 'react';
import { useCliente } from '@/contexts/ClienteContext';
import { useCampanhaContext } from '@/contexts/CampanhaContext';
import { DashboardCampanha } from '@/components/dashboard/DashboardCampanha';
import RelatoriosPublicos from '@/components/public/RelatoriosPublicos';
import { TrendingUp } from 'lucide-react';

interface Cliente {
  id: string;
  nome: string;
  logo_url?: string;
  slug?: string;
  empresa_id: string;
  metricas_visiveis?: any;
}

interface PublicClienteViewProps {
  cliente: Cliente;
}

export default function PublicClienteView({ cliente }: PublicClienteViewProps) {
  const { selecionarCliente } = useCliente();
  const { filtroData } = useCampanhaContext();

  useEffect(() => {
    // Selecionar o cliente automaticamente ao carregar a página
    selecionarCliente(cliente);
  }, [cliente, selecionarCliente]);

  return (
    <div className="min-h-screen bg-black antialiased">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-black to-black" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:20px_20px] sm:bg-[size:32px_32px] lg:bg-[size:48px_48px]" />
      </div>
      
      {/* Header Premium Ultra - Fully Responsive */}
      <header className="relative border-b border-white/10 backdrop-blur-md">
        {/* Background Premium */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/40 via-slate-900/30 to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-800/25 via-transparent to-transparent" />
        
        <div className="relative max-w-[1600px] mx-auto">
          {/* Mobile Header (< 640px) */}
          <div className="block sm:hidden px-4 py-5">
            <div className="text-center space-y-3">
              {/* Badge Superior */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-700/20 to-cyan-500/20 border border-blue-500/30">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
                </span>
                <span className="text-[10px] font-bold tracking-wider text-blue-300 uppercase">
                  Painel do Tráfego • Igor Macedo
                </span>
              </div>

              {/* Logo */}
              {cliente.logo_url && (
                <div className="flex justify-center">
                  <div className="relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-800 via-blue-600 to-cyan-500 rounded-2xl opacity-75 blur-lg animate-pulse" />
                    <img
                      src={cliente.logo_url}
                      alt={cliente.nome}
                      className="relative h-16 w-16 rounded-xl object-cover bg-white/10 p-2 ring-2 ring-white/20 backdrop-blur-sm"
                    />
                  </div>
                </div>
              )}

              {/* Nome do Cliente */}
              <div>
                <h1 className="text-2xl font-black text-white mb-1 bg-gradient-to-r from-white via-blue-200 to-cyan-200 bg-clip-text text-transparent leading-tight">
                  {cliente.nome}
                </h1>
                <p className="text-xs text-blue-300/80 font-medium flex items-center justify-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5" />
                  Métricas de Performance
                </p>
              </div>
            </div>
          </div>

          {/* Tablet Header (640px - 1024px) */}
          <div className="hidden sm:block lg:hidden px-6 py-6">
            <div className="flex items-center gap-6">
              {/* Logo */}
              {cliente.logo_url && (
                <div className="relative flex-shrink-0">
                  <div className="absolute -inset-2 bg-gradient-to-r from-blue-800 via-blue-600 to-cyan-500 rounded-2xl opacity-75 blur-xl animate-pulse" />
                  <img
                    src={cliente.logo_url}
                    alt={cliente.nome}
                    className="relative h-20 w-20 rounded-2xl object-cover bg-white/10 p-2.5 ring-2 ring-white/20 backdrop-blur-sm"
                  />
                </div>
              )}

              <div className="flex-1 min-w-0">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-blue-700/20 to-cyan-500/20 border border-blue-500/30 mb-3">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
                  </span>
                  <span className="text-[11px] font-bold tracking-wider text-blue-300 uppercase">
                    Painel do Tráfego • Igor Macedo
                  </span>
                </div>

                {/* Nome */}
                <h1 className="text-3xl font-black text-white mb-1.5 bg-gradient-to-r from-white via-blue-100 to-cyan-100 bg-clip-text text-transparent leading-tight">
                  {cliente.nome}
                </h1>
                <p className="text-sm text-blue-300/80 font-medium flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Dashboard de Performance e Resultados
                </p>
              </div>
            </div>
          </div>

          {/* Desktop Header (≥ 1024px) */}
          <div className="hidden lg:block px-8 xl:px-10 py-8">
            <div className="flex items-center gap-8">
              {/* Logo Premium */}
              {cliente.logo_url && (
                <div className="relative flex-shrink-0 group">
                  <div className="absolute -inset-3 bg-gradient-to-r from-blue-900 via-blue-600 to-cyan-500 rounded-3xl opacity-75 group-hover:opacity-100 blur-2xl transition-all duration-500 animate-pulse" />
                  <img
                    src={cliente.logo_url}
                    alt={cliente.nome}
                    className="relative h-28 w-28 rounded-2xl object-cover bg-white/10 p-3 ring-2 ring-white/20 backdrop-blur-sm transition-transform group-hover:scale-105 duration-300"
                  />
                </div>
              )}

              <div className="flex-1 min-w-0">
                {/* Badge Superior */}
                <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-700/20 to-cyan-500/20 border border-blue-500/40 mb-4 shadow-lg shadow-blue-600/20">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-600 shadow-lg shadow-blue-600/50"></span>
                  </span>
                  <span className="text-xs font-bold tracking-widest text-blue-300 uppercase">
                    Painel do Tráfego Pago • Igor Macedo
                  </span>
                  <div className="h-3 w-px bg-blue-500/40" />
                  <span className="text-xs font-medium text-cyan-400">Premium</span>
                </div>

                {/* Nome do Cliente */}
                <h1 className="text-5xl font-black text-white mb-2 bg-gradient-to-r from-white via-blue-100 to-cyan-100 bg-clip-text text-transparent leading-tight tracking-tight">
                  {cliente.nome}
                </h1>
                
                <p className="text-base text-blue-300/80 font-medium flex items-center gap-2.5">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  Dashboard de Performance e Resultados em Tempo Real
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/20 border border-green-400/30 text-[10px] font-bold text-green-400 ml-2">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                    </span>
                    AO VIVO
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Dashboard Content - Otimizado para Mobile e Desktop */}
      <main className="relative">
        <div className="max-w-[1600px] mx-auto px-3 sm:px-4 md:px-5 lg:px-6 xl:px-8 py-3 sm:py-4 md:py-6 lg:py-8">
          {/* Wrapper que otimiza TODOS os elementos do dashboard */}
          <div className="public-dashboard-optimized">
            <style jsx global>{`
              /* Otimizações Mobile (< 640px) */
              @media (max-width: 639px) {
                .public-dashboard-optimized [class*="grid"] {
                  gap: 0.5rem !important;
                }
                .public-dashboard-optimized [class*="Card"] {
                  padding: 0.75rem !important;
                }
                .public-dashboard-optimized h2, .public-dashboard-optimized h3 {
                  font-size: 0.875rem !important;
                  line-height: 1.25rem !important;
                }
                .public-dashboard-optimized button {
                  padding: 0.5rem 0.75rem !important;
                  font-size: 0.75rem !important;
                  min-height: 36px !important;
                }
                .public-dashboard-optimized select,
                .public-dashboard-optimized input {
                  padding: 0.5rem 0.75rem !important;
                  font-size: 0.8125rem !important;
                  min-height: 40px !important;
                }
                .public-dashboard-optimized [class*="gap-"] {
                  gap: 0.5rem !important;
                }
              }

              /* Otimizações Tablet (640px - 1023px) */
              @media (min-width: 640px) and (max-width: 1023px) {
                .public-dashboard-optimized [class*="grid"] {
                  gap: 0.75rem !important;
                }
                .public-dashboard-optimized [class*="Card"] {
                  padding: 1rem !important;
                }
                .public-dashboard-optimized h2 {
                  font-size: 1rem !important;
                }
                .public-dashboard-optimized h3 {
                  font-size: 0.9375rem !important;
                }
                .public-dashboard-optimized button {
                  padding: 0.625rem 1rem !important;
                  font-size: 0.8125rem !important;
                }
                .public-dashboard-optimized select,
                .public-dashboard-optimized input {
                  padding: 0.625rem 0.875rem !important;
                  font-size: 0.875rem !important;
                }
              }

              /* Otimizações Desktop (≥ 1024px) */
              @media (min-width: 1024px) {
                .public-dashboard-optimized [class*="grid"] {
                  gap: 1rem !important;
                }
                .public-dashboard-optimized [class*="Card"] {
                  padding: 1.25rem !important;
                }
                .public-dashboard-optimized button {
                  padding: 0.625rem 1.125rem !important;
                  font-size: 0.875rem !important;
                }
                .public-dashboard-optimized select,
                .public-dashboard-optimized input {
                  padding: 0.625rem 1rem !important;
                  font-size: 0.875rem !important;
                }
              }

              /* Melhorias gerais */
              .public-dashboard-optimized * {
                touch-action: manipulation;
              }
              .public-dashboard-optimized button,
              .public-dashboard-optimized select,
              .public-dashboard-optimized input {
                -webkit-tap-highlight-color: transparent;
                border-radius: 0.5rem !important;
              }
            `}</style>
            
            {/* Relatórios e Observações do Período */}
            <div className="mb-6">
              <RelatoriosPublicos 
                clienteId={cliente.id}
                dataInicio={filtroData.dataInicio}
                dataFim={filtroData.dataFim}
              />
            </div>
            
            <DashboardCampanha />
          </div>
        </div>
      </main>

      {/* Footer - Responsive */}
      <footer className="relative border-t border-white/5 mt-6 sm:mt-8 lg:mt-12">
        <div className="max-w-[1600px] mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
          <p className="text-center text-[9px] sm:text-[10px] lg:text-xs text-white/25 font-light">
            Powered by{' '}
            <span className="text-purple-400/80 font-medium">Portal do Tráfego</span>
            {' '}•{' '}Igor Macedo
          </p>
        </div>
      </footer>
    </div>
  );
}
