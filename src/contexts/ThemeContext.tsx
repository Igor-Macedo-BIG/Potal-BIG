'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'dark' | 'clean';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isClean: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('clean');
  const [mounted, setMounted] = useState(false);

  // Aplicar tema imediatamente no carregamento
  useEffect(() => {
    setMounted(true);
    let savedTheme = localStorage.getItem('painel-theme') as Theme | null;
    // Migrar tema antigo 'sistema' para 'clean'
    if (!savedTheme || savedTheme === 'sistema' as string) {
      savedTheme = 'clean';
      localStorage.setItem('painel-theme', 'clean');
    }
    setThemeState(savedTheme);
    applyTheme(savedTheme);
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('painel-theme', newTheme);
    applyTheme(newTheme);
  };

  const applyTheme = (selectedTheme: Theme) => {
    if (typeof window === 'undefined') return;
    
    const root = document.documentElement;
    
    // Remover todas as classes de tema
    root.classList.remove('theme-sistema', 'theme-dark', 'theme-clean');
    
    // Adicionar a classe do tema selecionado
    root.classList.add(`theme-${selectedTheme}`);
  };

  // Evitar flash de tema incorreto
  if (!mounted) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isClean: theme === 'clean' }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
