'use client';

import { LayoutComFunis } from '@/components/layout/LayoutComFunis';
import { DashboardCs } from '@/components/dashboard/DashboardCs';

export default function CsPage() {
  return (
    <LayoutComFunis>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <DashboardCs />
      </div>
    </LayoutComFunis>
  );
}
