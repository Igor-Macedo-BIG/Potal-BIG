'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { LoginFormLidiaCabral } from '@/components/auth/LoginFormLidiaCabral'
import { LayoutComFunis } from '@/components/layout/LayoutComFunis'
import { DashboardCampanha } from '@/components/dashboard/DashboardCampanha'
import type { Session } from '@supabase/supabase-js'

export default function LidiaCabralPortal() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Carregando Portal Lídia Cabral...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return <LoginFormLidiaCabral />
  }

  return (
    <LayoutComFunis empresa="Lídia Cabral Consultoria">
      <DashboardCampanha />
    </LayoutComFunis>
  )
}