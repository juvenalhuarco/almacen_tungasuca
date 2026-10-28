import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, ChevronDown, KeyRound, LogOut, Menu } from 'lucide-react';
import { useAuth } from '@/app/providers/AuthContext';
import { initials, roleLabel } from '@/shared/utils/format';

interface HeaderProps {
  onToggleSidebar: () => void;
  pendingAlerts: number;
}

export function Header({ onToggleSidebar, pendingAlerts }: HeaderProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [menuOpen]);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-brand-700 bg-brand-600 px-4 text-white shadow sm:px-6">
      <button
        type="button"
        onClick={onToggleSidebar}
        className="rounded-lg p-2 hover:bg-brand-700 lg:hidden"
        aria-label="Abrir menú"
      >
        <Menu className="h-5 w-5" />
      </button>

      <Link to="/" className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-white">
          <img src="/logo.png" alt="Consorcio Tungasuca" className="h-9 w-9 object-contain" />
        </span>
        <span className="hidden sm:block">
          <span className="block text-base font-bold leading-tight">Consorcio Tungasuca</span>
          <span className="block text-[11px] font-medium uppercase tracking-wider text-brand-100">
            Sistema web de control de inventarios
          </span>
        </span>
      </Link>

      <div className="ml-auto flex items-center gap-2 sm:gap-4">
        <Link
          to="/alertas"
          className="relative rounded-lg p-2 hover:bg-brand-700"
          aria-label={`Alertas pendientes: ${pendingAlerts}`}
        >
          <Bell className="h-5 w-5" />
          {pendingAlerts > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-400 px-1 text-[11px] font-bold text-slate-900">
              {pendingAlerts > 99 ? '99+' : pendingAlerts}
            </span>
          )}
        </Link>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="flex items-center gap-3 rounded-lg px-2 py-1 hover:bg-brand-700"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            <span className="hidden text-right sm:block">
              <span className="block text-sm font-semibold leading-tight">{user?.fullName}</span>
              <span className="block text-[11px] text-brand-100">
                {roleLabel(user?.role ?? '')}
              </span>
            </span>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-sm font-bold text-brand-700">
              {initials(user?.fullName ?? '')}
            </span>
            <ChevronDown className="hidden h-4 w-4 sm:block" />
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-56 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 text-sm text-slate-700 shadow-lg"
            >
              <div className="border-b border-slate-100 px-4 py-2 sm:hidden">
                <p className="font-semibold">{user?.fullName}</p>
                <p className="text-xs text-slate-500">{roleLabel(user?.role ?? '')}</p>
              </div>
              <Link
                to="/mi-cuenta"
                role="menuitem"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50"
              >
                <KeyRound className="h-4 w-4 text-slate-400" />
                Cambiar contraseña
              </Link>
              <button
                type="button"
                role="menuitem"
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
