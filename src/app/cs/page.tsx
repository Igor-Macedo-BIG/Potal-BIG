'use client';

import { LayoutComFunis } from '@/components/layout/LayoutComFunis';
import { DashboardCs } from '@/components/dashboard/DashboardCs';
import { useTheme } from '@/contexts/ThemeContext';

export default function CsPage() {
  const { isClean } = useTheme();
  return (
    <LayoutComFunis>
      <div className={`min-h-screen ${isClean ? 'bg-gray-50' : 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950'}`}>
        <DashboardCs />
      </div>
    </LayoutComFunis>
  );
}
