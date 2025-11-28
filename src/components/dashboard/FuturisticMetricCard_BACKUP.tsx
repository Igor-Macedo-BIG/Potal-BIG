'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface FuturisticMetricCardProps {
  title: string
  value: string | number
  description?: string
  trend?: 'up' | 'down' | 'stable'
  icon?: React.ReactNode
  percentage?: number
  gradient?: string
}

export function FuturisticMetricCard({ 
  title, 
  value, 
  description, 
  trend, 
  icon, 
  percentage = 0,
  gradient = 'from-blue-500/20 to-purple-500/20'
}: FuturisticMetricCardProps) {
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
        return '↗'
      case 'down':
        return '↘'
      case 'stable':
        return '→'
      default:
        return '●'
    }
  }

  return (
    <div className="group relative">
      {/* Glow effect */}
      <div className={cn(
        "absolute -inset-0.5 bg-gradient-to-r opacity-30 blur-sm transition-all duration-500 rounded-2xl",
        getTrendColor(),
        "group-hover:opacity-60 group-hover:blur-md"
      )} />
      
      <Card className={cn(
        "relative border-0 bg-gradient-to-br backdrop-blur-xl transition-all duration-500",
        "hover:scale-[1.02] hover:shadow-2xl shadow-lg",
        gradient,
        "bg-slate-900/40 border border-slate-700/50"
      )}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-slate-200 tracking-wide uppercase">
              {title}
            </CardTitle>
            {icon && (
              <div className="p-2 rounded-lg bg-white/10 backdrop-blur text-slate-200">
                {icon}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Main Value */}
            <div className="text-3xl font-bold text-white tracking-tight">
              {value}
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-slate-700/50 rounded-full h-1.5 overflow-hidden">
              <div 
                className={cn(
                  "h-full bg-gradient-to-r transition-all duration-1000 ease-out",
                  getTrendColor()
                )}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
            
            {/* Trend and Description */}
            <div className="flex items-center justify-between">
              {trend && (
                <div className={cn(
                  "flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-semibold",
                  "bg-gradient-to-r text-white shadow-lg",
                  getTrendColor()
                )}>
                  <span className="text-sm">{getTrendIcon()}</span>
                  <span>{percentage.toFixed(1)}%</span>
                </div>
              )}
              
              {description && (
                <CardDescription className="text-slate-400 text-xs text-right">
                  {description}
                </CardDescription>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}