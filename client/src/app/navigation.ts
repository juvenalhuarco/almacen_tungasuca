import {
  LayoutDashboard,
  Boxes,
  ArrowLeftRight,
  Bell,
  FileBarChart,
  Users,
  Settings2,
  ScrollText,
  History,
  type LucideIcon,
} from 'lucide-react';
import type { RoleName } from '@/shared/types';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  roles?: RoleName[];
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const NAVIGATION: NavSection[] = [
  {
    title: 'Menú principal',
    items: [
      { to: '/', label: 'Dashboard / KPIs', icon: LayoutDashboard },
      { to: '/materiales', label: 'Catálogo de materiales', icon: Boxes },
      { to: '/movimientos/nuevo', label: 'Registrar movimiento', icon: ArrowLeftRight },
      { to: '/movimientos', label: 'Historial de movimientos', icon: History },
      { to: '/alertas', label: 'Alertas de stock mínimo', icon: Bell },
      { to: '/reportes', label: 'Reportes', icon: FileBarChart },
    ],
  },
  {
    title: 'Administración',
    items: [
      { to: '/usuarios', label: 'Usuarios', icon: Users, roles: ['ADMINISTRADOR'] },
      { to: '/mantenimiento', label: 'Mantenimiento', icon: Settings2, roles: ['ADMINISTRADOR'] },
      { to: '/bitacora', label: 'Bitácora', icon: ScrollText, roles: ['ADMINISTRADOR'] },
    ],
  },
];
