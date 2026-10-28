import { In, Repository, SelectQueryBuilder } from 'typeorm';
import { AppDataSource } from '../../config/data-source';
import { Material, StockAlert, StockAlertStatus, StockAlertType } from '../../database/entities';
import { BusinessRuleError, NotFoundError } from '../../common/errors/app-error';
import { PaginatedResult, PaginationQuery, paginate } from '../../common/utils/pagination';
import { auditService, AuditAction } from '../audit/audit.service';
import { AlertEvaluation, evaluateMaterialAlert } from './alerts.evaluator';
import { alertNotifier } from './alerts.notifier';
import { logger } from '../../common/utils/logger';

export interface AlertFilters {
  status?: StockAlertStatus;
  type?: StockAlertType;
  search?: string;
  categoryId?: number;
}

export interface AlertView {
  id: number;
  material: {
    id: number;
    code: string;
    name: string;
    unit: string;
    category: string;
    currentStock: number;
    minimumStock: number;
    location: string | null;
  };
  type: StockAlertType;
  stockAtGeneration: number;
  minimumStock: number;
  status: StockAlertStatus;
  generatedAt: Date;
  attendedAt: Date | null;
  attendedBy: { id: number; name: string } | null;
  resolvedAt: Date | null;
  emailSent: boolean;
  suggestedQuantity: number;
}

export interface AlertSummary {
  pending: number;
  attended: number;
  resolved: number;
  open: number;
}

export interface CheckResult {
  evaluated: number;
  created: number;
  resolved: number;
  notified: number;
}

interface Actor {
  id: number;
  ip: string | null;
}

const OPEN_STATUSES = [StockAlertStatus.PENDING, StockAlertStatus.ATTENDED];

export function toAlertView(alert: StockAlert): AlertView {
  const material = alert.material;
  const deficit = material.minimumStock - material.currentStock;
  const suggested = deficit + material.minimumStock * 0.5;
  return {
    id: alert.id,
    material: {
      id: material.id,
      code: material.code,
      name: material.name,
      unit: material.unit?.abbreviation ?? '',
      category: material.category?.name ?? '',
      currentStock: material.currentStock,
      minimumStock: material.minimumStock,
      location: material.location,
    },
    type: alert.type,
    stockAtGeneration: alert.stockAtGeneration,
    minimumStock: alert.minimumStock,
    status: alert.status,
    generatedAt: alert.generatedAt,
    attendedAt: alert.attendedAt,
    attendedBy: alert.attendedBy
      ? {
          id: alert.attendedBy.id,
          name: `${alert.attendedBy.firstName} ${alert.attendedBy.lastName}`.trim(),
        }
      : null,
    resolvedAt: alert.resolvedAt,
    emailSent: alert.emailSent,
    suggestedQuantity: Math.max(0, Number(suggested.toFixed(3))),
  };
}

export class AlertsService {
  private get repo(): Repository<StockAlert> {
    return AppDataSource.getRepository(StockAlert);
  }

  private baseQuery(): SelectQueryBuilder<StockAlert> {
    return this.repo
      .createQueryBuilder('alert')
      .innerJoinAndSelect('alert.material', 'material')
      .leftJoinAndSelect('material.unit', 'unit')
      .leftJoinAndSelect('material.category', 'category')
      .leftJoinAndSelect('alert.attendedBy', 'attendedBy');
  }

  async list(
    filters: AlertFilters,
    pagination: PaginationQuery,
  ): Promise<PaginatedResult<AlertView>> {
    const query = this.baseQuery()
      .addSelect(
        `CASE alert.status WHEN 'PENDIENTE' THEN 0 WHEN 'ATENDIDA' THEN 1 ELSE 2 END`,
        'status_order',
      )
      .orderBy('status_order', 'ASC')
      .addOrderBy('alert.generatedAt', 'DESC')
      .skip(pagination.skip)
      .take(pagination.limit);

    if (filters.status) {
      query.andWhere('alert.status = :status', { status: filters.status });
    }
    if (filters.type) {
      query.andWhere('alert.type = :type', { type: filters.type });
    }
    if (filters.categoryId) {
      query.andWhere('material.categoryId = :categoryId', { categoryId: filters.categoryId });
    }
    if (filters.search) {
      query.andWhere('(material.code ILIKE :search OR material.name ILIKE :search)', {
        search: `%${filters.search}%`,
      });
    }

    const [rows, total] = await query.getManyAndCount();
    return paginate(rows.map(toAlertView), total, pagination);
  }

  async summary(): Promise<AlertSummary> {
    const [pending, attended, resolved] = await Promise.all([
      this.repo.count({ where: { status: StockAlertStatus.PENDING } }),
      this.repo.count({ where: { status: StockAlertStatus.ATTENDED } }),
      this.repo.count({ where: { status: StockAlertStatus.RESOLVED } }),
    ]);
    return { pending, attended, resolved, open: pending + attended };
  }

  async getById(id: number): Promise<AlertView> {
    const alert = await this.baseQuery().where('alert.id = :id', { id }).getOne();
    if (!alert) throw new NotFoundError('Alerta');
    return toAlertView(alert);
  }

  async attend(id: number, actor: Actor): Promise<AlertView> {
    const alert = await this.repo.findOne({ where: { id } });
    if (!alert) throw new NotFoundError('Alerta');
    if (alert.status !== StockAlertStatus.PENDING) {
      throw new BusinessRuleError('Solo se pueden atender alertas pendientes');
    }

    await this.repo.update(id, {
      status: StockAlertStatus.ATTENDED,
      attendedAt: new Date(),
      attendedById: actor.id,
    });
    await auditService.log({
      userId: actor.id,
      action: AuditAction.ATTEND,
      entity: 'alertas_stock',
      entityId: id,
      detail: { materialId: alert.materialId },
      ip: actor.ip,
    });
    return this.getById(id);
  }

  async reevaluateMaterial(materialId: number): Promise<AlertEvaluation> {
    const evaluation: AlertEvaluation = { created: [], resolved: [] };
    await AppDataSource.transaction(async (manager) => {
      const material = await manager.getRepository(Material).findOne({
        where: { id: materialId },
        relations: { unit: true, category: true },
      });
      if (!material || !material.active) return;
      await evaluateMaterialAlert(manager, material, evaluation);
    });
    alertNotifier.notifyCreated(evaluation.created);
    return evaluation;
  }

  async runFullCheck(
    trigger: 'cron' | 'manual',
    actorId: number | null = null,
  ): Promise<CheckResult> {
    const evaluation: AlertEvaluation = { created: [], resolved: [] };
    let evaluated = 0;

    await AppDataSource.transaction(async (manager) => {
      const materials = await manager.getRepository(Material).find({
        where: { active: true },
        relations: { unit: true, category: true },
      });
      for (const material of materials) {
        evaluated += 1;
        await evaluateMaterialAlert(manager, material, evaluation);
      }
    });

    const unsent = await this.baseQuery()
      .where('alert.status IN (:...statuses)', { statuses: OPEN_STATUSES })
      .andWhere('alert.emailSent = FALSE')
      .getMany();
    const notified = unsent.length > 0 && (await alertNotifier.send(unsent)) ? unsent.length : 0;

    const result: CheckResult = {
      evaluated,
      created: evaluation.created.length,
      resolved: evaluation.resolved.length,
      notified,
    };

    await auditService.log({
      userId: actorId,
      action: 'REVISION_STOCK',
      entity: 'alertas_stock',
      detail: { trigger, ...result },
    });
    logger.info(
      `Revisión de stock (${trigger}): ${result.evaluated} materiales, ${result.created} alertas nuevas, ${result.resolved} resueltas, ${result.notified} notificadas`,
    );
    return result;
  }

  countOpenByMaterial(materialIds: number[]): Promise<number> {
    if (materialIds.length === 0) return Promise.resolve(0);
    return this.repo.count({ where: { materialId: In(materialIds), status: In(OPEN_STATUSES) } });
  }
}

export const alertsService = new AlertsService();
