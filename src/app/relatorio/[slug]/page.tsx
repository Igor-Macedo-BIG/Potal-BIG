'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import {
  DollarSign,
  Users,
  MessageCircle,
  TrendingUp,
  TrendingDown,
  MousePointer,
  Target,
  BarChart3,
  ShoppingCart,
  Megaphone,
  Eye,
  Loader2,
  AlertCircle,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Activity,
  Zap,
  MessageSquareText,
  ChevronRight,
  ChevronLeft,
  X,
} from 'lucide-react';

interface MetricaConfig {
  metrica_key: string;
  nome_display: string;
  visivel: boolean;
  ordem: number;
}

interface FeedbackItem {
  id: string;
  tipo: 'semanal' | 'mensal';
  titulo: string;
  conteudo: string;
  periodo_inicio: string;
  periodo_fim: string;
  created_at: string;
}

interface RelatorioData {
  empresa: { nome: string; logo_url?: string };
  metricas: Record<string, number>;
  metricas_anterior: Record<string, number> | null;
  configs: MetricaConfig[];
  periodo: { inicio: string; fim: string; dias: number };
  feedbacks: FeedbackItem[];
}

const ICONE_MAP: Record<string, any> = {
  investimento: DollarSign,
  leads: Users,
  leads_whatsapp: MessageCircle,
  leads_messenger: Megaphone,
  mensagens: MessageCircle,
  cpl: DollarSign,
  custo_por_mensagem: DollarSign,
  media_diaria_mensagens: Activity,
  ctr: MousePointer,
  roas: Zap,
  alcance: Megaphone,
  impressoes: Eye,
  cliques: MousePointer,
  vendas: ShoppingCart,
  faturamento: DollarSign,
  cpm: BarChart3,
  cpc: Target,
};

// Cores vibrantes para dark e light — glow no dark
const GLOW_MAP: Record<string, { gradient: string; glow: string; ring: string; icon: string; lightGrad: string }> = {
  investimento:            { gradient: 'from-blue-500 to-cyan-400',    glow: 'shadow-blue-500/25',   ring: 'ring-blue-500/30',    icon: 'text-blue-400',   lightGrad: 'from-blue-500 to-cyan-500' },
  leads:                   { gradient: 'from-violet-500 to-purple-400', glow: 'shadow-violet-500/25', ring: 'ring-violet-500/30',  icon: 'text-violet-400', lightGrad: 'from-violet-500 to-purple-500' },
  leads_whatsapp:          { gradient: 'from-emerald-400 to-green-500', glow: 'shadow-emerald-500/25',ring: 'ring-emerald-500/30', icon: 'text-emerald-400',lightGrad: 'from-emerald-500 to-green-500' },
  leads_messenger:         { gradient: 'from-fuchsia-500 to-pink-400', glow: 'shadow-fuchsia-500/25',ring: 'ring-fuchsia-500/30', icon: 'text-fuchsia-400',lightGrad: 'from-fuchsia-500 to-pink-500' },
  mensagens:               { gradient: 'from-emerald-400 to-teal-400', glow: 'shadow-emerald-500/25',ring: 'ring-emerald-500/30', icon: 'text-emerald-400',lightGrad: 'from-emerald-500 to-teal-500' },
  cpl:                     { gradient: 'from-amber-400 to-orange-500', glow: 'shadow-amber-500/25',  ring: 'ring-amber-500/30',   icon: 'text-amber-400',  lightGrad: 'from-amber-500 to-orange-500' },
  custo_por_mensagem:      { gradient: 'from-rose-400 to-red-500',    glow: 'shadow-rose-500/25',   ring: 'ring-rose-500/30',    icon: 'text-rose-400',   lightGrad: 'from-rose-500 to-red-500' },
  media_diaria_mensagens:  { gradient: 'from-indigo-400 to-blue-500', glow: 'shadow-indigo-500/25', ring: 'ring-indigo-500/30',  icon: 'text-indigo-400', lightGrad: 'from-indigo-500 to-blue-500' },
  ctr:                     { gradient: 'from-pink-400 to-rose-500',   glow: 'shadow-pink-500/25',   ring: 'ring-pink-500/30',    icon: 'text-pink-400',   lightGrad: 'from-pink-500 to-rose-500' },
  roas:                    { gradient: 'from-yellow-400 to-amber-500', glow: 'shadow-yellow-500/25', ring: 'ring-yellow-500/30',  icon: 'text-yellow-400', lightGrad: 'from-yellow-500 to-amber-500' },
  alcance:                 { gradient: 'from-teal-400 to-cyan-500',   glow: 'shadow-teal-500/25',   ring: 'ring-teal-500/30',    icon: 'text-teal-400',   lightGrad: 'from-teal-500 to-cyan-500' },
  impressoes:              { gradient: 'from-sky-400 to-blue-500',    glow: 'shadow-sky-500/25',    ring: 'ring-sky-500/30',     icon: 'text-sky-400',    lightGrad: 'from-sky-500 to-blue-500' },
  cliques:                 { gradient: 'from-fuchsia-400 to-purple-500',glow:'shadow-fuchsia-500/25',ring: 'ring-fuchsia-500/30', icon: 'text-fuchsia-400',lightGrad: 'from-fuchsia-500 to-purple-500' },
  vendas:                  { gradient: 'from-emerald-400 to-green-500',glow: 'shadow-emerald-500/25',ring: 'ring-emerald-500/30', icon: 'text-emerald-400',lightGrad: 'from-emerald-500 to-green-500' },
  faturamento:             { gradient: 'from-yellow-300 to-amber-500', glow: 'shadow-yellow-500/25', ring: 'ring-yellow-500/30',  icon: 'text-yellow-400', lightGrad: 'from-yellow-500 to-amber-500' },
  cpm:                     { gradient: 'from-slate-400 to-zinc-500',   glow: 'shadow-slate-500/25',  ring: 'ring-slate-500/30',   icon: 'text-slate-400',  lightGrad: 'from-slate-500 to-zinc-500' },
  cpc:                     { gradient: 'from-orange-400 to-red-500',   glow: 'shadow-orange-500/25', ring: 'ring-orange-500/30',  icon: 'text-orange-400', lightGrad: 'from-orange-500 to-red-500' },
};

const DEFAULT_GLOW = { gradient: 'from-gray-400 to-gray-500', glow: 'shadow-gray-500/25', ring: 'ring-gray-500/30', icon: 'text-gray-400', lightGrad: 'from-gray-500 to-gray-600' };

// Métricas de custo: menor = melhor (inverte trend)
const METRICAS_CUSTO = new Set(['cpl', 'cpc', 'cpm', 'custo_por_mensagem']);

function formatarValor(key: string, value: number): string {
  if (value === 0 || value === undefined || value === null) return '—';
  switch (key) {
    case 'investimento':
    case 'faturamento':
    case 'cpl':
    case 'cpm':
    case 'cpc':
    case 'custo_por_mensagem':
      return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    case 'ctr':
      return `${value.toFixed(2)}%`;
    case 'roas':
      return `${value.toFixed(2)}x`;
    case 'media_diaria_mensagens':
      return value.toFixed(1);
    default:
      return value.toLocaleString('pt-BR');
  }
}

function diffPercent(current: number, prev: number): number {
  if (prev === 0) return current === 0 ? 0 : 100;
  return Math.round(((current - prev) / prev) * 100);
}

// Preset de períodos
const PRESETS = [
  { label: '7d', dias: 7 },
  { label: '15d', dias: 15 },
  { label: '30d', dias: 30 },
  { label: 'Mês atual', dias: 0 },
  { label: 'Mês anterior', dias: -1 },
];

function calcPreset(preset: typeof PRESETS[0]): { inicio: string; fim: string } {
  const hoje = new Date();
  if (preset.dias === 0) {
    const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    return { inicio: inicio.toISOString().split('T')[0], fim: hoje.toISOString().split('T')[0] };
  }
  if (preset.dias === -1) {
    const inicio = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
    const fim = new Date(hoje.getFullYear(), hoje.getMonth(), 0);
    return { inicio: inicio.toISOString().split('T')[0], fim: fim.toISOString().split('T')[0] };
  }
  const inicio = new Date(hoje);
  inicio.setDate(hoje.getDate() - preset.dias + 1);
  return { inicio: inicio.toISOString().split('T')[0], fim: hoje.toISOString().split('T')[0] };
}

function RelatorioContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const isDark = searchParams.get('tema') !== 'light';

  const [data, setData] = useState<RelatorioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [presetAtivo, setPresetAtivo] = useState(2); // 30 dias default

  const defaultRange = calcPreset(PRESETS[2]);
  const [dataInicio, setDataInicio] = useState(defaultRange.inicio);
  const [dataFim, setDataFim] = useState(defaultRange.fim);

  // Feedback state
  const [feedbackAberto, setFeedbackAberto] = useState(false);
  const [feedbackIdx, setFeedbackIdx] = useState(0);

  const carregar = useCallback(async (inicio: string, fim: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/relatorio/${slug}?inicio=${inicio}&fim=${fim}`);
      if (!res.ok) {
        setError(res.status === 404 ? 'Relatório não encontrado' : 'Erro ao carregar relatório');
        return;
      }
      setData(await res.json());
      setError(null);
    } catch {
      setError('Erro de conexão');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (slug) carregar(dataInicio, dataFim);
  }, [slug, dataInicio, dataFim, carregar]);

  const selecionarPreset = (idx: number) => {
    setPresetAtivo(idx);
    const range = calcPreset(PRESETS[idx]);
    setDataInicio(range.inicio);
    setDataFim(range.fim);
  };

  // ── Loading ──
  if (loading && !data) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-[#0a0a0f]' : 'bg-gray-50'}`}>
        <div className="text-center space-y-4">
          <div className="relative inline-flex">
            <div className={`h-12 w-12 rounded-full border-2 border-t-transparent animate-spin ${isDark ? 'border-blue-500' : 'border-blue-600'}`} />
            <div className={`absolute inset-0 h-12 w-12 rounded-full border-2 border-t-transparent animate-spin ${isDark ? 'border-purple-500/30' : 'border-purple-300'}`} style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
          </div>
          <p className={`text-sm font-medium ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Carregando relatório...</p>
        </div>
      </div>
    );
  }

  // ── Error ──
  if (error && !data) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-[#0a0a0f]' : 'bg-gray-50'}`}>
        <div className="text-center space-y-4">
          <div className={`inline-flex p-4 rounded-2xl ${isDark ? 'bg-red-500/10' : 'bg-red-50'}`}>
            <AlertCircle className={`h-8 w-8 ${isDark ? 'text-red-400' : 'text-red-500'}`} />
          </div>
          <h1 className={`text-lg font-semibold ${isDark ? 'text-slate-200' : 'text-gray-800'}`}>{error}</h1>
          <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Verifique o link e tente novamente</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { empresa, metricas, metricas_anterior, configs, periodo, feedbacks } = data;

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#0a0a0f]' : 'bg-[#f8f9fc]'} relative overflow-hidden`}>
      {/* ── Ambient background effects (dark only) ── */}
      {isDark && (
        <>
          <div className="fixed inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-600/[0.07] rounded-full blur-[128px]" />
            <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-600/[0.05] rounded-full blur-[128px]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-cyan-600/[0.03] rounded-full blur-[128px]" />
          </div>
          {/* Subtle grid */}
          <div
            className="fixed inset-0 pointer-events-none opacity-[0.03]"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
              backgroundSize: '64px 64px',
            }}
          />
        </>
      )}

      <div className="relative z-10">
        {/* ══════════════════════════════════════════
            HEADER
            ══════════════════════════════════════════ */}
        <header className={`border-b backdrop-blur-xl ${isDark ? 'bg-[#0a0a0f]/80 border-white/[0.06]' : 'bg-white/80 border-gray-200/80'}`}>
          <div className="max-w-6xl mx-auto px-6 py-5">
            {/* Top row: logo + company */}
            <div className="flex items-center gap-4">
              {empresa.logo_url ? (
                <img
                  src={empresa.logo_url}
                  alt={empresa.nome}
                  className={`h-11 w-11 rounded-xl object-cover ring-2 ${isDark ? 'ring-white/10' : 'ring-gray-200'}`}
                />
              ) : (
                <div className={`h-11 w-11 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-base shadow-lg shadow-blue-500/20`}>
                  {empresa.nome.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1">
                <h1 className={`text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {empresa.nome}
                </h1>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                  {new Date(periodo.inicio + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} — {new Date(periodo.fim + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                  {' · '}{periodo.dias} dias
                </p>
              </div>
              {loading && (
                <div className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 ${isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Atualizando
                </div>
              )}
            </div>

            {/* Period filter bar */}
            <div className={`mt-4 flex flex-wrap items-center gap-1.5 p-1 rounded-xl ${isDark ? 'bg-white/[0.04]' : 'bg-gray-100/80'}`}>
              {PRESETS.map((p, i) => (
                <button
                  key={i}
                  onClick={() => selecionarPreset(i)}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 ${
                    presetAtivo === i
                      ? isDark
                        ? 'bg-white/10 text-white shadow-sm'
                        : 'bg-white text-gray-900 shadow-sm'
                      : isDark
                        ? 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-white/60'
                  }`}
                >
                  {p.label}
                </button>
              ))}
              <div className={`h-4 w-px mx-1 ${isDark ? 'bg-white/10' : 'bg-gray-300'}`} />
              <div className="flex items-center gap-1.5">
                <input
                  type="date"
                  value={dataInicio}
                  onChange={(e) => { setDataInicio(e.target.value); setPresetAtivo(-1); }}
                  className={`px-2.5 py-1.5 text-xs rounded-lg border-0 outline-none focus:ring-1 ${
                    isDark
                      ? 'bg-white/[0.06] text-slate-300 focus:ring-blue-500/50'
                      : 'bg-white text-gray-700 focus:ring-blue-500/30'
                  }`}
                />
                <span className={`text-xs ${isDark ? 'text-slate-600' : 'text-gray-300'}`}>→</span>
                <input
                  type="date"
                  value={dataFim}
                  onChange={(e) => { setDataFim(e.target.value); setPresetAtivo(-1); }}
                  className={`px-2.5 py-1.5 text-xs rounded-lg border-0 outline-none focus:ring-1 ${
                    isDark
                      ? 'bg-white/[0.06] text-slate-300 focus:ring-blue-500/50'
                      : 'bg-white text-gray-700 focus:ring-blue-500/30'
                  }`}
                />
              </div>
            </div>
          </div>
        </header>

        {/* ══════════════════════════════════════════
            FEEDBACK DE PERFORMANCE
            ══════════════════════════════════════════ */}
        {feedbacks && feedbacks.length > 0 && (
          <div className="max-w-6xl mx-auto px-6 pt-6">
            {/* ── Minimized state ── */}
            {!feedbackAberto ? (
              <button
                onClick={() => { setFeedbackAberto(true); setFeedbackIdx(0); }}
                className={`w-full group relative rounded-2xl transition-all duration-300 overflow-hidden ${
                  isDark
                    ? 'bg-gradient-to-r from-blue-500/[0.06] via-purple-500/[0.04] to-cyan-500/[0.06] border border-white/[0.08] hover:border-white/[0.15] hover:shadow-lg hover:shadow-blue-500/10'
                    : 'bg-gradient-to-r from-blue-50 via-purple-50/50 to-cyan-50 border border-blue-200/60 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-100'
                }`}
              >
                {/* Animated top glow line */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/60 to-transparent group-hover:via-blue-400 transition-all" />

                <div className="px-5 py-4 flex items-center gap-4">
                  <div className={`p-2.5 rounded-xl ${
                    isDark
                      ? 'bg-blue-500/10 ring-1 ring-blue-500/20'
                      : 'bg-gradient-to-br from-blue-500 to-purple-600 shadow-sm'
                  }`}>
                    <MessageSquareText className={`h-4.5 w-4.5 ${isDark ? 'text-blue-400' : 'text-white'}`} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Feedback de Performance
                    </p>
                    <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                      {feedbacks.length} {feedbacks.length === 1 ? 'relatório disponível' : 'relatórios disponíveis'} · Clique para expandir
                    </p>
                  </div>
                  <div className={`flex items-center gap-2 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                    {feedbacks.slice(0, 3).map((fb, i) => (
                      <span key={i} className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider ${
                        fb.tipo === 'mensal'
                          ? isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-100 text-blue-600'
                          : isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-100 text-emerald-600'
                      }`}>
                        {fb.tipo}
                      </span>
                    ))}
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </div>
                </div>
              </button>
            ) : (
              /* ── Expanded state ── */
              <div className={`relative rounded-2xl overflow-hidden transition-all duration-500 ${
                isDark
                  ? 'bg-white/[0.02] border border-white/[0.08] shadow-2xl shadow-black/20'
                  : 'bg-white border border-gray-200 shadow-xl shadow-gray-200/50'
              }`}>
                {/* Top gradient bar */}
                <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500" />

                {/* Header */}
                <div className={`px-6 py-4 flex items-center justify-between border-b ${isDark ? 'border-white/[0.06]' : 'border-gray-100'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${
                      isDark
                        ? 'bg-blue-500/10 ring-1 ring-blue-500/20'
                        : 'bg-gradient-to-br from-blue-500 to-purple-600'
                    }`}>
                      <MessageSquareText className={`h-4 w-4 ${isDark ? 'text-blue-400' : 'text-white'}`} />
                    </div>
                    <div>
                      <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Feedback de Performance</h3>
                      <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                        {feedbackIdx + 1} de {feedbacks.length}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {/* Nav dots */}
                    <div className="flex items-center gap-1 mr-3">
                      {feedbacks.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setFeedbackIdx(i)}
                          className={`rounded-full transition-all duration-200 ${
                            i === feedbackIdx
                              ? `w-5 h-1.5 ${isDark ? 'bg-blue-400' : 'bg-blue-500'}`
                              : `w-1.5 h-1.5 ${isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-200 hover:bg-gray-300'}`
                          }`}
                        />
                      ))}
                    </div>
                    {/* Nav arrows */}
                    <button
                      onClick={() => setFeedbackIdx(Math.max(0, feedbackIdx - 1))}
                      disabled={feedbackIdx === 0}
                      className={`p-1.5 rounded-lg transition-colors ${
                        feedbackIdx === 0
                          ? isDark ? 'text-slate-700' : 'text-gray-200'
                          : isDark ? 'text-slate-400 hover:bg-white/[0.06] hover:text-white' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                      }`}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setFeedbackIdx(Math.min(feedbacks.length - 1, feedbackIdx + 1))}
                      disabled={feedbackIdx === feedbacks.length - 1}
                      className={`p-1.5 rounded-lg transition-colors ${
                        feedbackIdx === feedbacks.length - 1
                          ? isDark ? 'text-slate-700' : 'text-gray-200'
                          : isDark ? 'text-slate-400 hover:bg-white/[0.06] hover:text-white' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                      }`}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                    {/* Close */}
                    <button
                      onClick={() => setFeedbackAberto(false)}
                      className={`p-1.5 rounded-lg ml-1 transition-colors ${isDark ? 'text-slate-500 hover:bg-white/[0.06] hover:text-white' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700'}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                {feedbacks[feedbackIdx] && (
                  <div className="px-6 py-5">
                    {/* Badge + Title + Date */}
                    <div className="flex items-start gap-3 mb-4">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider shrink-0 mt-0.5 ${
                        feedbacks[feedbackIdx].tipo === 'mensal'
                          ? isDark ? 'bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20' : 'bg-blue-50 text-blue-600 ring-1 ring-blue-200'
                          : isDark ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20' : 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200'
                      }`}>
                        {feedbacks[feedbackIdx].tipo}
                      </span>
                      <div className="flex-1">
                        <h4 className={`text-base font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {feedbacks[feedbackIdx].titulo}
                        </h4>
                        <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                          {new Date(feedbacks[feedbackIdx].periodo_inicio + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                          {' — '}
                          {new Date(feedbacks[feedbackIdx].periodo_fim + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>

                    {/* Body text */}
                    <div className={`text-sm leading-relaxed whitespace-pre-wrap ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                      {feedbacks[feedbackIdx].conteudo}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════
            KPI CARDS
            ══════════════════════════════════════════ */}
        <main className="max-w-6xl mx-auto px-6 py-8">
          {configs.length === 0 ? (
            <div className="text-center py-20">
              <BarChart3 className={`h-10 w-10 mx-auto ${isDark ? 'text-slate-700' : 'text-gray-300'}`} />
              <p className={`mt-3 text-sm ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Nenhuma métrica configurada</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {configs.map((config) => {
                const IconComp = ICONE_MAP[config.metrica_key] || BarChart3;
                const colors = GLOW_MAP[config.metrica_key] || DEFAULT_GLOW;
                const valor = metricas[config.metrica_key] ?? 0;
                const valorAnt = metricas_anterior ? (metricas_anterior[config.metrica_key] ?? 0) : null;
                const temComp = valorAnt !== null;
                const pctDiff = temComp ? diffPercent(valor, valorAnt) : 0;
                const isCusto = METRICAS_CUSTO.has(config.metrica_key);
                const isPositive = isCusto ? pctDiff < 0 : pctDiff > 0;
                const isNeutral = pctDiff === 0;

                return (
                  <div
                    key={config.metrica_key}
                    className={`group relative rounded-2xl transition-all duration-300 ${
                      isDark
                        ? `bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.05] hover:${colors.glow} hover:shadow-lg`
                        : 'bg-white border border-gray-200/60 hover:shadow-lg hover:shadow-gray-200/50 hover:border-gray-300/80'
                    }`}
                  >
                    {/* Top accent glow line */}
                    <div className={`absolute top-0 left-4 right-4 h-px bg-gradient-to-r ${colors.gradient} opacity-40 group-hover:opacity-80 transition-opacity`} />

                    <div className="p-5 space-y-3">
                      {/* Icon + Label row */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className={`p-2 rounded-xl transition-shadow duration-300 ${
                            isDark
                              ? `bg-white/[0.06] ring-1 ${colors.ring}`
                              : `bg-gradient-to-br ${colors.lightGrad} shadow-sm`
                          }`}>
                            <IconComp className={`h-4 w-4 ${isDark ? colors.icon : 'text-white'}`} />
                          </div>
                          <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                            {config.nome_display}
                          </span>
                        </div>
                      </div>

                      {/* Main value */}
                      <div>
                        <p className={`text-3xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {formatarValor(config.metrica_key, valor)}
                        </p>
                      </div>

                      {/* Comparison badge */}
                      <div className="h-6 flex items-center">
                        {temComp && !isNeutral ? (
                          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold ${
                            isPositive
                              ? isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'
                              : isDark ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600'
                          }`}>
                            {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                            {pctDiff >= 0 ? '+' : ''}{pctDiff}%
                            <span className={`font-normal ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>vs anterior</span>
                          </div>
                        ) : temComp && isNeutral ? (
                          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${isDark ? 'bg-white/[0.04] text-slate-500' : 'bg-gray-50 text-gray-400'}`}>
                            <Minus className="h-3 w-3" />
                            Sem variação
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer */}
          <div className={`mt-16 pb-8 text-center ${isDark ? 'text-slate-700' : 'text-gray-300'}`}>
            <div className="flex items-center justify-center gap-2 text-xs">
              <div className={`h-1 w-1 rounded-full ${isDark ? 'bg-slate-700' : 'bg-gray-300'}`} />
              <span>Atualizado automaticamente · {periodo.dias} dias de dados</span>
              <div className={`h-1 w-1 rounded-full ${isDark ? 'bg-slate-700' : 'bg-gray-300'}`} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function RelatorioPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="h-10 w-10 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
      </div>
    }>
      <RelatorioContent />
    </Suspense>
  );
}
