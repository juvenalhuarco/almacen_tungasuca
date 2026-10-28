import { Request, Response, Router } from 'express';
import { reportsService } from './reports.service';
import { MovementStatus, MovementType } from '../../database/entities';
import { StockStatus } from '../materials/materials.repository';
import { parseBoolean, parseDate, parseInteger, parseString } from '../../common/utils/pagination';
import { authenticate } from '../../middlewares/authenticate';
import { NotFoundError } from '../../common/errors/app-error';
import { auditService, AuditAction } from '../audit/audit.service';
import { getClientIp } from '../../common/utils/request';

const router = Router();
router.use(authenticate);

const STOCK_STATUSES: readonly StockStatus[] = ['OPTIMO', 'CRITICO', 'AGOTADO'];
const TYPES = Object.values(MovementType);
const STATUSES = Object.values(MovementStatus);

/**
 * @openapi
 * /reports/stock:
 *   get:
 *     tags: [Reportes]
 *     summary: Reporte de existencias valorizado
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: categoryId, schema: { type: integer } }
 *       - { in: query, name: stockStatus, schema: { type: string, enum: [OPTIMO, CRITICO, AGOTADO] } }
 *       - { in: query, name: active, schema: { type: boolean, default: true } }
 *     responses:
 *       200:
 *         description: Filas del reporte y totales
 */
router.get('/stock', async (req: Request, res: Response) => {
  const status = parseString(req.query.stockStatus)?.toUpperCase();
  res.json(
    await reportsService.stock({
      categoryId: parseInteger(req.query.categoryId),
      stockStatus: STOCK_STATUSES.includes(status as StockStatus)
        ? (status as StockStatus)
        : undefined,
      active: parseBoolean(req.query.active),
    }),
  );
});

/**
 * @openapi
 * /reports/movements:
 *   get:
 *     tags: [Reportes]
 *     summary: Reporte de movimientos detallado por línea
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: from, schema: { type: string, format: date } }
 *       - { in: query, name: to, schema: { type: string, format: date } }
 *       - { in: query, name: type, schema: { type: string, enum: [ENTRADA, SALIDA, AJUSTE] } }
 *       - { in: query, name: status, schema: { type: string, enum: [REGISTRADO, ANULADO] } }
 *       - { in: query, name: workFrontId, schema: { type: integer } }
 *       - { in: query, name: supplierId, schema: { type: integer } }
 *       - { in: query, name: materialId, schema: { type: integer } }
 *       - { in: query, name: categoryId, schema: { type: integer } }
 *     responses:
 *       200:
 *         description: Filas del reporte y totales
 */
router.get('/movements', async (req: Request, res: Response) => {
  const type = parseString(req.query.type)?.toUpperCase();
  const status = parseString(req.query.status)?.toUpperCase();
  res.json(
    await reportsService.movements({
      from: parseDate(req.query.from),
      to: parseDate(req.query.to, true),
      type: TYPES.includes(type as MovementType) ? (type as MovementType) : undefined,
      status: STATUSES.includes(status as MovementStatus) ? (status as MovementStatus) : undefined,
      workFrontId: parseInteger(req.query.workFrontId),
      supplierId: parseInteger(req.query.supplierId),
      materialId: parseInteger(req.query.materialId),
      categoryId: parseInteger(req.query.categoryId),
    }),
  );
});

/**
 * @openapi
 * /reports/kardex/{materialId}:
 *   get:
 *     tags: [Reportes]
 *     summary: Kardex de un material con saldo inicial, entradas, salidas y saldo
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: materialId, required: true, schema: { type: integer } }
 *       - { in: query, name: from, schema: { type: string, format: date } }
 *       - { in: query, name: to, schema: { type: string, format: date } }
 *     responses:
 *       200:
 *         description: Kardex del material
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/kardex/:materialId', async (req: Request, res: Response) => {
  const materialId = Number(req.params.materialId);
  if (!Number.isInteger(materialId) || materialId <= 0) throw new NotFoundError('Material');
  res.json(
    await reportsService.kardex(
      materialId,
      parseDate(req.query.from),
      parseDate(req.query.to, true),
    ),
  );
});

/**
 * @openapi
 * /reports/export-log:
 *   post:
 *     tags: [Reportes]
 *     summary: Registrar en bitácora la exportación de un reporte (Excel o PDF)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               report: { type: string, example: existencias }
 *               format: { type: string, enum: [xlsx, pdf] }
 *               rows: { type: integer }
 *     responses:
 *       204:
 *         description: Registrado
 */
router.post('/export-log', async (req: Request, res: Response) => {
  const body = req.body ?? {};
  await auditService.log({
    userId: req.user!.id,
    action: AuditAction.EXPORT,
    entity: 'reportes',
    detail: {
      report: String(body.report ?? ''),
      format: String(body.format ?? ''),
      rows: Number(body.rows) || 0,
    },
    ip: getClientIp(req),
  });
  res.status(204).send();
});

export default router;
