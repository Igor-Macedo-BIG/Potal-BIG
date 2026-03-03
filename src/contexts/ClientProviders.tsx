"use client";

import React from 'react';
import { EmpresaProvider } from './EmpresaContext';
import { CampanhaProvider } from './CampanhaContext';
import { ThemeProvider } from './ThemeContext';
import { ClienteProvider } from './ClienteContext';

interface Props {
  children: React.ReactNode;
}

export default function ClientProviders({ children }: Props) {
  return (
    <ThemeProvider>
      <EmpresaProvider>
        <ClienteProvider>
          <CampanhaProvider>{children}</CampanhaProvider>
        </ClienteProvider>
      </EmpresaProvider>
    </ThemeProvider>
  );
}
