import { DashboardTrafego } from '../../components/dashboard/DashboardTrafego';
import { LayoutComFunis } from '@/components/layout/LayoutComFunis';

export default function TrafegoPage() {
  const empresa = 'Lídia Cabral Consultoria';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black">
      <LayoutComFunis empresa={empresa}>
        <DashboardTrafego />
      </LayoutComFunis>
    </div>
  );
}