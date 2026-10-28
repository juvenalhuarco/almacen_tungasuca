import { AppDataSource } from '../../config/data-source';
import { Category, Material, UnitOfMeasure } from '../../database/entities';
import { BusinessRuleError, ConflictError, NotFoundError } from '../../common/errors/app-error';
import { PaginatedResult, PaginationQuery, paginate } from '../../common/utils/pagination';
import { auditService, AuditAction } from '../audit/audit.service';
import { alertsService } from '../alerts/alerts.service';
import {
  KardexEntry,
  MaterialFilters,
  MaterialSummary,
  materialsRepository,
  StockStatus,
} from './materials.repository';

export interface MaterialView {
  id: number;
  code: string;
  name: string;
  description: string | null;
  category: { id: number; name: string };
  unit: { id: number; name: string; abbreviation: string };
  currentStock: number;
  minimumStock: number;
  referencePrice: number;
  location: string | null;
  active: boolean;
  stockStatus: StockStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMaterialInput {
  code?: string;
  name: string;
  description?: string;
  categoryId: number;
  unitId: number;
  minimumStock: number;
  initialStock: number;
  referencePrice: number;
  location?: string;
}

export interface UpdateMaterialInput {
  name?: string;
  description?: string | null;
  categoryId?: number;
  unitId?: number;
  minimumStock?: number;
  referencePrice?: number;
  location?: string | null;
}

interface Actor {
  id: number;
  ip: string | null;
}

export function getStockStatus(currentStock: number, minimumStock: number): StockStatus {
  if (currentStock <= 0) return 'AGOTADO';
  if (currentStock <= minimumStock) return 'CRITICO';
  return 'OPTIMO';
}

export function toMaterialView(material: Material): MaterialView {
  return {
    id: material.id,
    code: material.code,
    name: material.name,
    description: material.description,
    category: { id: material.category.id, name: material.category.name },
    unit: {
      id: material.unit.id,
      name: material.unit.name,
      abbreviation: material.unit.abbreviation,
    },
    currentStock: material.currentStock,
    minimumStock: material.minimumStock,
    referencePrice: material.referencePrice,
    location: material.location,
    active: material.active,
    stockStatus: getStockStatus(material.currentStock, material.minimumStock),
    createdAt: material.createdAt,
    updatedAt: material.updatedAt,
  };
}

export class MaterialsService {
  async list(
    filters: MaterialFilters,
    pagination: PaginationQuery,
  ): Promise<PaginatedResult<MaterialView>> {
    const [rows, total] = await materialsRepository.findPaginated(filters, pagination);
    const meta = filters.all ? { page: 1, limit: rows.length || 1, skip: 0 } : pagination;
    return paginate(rows.map(toMaterialView), total, meta);
  }

  async getById(id: number): Promise<MaterialView> {
    return toMaterialView(await this.findOrFail(id));
  }

  summary(): Promise<MaterialSummary> {
    return materialsRepository.summary();
  }

  nextCode(): Promise<string> {
    return materialsRepository.nextCode();
  }

  kardex(id: number): Promise<KardexEntry[]> {
    return this.findOrFail(id).then(() => materialsRepository.kardex(id));
  }

  async create(input: CreateMaterialInput, actor: Actor): Promise<MaterialView> {
    const code = (input.code ?? (await materialsRepository.nextCode())).toUpperCase();
    if (await materialsRepository.findByCode(code)) {
      throw new ConflictError(`Ya existe un material con el código ${code}`);
    }
    await this.ensureCategory(input.categoryId);
    await this.ensureUnit(input.unitId);

    const created = await materialsRepository.create({
      code,
      name: input.name,
      description: input.description ?? null,
      categoryId: input.categoryId,
      unitId: input.unitId,
      currentStock: input.initialStock,
      minimumStock: input.minimumStock,
      referencePrice: input.referencePrice,
      location: input.location ?? null,
      active: true,
    });

    await auditService.log({
      userId: actor.id,
      action: AuditAction.CREATE,
      entity: 'materiales',
      entityId: created.id,
      detail: {
        code,
        name: input.name,
        initialStock: input.initialStock,
        minimumStock: input.minimumStock,
      },
      ip: actor.ip,
    });
    await alertsService.reevaluateMaterial(created.id);
    return this.getById(created.id);
  }

  async update(id: number, input: UpdateMaterialInput, actor: Actor): Promise<MaterialView> {
    await this.findOrFail(id);
    if (input.categoryId !== undefined) await this.ensureCategory(input.categoryId);
    if (input.unitId !== undefined) await this.ensureUnit(input.unitId);

    await materialsRepository.update(id, {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.categoryId !== undefined ? { categoryId: input.categoryId } : {}),
      ...(input.unitId !== undefined ? { unitId: input.unitId } : {}),
      ...(input.minimumStock !== undefined ? { minimumStock: input.minimumStock } : {}),
      ...(input.referencePrice !== undefined ? { referencePrice: input.referencePrice } : {}),
      ...(input.location !== undefined ? { location: input.location } : {}),
    });

    await auditService.log({
      userId: actor.id,
      action: AuditAction.UPDATE,
      entity: 'materiales',
      entityId: id,
      detail: { changes: input },
      ip: actor.ip,
    });
    if (input.minimumStock !== undefined) await alertsService.reevaluateMaterial(id);
    return this.getById(id);
  }

  async setMinimumStock(id: number, minimumStock: number, actor: Actor): Promise<MaterialView> {
    const material = await this.findOrFail(id);
    await materialsRepository.update(id, { minimumStock });
    await auditService.log({
      userId: actor.id,
      action: AuditAction.UPDATE,
      entity: 'materiales',
      entityId: id,
      detail: { field: 'stock_minimo', from: material.minimumStock, to: minimumStock },
      ip: actor.ip,
    });
    await alertsService.reevaluateMaterial(id);
    return this.getById(id);
  }

  async setActive(id: number, active: boolean, actor: Actor): Promise<MaterialView> {
    const material = await this.findOrFail(id);
    if (!active && material.currentStock > 0) {
      throw new BusinessRuleError(
        'No se puede desactivar un material con existencias. Registre primero la salida o el ajuste del stock.',
      );
    }
    await materialsRepository.update(id, { active });
    await auditService.log({
      userId: actor.id,
      action: active ? AuditAction.ACTIVATE : AuditAction.DEACTIVATE,
      entity: 'materiales',
      entityId: id,
      ip: actor.ip,
    });
    return this.getById(id);
  }

  private async findOrFail(id: number): Promise<Material> {
    const material = await materialsRepository.findById(id);
    if (!material) throw new NotFoundError('Material');
    return material;
  }

  private async ensureCategory(id: number): Promise<void> {
    const category = await AppDataSource.getRepository(Category).findOne({ where: { id } });
    if (!category) throw new BusinessRuleError('La categoría indicada no existe');
    if (!category.active) throw new BusinessRuleError('La categoría indicada está inactiva');
  }

  private async ensureUnit(id: number): Promise<void> {
    const unit = await AppDataSource.getRepository(UnitOfMeasure).findOne({ where: { id } });
    if (!unit) throw new BusinessRuleError('La unidad de medida indicada no existe');
    if (!unit.active) throw new BusinessRuleError('La unidad de medida indicada está inactiva');
  }
}

export const materialsService = new MaterialsService();
