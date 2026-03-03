"use client";

import React from 'react';
import { EmpresaProvider } from './EmpresaContext';
import { CampanhaProvider } from './CampanhaContext';
import { ThemeProvider } from './ThemeContext';

interface Props {
  children: React.ReactNode;
}

export default function ClientProviders({ children }: Props) {
  return (
    <ThemeProvider>
      <EmpresaProvider>
        <CampanhaProvider>{children}</CampanhaProvider>
      </EmpresaProvider>
    </ThemeProvider>
  );
}
