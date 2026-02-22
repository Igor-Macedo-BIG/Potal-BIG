'use client';

import { LayoutComFunis } from '@/components/layout/LayoutComFunis';
import DashboardSocialSeller from '@/components/dashboard/DashboardSocialSeller';
import { useTheme } from '@/contexts/ThemeContext';

export default function SocialSellerPage() {
  const { isClean } = useTheme();
  return (
    <LayoutComFunis>
      <div className={`min-h-screen ${isClean ? 'bg-gray-50' : 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950'}`}>
        <DashboardSocialSeller />
      </div>
    </LayoutComFunis>
  );
}
