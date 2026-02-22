 'use client';

import { DashboardCampanha } from './DashboardCampanha';

export function DashboardCloser() {
  // Reutiliza o DashboardCampanha para manter identidade visual e comportamento
  return <DashboardCampanha defaultTitle="Dashboard Closer" showEditButton={false} hideFinanceFields={false} department="closer" />;
}