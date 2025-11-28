'use client';

import { DashboardCampanha } from './DashboardCampanha';

export function DashboardTrafego() {
  // Renderiza o Dashboard principal, mas sobrescreve o título padrão apenas para a aba Tráfego
  // Habilita o botão/modal de edição de métricas nesta rota
  return <DashboardCampanha defaultTitle="Dashboard Tráfego" showEditButton={true} hideFinanceFields={true} department="trafego" />;
}