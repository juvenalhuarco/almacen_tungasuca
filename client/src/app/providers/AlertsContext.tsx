import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useLocation } from 'react-router-dom';
import type { AlertSummary } from '@/shared/types';
import { alertsApi } from '@/features/alerts/alerts.api';
import { useAuth } from './AuthContext';

interface AlertsContextValue {
  summary: AlertSummary;
  refresh: () => Promise<void>;
}

const EMPTY: AlertSummary = { pending: 0, attended: 0, resolved: 0, open: 0 };
const POLL_INTERVAL_MS = 60_000;

const AlertsContext = createContext<AlertsContextValue | null>(null);

export function AlertsProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const [summary, setSummary] = useState<AlertSummary>(EMPTY);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setSummary(EMPTY);
      return;
    }
    const latest = await alertsApi.summary().catch(() => null);
    if (latest) setSummary(latest);
  }, [isAuthenticated]);

  useEffect(() => {
    void refresh();
  }, [refresh, location.pathname]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const timer = window.setInterval(() => void refresh(), POLL_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [isAuthenticated, refresh]);

  const value = useMemo(() => ({ summary, refresh }), [summary, refresh]);
  return <AlertsContext.Provider value={value}>{children}</AlertsContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAlerts(): AlertsContextValue {
  const context = useContext(AlertsContext);
  if (!context) throw new Error('useAlerts debe usarse dentro de AlertsProvider');
  return context;
}
