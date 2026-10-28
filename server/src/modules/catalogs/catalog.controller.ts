import { Request, Response, Router } from 'express';
import { CatalogEntity, CatalogService } from './catalog.service';
import { Validator } from '../../common/utils/validator';
import { parseBoolean, parsePagination, parseString } from '../../common/utils/pagination';
import { getClientIp } from '../../common/utils/request';
import { NotFoundError } from '../../common/errors/app-error';
import { authenticate } from '../../middlewares/authenticate';
import { adminOnly } from '../../middlewares/authorize';

export type InputParser<T> = (validator: Validator, partial: boolean) => Partial<T>;

function parseId(req: Request, label: string): number {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) throw new NotFoundError(label);
  return id;
}

export function createCatalogRouter<T extends CatalogEntity>(
  service: CatalogService<T>,
  label: string,
  parseInput: InputParser<T>,
): Router {
  const router = Router();
  const actor = (req: Request) => ({ id: req.user!.id, ip: getClientIp(req) });

  router.use(authenticate);

  router.get('/', async (req: Request, res: Response) => {
    const result = await service.list(
      {
        search: parseString(req.query.search),
        active: parseBoolean(req.query.active),
        all: parseBoolean(req.query.all) === true,
      },
      parsePagination(req.query),
    );
    res.json(result);
  });

  router.get('/:id', async (req: Request, res: Response) => {
    res.json(await service.getById(parseId(req, label)));
  });

  router.post('/', adminOnly, async (req: Request, res: Response) => {
    const validator = new Validator(req.body ?? {});
    const data = parseInput(validator, false);
    validator.throwIfInvalid();
    res.status(201).json(await service.create(data, actor(req)));
  });

  router.put('/:id', adminOnly, async (req: Request, res: Response) => {
    const validator = new Validator(req.body ?? {});
    const data = parseInput(validator, true);
    validator.throwIfInvalid();
    res.json(await service.update(parseId(req, label), data, actor(req)));
  });

  router.patch('/:id/status', adminOnly, async (req: Request, res: Response) => {
    const validator = new Validator(req.body ?? {});
    const active = validator.boolean('active', { required: true });
    validator.throwIfInvalid();
    res.json(await service.setActive(parseId(req, label), active!, actor(req)));
  });

  return router;
}
