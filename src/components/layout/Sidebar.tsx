'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { 
  BarChart3,
  Megaphone,
  Image,
  FileText,
  Settings,
  LogOut,
  Home
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Campanhas', href: '/campanhas', icon: Megaphone },
  { name: 'Criativos', href: '/criativos', icon: Image },
  { name: 'Relatórios', href: '/relatorios', icon: FileText },
  { name: 'Configurações', href: '/configuracoes', icon: Settings },
]

interface SidebarProps {
  empresaNome?: string
}

export function Sidebar({ empresaNome }: SidebarProps) {
  const pathname = usePathname()

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <div className="flex h-full w-64 flex-col bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-r border-slate-700/50 backdrop-blur-xl">
      {/* Logo e nome da empresa */}
      <div className="relative flex h-16 items-center justify-center border-b border-slate-700/50 px-4 bg-gradient-to-r from-cyan-500/10 to-purple-500/10">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-purple-500/5 blur-xl" />
        <div className="relative flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl">
            <BarChart3 className="h-6 w-6 text-white" />
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-white bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Neural Traffic
            </p>
            {empresaNome && (
              <Badge className="text-xs bg-gradient-to-r from-slate-700 to-slate-600 text-cyan-300 border-slate-600">
                {empresaNome}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Navegação */}
      <nav className="flex-1 space-y-2 px-3 py-6">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link key={item.name} href={item.href}>
              <Button
                variant="ghost"
                className={cn(
                  'w-full justify-start text-left group relative overflow-hidden transition-all duration-300',
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-white border border-cyan-500/30 shadow-lg shadow-cyan-500/20'
                    : 'text-slate-300 hover:bg-gradient-to-r hover:from-slate-800/50 hover:to-slate-700/50 hover:text-white border border-transparent hover:border-slate-600/30'
                )}
              >
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 blur-sm" />
                )}
                <Icon className={cn(
                  "mr-3 h-4 w-4 relative z-10 transition-all duration-300",
                  isActive ? "text-cyan-400" : "group-hover:text-purple-400"
                )} />
                <span className="relative z-10 font-medium">{item.name}</span>
              </Button>
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="border-t border-slate-700/50 p-4 bg-gradient-to-r from-red-500/10 to-pink-500/10">
        <Button
          variant="ghost"
          className="w-full justify-start text-slate-300 hover:bg-gradient-to-r hover:from-red-500/20 hover:to-pink-500/20 hover:text-white border border-transparent hover:border-red-500/30 transition-all duration-300 group"
          onClick={handleLogout}
        >
          <LogOut className="mr-3 h-4 w-4 group-hover:text-red-400 transition-colors duration-300" />
          <span className="font-medium">Sair</span>
        </Button>
      </div>
    </div>
  )
}