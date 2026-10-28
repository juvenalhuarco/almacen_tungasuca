import { NavLink } from 'react-router-dom';
import { MapPin, X } from 'lucide-react';
import { NAVIGATION } from '@/app/navigation';
import { useAuth } from '@/app/providers/AuthContext';
import { cn } from '@/shared/utils/cn';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  pendingAlerts: number;
}

export function Sidebar({ open, onClose, pendingAlerts }: SidebarProps) {
  const { hasRole } = useAuth();

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-30 bg-slate-900/50 transition-opacity lg:hidden',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-slate-200 bg-white transition-transform lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 lg:hidden">
          <span className="text-sm font-semibold text-slate-700">Navegación</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"
            aria-label="Cerrar menú"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-5">
          {NAVIGATION.map((section) => {
            const items = section.items.filter((item) => !item.roles || hasRole(...item.roles));
            if (items.length === 0) return null;
            return (
              <div key={section.title} className="mb-6">
                <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {section.title}
                </p>
                <ul className="space-y-1">
                  {items.map((item) => (
                    <li key={item.to}>
                      <NavLink
                        to={item.to}
                        end={item.to === '/' || item.to === '/movimientos'}
                        onClick={onClose}
                        className={({ isActive }) =>
                          cn(
                            'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition',
                            isActive
                              ? 'bg-brand-50 text-brand-700'
                              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                          )
                        }
                      >
                        <item.icon className="h-5 w-5 shrink-0" />
                        <span className="flex-1">{item.label}</span>
                        {item.to === '/alertas' && pendingAlerts > 0 && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">
                            {pendingAlerts}
                          </span>
                        )}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </nav>

        <div className="border-t border-slate-200 px-5 py-4">
          <div className="rounded-lg bg-slate-50 px-3 py-3">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 font-semibold text-slate-700">
                <MapPin className="h-3.5 w-3.5 text-brand-600" />
                Cusco / Obra
              </span>
              <span className="flex items-center gap-1 text-emerald-600">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Activo
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">Almacén central Tungasuca</p>
          </div>
        </div>
      </aside>
    </>
  );
}
