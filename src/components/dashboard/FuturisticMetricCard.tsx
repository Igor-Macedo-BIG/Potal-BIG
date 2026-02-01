'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus, Star } from 'lucide-react'

interface FuturisticMetricCardProps {
  title: string
  value: string | number
  description?: string
  trend?: 'up' | 'down' | 'stable'
  icon?: React.ReactNode
  percentage?: number
  gradient?: string
  isKPI?: boolean
}

export function FuturisticMetricCard({
  title,
  value,
  description,
  trend,
  icon,
  percentage = 0,
  gradient = 'from-blue-500/20 to-purple-500/20',
  isKPI = false
}: FuturisticMetricCardProps) {
  
  // Determinar se é um KPI baseado no título
  const autoKPI = ['faturamento', 'roas', 'vendas', 'leads'].some(key => 
    title.toLowerCase().includes(key.toLowerCase())
  )
  const shouldBeKPI = isKPI || autoKPI

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'from-emerald-500 to-green-400'
      case 'down':
        return 'from-red-500 to-pink-400'
      case 'stable':
        return 'from-amber-500 to-orange-400'
      default:
        return 'from-blue-500 to-cyan-400'
    }
  }

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4" />
      case 'down':
        return <TrendingDown className="h-4 w-4" />
      case 'stable':
        return <Minus className="h-4 w-4" />
      default:
        return null
    }
  }

  const getTrendBadgeColor = () => {
    switch (trend) {
      case 'up':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
      case 'down':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'stable':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
      default:
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    }
  }

  return (
    <div className="relative group">
      {/* Badge KPI */}
      {shouldBeKPI && (
        <div className="absolute -top-2 -right-2 z-20">
          <div className="bg-gradient-to-r from-yellow-400 to-amber-500 text-black text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1 animate-pulse">
            <Star className="h-3 w-3" />
            KPI
          </div>
        </div>
      )}

      <Card className={cn(
        'relative overflow-hidden border-2 transition-all duration-500 backdrop-blur-sm',
        'hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/25',
        shouldBeKPI 
          ? 'border-yellow-400/40 bg-gradient-to-br from-yellow-500/10 via-orange-500/10 to-red-500/10 min-h-[160px] sm:min-h-[150px] ring-2 ring-yellow-400/20' 
          : 'border-slate-700/50 bg-gradient-to-br from-slate-800/50 to-slate-900/50 min-h-[140px] sm:min-h-[130px]'
      )}>
        {/* Background gradient */}
        <div className={cn(
          'absolute inset-0 bg-gradient-to-br opacity-30',
          gradient
        )} />
        
        {/* Barra de progresso animada no bottom (apenas para KPIs) */}
        {shouldBeKPI && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-700/30 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 animate-pulse"></div>
          </div>
        )}

        <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center space-x-2">
            {icon && (
              <div className={cn(
                'flex items-center justify-center rounded-xl p-1.5 transition-colors',
                shouldBeKPI 
                  ? 'bg-yellow-500/20 text-yellow-400' 
                  : 'bg-blue-500/20 text-blue-400'
              )}>
                {icon}
              </div>
            )}
            <CardTitle className={cn(
              'text-[11px] sm:text-xs font-medium uppercase tracking-wider',
              shouldBeKPI ? 'text-yellow-200' : 'text-slate-300'
            )}>
              {title}
            </CardTitle>
          </div>

          {trend && (
            <Badge className={cn(
              'border flex items-center gap-1',
              getTrendBadgeColor()
            )}>
              {getTrendIcon()}
              {trend === 'up' ? '+' : trend === 'down' ? '-' : '~'}
            </Badge>
          )}
        </CardHeader>

        <CardContent className="relative">
          {/* Valor Principal - DESTAQUE MÁXIMO */}
          <div className={cn(
            'font-black tracking-tight leading-none mb-2 drop-shadow-lg',
            shouldBeKPI
              ? 'text-4xl sm:text-4xl text-white'
              : 'text-2xl sm:text-3xl text-slate-100'
          )}>
            {value === 0 || value === '0' || value === 'Não informado' ? (
              <span className="text-slate-500">-</span>
            ) : (
              value
            )}
          </div>

          {description && (
            <CardDescription className={cn(
              'text-xs',
              shouldBeKPI ? 'text-yellow-200/80' : 'text-slate-400'
            )}>
              {description}
            </CardDescription>
          )}

          {/* Progress bar visual */}
          {percentage > 0 && (
            <div className="mt-2">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-slate-400">Performance</span>
                <span className="text-xs text-slate-300">{percentage.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-slate-700/50 rounded-full h-2 overflow-hidden">
                <div
                  className={cn(
                    'h-2 rounded-full transition-all duration-1000 bg-gradient-to-r',
                    getTrendColor()
                  )}
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
              </div>
            </div>
          )}
        </CardContent>

        {/* Efeito de brilho no hover para KPIs */}
        {shouldBeKPI && (
          <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300 bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 pointer-events-none" />
        )}
      </Card>
    </div>
  )
}
