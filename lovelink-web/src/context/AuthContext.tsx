import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface User {
  id_user: number;
  nome: string;
  email: string;
  perfil: string; // 'prefeita' | 'secretario'
  id_secretaria?: number | null;
}

interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isPrefeita: boolean;
  isSecretario: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const isAuthenticated = !!user;
  const isPrefeita = user?.perfil === 'prefeita';
  const isSecretario = user?.perfil === 'secretario';

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated, isPrefeita, isSecretario }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
