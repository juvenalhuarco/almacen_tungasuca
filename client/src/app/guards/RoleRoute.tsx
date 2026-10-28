import { Outlet } from 'react-router-dom';
import { ShieldOff } from 'lucide-react';
import { useAuth } from '@/app/providers/AuthContext';
import type { RoleName } from '@/shared/types';

export function RoleRoute({ roles }: { roles: RoleName[] }) {
  const { hasRole } = useAuth();

  if (!hasRole(...roles)) {
    return (
      <div className="card flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
        <span className="rounded-full bg-red-100 p-3 text-red-600">
          <ShieldOff className="h-6 w-6" />
        </span>
        <h2 className="text-lg font-semibold text-slate-900">Acceso restringido</h2>
        <p className="max-w-md text-sm text-slate-500">
          Su rol no tiene permisos para acceder a esta sección. Si considera que es un error,
          comuníquese con el administrador del sistema.
        </p>
      </div>
    );
  }
  return <Outlet />;
}
