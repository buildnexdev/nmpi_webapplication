import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, tokenStore } from '../api/client';

export interface SessionUser {
  id: number;
  email: string;
  country_code?: string;
  phone_number: string;
  roles: string[];
  role_names: string[];
  member: { id: number; member_id: string; full_name: string; profile_image: string | null; role_name: string } | null;
}

const STAFF_ROLES = ['SUPER_ADMIN', 'ADMIN', 'DISTRICT_ADMIN', 'TALUK_ADMIN', 'UNIT_ADMIN'];
const CONTENT_ROLES = ['SUPER_ADMIN', 'ADMIN'];

interface AuthContextValue {
  user: SessionUser | null;
  loading: boolean;
  isContentAdmin: boolean;
  isSuperAdmin: boolean;
  login: (login: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export class NotStaffError extends Error {}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  useEffect(() => {
    if (!tokenStore.get()) {
      setLoading(false);
      return;
    }
    api
      .get('/auth/me')
      .then((res) => {
        const u: SessionUser = res.data.data;
        if (u.roles.some((r) => STAFF_ROLES.includes(r))) setUser(u);
        else tokenStore.clear();
      })
      .catch(() => tokenStore.clear())
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const onExpired = () => setUser(null);
    window.addEventListener('nmpi:session-expired', onExpired);
    return () => window.removeEventListener('nmpi:session-expired', onExpired);
  }, []);

  const login = useCallback(async (loginId: string, password: string) => {
    const res = await api.post('/auth/login', { login: loginId, password });
    const { token, user: u } = res.data.data as { token: string; user: SessionUser };
    if (!u.roles.some((r) => STAFF_ROLES.includes(r))) {
      throw new NotStaffError('This account does not have access to the admin portal.');
    }
    tokenStore.set(token);
    setUser(u);
  }, []);

  const roles = user?.roles || [];
  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isContentAdmin: roles.some((r) => CONTENT_ROLES.includes(r)),
        isSuperAdmin: roles.includes('SUPER_ADMIN'),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
