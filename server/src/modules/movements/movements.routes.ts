import { Router } from 'express';
import { movementsController } from './movements.controller';
import { authenticate } from '../../middlewares/authenticate';
import { adminOnly } from '../../middlewares/authorize';

const router = Router();

router.use(authenticate);

/**
 * @openapi
 * /movements:
 *   get:
 *     tags: [Movimientos]
 *     summary: Historial de movimientos con filtros
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: from, schema: { type: string, format: date } }
 *       - { in: query, name: to, schema: { type: string, format: date } }
 *       - { in: query, name: type, schema: { type: string, enum: [ENTRADA, SALIDA, AJUSTE] } }
 *       - { in: query, name: status, schema: { type: string, enum: [REGISTRADO, ANULADO] } }
 *       - { in: query, name: materialId, schema: { type: integer } }
 *       - { in: query, name: workFrontId, schema: { type: integer } }
 *       - { in: query, name: supplierId, schema: { type: integer } }
 *       - { in: query, name: userId, schema: { type: integer } }
 *       - { in: query, name: search, schema: { type: string }, description: Código, documento o solicitante }
 *       - { $ref: '#/components/parameters/Page' }
 *       - { $ref: '#/components/parameters/Limit' }
 *     responses:
 *       200:
 *         description: Lista paginada de movimientos
 *   post:
 *     tags: [Movimientos]
 *     summary: Registrar una entrada, salida o ajuste de inventario
 *     description: |
 *       Se ejecuta en una transacción: valida existencias, actualiza el stock, registra el kardex
 *       (stock anterior y resultante por línea), evalúa alertas de stock mínimo y escribe la bitácora.
 *       Las salidas nunca pueden dejar stock negativo.
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MovementInput'
 *     responses:
 *       201:
 *         description: Movimiento registrado
 *       400:
 *         $ref: '#/components/responses/BusinessRule'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.get('/', movementsController.list);
router.post('/', movementsController.create);

/**
 * @openapi
 * /movements/{id}:
 *   get:
 *     tags: [Movimientos]
 *     summary: Detalle de un movimiento con sus líneas
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ $ref: '#/components/parameters/Id' }]
 *     responses:
 *       200:
 *         description: Movimiento con detalle
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', movementsController.getById);

/**
 * @openapi
 * /movements/{id}/void:
 *   post:
 *     tags: [Movimientos]
 *     summary: Anular un movimiento (solo Administrador)
 *     description: |
 *       El movimiento no se elimina. Se marca como ANULADO y se genera un ajuste inverso
 *       que devuelve el stock a su valor anterior, conservando la trazabilidad del kardex.
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ $ref: '#/components/parameters/Id' }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [reason]
 *             properties:
 *               reason: { type: string, example: Vale duplicado por error de digitación }
 *     responses:
 *       200:
 *         description: Movimiento anulado
 *       400:
 *         $ref: '#/components/responses/BusinessRule'
 */
router.post('/:id/void', adminOnly, movementsController.void);

export default router;
