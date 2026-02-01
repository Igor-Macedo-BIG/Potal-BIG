"use client";

import React from 'react';
import { CampanhaProvider } from './CampanhaContext';
import { ThemeProvider } from './ThemeContext';
import { ClienteProvider } from './ClienteContext';
import { Toaster } from '@/components/ui/toaster';

interface Props {
  children: React.ReactNode;
}

export default function ClientProviders({ children }: Props) {
  return (
    <ThemeProvider>
      <ClienteProvider>
        <CampanhaProvider>
          {children}
          <Toaster />
        </CampanhaProvider>
      </ClienteProvider>
    </ThemeProvider>
  );
}
