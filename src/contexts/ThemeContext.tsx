'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'sistema' | 'dark' | 'clean';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('sistema');
  const [mounted, setMounted] = useState(false);

  // Aplicar tema imediatamente no carregamento
  useEffect(() => {
    setMounted(true);
    const savedTheme = (localStorage.getItem('painel-theme') as Theme) || 'sistema';
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
    
    console.log('🎨 Tema aplicado:', selectedTheme, 'Classes:', root.className);
  };

  // Evitar flash de tema incorreto
  if (!mounted) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
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
