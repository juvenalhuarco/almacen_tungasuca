import { Repository, SelectQueryBuilder } from 'typeorm';
import { AppDataSource } from '../../config/data-source';
import { Material, MovementDetail } from '../../database/entities';
import { PaginationQuery } from '../../common/utils/pagination';

export type StockStatus = 'OPTIMO' | 'CRITICO' | 'AGOTADO';

export interface MaterialFilters {
  search?: string;
  categoryId?: number;
  stockStatus?: StockStatus;
  active?: boolean;
  all?: boolean;
}

export interface MaterialSummary {
  total: number;
  optimal: number;
  critical: number;
  outOfStock: number;
}

export interface KardexEntry {
  detailId: number;
  movementId: number;
  movementCode: string;
  movementType: string;
  movementStatus: string;
  isReversal: boolean;
  date: Date;
  documentNumber: string | null;
  counterpart: string | null;
  user: string;
  quantity: number;
  previousStock: number;
  resultingStock: number;
  unitPrice: number;
}

export class MaterialsRepository {
  private get repo(): Repository<Material> {
    return AppDataSource.getRepository(Material);
  }

  private baseQuery(): SelectQueryBuilder<Material> {
    return this.repo
      .createQueryBuilder('material')
      .leftJoinAndSelect('material.category', 'category')
      .leftJoinAndSelect('material.unit', 'unit');
  }

  private applyFilters(query: SelectQueryBuilder<Material>, filters: MaterialFilters): void {
    if (filters.search) {
      query.andWhere(
        '(material.code ILIKE :search OR material.name ILIKE :search OR material.description ILIKE :search OR category.name ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }
    if (filters.categoryId !== undefined) {
      query.andWhere('material.categoryId = :categoryId', { categoryId: filters.categoryId });
    }
    if (filters.active !== undefined) {
      query.andWhere('material.active = :active', { active: filters.active });
    }
    if (filters.stockStatus === 'AGOTADO') {
      query.andWhere('material.currentStock <= 0');
    }
    if (filters.stockStatus === 'CRITICO') {
      query.andWhere(
        'material.currentStock > 0 AND material.currentStock <= material.minimumStock',
      );
    }
    if (filters.stockStatus === 'OPTIMO') {
      query.andWhere('material.currentStock > material.minimumStock');
    }
  }

  async findPaginated(
    filters: MaterialFilters,
    pagination: PaginationQuery,
  ): Promise<[Material[], number]> {
    const query = this.baseQuery().orderBy('material.code', 'ASC');
    this.applyFilters(query, filters);

    if (filters.all) {
      const rows = await query.getMany();
      return [rows, rows.length];
    }

    query.skip(pagination.skip).take(pagination.limit);
    return query.getManyAndCount();
  }

  findById(id: number): Promise<Material | null> {
    return this.baseQuery().where('material.id = :id', { id }).getOne();
  }

  findByCode(code: string): Promise<Material | null> {
    return this.repo.findOne({ where: { code } });
  }

  create(data: Partial<Material>): Promise<Material> {
    return this.repo.save(this.repo.create(data));
  }

  async update(id: number, data: Partial<Material>): Promise<void> {
    await this.repo.update({ id }, data);
  }

  async nextCode(): Promise<string> {
    const rows = await AppDataSource.query(
      `SELECT MAX(CAST(SUBSTRING(codigo FROM '^MAT-([0-9]+)$') AS INTEGER)) AS max FROM materiales`,
    );
    const next = (Number(rows[0]?.max) || 0) + 1;
    return `MAT-${String(next).padStart(3, '0')}`;
  }

  async summary(): Promise<MaterialSummary> {
    const rows = await AppDataSource.query(`
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE stock_actual > stock_minimo) AS optimal,
        COUNT(*) FILTER (WHERE stock_actual > 0 AND stock_actual <= stock_minimo) AS critical,
        COUNT(*) FILTER (WHERE stock_actual <= 0) AS out_of_stock
      FROM materiales
      WHERE activo = TRUE
    `);
    const row = rows[0] ?? {};
    return {
      total: Number(row.total ?? 0),
      optimal: Number(row.optimal ?? 0),
      critical: Number(row.critical ?? 0),
      outOfStock: Number(row.out_of_stock ?? 0),
    };
  }

  async kardex(materialId: number, limit = 200): Promise<KardexEntry[]> {
    const details = await AppDataSource.getRepository(MovementDetail)
      .createQueryBuilder('detail')
      .innerJoinAndSelect('detail.movement', 'movement')
      .leftJoinAndSelect('movement.user', 'user')
      .leftJoinAndSelect('movement.supplier', 'supplier')
      .leftJoinAndSelect('movement.workFront', 'workFront')
      .where('detail.materialId = :materialId', { materialId })
      .orderBy('movement.date', 'DESC')
      .addOrderBy('detail.id', 'DESC')
      .take(limit)
      .getMany();

    return details.map((detail) => {
      const movement = detail.movement;
      return {
        detailId: detail.id,
        movementId: movement.id,
        movementCode: movement.code,
        movementType: movement.type,
        movementStatus: movement.status,
        isReversal: movement.reversesMovementId !== null,
        date: movement.date,
        documentNumber: movement.documentNumber,
        counterpart: movement.supplier?.businessName ?? movement.workFront?.name ?? null,
        user: movement.user ? `${movement.user.firstName} ${movement.user.lastName}`.trim() : '',
        quantity: detail.quantity,
        previousStock: detail.previousStock,
        resultingStock: detail.resultingStock,
        unitPrice: detail.unitPrice,
      };
    });
  }
}

export const materialsRepository = new MaterialsRepository();
