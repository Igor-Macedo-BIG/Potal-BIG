'use client'

import React from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, Minus, ArrowUpRight, ArrowDownRight } from 'lucide-react'

interface MetricCardProps {
  title: string
  value: string | number
  description?: string
  trend?: 'up' | 'down' | 'stable'
  trendValue?: number
  icon?: React.ReactNode
  type?: 'default' | 'primary' | 'success' | 'warning' | 'danger'
  isKPI?: boolean
}

export function MetricCard({ 
  title, 
  value, 
  description, 
  trend, 
  trendValue,
  icon, 
  type = 'default',
  isKPI = false 
}: MetricCardProps) {

  // Configurações de cores por tipo
  const typeConfig = {
    default: {
      gradient: 'from-gray-600/20 to-slate-800/20',
      border: 'border-gray-500/40',
      iconBg: 'bg-gray-500/20',
      iconColor: 'text-gray-400',
      valueColor: 'text-white'
    },
    primary: {
      gradient: 'from-blue-600/20 to-blue-800/20',
      border: 'border-blue-500/40',
      iconBg: 'bg-blue-500/20',
      iconColor: 'text-blue-400',
      valueColor: 'text-white'
    },
    success: {
      gradient: 'from-emerald-600/20 to-green-800/20',
      border: 'border-emerald-500/40',
      iconBg: 'bg-emerald-500/20',
      iconColor: 'text-emerald-400',
      valueColor: 'text-white'
    },
    warning: {
      gradient: 'from-yellow-600/20 to-amber-800/20',
      border: 'border-yellow-500/40',
      iconBg: 'bg-yellow-500/20',
      iconColor: 'text-yellow-400',
      valueColor: 'text-white'
    },
    danger: {
      gradient: 'from-red-600/20 to-rose-800/20',
      border: 'border-red-500/40',
      iconBg: 'bg-red-500/20',
      iconColor: 'text-red-400',
      valueColor: 'text-white'
    }
  }

  const config = typeConfig[type]

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <ArrowUpRight className="h-4 w-4 text-emerald-400" />
      case 'down':
        return <ArrowDownRight className="h-4 w-4 text-red-400" />
      case 'stable':
        return <Minus className="h-4 w-4 text-gray-400" />
      default:
        return null
    }
  }

  const getTrendBadgeColor = () => {
    switch (trend) {
      case 'up':
        return 'bg-emerald-500/20 text-emerald-400'
      case 'down':
        return 'bg-red-500/20 text-red-400'
      case 'stable':
        return 'bg-gray-500/20 text-gray-400'
      default:
        return 'bg-blue-500/20 text-blue-400'
    }
  }

  const formatTrendValue = () => {
    if (!trendValue) return ''
    const prefix = trendValue > 0 ? '+' : ''
    return `${prefix}${trendValue.toFixed(1)}%`
  }

  return (
    <div className="relative">
      <Card className={`
        relative border-2 transition-all duration-300 hover:scale-[1.02] backdrop-blur-sm
        bg-gradient-to-br ${config.gradient} ${config.border} shadow-xl hover:shadow-2xl
        ${isKPI ? 'ring-2 ring-yellow-400/30 min-h-[140px]' : 'min-h-[120px]'}
      `}>
        
        {/* Badge KPI */}
        {isKPI && (
          <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-amber-500 text-black text-xs font-bold px-3 py-1 rounded-full shadow-lg z-10">
            KPI 
          </div>
        )}

        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
          <div className="flex items-center gap-3">
            {icon && (
              <div className={`p-2 rounded-lg ${config.iconBg}`}>
                <div className={config.iconColor}>
                  {icon}
                </div>
              </div>
            )}
            <div>
              <h3 className={`text-sm font-medium uppercase tracking-wider ${config.iconColor}`}>
                {title}
              </h3>
            </div>
          </div>

          {/* Trend Badge */}
          {trend && (
            <Badge className={`${getTrendBadgeColor()} border-0 flex items-center gap-1`}>
              {getTrendIcon()}
              {trendValue && formatTrendValue()}
            </Badge>
          )}
        </CardHeader>

        <CardContent className="pb-6">
          {/* Valor Principal - DESTAQUE MÁXIMO */}
          <div className={`
            ${config.valueColor} font-black tracking-tight leading-none mb-2
            ${isKPI ? 'text-4xl' : 'text-3xl'}
            ${isKPI ? 'drop-shadow-lg' : ''}
          `}>
            {value === 0 || value === '0' ? '-' : value}
          </div>

          {/* Descrição */}
          {description && (
            <p className="text-xs text-gray-400 mt-2">
              {description}
            </p>
          )}
        </CardContent>

        {/* Barra de progresso animada no bottom (apenas para KPIs) */}
        {isKPI && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700/30 rounded-b-lg overflow-hidden">
            <div className="h-full bg-gradient-to-r from-yellow-400 to-amber-500 rounded-b-lg animate-pulse"></div>
          </div>
        )}
      </Card>
    </div>
  )
}
