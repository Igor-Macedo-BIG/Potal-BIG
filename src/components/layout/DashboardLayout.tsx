'use client'

import { Sidebar } from './Sidebar'

interface DashboardLayoutProps {
  children: React.ReactNode
  empresaNome?: string
}

export function DashboardLayout({ children, empresaNome }: DashboardLayoutProps) {
  return (
    <div className="h-screen flex bg-transparent">
      <Sidebar empresaNome={empresaNome} />
      <main className="flex-1 overflow-y-auto bg-transparent">
        {children}
      </main>
    </div>
  )
}