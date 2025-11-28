'use client';

import { DashboardCampanha } from './DashboardCampanha';

export function DashboardCs() {
  return (
    <DashboardCampanha 
      defaultTitle="Dashboard CS (Customer Success)" 
      showEditButton={true}
      department="cs"
    />
  );
}
