import { Router } from 'express';
import { materialsController } from './materials.controller';
import { authenticate } from '../../middlewares/authenticate';
import { adminOnly } from '../../middlewares/authorize';

const router = Router();

router.use(authenticate);

/**
 * @openapi
 * /materials:
 *   get:
 *     tags: [Materiales]
 *     summary: Listar materiales con búsqueda, filtros y semáforo de stock
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: search, schema: { type: string }, description: Código, nombre, descripción o categoría }
 *       - { in: query, name: categoryId, schema: { type: integer } }
 *       - { in: query, name: stockStatus, schema: { type: string, enum: [OPTIMO, CRITICO, AGOTADO] } }
 *       - { in: query, name: active, schema: { type: boolean } }
 *       - { in: query, name: all, schema: { type: boolean } }
 *       - { $ref: '#/components/parameters/Page' }
 *       - { $ref: '#/components/parameters/Limit' }
 *     responses:
 *       200:
 *         description: Lista paginada de materiales
 *   post:
 *     tags: [Materiales]
 *     summary: Registrar un nuevo material
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MaterialInput'
 *     responses:
 *       201:
 *         description: Material creado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Material'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.get('/', materialsController.list);
router.post('/', materialsController.create);

/**
 * @openapi
 * /materials/summary:
 *   get:
 *     tags: [Materiales]
 *     summary: Resumen de materiales activos por estado de stock
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Conteos de materiales
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total: { type: integer }
 *                 optimal: { type: integer }
 *                 critical: { type: integer }
 *                 outOfStock: { type: integer }
 */
router.get('/summary', materialsController.summary);

/**
 * @openapi
 * /materials/next-code:
 *   get:
 *     tags: [Materiales]
 *     summary: Sugerir el siguiente código correlativo (MAT-###)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Código sugerido
 */
router.get('/next-code', materialsController.nextCode);

/**
 * @openapi
 * /materials/{id}:
 *   get:
 *     tags: [Materiales]
 *     summary: Obtener un material
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ $ref: '#/components/parameters/Id' }]
 *     responses:
 *       200:
 *         description: Material
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   put:
 *     tags: [Materiales]
 *     summary: Actualizar datos de un material (el stock solo cambia con movimientos)
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ $ref: '#/components/parameters/Id' }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MaterialInput'
 *     responses:
 *       200:
 *         description: Material actualizado
 */
router.get('/:id', materialsController.getById);
router.put('/:id', materialsController.update);

/**
 * @openapi
 * /materials/{id}/kardex:
 *   get:
 *     tags: [Materiales]
 *     summary: Kardex del material (historial de movimientos con saldos)
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ $ref: '#/components/parameters/Id' }]
 *     responses:
 *       200:
 *         description: Lista de movimientos del material
 */
router.get('/:id/kardex', materialsController.kardex);

/**
 * @openapi
 * /materials/{id}/minimum-stock:
 *   patch:
 *     tags: [Materiales]
 *     summary: Configurar el stock mínimo del material
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ $ref: '#/components/parameters/Id' }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [minimumStock]
 *             properties:
 *               minimumStock: { type: number, example: 50 }
 *     responses:
 *       200:
 *         description: Stock mínimo actualizado
 */
router.patch('/:id/minimum-stock', materialsController.setMinimumStock);

/**
 * @openapi
 * /materials/{id}/status:
 *   patch:
 *     tags: [Materiales]
 *     summary: Activar o desactivar un material (solo Administrador)
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ $ref: '#/components/parameters/Id' }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [active]
 *             properties:
 *               active: { type: boolean }
 *     responses:
 *       200:
 *         description: Estado actualizado
 *       400:
 *         $ref: '#/components/responses/BusinessRule'
 */
router.patch('/:id/status', adminOnly, materialsController.setActive);

export default router;
