'use client';

import React, { createContext, useContext, useState } from 'react';

export type UserRole = 'admin' | 'trafego' | 'sdr' | 'closer' | 'cs';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
}

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  hasEditPermission: (section: UserRole) => boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>({
    id: '1',
    email: 'admin@lidiacabral.com',
    role: 'admin',
    name: 'Admin Lídia Cabral'
  });

  const hasEditPermission = (section: UserRole): boolean => {
    if (!user) return false;
    // Admin pode editar tudo, outros só sua própria seção
    return user.role === 'admin' || user.role === section;
  };

  return (
    <UserContext.Provider value={{ user, setUser, hasEditPermission }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}