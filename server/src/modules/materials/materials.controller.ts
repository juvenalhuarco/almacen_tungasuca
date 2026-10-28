import { Request, Response } from 'express';
import { materialsService } from './materials.service';
import { StockStatus } from './materials.repository';
import { Validator } from '../../common/utils/validator';
import {
  parseBoolean,
  parseInteger,
  parsePagination,
  parseString,
} from '../../common/utils/pagination';
import { getClientIp } from '../../common/utils/request';
import { NotFoundError } from '../../common/errors/app-error';

const STOCK_STATUSES: readonly StockStatus[] = ['OPTIMO', 'CRITICO', 'AGOTADO'];

function parseId(req: Request): number {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) throw new NotFoundError('Material');
  return id;
}

function actor(req: Request) {
  return { id: req.user!.id, ip: getClientIp(req) };
}

export class MaterialsController {
  async list(req: Request, res: Response): Promise<void> {
    const status = parseString(req.query.stockStatus)?.toUpperCase();
    res.json(
      await materialsService.list(
        {
          search: parseString(req.query.search),
          categoryId: parseInteger(req.query.categoryId),
          stockStatus: STOCK_STATUSES.includes(status as StockStatus)
            ? (status as StockStatus)
            : undefined,
          active: parseBoolean(req.query.active),
          all: parseBoolean(req.query.all) === true,
        },
        parsePagination(req.query),
      ),
    );
  }

  async summary(_req: Request, res: Response): Promise<void> {
    res.json(await materialsService.summary());
  }

  async nextCode(_req: Request, res: Response): Promise<void> {
    res.json({ code: await materialsService.nextCode() });
  }

  async getById(req: Request, res: Response): Promise<void> {
    res.json(await materialsService.getById(parseId(req)));
  }

  async kardex(req: Request, res: Response): Promise<void> {
    res.json(await materialsService.kardex(parseId(req)));
  }

  async create(req: Request, res: Response): Promise<void> {
    const v = new Validator(req.body ?? {});
    const code = v.string('code', {
      maxLength: 20,
      pattern: /^[A-Za-z0-9-]+$/,
      patternMessage: 'Solo letras, números y guiones',
    });
    const name = v.string('name', { required: true, maxLength: 150 });
    const description = v.string('description', { maxLength: 300 });
    const categoryId = v.number('categoryId', { required: true, integer: true, min: 1 });
    const unitId = v.number('unitId', { required: true, integer: true, min: 1 });
    const minimumStock = v.number('minimumStock', { required: true, min: 0 });
    const initialStock = v.number('initialStock', { min: 0 }) ?? 0;
    const referencePrice = v.number('referencePrice', { min: 0 }) ?? 0;
    const location = v.string('location', { maxLength: 100 });
    v.throwIfInvalid();

    const material = await materialsService.create(
      {
        code,
        name: name!,
        description,
        categoryId: categoryId!,
        unitId: unitId!,
        minimumStock: minimumStock!,
        initialStock,
        referencePrice,
        location,
      },
      actor(req),
    );
    res.status(201).json(material);
  }

  async update(req: Request, res: Response): Promise<void> {
    const body = req.body ?? {};
    const v = new Validator(body);
    const name = v.string('name', { maxLength: 150 });
    const description = v.string('description', { maxLength: 300 });
    const categoryId = v.number('categoryId', { integer: true, min: 1 });
    const unitId = v.number('unitId', { integer: true, min: 1 });
    const minimumStock = v.number('minimumStock', { min: 0 });
    const referencePrice = v.number('referencePrice', { min: 0 });
    const location = v.string('location', { maxLength: 100 });
    v.throwIfInvalid();

    const material = await materialsService.update(
      parseId(req),
      {
        name,
        description: 'description' in body ? (description ?? null) : undefined,
        categoryId,
        unitId,
        minimumStock,
        referencePrice,
        location: 'location' in body ? (location ?? null) : undefined,
      },
      actor(req),
    );
    res.json(material);
  }

  async setMinimumStock(req: Request, res: Response): Promise<void> {
    const v = new Validator(req.body ?? {});
    const minimumStock = v.number('minimumStock', { required: true, min: 0 });
    v.throwIfInvalid();
    res.json(await materialsService.setMinimumStock(parseId(req), minimumStock!, actor(req)));
  }

  async setActive(req: Request, res: Response): Promise<void> {
    const v = new Validator(req.body ?? {});
    const active = v.boolean('active', { required: true });
    v.throwIfInvalid();
    res.json(await materialsService.setActive(parseId(req), active!, actor(req)));
  }
}

export const materialsController = new MaterialsController();
