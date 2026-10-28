import { Request, Response, Router } from 'express';
import { dashboardService } from './dashboard.service';
import { authenticate } from '../../middlewares/authenticate';
import { parseInteger } from '../../common/utils/pagination';

const router = Router();
router.use(authenticate);

/**
 * @openapi
 * /dashboard/summary:
 *   get:
 *     tags: [Dashboard]
 *     summary: Resumen general de materiales, alertas, movimientos y valor del inventario
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Resumen
 */
router.get('/summary', async (_req: Request, res: Response) => {
  res.json(await dashboardService.summary());
});

/**
 * @openapi
 * /dashboard/kpis:
 *   get:
 *     tags: [Dashboard]
 *     summary: Indicadores TPA, EIE e IOSM calculados con datos reales del periodo
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: days, schema: { type: integer, default: 30 } }
 *     responses:
 *       200:
 *         description: Lista de indicadores con línea base, meta y valor actual
 */
router.get('/kpis', async (req: Request, res: Response) => {
  const days = Math.min(365, Math.max(1, parseInteger(req.query.days) ?? 30));
  res.json(await dashboardService.kpis(days));
});

/**
 * @openapi
 * /dashboard/movements-by-day:
 *   get:
 *     tags: [Dashboard]
 *     summary: Cantidad de movimientos por día y tipo
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: days, schema: { type: integer, default: 14 } }
 *     responses:
 *       200:
 *         description: Serie diaria
 */
router.get('/movements-by-day', async (req: Request, res: Response) => {
  const days = Math.min(90, Math.max(7, parseInteger(req.query.days) ?? 14));
  res.json(await dashboardService.movementsByDay(days));
});

/**
 * @openapi
 * /dashboard/critical-materials:
 *   get:
 *     tags: [Dashboard]
 *     summary: Materiales con menor cobertura respecto a su stock mínimo
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Lista de materiales críticos
 */
router.get('/critical-materials', async (_req: Request, res: Response) => {
  res.json(await dashboardService.criticalMaterials());
});

/**
 * @openapi
 * /dashboard/recent-movements:
 *   get:
 *     tags: [Dashboard]
 *     summary: Últimos movimientos registrados
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Lista de movimientos recientes
 */
router.get('/recent-movements', async (_req: Request, res: Response) => {
  res.json(await dashboardService.recentMovements());
});

export default router;
