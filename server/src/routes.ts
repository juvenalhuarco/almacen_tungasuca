import { Router } from 'express';
import authRoutes from './modules/auth/auth.routes';
import usersRoutes from './modules/users/users.routes';
import rolesRoutes from './modules/roles/roles.routes';
import catalogsRoutes from './modules/catalogs/catalogs.routes';
import materialsRoutes from './modules/materials/materials.routes';
import movementsRoutes from './modules/movements/movements.routes';
import alertsRoutes from './modules/alerts/alerts.routes';
import reportsRoutes from './modules/reports/reports.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';
import auditRoutes from './modules/audit/audit.routes';
import companyRoutes from './modules/company/company.routes';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/roles', rolesRoutes);
router.use('/', catalogsRoutes);
router.use('/materials', materialsRoutes);
router.use('/movements', movementsRoutes);
router.use('/alerts', alertsRoutes);
router.use('/reports', reportsRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/audit', auditRoutes);
router.use('/company', companyRoutes);

export default router;
