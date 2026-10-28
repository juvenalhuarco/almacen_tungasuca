import { Request, Response, Router } from 'express';
import { env } from '../../config/env';
import { authenticate } from '../../middlewares/authenticate';

const router = Router();

/**
 * @openapi
 * /company:
 *   get:
 *     tags: [Reportes]
 *     summary: Datos de la empresa usados en el membrete de los reportes
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Datos de la empresa
 */
router.get('/', authenticate, (_req: Request, res: Response) => {
  res.json({
    name: env.company.name,
    ruc: env.company.ruc,
    address: env.company.address,
    phone: env.company.phone,
    email: env.company.email,
  });
});

export default router;
