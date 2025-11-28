'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface MetricCardProps {
  title: string
  value: string | number
  description?: string
  trend?: 'up' | 'down' | 'stable'
  icon?: React.ReactNode
}

export function MetricCard({ title, value, description, trend, icon }: MetricCardProps) {
  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'bg-green-100 text-green-800'
      case 'down':
        return 'bg-red-100 text-red-800'
      case 'stable':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-blue-100 text-blue-800'
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <CardDescription className="mt-1">
            {description}
          </CardDescription>
        )}
        {trend && (
          <Badge className={`mt-2 ${getTrendColor()}`}>
            {trend === 'up' && '↑'}
            {trend === 'down' && '↓'}
            {trend === 'stable' && '→'}
            {' '}
            {trend === 'up' ? 'Subindo' : trend === 'down' ? 'Descendo' : 'Estável'}
          </Badge>
        )}
      </CardContent>
    </Card>
  )
}