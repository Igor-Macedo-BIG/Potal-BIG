'use client';

import { SidebarComFunis } from './SidebarComFunis';
import { CampanhaProvider } from '@/contexts/CampanhaContext';
import { UserProvider } from '@/contexts/UserContext';
import { Toaster } from 'sonner';

interface Props {
  children: React.ReactNode;
  empresa?: string;
}

export function LayoutComFunis({ children, empresa }: Props) {
  return (
    <UserProvider>
      <CampanhaProvider>
        <div className="flex h-screen bg-background">
          <SidebarComFunis empresaNome={empresa} />
          <div className="flex-1 overflow-auto">
            {children}
          </div>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                color: 'hsl(var(--card-foreground))',
              },
            }}
          />
        </div>
      </CampanhaProvider>
    </UserProvider>
  );
}