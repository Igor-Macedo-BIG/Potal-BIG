'use client';

import { ReactNode } from 'react';

interface DashboardShellProps {
  title: string | ReactNode;
  subtitle?: string | ReactNode;
  icon?: ReactNode;
  children: ReactNode;
}

export default function DashboardShell({ title, subtitle, icon, children }: DashboardShellProps) {
  return (
    <div className="space-y-8 p-2">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10 blur-3xl" />
        <div className="relative bg-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="flex space-x-1">
                <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse"></div>
                <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse animation-delay-200"></div>
                <div className="w-3 h-3 bg-pink-400 rounded-full animate-pulse animation-delay-400"></div>
              </div>

              <div>
                <h1 className="text-4xl font-bold text-white bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent flex items-center gap-3">
                  {icon}
                  {title}
                </h1>
                {subtitle && <p className="text-slate-300 text-lg mt-2">{subtitle}</p>}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
        {children}
      </div>
    </div>
  );
}
