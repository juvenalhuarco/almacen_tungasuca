import { Request, Response, Router } from 'express';
import { AppDataSource } from '../../config/data-source';
import { Role } from '../../database/entities';
import { authenticate } from '../../middlewares/authenticate';

const router = Router();

/**
 * @openapi
 * /roles:
 *   get:
 *     tags: [Usuarios]
 *     summary: Listar los roles disponibles
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Lista de roles
 */
router.get('/', authenticate, async (_req: Request, res: Response) => {
  const roles = await AppDataSource.getRepository(Role).find({ order: { id: 'ASC' } });
  res.json(roles.map((role) => ({ id: role.id, name: role.name, description: role.description })));
});

export default router;
