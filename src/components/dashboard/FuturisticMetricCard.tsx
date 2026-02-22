'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus, Star } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'

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
  const { isClean } = useTheme();
  
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
        return isClean ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
      case 'down':
        return isClean ? 'bg-red-50 text-red-600 border-red-200' : 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'stable':
        return isClean ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
      default:
        return isClean ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    }
  }

  return (
    <div className={cn("relative group metric-card", shouldBeKPI && 'kpi-card')}>
      {/* Badge KPI */}
      {shouldBeKPI && (
        <div className="absolute -top-2 -right-2 z-20">
          <div className={cn(
            "kpi-badge text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1 animate-pulse",
            isClean
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white'
              : 'bg-gradient-to-r from-yellow-400 to-amber-500 text-black'
          )}>
            <Star className="h-3 w-3" />
            KPI
          </div>
        </div>
      )}

      <Card className={cn(
        'relative overflow-hidden border-2 transition-all duration-500',
        isClean
          ? cn(
              'hover:scale-105 hover:shadow-lg hover:shadow-amber-100/50',
              shouldBeKPI 
                ? 'border-amber-200/60 bg-white shadow-md ring-1 ring-amber-100 min-h-[130px]' 
                : 'border-gray-200/60 bg-white shadow-sm min-h-[110px]'
            )
          : cn(
              'backdrop-blur-sm hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/25',
              shouldBeKPI 
                ? 'border-yellow-400/40 bg-gradient-to-br from-yellow-500/10 via-orange-500/10 to-red-500/10 min-h-[130px] ring-2 ring-yellow-400/20' 
                : 'border-slate-700/50 bg-gradient-to-br from-slate-800/50 to-slate-900/50 min-h-[110px]'
            )
      )}>
        {/* Background gradient */}
        {!isClean && (
          <div className={cn(
            'absolute inset-0 bg-gradient-to-br opacity-30',
            gradient
          )} />
        )}
        
        {/* Barra de progresso animada no bottom (apenas para KPIs) */}
        {shouldBeKPI && (
          <div className={cn(
            "absolute bottom-0 left-0 right-0 h-1 overflow-hidden",
            isClean ? 'bg-amber-100' : 'bg-slate-700/30'
          )}>
            <div className={cn(
              "h-full animate-pulse",
              isClean
                ? 'bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500'
                : 'bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400'
            )}></div>
          </div>
        )}

        <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center space-x-2">
            {icon && (
              <div className={cn(
                'flex items-center justify-center rounded-xl p-1.5 transition-colors',
                isClean
                  ? (shouldBeKPI ? 'bg-amber-50 text-amber-600' : 'bg-gray-100 text-gray-500')
                  : (shouldBeKPI ? 'bg-yellow-500/20 text-yellow-400' : 'bg-blue-500/20 text-blue-400')
              )}>
                {icon}
              </div>
            )}
            <CardTitle className={cn(
              'card-title text-xs font-medium uppercase tracking-wider',
              isClean
                ? (shouldBeKPI ? 'text-amber-800' : 'text-gray-600')
                : (shouldBeKPI ? 'text-yellow-200' : 'text-slate-300')
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
            'card-value font-black tracking-tight leading-none mb-2 drop-shadow-lg',
            isClean
              ? (shouldBeKPI ? 'text-4xl text-gray-900' : 'text-2xl text-gray-900')
              : (shouldBeKPI ? 'text-4xl text-white' : 'text-2xl text-slate-100')
          )}>
            {value === 0 || value === '0' || value === 'Não informado' ? (
              <span className={isClean ? 'text-gray-300' : 'text-slate-500'}>-</span>
            ) : (
              value
            )}
          </div>

          {description && (
            <CardDescription className={cn(
              'card-description text-xs',
              isClean
                ? (shouldBeKPI ? 'text-amber-600/80' : 'text-gray-500')
                : (shouldBeKPI ? 'text-yellow-200/80' : 'text-slate-400')
            )}>
              {description}
            </CardDescription>
          )}

          {/* Progress bar visual */}
          {percentage > 0 && (
            <div className="mt-2">
              <div className="flex justify-between items-center mb-1">
                <span className={cn("progress-label text-xs", isClean ? 'text-gray-500' : 'text-slate-400')}>Performance</span>
                <span className={cn("text-xs", isClean ? 'text-gray-600' : 'text-slate-300')}>{percentage.toFixed(0)}%</span>
              </div>
              <div className={cn("progress-track w-full rounded-full h-2 overflow-hidden", isClean ? 'bg-gray-100' : 'bg-slate-700/50')}>
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
        {shouldBeKPI && !isClean && (
          <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300 bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 pointer-events-none" />
        )}
      </Card>
    </div>
  )
}
