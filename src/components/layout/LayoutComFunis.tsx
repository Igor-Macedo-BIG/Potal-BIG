'use client';

import { useState } from 'react';
import { SidebarComFunis } from './SidebarComFunis';
import { CampanhaProvider } from '@/contexts/CampanhaContext';
import { UserProvider } from '@/contexts/UserContext';
import { Toaster } from 'sonner';
import { Menu, X } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  empresa?: string;
}

export function LayoutComFunis({ children, empresa }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <UserProvider>
      <CampanhaProvider>
        <div className="flex h-screen bg-background relative">
          {/* Mobile overlay */}
          <div
            className={`sidebar-overlay ${sidebarOpen ? 'sidebar-open' : ''}`}
            onClick={() => setSidebarOpen(false)}
          />

          {/* Sidebar */}
          <SidebarComFunis
            empresaNome={empresa}
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />

          {/* Main content */}
          <div className="flex-1 overflow-auto flex flex-col min-w-0">
            {/* Mobile header */}
            <div className="mobile-menu-btn sticky top-0 z-30 items-center gap-3 px-4 py-3 bg-background/80 backdrop-blur-md border-b border-border">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
                aria-label="Abrir menu"
              >
                <Menu className="h-5 w-5" />
              </button>
              <span className="text-sm font-semibold truncate">{empresa || 'Portal Empresarial'}</span>
            </div>

            <div className="flex-1 overflow-auto">
              {children}
            </div>
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