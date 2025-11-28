'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts'
import { cn } from '@/lib/utils'

interface ChartData {
  data: string
  investimento: number
  leads: number
  vendas: number
  cliques?: number
  alcance?: number
}

interface FuturisticChartsProps {
  data: ChartData[]
}

export function FuturisticCharts({ data }: FuturisticChartsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit'
    })
  }

  const formattedData = data.map(item => ({
    ...item,
    dataFormatada: formatDate(item.data)
  }))

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Investment & Leads Chart */}
      <div className="group relative">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 opacity-20 blur-sm transition-all duration-500 rounded-2xl group-hover:opacity-40 group-hover:blur-md" />
        <Card className="relative border-0 bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-xl border border-slate-700/50 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-b border-slate-700/50">
            <CardTitle className="text-white font-bold flex items-center space-x-2">
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
              <span>Performance em Tempo Real</span>
            </CardTitle>
            <CardDescription className="text-slate-400">
              Investimento vs Captação de Leads • Últimos 7 dias
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={formattedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <defs>
                  <linearGradient id="investimentoGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="leadsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis 
                  dataKey="dataFormatada" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '12px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                  }}
                  labelStyle={{ color: '#f1f5f9' }}
                  formatter={(value, name) => {
                    if (name === 'investimento') {
                      return [formatCurrency(value as number), 'Investimento']
                    }
                    return [value, 'Leads']
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="investimento" 
                  stroke="#06b6d4"
                  strokeWidth={3}
                  fill="url(#investimentoGradient)"
                  dot={{ fill: '#06b6d4', strokeWidth: 2, r: 4 }}
                />
                <Area 
                  type="monotone" 
                  dataKey="leads" 
                  stroke="#10b981"
                  strokeWidth={3}
                  fill="url(#leadsGradient)"
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Conversions Chart */}
      <div className="group relative">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-500 opacity-20 blur-sm transition-all duration-500 rounded-2xl group-hover:opacity-40 group-hover:blur-md" />
        <Card className="relative border-0 bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-xl border border-slate-700/50 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-b border-slate-700/50">
            <CardTitle className="text-white font-bold flex items-center space-x-2">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
              <span>Taxa de Conversão</span>
            </CardTitle>
            <CardDescription className="text-slate-400">
              Conversões por dia • Análise de performance
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={formattedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <defs>
                  <linearGradient id="vendasGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.9}/>
                    <stop offset="95%" stopColor="#ec4899" stopOpacity={0.6}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis 
                  dataKey="dataFormatada" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '12px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                  }}
                  labelStyle={{ color: '#f1f5f9' }}
                  formatter={(value) => [value, 'Vendas']}
                />
                <Bar 
                  dataKey="vendas" 
                  fill="url(#vendasGradient)"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}