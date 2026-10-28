import { EntityManager } from 'typeorm';
import { AppDataSource } from '../../config/data-source';
import {
  Material,
  Movement,
  MovementDetail,
  MovementStatus,
  MovementType,
  Supplier,
  WorkFront,
} from '../../database/entities';
import { BusinessRuleError, NotFoundError } from '../../common/errors/app-error';
import { PaginatedResult, PaginationQuery, paginate } from '../../common/utils/pagination';
import { auditService, AuditAction } from '../audit/audit.service';
import { AlertEvaluation, evaluateMaterialAlert } from '../alerts/alerts.evaluator';
import { alertNotifier } from '../alerts/alerts.notifier';
import { MovementFilters, movementsRepository } from './movements.repository';

export interface MovementLineInput {
  materialId: number;
  quantity?: number;
  unitPrice?: number;
  countedStock?: number;
}

export interface CreateMovementInput {
  type: MovementType;
  date?: Date;
  documentNumber?: string;
  supplierId?: number;
  workFrontId?: number;
  requester?: string;
  notes?: string;
  registrationSeconds?: number;
  lines: MovementLineInput[];
}

interface Actor {
  id: number;
  ip: string | null;
}

export interface MovementLineView {
  id: number;
  material: {
    id: number;
    code: string;
    name: string;
    unit: string;
    category: string;
  };
  quantity: number;
  unitPrice: number;
  subtotal: number;
  previousStock: number;
  resultingStock: number;
}

export interface MovementView {
  id: number;
  code: string;
  type: MovementType;
  date: Date;
  documentNumber: string | null;
  supplier: { id: number; name: string } | null;
  workFront: { id: number; code: string; name: string } | null;
  requester: string | null;
  user: { id: number; name: string };
  notes: string | null;
  status: MovementStatus;
  voidReason: string | null;
  voidedBy: { id: number; name: string } | null;
  voidedAt: Date | null;
  registrationSeconds: number | null;
  total: number;
  itemCount: number;
  reversesMovement: { id: number; code: string } | null;
  createdAt: Date;
  lines?: MovementLineView[];
}

const CODE_PREFIX: Record<MovementType, string> = {
  [MovementType.ENTRY]: 'ING',
  [MovementType.EXIT]: 'SAL',
  [MovementType.ADJUSTMENT]: 'AJU',
};

function userName(user: { firstName: string; lastName: string } | null | undefined): string {
  return user ? `${user.firstName} ${user.lastName}`.trim() : '';
}

export function toMovementView(movement: Movement, includeLines = false): MovementView {
  const view: MovementView = {
    id: movement.id,
    code: movement.code,
    type: movement.type,
    date: movement.date,
    documentNumber: movement.documentNumber,
    supplier: movement.supplier
      ? { id: movement.supplier.id, name: movement.supplier.businessName }
      : null,
    workFront: movement.workFront
      ? { id: movement.workFront.id, code: movement.workFront.code, name: movement.workFront.name }
      : null,
    requester: movement.requester,
    user: { id: movement.userId, name: userName(movement.user) },
    notes: movement.notes,
    status: movement.status,
    voidReason: movement.voidReason,
    voidedBy: movement.voidedBy
      ? { id: movement.voidedBy.id, name: userName(movement.voidedBy) }
      : null,
    voidedAt: movement.voidedAt,
    registrationSeconds: movement.registrationSeconds,
    total: movement.total,
    itemCount:
      (movement as Movement & { itemCount?: number }).itemCount ?? movement.details?.length ?? 0,
    reversesMovement: movement.reversesMovement
      ? { id: movement.reversesMovement.id, code: movement.reversesMovement.code }
      : null,
    createdAt: movement.createdAt,
  };
  if (includeLines && movement.details) {
    view.lines = movement.details.map((detail) => ({
      id: detail.id,
      material: {
        id: detail.material.id,
        code: detail.material.code,
        name: detail.material.name,
        unit: detail.material.unit?.abbreviation ?? '',
        category: detail.material.category?.name ?? '',
      },
      quantity: detail.quantity,
      unitPrice: detail.unitPrice,
      subtotal: detail.subtotal,
      previousStock: detail.previousStock,
      resultingStock: detail.resultingStock,
    }));
  }
  return view;
}

export class MovementsService {
  async list(
    filters: MovementFilters,
    pagination: PaginationQuery,
  ): Promise<PaginatedResult<MovementView>> {
    const [rows, total] = await movementsRepository.findPaginated(filters, pagination);
    return paginate(
      rows.map((row) => toMovementView(row)),
      total,
      pagination,
    );
  }

  async getById(id: number): Promise<MovementView> {
    const movement = await movementsRepository.findById(id);
    if (!movement) throw new NotFoundError('Movimiento');
    return toMovementView(movement, true);
  }

  async create(input: CreateMovementInput, actor: Actor): Promise<MovementView> {
    this.validateHeader(input);
    const evaluation: AlertEvaluation = { created: [], resolved: [] };

    const movementId = await AppDataSource.transaction(async (manager) => {
      await this.ensureCounterparts(manager, input);

      const materials = await this.lockMaterials(
        manager,
        input.lines.map((line) => line.materialId),
      );

      const details: MovementDetail[] = [];
      let total = 0;
      for (const line of input.lines) {
        const material = materials.get(line.materialId)!;
        const detail = this.buildDetail(input.type, line, material);
        details.push(detail);
        total += detail.subtotal;
      }

      const code = await this.nextCode(manager, input.type, input.date ?? new Date());
      const movementRepo = manager.getRepository(Movement);
      const movement = await movementRepo.save(
        movementRepo.create({
          code,
          type: input.type,
          date: input.date ?? new Date(),
          documentNumber: input.documentNumber ?? null,
          supplierId: input.type === MovementType.ENTRY ? (input.supplierId ?? null) : null,
          workFrontId: input.type === MovementType.EXIT ? (input.workFrontId ?? null) : null,
          requester: input.requester ?? null,
          userId: actor.id,
          notes: input.notes ?? null,
          status: MovementStatus.REGISTERED,
          registrationSeconds: input.registrationSeconds ?? null,
          total: Number(total.toFixed(2)),
          reversesMovementId: null,
        }),
      );

      await this.applyDetails(manager, movement.id, details, materials, evaluation);

      await auditService.log(
        {
          userId: actor.id,
          action: AuditAction.CREATE,
          entity: 'movimientos',
          entityId: movement.id,
          detail: {
            code,
            type: input.type,
            items: details.map((d) => ({
              materialId: d.materialId,
              quantity: d.quantity,
              resultingStock: d.resultingStock,
            })),
          },
          ip: actor.ip,
        },
        manager,
      );

      return movement.id;
    });

    alertNotifier.notifyCreated(evaluation.created);
    return this.getById(movementId);
  }

  async void(id: number, reason: string, actor: Actor): Promise<MovementView> {
    const evaluation: AlertEvaluation = { created: [], resolved: [] };

    await AppDataSource.transaction(async (manager) => {
      const original = await manager.getRepository(Movement).findOne({
        where: { id },
        relations: { details: { material: true } },
      });
      if (!original) throw new NotFoundError('Movimiento');
      if (original.status === MovementStatus.VOIDED) {
        throw new BusinessRuleError('El movimiento ya se encuentra anulado');
      }
      if (original.reversesMovementId !== null) {
        throw new BusinessRuleError('No se puede anular un movimiento de reversión');
      }

      const materials = await this.lockMaterials(
        manager,
        original.details.map((detail) => detail.materialId),
      );

      const details: MovementDetail[] = [];
      for (const detail of original.details) {
        const material = materials.get(detail.materialId)!;
        const delta = detail.resultingStock - detail.previousStock;
        const resulting = round3(material.currentStock - delta);
        if (resulting < 0) {
          throw new BusinessRuleError(
            `No se puede anular: el material ${material.code} quedaría con stock negativo (${resulting}). Registre primero un ingreso.`,
          );
        }
        const reversal = new MovementDetail();
        reversal.materialId = material.id;
        reversal.quantity = detail.quantity;
        reversal.unitPrice = detail.unitPrice;
        reversal.subtotal = detail.subtotal;
        reversal.previousStock = material.currentStock;
        reversal.resultingStock = resulting;
        details.push(reversal);
      }

      const now = new Date();
      const code = await this.nextCode(manager, MovementType.ADJUSTMENT, now);
      const movementRepo = manager.getRepository(Movement);
      const reversalMovement = await movementRepo.save(
        movementRepo.create({
          code,
          type: MovementType.ADJUSTMENT,
          date: now,
          documentNumber: original.code,
          supplierId: null,
          workFrontId: null,
          requester: null,
          userId: actor.id,
          notes: `Reversión por anulación de ${original.code}: ${reason}`,
          status: MovementStatus.REGISTERED,
          registrationSeconds: null,
          total: original.total,
          reversesMovementId: original.id,
        }),
      );

      await this.applyDetails(manager, reversalMovement.id, details, materials, evaluation);

      await movementRepo.update(original.id, {
        status: MovementStatus.VOIDED,
        voidReason: reason,
        voidedById: actor.id,
        voidedAt: now,
      });

      await auditService.log(
        {
          userId: actor.id,
          action: AuditAction.VOID,
          entity: 'movimientos',
          entityId: original.id,
          detail: { code: original.code, reason, reversalCode: code },
          ip: actor.ip,
        },
        manager,
      );
    });

    alertNotifier.notifyCreated(evaluation.created);
    return this.getById(id);
  }

  private validateHeader(input: CreateMovementInput): void {
    if (!Object.values(MovementType).includes(input.type)) {
      throw new BusinessRuleError('Tipo de movimiento no válido');
    }
    if (input.lines.length === 0) {
      throw new BusinessRuleError('Debe registrar al menos un material');
    }
    const ids = input.lines.map((line) => line.materialId);
    if (new Set(ids).size !== ids.length) {
      throw new BusinessRuleError('No puede repetir el mismo material en varias líneas');
    }
    if (input.type === MovementType.EXIT && !input.workFrontId) {
      throw new BusinessRuleError('Las salidas requieren indicar el frente de obra de destino');
    }
    if (input.type === MovementType.ADJUSTMENT && !input.notes) {
      throw new BusinessRuleError('Los ajustes requieren indicar el motivo en observaciones');
    }
    if (input.date && input.date.getTime() > Date.now() + 5 * 60 * 1000) {
      throw new BusinessRuleError('La fecha del movimiento no puede ser futura');
    }
  }

  private async ensureCounterparts(
    manager: EntityManager,
    input: CreateMovementInput,
  ): Promise<void> {
    if (input.type === MovementType.ENTRY && input.supplierId) {
      const supplier = await manager
        .getRepository(Supplier)
        .findOne({ where: { id: input.supplierId } });
      if (!supplier || !supplier.active)
        throw new BusinessRuleError('El proveedor indicado no existe o está inactivo');
    }
    if (input.type === MovementType.EXIT && input.workFrontId) {
      const workFront = await manager
        .getRepository(WorkFront)
        .findOne({ where: { id: input.workFrontId } });
      if (!workFront || !workFront.active)
        throw new BusinessRuleError('El frente de obra indicado no existe o está inactivo');
    }
  }

  private async lockMaterials(
    manager: EntityManager,
    ids: number[],
  ): Promise<Map<number, Material>> {
    const rows = await manager
      .getRepository(Material)
      .createQueryBuilder('material')
      .setLock('pessimistic_write')
      .where('material.id IN (:...ids)', { ids })
      .getMany();

    const map = new Map(rows.map((row) => [row.id, row]));
    for (const id of ids) {
      const material = map.get(id);
      if (!material) throw new BusinessRuleError(`El material con id ${id} no existe`);
      if (!material.active)
        throw new BusinessRuleError(`El material ${material.code} está inactivo`);
    }
    return map;
  }

  private buildDetail(
    type: MovementType,
    line: MovementLineInput,
    material: Material,
  ): MovementDetail {
    const detail = new MovementDetail();
    detail.materialId = material.id;
    detail.previousStock = material.currentStock;

    if (type === MovementType.ADJUSTMENT) {
      const counted = line.countedStock;
      if (counted === undefined || counted < 0) {
        throw new BusinessRuleError(`Indique el stock físico contado para ${material.code}`);
      }
      const diff = round3(counted - material.currentStock);
      if (diff === 0) {
        throw new BusinessRuleError(`El material ${material.code} no presenta diferencia de stock`);
      }
      detail.quantity = Math.abs(diff);
      detail.resultingStock = round3(counted);
      detail.unitPrice = line.unitPrice ?? material.referencePrice;
    } else {
      const quantity = line.quantity;
      if (quantity === undefined || quantity <= 0) {
        throw new BusinessRuleError(`La cantidad de ${material.code} debe ser mayor que cero`);
      }
      detail.quantity = round3(quantity);
      detail.unitPrice = line.unitPrice ?? material.referencePrice;
      if (type === MovementType.ENTRY) {
        detail.resultingStock = round3(material.currentStock + detail.quantity);
      } else {
        detail.resultingStock = round3(material.currentStock - detail.quantity);
        if (detail.resultingStock < 0) {
          throw new BusinessRuleError(
            `Stock insuficiente para ${material.code} - ${material.name}: disponible ${material.currentStock}, solicitado ${detail.quantity}`,
          );
        }
      }
    }

    detail.subtotal = Number((detail.quantity * detail.unitPrice).toFixed(2));
    return detail;
  }

  private async applyDetails(
    manager: EntityManager,
    movementId: number,
    details: MovementDetail[],
    materials: Map<number, Material>,
    evaluation: AlertEvaluation,
  ): Promise<void> {
    const detailRepo = manager.getRepository(MovementDetail);
    const materialRepo = manager.getRepository(Material);

    for (const detail of details) {
      detail.movementId = movementId;
      await detailRepo.save(detail);

      const material = materials.get(detail.materialId)!;
      material.currentStock = detail.resultingStock;
      await materialRepo.update(material.id, { currentStock: detail.resultingStock });
      await evaluateMaterialAlert(manager, material, evaluation);
    }
  }

  private async nextCode(manager: EntityManager, type: MovementType, date: Date): Promise<string> {
    const year = date.getFullYear();
    const prefix = `${CODE_PREFIX[type]}-${year}-`;
    await manager.query('SELECT pg_advisory_xact_lock(hashtext($1))', [prefix]);
    const rows = await manager.query(
      `SELECT MAX(CAST(SUBSTRING(codigo FROM ${prefix.length + 1}) AS INTEGER)) AS max FROM movimientos WHERE codigo LIKE $1`,
      [`${prefix}%`],
    );
    const next = (Number(rows[0]?.max) || 0) + 1;
    return `${prefix}${String(next).padStart(4, '0')}`;
  }
}

function round3(value: number): number {
  return Number(value.toFixed(3));
}

export const movementsService = new MovementsService();
