import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { RoleName, User } from '@/shared/types';
import { authApi, type LoginPayload } from '@/features/auth/auth.api';
import { refreshAccessToken, setAccessToken, setSessionExpiredHandler } from '@/shared/api/http';

interface AuthContextValue {
  user: User | null;
  initializing: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  hasRole: (...roles: RoleName[]) => boolean;
  login: (payload: LoginPayload) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await refreshAccessToken();
        const me = await authApi.me();
        if (!cancelled) setUser(me);
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setInitializing(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setSessionExpiredHandler(() => setUser(null));
    return () => setSessionExpiredHandler(null);
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    const session = await authApi.login(payload);
    setAccessToken(session.accessToken);
    setUser(session.user);
    return session.user;
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout().catch(() => undefined);
    setAccessToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    setUser(await authApi.me());
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      initializing,
      isAuthenticated: user !== null,
      isAdmin: user?.role === 'ADMINISTRADOR',
      hasRole: (...roles) => (user ? roles.includes(user.role) : false),
      login,
      logout,
      refreshUser,
    }),
    [user, initializing, login, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
}
