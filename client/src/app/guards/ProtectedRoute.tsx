import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthContext';
import { FullPageSpinner } from '@/shared/components/ui';

export function ProtectedRoute() {
  const { isAuthenticated, initializing } = useAuth();
  const location = useLocation();

  if (initializing) return <FullPageSpinner message="Restaurando sesión..." />;
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
}
