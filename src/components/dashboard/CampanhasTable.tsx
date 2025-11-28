'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

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

interface CampanhasTableProps {
  campanhas: Campanha[]
}

export function CampanhasTable({ campanhas }: CampanhasTableProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Campanhas Ativas</CardTitle>
        <CardDescription>
          Acompanhe o desempenho das suas campanhas em tempo real
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Campanha</TableHead>
              <TableHead>Plataforma</TableHead>
              <TableHead>Investido</TableHead>
              <TableHead>Leads</TableHead>
              <TableHead>CTR</TableHead>
              <TableHead>Conversão</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campanhas.map((campanha) => (
              <TableRow key={campanha.id}>
                <TableCell className="font-medium">{campanha.nome}</TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {campanha.plataforma}
                  </Badge>
                </TableCell>
                <TableCell>{formatCurrency(campanha.investido)}</TableCell>
                <TableCell>{campanha.leads}</TableCell>
                <TableCell>{formatPercentage(campanha.ctr)}</TableCell>
                <TableCell>{formatPercentage(campanha.conversao)}</TableCell>
                <TableCell>
                  <Badge variant={campanha.ativa ? 'default' : 'secondary'}>
                    {campanha.ativa ? 'Ativa' : 'Pausada'}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}