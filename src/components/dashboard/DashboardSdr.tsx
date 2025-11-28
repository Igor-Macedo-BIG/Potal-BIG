 'use client';

import { DashboardCampanha } from './DashboardCampanha';

export function DashboardSdr() {
  // Reutiliza o DashboardCampanha como fonte única de verdade para consistência
  // Habilita o botão de edição e mantém os campos financeiros visíveis para SDR
  return <DashboardCampanha defaultTitle="Dashboard SDR" showEditButton={true} hideFinanceFields={false} department="sdr" />;
}