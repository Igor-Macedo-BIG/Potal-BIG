'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

interface Cliente {
  id: string;
  nome: string;
  slug?: string;
  logo_url?: string;
  email?: string;
  telefone?: string;
  empresa_id: string;
  metricas_visiveis?: {
    investimento?: boolean;
    faturamento?: boolean;
    roas?: boolean;
    leads?: boolean;
    vendas?: boolean;
    custo_por_lead?: boolean;
    alcance?: boolean;
    cliques?: boolean;
    impressoes?: boolean;
    visualizacoes?: boolean;
    checkouts?: boolean;
  };
}

interface ClienteContextType {
  clienteSelecionado: Cliente | null;
  clientes: Cliente[];
  selecionarCliente: (cliente: Cliente | null) => void;
  carregarClientes: () => Promise<void>;
  loading: boolean;
}

const ClienteContext = createContext<ClienteContextType | undefined>(undefined);

export function ClienteProvider({ children }: { children: ReactNode }) {
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);

  const carregarClientes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('nome');

      if (error) throw error;

      setClientes(data || []);

      // Auto-selecionar cliente do localStorage ou primeiro da lista
      if (data && data.length > 0) {
        const ultimoClienteId = localStorage.getItem('ultimo_cliente_id');
        const cliente = ultimoClienteId 
          ? data.find(c => c.id === ultimoClienteId) || data[0]
          : data[0];
        setClienteSelecionado(cliente);
      }
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const selecionarCliente = (cliente: Cliente | null) => {
    setClienteSelecionado(cliente);
    if (cliente) {
      localStorage.setItem('ultimo_cliente_id', cliente.id);
    } else {
      localStorage.removeItem('ultimo_cliente_id');
    }
  };

  useEffect(() => {
    carregarClientes();
  }, []);

  return (
    <ClienteContext.Provider
      value={{
        clienteSelecionado,
        clientes,
        selecionarCliente,
        carregarClientes,
        loading,
      }}
    >
      {children}
    </ClienteContext.Provider>
  );
}

export function useCliente() {
  const context = useContext(ClienteContext);
  if (context === undefined) {
    throw new Error('useCliente deve ser usado dentro de um ClienteProvider');
  }
  return context;
}
