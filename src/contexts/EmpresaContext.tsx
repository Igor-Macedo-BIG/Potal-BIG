'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface Empresa {
  id: string;
  nome: string;
  logo_url?: string;
  slug_relatorio?: string;
  created_at?: string;
}

interface EmpresaContextType {
  empresas: Empresa[];
  empresaSelecionada: Empresa | null;
  selecionarEmpresa: (empresa: Empresa | null) => void;
  carregarEmpresas: () => Promise<void>;
  criarEmpresa: (nome: string) => Promise<Empresa | null>;
  excluirEmpresa: (id: string) => Promise<boolean>;
  loading: boolean;
}

const EmpresaContext = createContext<EmpresaContextType | undefined>(undefined);

export function EmpresaProvider({ children }: { children: React.ReactNode }) {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [empresaSelecionada, setEmpresaSelecionada] = useState<Empresa | null>(null);
  const [loading, setLoading] = useState(true);

  const carregarEmpresas = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/empresas');
      if (!response.ok) throw new Error('Erro ao carregar empresas');
      const data = await response.json();
      setEmpresas(data.empresas || []);

      // Restaurar empresa selecionada do localStorage
      const savedId = localStorage.getItem('empresa-selecionada-id');
      if (savedId && data.empresas?.length > 0) {
        const found = data.empresas.find((e: Empresa) => e.id === savedId);
        if (found) {
          setEmpresaSelecionada(found);
        } else if (data.empresas.length > 0) {
          setEmpresaSelecionada(data.empresas[0]);
          localStorage.setItem('empresa-selecionada-id', data.empresas[0].id);
        }
      } else if (data.empresas?.length > 0 && !empresaSelecionada) {
        setEmpresaSelecionada(data.empresas[0]);
        localStorage.setItem('empresa-selecionada-id', data.empresas[0].id);
      }
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const selecionarEmpresa = useCallback((empresa: Empresa | null) => {
    setEmpresaSelecionada(empresa);
    if (empresa) {
      localStorage.setItem('empresa-selecionada-id', empresa.id);
    } else {
      localStorage.removeItem('empresa-selecionada-id');
    }
  }, []);

  const criarEmpresa = useCallback(async (nome: string): Promise<Empresa | null> => {
    try {
      const response = await fetch('/api/empresas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome }),
      });
      if (!response.ok) throw new Error('Erro ao criar empresa');
      const empresa = await response.json();
      await carregarEmpresas();
      return empresa;
    } catch (error) {
      console.error('Erro ao criar empresa:', error);
      return null;
    }
  }, [carregarEmpresas]);

  const excluirEmpresa = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/empresas?id=${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Erro ao excluir empresa');
      
      if (empresaSelecionada?.id === id) {
        setEmpresaSelecionada(null);
        localStorage.removeItem('empresa-selecionada-id');
      }
      await carregarEmpresas();
      return true;
    } catch (error) {
      console.error('Erro ao excluir empresa:', error);
      return false;
    }
  }, [carregarEmpresas, empresaSelecionada]);

  useEffect(() => {
    carregarEmpresas();
  }, [carregarEmpresas]);

  return (
    <EmpresaContext.Provider value={{
      empresas,
      empresaSelecionada,
      selecionarEmpresa,
      carregarEmpresas,
      criarEmpresa,
      excluirEmpresa,
      loading
    }}>
      {children}
    </EmpresaContext.Provider>
  );
}

export function useEmpresa() {
  const context = useContext(EmpresaContext);
  if (!context) {
    throw new Error('useEmpresa deve ser usado dentro de EmpresaProvider');
  }
  return context;
}
