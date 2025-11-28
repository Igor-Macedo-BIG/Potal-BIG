'use client';

import { DashboardCampanha } from './DashboardCampanha';

export default function DashboardSocialSeller() {
  return (
    <DashboardCampanha 
      defaultTitle="Dashboard Social Seller" 
      showEditButton={true}
      department="social-seller"
    />
  );
}
