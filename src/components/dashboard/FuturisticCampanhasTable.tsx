'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'

interface Campanha {
  id: string
  nome: string
  plataforma: string
  tipo: string
  objetivo: string
  ativo: boolean
  created_at: string
}

interface CampanhaComMetricas extends Campanha {
  investido: number
  leads: number
  ctr: number
  conversao: number
  impressoes: number
  cliques: number
  alcance: number
}

interface FuturisticCampanhasTableProps {
  dataInicio?: string
  dataFim?: string
}

// Mapear objetivos Meta para nomes amigáveis
function formatarObjetivo(objetivo: string): string {
  const mapa: Record<string, string> = {
    'OUTCOME_TRAFFIC': 'Tráfego',
    'OUTCOME_LEADS': 'Geração de Leads',
    'OUTCOME_ENGAGEMENT': 'Engajamento',
    'OUTCOME_AWARENESS': 'Reconhecimento',
    'OUTCOME_SALES': 'Vendas',
    'OUTCOME_APP_PROMOTION': 'Promoção de App',
    'LINK_CLICKS': 'Cliques no Link',
    'POST_ENGAGEMENT': 'Engajamento',
    'REACH': 'Alcance',
    'IMPRESSIONS': 'Impressões',
    'LEAD_GENERATION': 'Geração de Leads',
    'CONVERSIONS': 'Conversões',
    'BRAND_AWARENESS': 'Reconhecimento de Marca',
    'VIDEO_VIEWS': 'Visualizações de Vídeo',
    'MESSAGES': 'Mensagens',
    'PAGE_LIKES': 'Curtidas na Página',
  }
  return mapa[objetivo] || objetivo?.replace(/OUTCOME_/g, '').replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase()) || 'Campanha'
}

export function FuturisticCampanhasTable({ dataInicio, dataFim }: FuturisticCampanhasTableProps) {
  const [campanhas, setCampanhas] = useState<CampanhaComMetricas[]>([])
  const [loading, setLoading] = useState(true)
  const { isClean } = useTheme()

  useEffect(() => {
    carregarCampanhas()
  }, [dataInicio, dataFim])

  const carregarCampanhas = async () => {
    try {
      setLoading(true)
      
      // Buscar campanhas que têm meta_id (são do Meta Ads)
      const { data: campanhasData, error: errorCampanhas } = await supabase
        .from('campanhas')
        .select('*')
        .not('meta_id', 'is', null)
        .order('ativo', { ascending: false })

      if (errorCampanhas) {
        console.error('Erro ao carregar campanhas:', errorCampanhas)
        return
      }

      if (!campanhasData || campanhasData.length === 0) {
        setCampanhas([])
        return
      }

      // Buscar métricas de TODAS as campanhas de uma vez (mais eficiente)
      const campanhaIds = campanhasData.map(c => c.id)
      let query = supabase
        .from('metricas')
        .select('referencia_id, investimento, leads, impressoes, cliques, alcance')
        .eq('tipo', 'campanha')
        .in('referencia_id', campanhaIds)

      if (dataInicio) {
        query = query.gte('periodo_inicio', dataInicio)
      }
      if (dataFim) {
        query = query.lte('periodo_inicio', dataFim)
      }

      const { data: todasMetricas } = await query

      // Agrupar métricas por campanha
      const metricasPorCampanha = new Map<string, { investido: number; leads: number; impressoes: number; cliques: number; alcance: number }>()
      
      todasMetricas?.forEach(m => {
        const current = metricasPorCampanha.get(m.referencia_id) || { investido: 0, leads: 0, impressoes: 0, cliques: 0, alcance: 0 }
        current.investido += m.investimento || 0
        current.leads += m.leads || 0
        current.impressoes += m.impressoes || 0
        current.cliques += m.cliques || 0
        current.alcance += m.alcance || 0
        metricasPorCampanha.set(m.referencia_id, current)
      })

      // Construir lista com métricas
      const campanhasComMetricas: CampanhaComMetricas[] = campanhasData.map(campanha => {
        const totais = metricasPorCampanha.get(campanha.id) || { investido: 0, leads: 0, impressoes: 0, cliques: 0, alcance: 0 }
        const ctr = totais.impressoes > 0 ? (totais.cliques / totais.impressoes) * 100 : 0
        const conversao = totais.cliques > 0 ? (totais.leads / totais.cliques) * 100 : 0

        return {
          ...campanha,
          investido: totais.investido,
          leads: totais.leads,
          ctr,
          conversao,
          impressoes: totais.impressoes,
          cliques: totais.cliques,
          alcance: totais.alcance,
        }
      })

      // Ordenar: ativas primeiro, depois por investimento desc
      campanhasComMetricas.sort((a, b) => {
        if (a.ativo !== b.ativo) return a.ativo ? -1 : 1
        return b.investido - a.investido
      })

      // Filtrar: só mostrar campanhas que tiveram gasto no período OU que são ativas
      const filtradas = campanhasComMetricas.filter(c => c.investido > 0 || c.ativo)

      setCampanhas(filtradas)
    } catch (error) {
      console.error('Erro ao carregar campanhas:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value)
  }

  const getPerformanceColor = (conversao: number) => {
    if (conversao >= 15) return 'from-emerald-500 to-green-400'
    if (conversao >= 5) return 'from-amber-500 to-orange-400'
    return 'from-red-500 to-pink-400'
  }

  const getPlataformaIcon = (plataforma: string) => {
    switch (plataforma?.toLowerCase()) {
      case 'meta ads':
      case 'meta':
      case 'facebook':
        return '📘'
      case 'google ads':
      case 'google':
        return '🔍'
      case 'linkedin ads':
      case 'linkedin':
        return '💼'
      case 'tiktok ads':
      case 'tiktok':
        return '🎵'
      default:
        return '📊'
    }
  }

  // Calcular totais
  const totais = campanhas.reduce(
    (acc, c) => ({
      investido: acc.investido + c.investido,
      leads: acc.leads + c.leads,
      impressoes: acc.impressoes + c.impressoes,
      cliques: acc.cliques + c.cliques,
      alcance: acc.alcance + c.alcance,
    }),
    { investido: 0, leads: 0, impressoes: 0, cliques: 0, alcance: 0 }
  )
  const totalCtr = totais.impressoes > 0 ? (totais.cliques / totais.impressoes) * 100 : 0
  const totalConversao = totais.cliques > 0 ? (totais.leads / totais.cliques) * 100 : 0

  if (loading) {
    return (
      <div className="group relative">
        {!isClean && <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-20 blur-sm rounded-2xl" />}
        <Card className={cn(
          "relative border-0",
          isClean ? 'bg-white border border-gray-200/60 shadow-sm' : 'bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl border border-slate-700/50'
        )}>
          <CardContent className="p-12">
            <div className="flex items-center justify-center">
              <Loader2 className={cn("h-8 w-8 animate-spin", isClean ? 'text-amber-600' : 'text-cyan-400')} />
              <span className={cn("ml-3", isClean ? 'text-gray-500' : 'text-slate-400')}>Carregando campanhas...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (campanhas.length === 0) {
    return (
      <div className="group relative">
        {!isClean && <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-20 blur-sm rounded-2xl" />}
        <Card className={cn(
          "relative border-0",
          isClean ? 'bg-white border border-gray-200/60 shadow-sm' : 'bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl border border-slate-700/50'
        )}>
          <CardHeader className={cn(
            "border-b",
            isClean ? 'bg-gray-50 border-gray-200' : 'bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border-slate-700/50'
          )}>
            <CardTitle className={cn("font-bold flex items-center space-x-2", isClean ? 'text-gray-900' : 'text-white')}>
              <span>Campanhas</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-12">
            <div className={cn("text-center", isClean ? 'text-gray-500' : 'text-slate-400')}>
              <p>Nenhuma campanha com dados no período selecionado</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Formatar período para exibir
  const periodoTexto = dataInicio && dataFim
    ? `${dataInicio.split('-').reverse().join('/')} — ${dataFim.split('-').reverse().join('/')}`
    : 'Período atual'

  return (
    <div className="group relative">
      {!isClean && <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-20 blur-sm transition-all duration-500 rounded-2xl group-hover:opacity-30 group-hover:blur-md" />}
      
      <Card className={cn(
        "data-table relative border-0 overflow-hidden",
        isClean
          ? 'bg-white border border-gray-200/60 shadow-sm'
          : 'bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl border border-slate-700/50'
      )}>
        <CardHeader className={cn(
          "data-table-header border-b py-4",
          isClean
            ? 'bg-gray-50/80 border-gray-200'
            : 'bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border-slate-700/50'
        )}>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className={cn("font-bold flex items-center space-x-2", isClean ? 'text-gray-900' : 'text-white')}>
                <div className="flex space-x-1">
                  <div className={cn("w-2 h-2 rounded-full animate-pulse", isClean ? 'bg-amber-500' : 'bg-indigo-400')}></div>
                  <div className={cn("w-2 h-2 rounded-full animate-pulse animation-delay-200", isClean ? 'bg-amber-300' : 'bg-purple-400')}></div>
                  <div className={cn("w-2 h-2 rounded-full animate-pulse animation-delay-400", isClean ? 'bg-amber-200' : 'bg-pink-400')}></div>
                </div>
                <span>Campanhas Meta Ads</span>
              </CardTitle>
              <CardDescription className={cn("mt-1", isClean ? 'text-gray-500' : 'text-slate-400')}>
                {periodoTexto} • {campanhas.length} campanha{campanhas.length !== 1 ? 's' : ''}
              </CardDescription>
            </div>
            <div className="text-right">
              <div className={cn("text-xs", isClean ? 'text-gray-500' : 'text-slate-400')}>Total investido</div>
              <div className={cn("text-lg font-bold font-mono", isClean ? 'text-emerald-600' : 'text-emerald-400')}>{formatCurrency(totais.investido)}</div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className={cn("hover:bg-transparent", isClean ? 'border-gray-200' : 'border-slate-700/50')}>
                  <TableHead className={cn("font-semibold text-xs", isClean ? 'text-gray-600' : 'text-slate-300')}>Campanha</TableHead>
                  <TableHead className={cn("font-semibold text-xs", isClean ? 'text-gray-600' : 'text-slate-300')}>Plataforma</TableHead>
                  <TableHead className={cn("font-semibold text-right text-xs", isClean ? 'text-gray-600' : 'text-slate-300')}>Investido</TableHead>
                  <TableHead className={cn("font-semibold text-right text-xs", isClean ? 'text-gray-600' : 'text-slate-300')}>Impressões</TableHead>
                  <TableHead className={cn("font-semibold text-right text-xs", isClean ? 'text-gray-600' : 'text-slate-300')}>Cliques</TableHead>
                  <TableHead className={cn("font-semibold text-right text-xs", isClean ? 'text-gray-600' : 'text-slate-300')}>Leads</TableHead>
                  <TableHead className={cn("font-semibold text-right text-xs", isClean ? 'text-gray-600' : 'text-slate-300')}>CTR</TableHead>
                  <TableHead className={cn("font-semibold text-right text-xs", isClean ? 'text-gray-600' : 'text-slate-300')}>Conversão</TableHead>
                  <TableHead className={cn("font-semibold text-center text-xs", isClean ? 'text-gray-600' : 'text-slate-300')}>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campanhas.map((campanha) => (
                  <TableRow 
                    key={campanha.id} 
                    className={cn(
                      "transition-all duration-300 group/row",
                      isClean
                        ? cn("border-gray-100 hover:bg-gray-50", campanha.ativo ? '' : 'opacity-60')
                        : cn("border-slate-700/30 hover:bg-slate-800/40", campanha.ativo ? "bg-slate-900/20" : "bg-slate-800/20 opacity-60")
                    )}
                  >
                    <TableCell className="max-w-[280px]">
                      <div className="flex items-center space-x-2">
                        <div className={cn(
                          "w-2 h-2 rounded-full flex-shrink-0",
                          campanha.ativo ? "bg-green-400 animate-pulse" : "bg-gray-500"
                        )} />
                        <div className="min-w-0">
                          <div className={cn(
                            "font-medium text-xs truncate transition-colors",
                            isClean ? 'text-gray-900 group-hover/row:text-amber-700' : 'text-white group-hover/row:text-blue-300'
                          )}>
                            {campanha.nome}
                          </div>
                          <div className={cn("text-[10px]", isClean ? 'text-gray-400' : 'text-slate-500')}>
                            {formatarObjetivo(campanha.objetivo || campanha.tipo)}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-[10px] px-1.5 py-0",
                          isClean ? 'border-gray-200 text-gray-600 bg-gray-50' : 'border-slate-700 text-slate-300 bg-slate-800/50'
                        )}
                      >
                        <span className="mr-1">{getPlataformaIcon(campanha.plataforma)}</span>
                        {campanha.plataforma}
                      </Badge>
                    </TableCell>
                    
                    <TableCell className="text-right">
                      <div className={cn("font-mono font-semibold text-xs", isClean ? 'text-emerald-600' : 'text-emerald-400')}>
                        {formatCurrency(campanha.investido)}
                      </div>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className={cn("font-mono text-xs", isClean ? 'text-gray-700' : 'text-slate-300')}>
                        {formatNumber(campanha.impressoes)}
                      </div>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className={cn("font-mono text-xs", isClean ? 'text-blue-600' : 'text-blue-400')}>
                        {formatNumber(campanha.cliques)}
                      </div>
                    </TableCell>
                    
                    <TableCell className="text-right">
                      <div className={cn("font-mono font-semibold text-xs", isClean ? 'text-cyan-600' : 'text-cyan-400')}>
                        {campanha.leads > 0 ? formatNumber(campanha.leads) : '—'}
                      </div>
                    </TableCell>
                    
                    <TableCell className="text-right">
                      <div className={cn("font-mono text-xs", isClean ? 'text-amber-600' : 'text-amber-400')}>
                        {formatPercentage(campanha.ctr)}
                      </div>
                    </TableCell>
                    
                    <TableCell className="text-right">
                      {campanha.conversao > 0 ? (
                        <div className={cn(
                          "inline-flex px-1.5 py-0.5 rounded font-mono font-semibold text-[10px] bg-gradient-to-r text-white",
                          getPerformanceColor(campanha.conversao)
                        )}>
                          {formatPercentage(campanha.conversao)}
                        </div>
                      ) : (
                        <div className={cn("font-mono text-xs", isClean ? 'text-gray-400' : 'text-slate-500')}>—</div>
                      )}
                    </TableCell>
                    
                    <TableCell className="text-center">
                      <Badge 
                        variant={campanha.ativo ? 'default' : 'secondary'}
                        className={cn(
                          "font-semibold text-[10px] px-1.5 py-0",
                          campanha.ativo 
                            ? isClean
                              ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                              : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : isClean
                              ? "bg-gray-100 text-gray-500 border border-gray-200"
                              : "bg-slate-700/50 text-slate-400 border border-slate-600/30"
                        )}
                      >
                        {campanha.ativo ? '🟢 Ativa' : '⏸️ Pausada'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              {/* Linha de totais */}
              <TableFooter>
                <TableRow className={cn(
                  "border-t-2",
                  isClean
                    ? 'border-gray-200 bg-gray-50 hover:bg-gray-50'
                    : 'border-slate-600/50 bg-slate-800/60 hover:bg-slate-800/60'
                )}>
                  <TableCell className={cn("font-bold text-xs", isClean ? 'text-gray-900' : 'text-white')}>
                    TOTAL ({campanhas.length} campanhas)
                  </TableCell>
                  <TableCell></TableCell>
                  <TableCell className="text-right">
                    <div className={cn("font-mono font-bold text-sm", isClean ? 'text-emerald-600' : 'text-emerald-300')}>
                      {formatCurrency(totais.investido)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className={cn("font-mono font-bold text-xs", isClean ? 'text-gray-700' : 'text-slate-200')}>
                      {formatNumber(totais.impressoes)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className={cn("font-mono font-bold text-xs", isClean ? 'text-blue-600' : 'text-blue-300')}>
                      {formatNumber(totais.cliques)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className={cn("font-mono font-bold text-xs", isClean ? 'text-cyan-600' : 'text-cyan-300')}>
                      {totais.leads > 0 ? formatNumber(totais.leads) : '—'}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className={cn("font-mono font-bold text-xs", isClean ? 'text-amber-600' : 'text-amber-300')}>
                      {formatPercentage(totalCtr)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className={cn("font-mono font-bold text-xs", isClean ? 'text-gray-900' : 'text-white')}>
                      {totalConversao > 0 ? formatPercentage(totalConversao) : '—'}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={cn("text-[10px]", isClean ? 'text-gray-500' : 'text-slate-400')}>
                      {campanhas.filter(c => c.ativo).length} ativas
                    </span>
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}