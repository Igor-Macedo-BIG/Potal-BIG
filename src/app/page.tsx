'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { LoginForm } from '@/components/auth/LoginForm'
import { RegisterForm } from '@/components/auth/RegisterForm'
import { LayoutComFunis } from '@/components/layout/LayoutComFunis'
import { DashboardCampanha } from '@/components/dashboard/DashboardCampanha'
import type { Session } from '@supabase/supabase-js'

export default function Home() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [empresa, setEmpresa] = useState<string>('')
  const [showRegister, setShowRegister] = useState(false)

  useEffect(() => {
    // Verificar se o usuário está logado
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setSession(session)
      } catch (error) {
        console.warn('Erro ao verificar sessão:', error)
        setSession(null)
      } finally {
        setLoading(false)
      }
    }

    checkSession()

    // Escutar mudanças na autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    // Buscar informações da empresa do usuário logado
    if (session?.user) {
      // Aqui você faria a busca da empresa no banco de dados
      // Por enquanto, vamos usar um valor de exemplo
      setEmpresa('Lídia Cabral Consultoria')
    }
  }, [session])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Carregando...</div>
      </div>
    )
  }

  if (!session) {
    if (showRegister) {
      return <RegisterForm onBackToLogin={() => setShowRegister(false)} />
    }
    return <LoginForm onSwitchToRegister={() => setShowRegister(true)} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black">
      <LayoutComFunis empresa={empresa}>
        <DashboardCampanha />
      </LayoutComFunis>
    </div>
  )
}
