import { Request, Response } from 'express';
import { movementsService, MovementLineInput } from './movements.service';
import { MovementStatus, MovementType } from '../../database/entities';
import { Validator } from '../../common/utils/validator';
import {
  parseDate,
  parseInteger,
  parsePagination,
  parseString,
} from '../../common/utils/pagination';
import { getClientIp } from '../../common/utils/request';
import { NotFoundError } from '../../common/errors/app-error';

const TYPES = Object.values(MovementType);
const STATUSES = Object.values(MovementStatus);

function parseId(req: Request): number {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) throw new NotFoundError('Movimiento');
  return id;
}

function actor(req: Request) {
  return { id: req.user!.id, ip: getClientIp(req) };
}

export class MovementsController {
  async list(req: Request, res: Response): Promise<void> {
    const type = parseString(req.query.type)?.toUpperCase();
    const status = parseString(req.query.status)?.toUpperCase();
    res.json(
      await movementsService.list(
        {
          from: parseDate(req.query.from),
          to: parseDate(req.query.to, true),
          type: TYPES.includes(type as MovementType) ? (type as MovementType) : undefined,
          status: STATUSES.includes(status as MovementStatus)
            ? (status as MovementStatus)
            : undefined,
          materialId: parseInteger(req.query.materialId),
          workFrontId: parseInteger(req.query.workFrontId),
          supplierId: parseInteger(req.query.supplierId),
          userId: parseInteger(req.query.userId),
          search: parseString(req.query.search),
        },
        parsePagination(req.query),
      ),
    );
  }

  async getById(req: Request, res: Response): Promise<void> {
    res.json(await movementsService.getById(parseId(req)));
  }

  async create(req: Request, res: Response): Promise<void> {
    const body = req.body ?? {};
    const v = new Validator(body);
    const type = v.string('type', { required: true, oneOf: TYPES }) as MovementType | undefined;
    const date = v.date('date');
    const documentNumber = v.string('documentNumber', { maxLength: 50 });
    const supplierId = v.number('supplierId', { integer: true, min: 1 });
    const workFrontId = v.number('workFrontId', { integer: true, min: 1 });
    const requester = v.string('requester', { maxLength: 150 });
    const notes = v.string('notes', { maxLength: 500 });
    const registrationSeconds = v.number('registrationSeconds', { integer: true, min: 0 });
    const rawLines = v.array<Record<string, unknown>>('lines', { required: true, minItems: 1 });

    const lines: MovementLineInput[] = [];
    rawLines?.forEach((raw, index) => {
      const lv = new Validator(raw ?? {});
      const materialId = lv.number('materialId', { required: true, integer: true, min: 1 });
      const quantity = lv.number('quantity', { min: 0 });
      const unitPrice = lv.number('unitPrice', { min: 0 });
      const countedStock = lv.number('countedStock', { min: 0 });
      if (lv.hasErrors) {
        v.addError(`lines[${index}]`, 'Línea incompleta o con valores inválidos');
      } else {
        lines.push({ materialId: materialId!, quantity, unitPrice, countedStock });
      }
    });
    v.throwIfInvalid();

    const movement = await movementsService.create(
      {
        type: type!,
        date,
        documentNumber,
        supplierId,
        workFrontId,
        requester,
        notes,
        registrationSeconds,
        lines,
      },
      actor(req),
    );
    res.status(201).json(movement);
  }

  async void(req: Request, res: Response): Promise<void> {
    const v = new Validator(req.body ?? {});
    const reason = v.string('reason', { required: true, minLength: 5, maxLength: 300 });
    v.throwIfInvalid();
    res.json(await movementsService.void(parseId(req), reason!, actor(req)));
  }
}

export const movementsController = new MovementsController();
