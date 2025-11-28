'use client';

import { LayoutComFunis } from '@/components/layout/LayoutComFunis';
import DashboardSocialSeller from '@/components/dashboard/DashboardSocialSeller';

export default function SocialSellerPage() {
  return (
    <LayoutComFunis>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <DashboardSocialSeller />
      </div>
    </LayoutComFunis>
  );
}
