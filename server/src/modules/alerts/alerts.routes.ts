import { Router } from 'express';
import { alertsController } from './alerts.controller';
import { authenticate } from '../../middlewares/authenticate';
import { adminOnly } from '../../middlewares/authorize';

const router = Router();

router.use(authenticate);

/**
 * @openapi
 * /alerts:
 *   get:
 *     tags: [Alertas]
 *     summary: Listar alertas de stock mínimo
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: status, schema: { type: string, enum: [PENDIENTE, ATENDIDA, RESUELTA] } }
 *       - { in: query, name: type, schema: { type: string, enum: [STOCK_MINIMO, AGOTADO] } }
 *       - { in: query, name: categoryId, schema: { type: integer } }
 *       - { in: query, name: search, schema: { type: string } }
 *       - { $ref: '#/components/parameters/Page' }
 *       - { $ref: '#/components/parameters/Limit' }
 *     responses:
 *       200:
 *         description: Lista paginada de alertas (pendientes primero)
 */
router.get('/', alertsController.list);

/**
 * @openapi
 * /alerts/summary:
 *   get:
 *     tags: [Alertas]
 *     summary: Conteo de alertas por estado (alimenta la campana de notificaciones)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Conteos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 pending: { type: integer }
 *                 attended: { type: integer }
 *                 resolved: { type: integer }
 *                 open: { type: integer }
 */
router.get('/summary', alertsController.summary);

/**
 * @openapi
 * /alerts/check:
 *   post:
 *     tags: [Alertas]
 *     summary: Ejecutar ahora la revisión completa de stock mínimo (solo Administrador)
 *     description: Es la misma revisión que el sistema ejecuta automáticamente cada día.
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Resultado de la revisión
 */
router.post('/check', adminOnly, alertsController.runCheck);

/**
 * @openapi
 * /alerts/{id}:
 *   get:
 *     tags: [Alertas]
 *     summary: Obtener una alerta
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ $ref: '#/components/parameters/Id' }]
 *     responses:
 *       200:
 *         description: Alerta
 */
router.get('/:id', alertsController.getById);

/**
 * @openapi
 * /alerts/{id}/attend:
 *   patch:
 *     tags: [Alertas]
 *     summary: Marcar una alerta pendiente como atendida
 *     description: Indica que ya se gestionó la reposición. La alerta se cierra automáticamente cuando el stock supera el mínimo.
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ $ref: '#/components/parameters/Id' }]
 *     responses:
 *       200:
 *         description: Alerta atendida
 *       400:
 *         $ref: '#/components/responses/BusinessRule'
 */
router.patch('/:id/attend', alertsController.attend);

export default router;
