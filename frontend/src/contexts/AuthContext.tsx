'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { authApi } from '@/lib/api';

interface AuthUser {
  id: number;
  email: string;
  fullName: string;
  role: 'ADMIN' | 'SALES_REP' | 'DISTRIBUTOR';
  organizationId: number;
  organizationName: string;
  organizationSlug: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await authApi.me();
      setUser({
        id: data.id,
        email: data.email,
        fullName: data.fullName || `${data.firstName} ${data.lastName}`,
        role: data.role,
        organizationId: data.organizationId,
        organizationName: data.organizationName || '',
        organizationSlug: data.organizationSlug || '',
      });
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = async (email: string, password: string) => {
    const data = await authApi.login(email, password);
    setUser({
      id: data.id,
      email: data.email,
      fullName: data.fullName,
      role: data.role as AuthUser['role'],
      organizationId: data.organizationId,
      organizationName: data.organizationName,
      organizationSlug: data.organizationSlug,
    });
  };

  const register = async (data: any) => {
    const res = await authApi.register(data);
    setUser({
      id: res.id,
      email: res.email,
      fullName: res.fullName,
      role: res.role as AuthUser['role'],
      organizationId: res.organizationId,
      organizationName: res.organizationName,
      organizationSlug: res.organizationSlug,
    });
  };

  const logout = async () => {
    try { await authApi.logout(); } catch {}
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
