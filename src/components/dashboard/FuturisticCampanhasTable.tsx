'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'
import { useCliente } from '@/contexts/ClienteContext'

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
}

interface FuturisticCampanhasTableProps {
  dataInicio?: string
  dataFim?: string
}

export function FuturisticCampanhasTable({ dataInicio, dataFim }: FuturisticCampanhasTableProps) {
  const { clienteSelecionado } = useCliente()
  const [campanhas, setCampanhas] = useState<CampanhaComMetricas[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    carregarCampanhas()
  }, [dataInicio, dataFim, clienteSelecionado])

  const carregarCampanhas = async () => {
    try {
      setLoading(true)

      // Buscar campanhas filtradas por cliente
      let query = supabase
        .from('campanhas')
        .select('*')
        .order('created_at', { ascending: false })

      // Filtrar por cliente se houver um selecionado
      if (clienteSelecionado) {
        query = query.eq('cliente_id', clienteSelecionado.id)
      }

      const { data: campanhasData, error: errorCampanhas } = await query
      if (errorCampanhas) {
        console.error('Erro ao carregar campanhas:', errorCampanhas)
        return
      }

      if (!campanhasData || campanhasData.length === 0) {
        setCampanhas([])
        return
      }

      // Buscar métricas para cada campanha
      const campanhasComMetricas = await Promise.all(
        campanhasData.map(async (campanha) => {
          let query = supabase
            .from('metricas')
            .select('*')
            .eq('tipo', 'campanha')
            .eq('referencia_id', campanha.id)

          if (dataInicio) {
            query = query.gte('periodo_inicio', dataInicio)
          }
          if (dataFim) {
            query = query.lte('periodo_inicio', dataFim)
          }

          const { data: metricas } = await query

          // Agregar métricas
          const totais = metricas?.reduce(
            (acc, m) => ({
              investido: acc.investido + (m.investimento || 0),
              leads: acc.leads + (m.leads || 0),
              impressoes: acc.impressoes + (m.impressoes || 0),
              cliques: acc.cliques + (m.cliques || 0),
            }),
            { investido: 0, leads: 0, impressoes: 0, cliques: 0 }
          ) || { investido: 0, leads: 0, impressoes: 0, cliques: 0 }

          const ctr = totais.impressoes > 0 ? (totais.cliques / totais.impressoes) * 100 : 0
          const conversao = totais.cliques > 0 ? (totais.leads / totais.cliques) * 100 : 0

          return {
            ...campanha,
            investido: totais.investido,
            leads: totais.leads,
            ctr,
            conversao,
          }
        })
      )

      setCampanhas(campanhasComMetricas)
    } catch (error) {
      console.error('Erro ao carregar campanhas:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleCampanha = async (id: string, novoStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('campanhas')
        .update({ ativo: novoStatus })
        .eq('id', id)

      if (error) {
        console.error('Erro ao atualizar campanha:', error)
        return
      }

      // Atualizar estado local
      setCampanhas((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ativo: novoStatus } : c))
      )
    } catch (error) {
      console.error('Erro ao atualizar campanha:', error)
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

  const getPerformanceColor = (conversao: number) => {
    if (conversao >= 15) return 'from-emerald-500 to-green-400'
    if (conversao >= 10) return 'from-amber-500 to-orange-400'
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

  if (loading) {
    return (
      <div className="group relative">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-20 blur-sm rounded-2xl" />
        <Card className="relative border-0 bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl border border-slate-700/50">
          <CardContent className="p-12">
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
              <span className="ml-3 text-slate-400">Carregando campanhas...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (campanhas.length === 0) {
    return (
      <div className="group relative">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-20 blur-sm rounded-2xl" />
        <Card className="relative border-0 bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl border border-slate-700/50">
          <CardHeader className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border-b border-slate-700/50">
            <CardTitle className="text-white font-bold flex items-center space-x-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse animation-delay-200"></div>
                <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse animation-delay-400"></div>
              </div>
              <span>Campanhas Ativas</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-12">
            <div className="text-center text-slate-400">
              <p>Nenhuma campanha cadastrada</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="group relative">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-20 blur-sm transition-all duration-500 rounded-2xl group-hover:opacity-30 group-hover:blur-md" />
      
      <Card className="relative border-0 bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl border border-slate-700/50 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border-b border-slate-700/50">
          <CardTitle className="text-white font-bold flex items-center space-x-2">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse animation-delay-200"></div>
              <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse animation-delay-400"></div>
            </div>
            <span>Campanhas Ativas</span>
          </CardTitle>
          <CardDescription className="text-slate-400">
            Monitoramento em tempo real • Performance por campanha
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700/50 hover:bg-slate-800/30">
                  <TableHead className="text-slate-300 font-semibold">Campanha</TableHead>
                  <TableHead className="text-slate-300 font-semibold">Plataforma</TableHead>
                  <TableHead className="text-slate-300 font-semibold text-right">Investido</TableHead>
                  <TableHead className="text-slate-300 font-semibold text-right">Leads</TableHead>
                  <TableHead className="text-slate-300 font-semibold text-right">CTR</TableHead>
                  <TableHead className="text-slate-300 font-semibold text-right">Conversão</TableHead>
                  <TableHead className="text-slate-300 font-semibold text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campanhas.map((campanha, index) => (
                  <TableRow 
                    key={campanha.id} 
                    className={cn(
                      "border-slate-700/30 hover:bg-slate-800/40 transition-all duration-300 group/row",
                      campanha.ativo ? "bg-slate-900/20" : "bg-slate-800/20 opacity-75"
                    )}
                  >
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className={cn(
                          "w-3 h-3 rounded-full",
                          campanha.ativo ? "bg-green-400 animate-pulse" : "bg-gray-500"
                        )} />
                        <div>
                          <div className="font-semibold text-white group-hover/row:text-blue-300 transition-colors">
                            {campanha.nome}
                          </div>
                          <div className="text-xs text-slate-400">
                            {campanha.objetivo || campanha.tipo}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "border-slate-600 text-slate-200 bg-slate-800/50 backdrop-blur",
                          "hover:bg-slate-700/50 transition-all duration-300"
                        )}
                      >
                        <span className="mr-1">{getPlataformaIcon(campanha.plataforma)}</span>
                        {campanha.plataforma}
                      </Badge>
                    </TableCell>
                    
                    <TableCell className="text-right">
                      <div className="font-mono text-emerald-400 font-semibold">
                        {formatCurrency(campanha.investido)}
                      </div>
                    </TableCell>
                    
                    <TableCell className="text-right">
                      <div className="font-mono text-cyan-400 font-semibold">
                        {campanha.leads.toLocaleString()}
                      </div>
                    </TableCell>
                    
                    <TableCell className="text-right">
                      <div className="font-mono text-amber-400 font-semibold">
                        {formatPercentage(campanha.ctr)}
                      </div>
                    </TableCell>
                    
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <div className={cn(
                          "px-2 py-1 rounded-lg font-mono font-semibold text-xs bg-gradient-to-r text-white",
                          getPerformanceColor(campanha.conversao)
                        )}>
                          {formatPercentage(campanha.conversao)}
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <Switch
                          checked={campanha.ativo}
                          onCheckedChange={(checked) => toggleCampanha(campanha.id, checked)}
                          className="data-[state=checked]:bg-emerald-500"
                        />
                        <Badge 
                          variant={campanha.ativo ? 'default' : 'secondary'}
                          className={cn(
                            "font-semibold text-xs",
                            campanha.ativo 
                              ? "bg-gradient-to-r from-emerald-500 to-green-400 text-white shadow-lg shadow-green-500/20" 
                              : "bg-slate-600 text-slate-300"
                          )}
                        >
                          {campanha.ativo ? '🟢 Ativa' : '⏸️ Pausada'}
                        </Badge>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}