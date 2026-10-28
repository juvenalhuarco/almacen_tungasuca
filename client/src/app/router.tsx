import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from './layout/AppLayout';
import { ProtectedRoute } from './guards/ProtectedRoute';
import { RoleRoute } from './guards/RoleRoute';
import { LoginPage } from '@/features/auth/LoginPage';
import { ChangePasswordPage } from '@/features/auth/ChangePasswordPage';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { UsersPage } from '@/features/users/UsersPage';
import { MaterialsPage } from '@/features/materials/MaterialsPage';
import { MaintenancePage } from '@/features/maintenance/MaintenancePage';
import { MovementsPage } from '@/features/movements/MovementsPage';
import { NewMovementPage } from '@/features/movements/NewMovementPage';
import { AlertsPage } from '@/features/alerts/AlertsPage';
import { ReportsPage } from '@/features/reports/ReportsPage';
import { AuditPage } from '@/features/audit/AuditPage';
import { NotFoundPage } from './pages/NotFoundPage';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/', element: <DashboardPage /> },
          { path: '/materiales', element: <MaterialsPage /> },
          { path: '/movimientos', element: <MovementsPage /> },
          { path: '/movimientos/nuevo', element: <NewMovementPage /> },
          { path: '/alertas', element: <AlertsPage /> },
          { path: '/reportes', element: <ReportsPage /> },
          { path: '/mi-cuenta', element: <ChangePasswordPage /> },
          {
            element: <RoleRoute roles={['ADMINISTRADOR']} />,
            children: [
              { path: '/usuarios', element: <UsersPage /> },
              { path: '/mantenimiento', element: <MaintenancePage /> },
              { path: '/bitacora', element: <AuditPage /> },
            ],
          },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
]);
