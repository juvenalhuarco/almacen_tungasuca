import { Request, Response, Router } from 'express';
import { AppDataSource } from '../../config/data-source';
import { AuditLog } from '../../database/entities';
import { authenticate } from '../../middlewares/authenticate';
import { adminOnly } from '../../middlewares/authorize';
import {
  paginate,
  parseDate,
  parseInteger,
  parsePagination,
  parseString,
} from '../../common/utils/pagination';

const router = Router();
router.use(authenticate, adminOnly);

/**
 * @openapi
 * /audit:
 *   get:
 *     tags: [Bitácora]
 *     summary: Consultar la bitácora de operaciones (solo Administrador)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: from, schema: { type: string, format: date } }
 *       - { in: query, name: to, schema: { type: string, format: date } }
 *       - { in: query, name: userId, schema: { type: integer } }
 *       - { in: query, name: action, schema: { type: string } }
 *       - { in: query, name: entity, schema: { type: string } }
 *       - { in: query, name: search, schema: { type: string }, description: Busca en el detalle JSON }
 *       - { $ref: '#/components/parameters/Page' }
 *       - { $ref: '#/components/parameters/Limit' }
 *     responses:
 *       200:
 *         description: Lista paginada de registros de auditoría
 */
router.get('/', async (req: Request, res: Response) => {
  const pagination = parsePagination(req.query);
  const query = AppDataSource.getRepository(AuditLog)
    .createQueryBuilder('log')
    .leftJoinAndSelect('log.user', 'user')
    .orderBy('log.createdAt', 'DESC')
    .skip(pagination.skip)
    .take(pagination.limit);

  const from = parseDate(req.query.from);
  const to = parseDate(req.query.to, true);
  const userId = parseInteger(req.query.userId);
  const action = parseString(req.query.action)?.toUpperCase();
  const entity = parseString(req.query.entity);
  const search = parseString(req.query.search);

  if (from) query.andWhere('log.createdAt >= :from', { from });
  if (to) query.andWhere('log.createdAt <= :to', { to });
  if (userId) query.andWhere('log.userId = :userId', { userId });
  if (action) query.andWhere('log.action = :action', { action });
  if (entity) query.andWhere('log.entity = :entity', { entity });
  if (search) query.andWhere('CAST(log.detail AS TEXT) ILIKE :search', { search: `%${search}%` });

  const [rows, total] = await query.getManyAndCount();
  const data = rows.map((log) => ({
    id: log.id,
    user: log.user
      ? {
          id: log.user.id,
          name: `${log.user.firstName} ${log.user.lastName}`.trim(),
          username: log.user.username,
        }
      : null,
    action: log.action,
    entity: log.entity,
    entityId: log.entityId,
    detail: log.detail,
    ip: log.ip,
    createdAt: log.createdAt,
  }));
  res.json(paginate(data, total, pagination));
});

/**
 * @openapi
 * /audit/filters:
 *   get:
 *     tags: [Bitácora]
 *     summary: Valores disponibles de acción y entidad para filtrar la bitácora
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Listas de acciones y entidades
 */
router.get('/filters', async (_req: Request, res: Response) => {
  const [actions, entities] = await Promise.all([
    AppDataSource.query('SELECT DISTINCT accion AS value FROM bitacora ORDER BY accion'),
    AppDataSource.query('SELECT DISTINCT entidad AS value FROM bitacora ORDER BY entidad'),
  ]);
  res.json({
    actions: actions.map((row: { value: string }) => row.value),
    entities: entities.map((row: { value: string }) => row.value),
  });
});

export default router;
