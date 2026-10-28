import { Request, Response } from 'express';
import { alertsService } from './alerts.service';
import { StockAlertStatus, StockAlertType } from '../../database/entities';
import { parseInteger, parsePagination, parseString } from '../../common/utils/pagination';
import { getClientIp } from '../../common/utils/request';
import { NotFoundError } from '../../common/errors/app-error';

const STATUSES = Object.values(StockAlertStatus);
const TYPES = Object.values(StockAlertType);

function parseId(req: Request): number {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) throw new NotFoundError('Alerta');
  return id;
}

export class AlertsController {
  async list(req: Request, res: Response): Promise<void> {
    const status = parseString(req.query.status)?.toUpperCase();
    const type = parseString(req.query.type)?.toUpperCase();
    res.json(
      await alertsService.list(
        {
          status: STATUSES.includes(status as StockAlertStatus)
            ? (status as StockAlertStatus)
            : undefined,
          type: TYPES.includes(type as StockAlertType) ? (type as StockAlertType) : undefined,
          search: parseString(req.query.search),
          categoryId: parseInteger(req.query.categoryId),
        },
        parsePagination(req.query),
      ),
    );
  }

  async summary(_req: Request, res: Response): Promise<void> {
    res.json(await alertsService.summary());
  }

  async getById(req: Request, res: Response): Promise<void> {
    res.json(await alertsService.getById(parseId(req)));
  }

  async attend(req: Request, res: Response): Promise<void> {
    res.json(await alertsService.attend(parseId(req), { id: req.user!.id, ip: getClientIp(req) }));
  }

  async runCheck(req: Request, res: Response): Promise<void> {
    res.json(await alertsService.runFullCheck('manual', req.user!.id));
  }
}

export const alertsController = new AlertsController();
