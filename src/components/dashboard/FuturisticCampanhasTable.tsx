'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface Campanha {
  id: string
  nome: string
  plataforma: string
  investido: number
  leads: number
  ctr: number
  conversao: number
  ativa: boolean
}

interface FuturisticCampanhasTableProps {
  campanhas: Campanha[]
}

export function FuturisticCampanhasTable({ campanhas }: FuturisticCampanhasTableProps) {
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
    switch (plataforma.toLowerCase()) {
      case 'meta ads':
        return '📘'
      case 'google ads':
        return '🔍'
      case 'linkedin ads':
        return '💼'
      case 'tiktok ads':
        return '🎵'
      default:
        return '📊'
    }
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
                      campanha.ativa ? "bg-slate-900/20" : "bg-slate-800/20 opacity-75"
                    )}
                  >
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className={cn(
                          "w-3 h-3 rounded-full",
                          campanha.ativa ? "bg-green-400 animate-pulse" : "bg-gray-500"
                        )} />
                        <div>
                          <div className="font-semibold text-white group-hover/row:text-blue-300 transition-colors">
                            {campanha.nome}
                          </div>
                          <div className="text-xs text-slate-400">
                            ID: {campanha.id.slice(0, 8)}
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
                      <Badge 
                        variant={campanha.ativa ? 'default' : 'secondary'}
                        className={cn(
                          "font-semibold",
                          campanha.ativa 
                            ? "bg-gradient-to-r from-emerald-500 to-green-400 text-white shadow-lg shadow-green-500/20" 
                            : "bg-slate-600 text-slate-300"
                        )}
                      >
                        {campanha.ativa ? '🟢 Ativa' : '⏸️ Pausada'}
                      </Badge>
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