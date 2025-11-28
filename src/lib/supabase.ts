import { createClient } from '@supabase/supabase-js'

// Configurações do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      empresas: {
        Row: {
          id: string
          nome: string
          logo_url?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome: string
          logo_url?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          logo_url?: string
          created_at?: string
          updated_at?: string
        }
      }
      usuarios: {
        Row: {
          id: string
          nome: string
          email: string
          empresa_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome: string
          email: string
          empresa_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          email?: string
          empresa_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      campanhas: {
        Row: {
          id: string
          nome: string
          plataforma: string
          empresa_id: string
          ativa: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome: string
          plataforma: string
          empresa_id: string
          ativa?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          plataforma?: string
          empresa_id?: string
          ativa?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      metricas: {
        Row: {
          id: string
          campanha_id: string
          data: string
          investido: number
          cliques: number
          leads: number
          ctr: number
          conversao: number
          faturamento?: number
          created_at: string
        }
        Insert: {
          id?: string
          campanha_id: string
          data: string
          investido: number
          cliques: number
          leads: number
          ctr: number
          conversao: number
          faturamento?: number
          created_at?: string
        }
        Update: {
          id?: string
          campanha_id?: string
          data?: string
          investido?: number
          cliques?: number
          leads?: number
          ctr?: number
          conversao?: number
          faturamento?: number
          created_at?: string
        }
      }
      criativos: {
        Row: {
          id: string
          campanha_id: string
          titulo: string
          imagem_url: string
          desempenho: number
          ativo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          campanha_id: string
          titulo: string
          imagem_url: string
          desempenho?: number
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          campanha_id?: string
          titulo?: string
          imagem_url?: string
          desempenho?: number
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}