import { DashboardCloser } from '../../components/dashboard/DashboardCloser';
import { LayoutComFunis } from '@/components/layout/LayoutComFunis';

export default function CloserPage() {
  const empresa = 'Lídia Cabral Consultoria';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black">
      <LayoutComFunis empresa={empresa}>
        <DashboardCloser />
      </LayoutComFunis>
    </div>
  );
}