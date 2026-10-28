import { EntityTarget, ObjectLiteral, Repository } from 'typeorm';
import { AppDataSource } from '../../config/data-source';
import { ConflictError, NotFoundError } from '../../common/errors/app-error';
import { PaginatedResult, PaginationQuery, paginate } from '../../common/utils/pagination';
import { auditService, AuditAction } from '../audit/audit.service';

export interface CatalogEntity extends ObjectLiteral {
  id: number;
  active: boolean;
}

export interface CatalogFilters {
  search?: string;
  active?: boolean;
  all?: boolean;
}

export interface Actor {
  id: number;
  ip: string | null;
}

export interface CatalogConfig<T extends CatalogEntity> {
  entity: EntityTarget<T>;
  table: string;
  label: string;
  searchable: Array<keyof T & string>;
  unique: Array<{ property: keyof T & string; message: string }>;
  orderBy: keyof T & string;
}

export class CatalogService<T extends CatalogEntity> {
  constructor(private readonly config: CatalogConfig<T>) {}

  private get repo(): Repository<T> {
    return AppDataSource.getRepository(this.config.entity);
  }

  async list(filters: CatalogFilters, pagination: PaginationQuery): Promise<PaginatedResult<T>> {
    const query = this.repo
      .createQueryBuilder('item')
      .orderBy(`item.${this.config.orderBy}`, 'ASC');

    if (filters.search) {
      const conditions = this.config.searchable
        .map((column) => `item.${column} ILIKE :search`)
        .join(' OR ');
      query.andWhere(`(${conditions})`, { search: `%${filters.search}%` });
    }
    if (filters.active !== undefined) {
      query.andWhere('item.active = :active', { active: filters.active });
    }

    if (filters.all) {
      const rows = await query.getMany();
      return paginate(rows, rows.length, { page: 1, limit: rows.length || 1, skip: 0 });
    }

    query.skip(pagination.skip).take(pagination.limit);
    const [rows, total] = await query.getManyAndCount();
    return paginate(rows, total, pagination);
  }

  async getById(id: number): Promise<T> {
    const item = await this.repo.findOne({ where: { id } as any });
    if (!item) throw new NotFoundError(this.config.label);
    return item;
  }

  async create(data: Partial<T>, actor: Actor): Promise<T> {
    await this.ensureUnique(data);
    const created = await this.repo.save(this.repo.create({ ...data, active: true } as T));
    await auditService.log({
      userId: actor.id,
      action: AuditAction.CREATE,
      entity: this.config.table,
      entityId: created.id,
      detail: { ...data },
      ip: actor.ip,
    });
    return created;
  }

  async update(id: number, data: Partial<T>, actor: Actor): Promise<T> {
    await this.getById(id);
    await this.ensureUnique(data, id);
    await this.repo.update(id, data as any);
    const updated = await this.getById(id);
    await auditService.log({
      userId: actor.id,
      action: AuditAction.UPDATE,
      entity: this.config.table,
      entityId: id,
      detail: { changes: data },
      ip: actor.ip,
    });
    return updated;
  }

  async setActive(id: number, active: boolean, actor: Actor): Promise<T> {
    await this.getById(id);
    await this.repo.update(id, { active } as any);
    const updated = await this.getById(id);
    await auditService.log({
      userId: actor.id,
      action: active ? AuditAction.ACTIVATE : AuditAction.DEACTIVATE,
      entity: this.config.table,
      entityId: id,
      ip: actor.ip,
    });
    return updated;
  }

  private async ensureUnique(data: Partial<T>, excludeId?: number): Promise<void> {
    for (const rule of this.config.unique) {
      const value = data[rule.property];
      if (value === undefined || value === null) continue;
      const existing = await this.repo.findOne({ where: { [rule.property]: value } as any });
      if (existing && existing.id !== excludeId) {
        throw new ConflictError(rule.message);
      }
    }
  }
}
