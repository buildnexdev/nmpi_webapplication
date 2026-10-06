import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, tokenStore } from '../api/client';
import { isContentRole, isPortalAdminRole, isStaffRole, normalizeRoleCodes, pagesForUser } from './roles';

export interface SessionUser {
  id: number;
  email: string;
  country_code?: string;
  phone_number: string;
  roles: string[];
  role_names: string[];
  pages?: string[];
  member: { id: number; member_id: string; full_name: string; profile_image: string | null; role_name: string } | null;
}

interface AuthContextValue {
  user: SessionUser | null;
  loading: boolean;
  pages: string[];
  isContentAdmin: boolean;
  isSuperAdmin: boolean;
  isPortalAdmin: boolean;
  canAccess: (page: string) => boolean;
  login: (login: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export class NotStaffError extends Error {}

function hydrateUser(u: SessionUser): SessionUser {
  return { ...u, pages: pagesForUser(u.roles, u.pages) };
}

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
        const u: SessionUser = hydrateUser(res.data.data);
        if (isStaffRole(u.roles)) setUser(u);
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
    const { token, user: raw } = res.data.data as { token: string; user: SessionUser };
    const u = hydrateUser(raw);
    if (!isStaffRole(u.roles)) {
      throw new NotStaffError('This account does not have access to the admin portal.');
    }
    tokenStore.set(token);
    setUser(u);
  }, []);

  const pages = user?.pages || [];
  const canAccess = useCallback(
    (page: string) => {
      if (!user) return false;
      if (page === 'account') return true;
      return pages.includes(page);
    },
    [user, pages]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      pages,
      login,
      logout,
      canAccess,
      isContentAdmin: isContentRole(user?.roles),
      isSuperAdmin: normalizeRoleCodes(user?.roles).includes('SUPER_ADMIN'),
      isPortalAdmin: isPortalAdminRole(user?.roles),
    }),
    [user, loading, pages, login, logout, canAccess]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
