"use client";

import React from 'react';
import { CampanhaProvider } from './CampanhaContext';
import { ThemeProvider } from './ThemeContext';

interface Props {
  children: React.ReactNode;
}

export default function ClientProviders({ children }: Props) {
  return (
    <ThemeProvider>
      <CampanhaProvider>{children}</CampanhaProvider>
    </ThemeProvider>
  );
}
