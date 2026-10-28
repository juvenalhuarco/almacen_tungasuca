import { AppDataSource } from '../../config/data-source';
import { Material, MovementDetail, MovementStatus, MovementType } from '../../database/entities';
import { NotFoundError } from '../../common/errors/app-error';
import { getStockStatus } from '../materials/materials.service';
import { StockStatus } from '../materials/materials.repository';

export interface StockReportFilters {
  categoryId?: number;
  stockStatus?: StockStatus;
  active?: boolean;
}

export interface StockReportRow {
  code: string;
  name: string;
  category: string;
  unit: string;
  location: string | null;
  currentStock: number;
  minimumStock: number;
  referencePrice: number;
  stockValue: number;
  stockStatus: StockStatus;
  active: boolean;
}

export interface StockReport {
  generatedAt: Date;
  rows: StockReportRow[];
  totals: {
    materials: number;
    optimal: number;
    critical: number;
    outOfStock: number;
    stockValue: number;
  };
}

export interface MovementReportFilters {
  from?: Date;
  to?: Date;
  type?: MovementType;
  status?: MovementStatus;
  workFrontId?: number;
  supplierId?: number;
  materialId?: number;
  categoryId?: number;
}

export interface MovementReportRow {
  movementId: number;
  code: string;
  type: MovementType;
  status: MovementStatus;
  date: Date;
  documentNumber: string | null;
  counterpart: string | null;
  requester: string | null;
  user: string;
  materialCode: string;
  materialName: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  previousStock: number;
  resultingStock: number;
}

export interface MovementReport {
  generatedAt: Date;
  period: { from: Date | null; to: Date | null };
  rows: MovementReportRow[];
  totals: {
    movements: number;
    lines: number;
    entries: number;
    exits: number;
    adjustments: number;
    value: number;
  };
}

export interface KardexReportRow {
  date: Date;
  code: string;
  type: MovementType;
  status: MovementStatus;
  isReversal: boolean;
  documentNumber: string | null;
  counterpart: string | null;
  user: string;
  entry: number;
  exit: number;
  balance: number;
  unitPrice: number;
}

export interface KardexReport {
  generatedAt: Date;
  material: {
    code: string;
    name: string;
    category: string;
    unit: string;
    currentStock: number;
    minimumStock: number;
  };
  period: { from: Date | null; to: Date | null };
  openingBalance: number;
  rows: KardexReportRow[];
  totals: { entries: number; exits: number; closingBalance: number };
}

function userName(user: { firstName: string; lastName: string } | null | undefined): string {
  return user ? `${user.firstName} ${user.lastName}`.trim() : '';
}

export class ReportsService {
  async stock(filters: StockReportFilters): Promise<StockReport> {
    const query = AppDataSource.getRepository(Material)
      .createQueryBuilder('material')
      .leftJoinAndSelect('material.category', 'category')
      .leftJoinAndSelect('material.unit', 'unit')
      .where('material.active = :active', { active: filters.active ?? true })
      .orderBy('category.name', 'ASC')
      .addOrderBy('material.code', 'ASC');

    if (filters.categoryId) {
      query.andWhere('material.categoryId = :categoryId', { categoryId: filters.categoryId });
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

    const materials = await query.getMany();
    const rows: StockReportRow[] = materials.map((material) => ({
      code: material.code,
      name: material.name,
      category: material.category.name,
      unit: material.unit.abbreviation,
      location: material.location,
      currentStock: material.currentStock,
      minimumStock: material.minimumStock,
      referencePrice: material.referencePrice,
      stockValue: Number((material.currentStock * material.referencePrice).toFixed(2)),
      stockStatus: getStockStatus(material.currentStock, material.minimumStock),
      active: material.active,
    }));

    return {
      generatedAt: new Date(),
      rows,
      totals: {
        materials: rows.length,
        optimal: rows.filter((row) => row.stockStatus === 'OPTIMO').length,
        critical: rows.filter((row) => row.stockStatus === 'CRITICO').length,
        outOfStock: rows.filter((row) => row.stockStatus === 'AGOTADO').length,
        stockValue: Number(rows.reduce((sum, row) => sum + row.stockValue, 0).toFixed(2)),
      },
    };
  }

  async movements(filters: MovementReportFilters): Promise<MovementReport> {
    const query = AppDataSource.getRepository(MovementDetail)
      .createQueryBuilder('detail')
      .innerJoinAndSelect('detail.movement', 'movement')
      .innerJoinAndSelect('detail.material', 'material')
      .leftJoinAndSelect('material.unit', 'unit')
      .leftJoinAndSelect('movement.user', 'user')
      .leftJoinAndSelect('movement.supplier', 'supplier')
      .leftJoinAndSelect('movement.workFront', 'workFront')
      .orderBy('movement.date', 'ASC')
      .addOrderBy('movement.id', 'ASC')
      .addOrderBy('detail.id', 'ASC');

    if (filters.from) {
      query.andWhere('movement.date >= :from', { from: filters.from });
    }
    if (filters.to) {
      query.andWhere('movement.date <= :to', { to: filters.to });
    }
    if (filters.type) {
      query.andWhere('movement.type = :type', { type: filters.type });
    }
    if (filters.status) {
      query.andWhere('movement.status = :status', { status: filters.status });
    }
    if (filters.workFrontId) {
      query.andWhere('movement.workFrontId = :workFrontId', { workFrontId: filters.workFrontId });
    }
    if (filters.supplierId) {
      query.andWhere('movement.supplierId = :supplierId', { supplierId: filters.supplierId });
    }
    if (filters.materialId) {
      query.andWhere('detail.materialId = :materialId', { materialId: filters.materialId });
    }
    if (filters.categoryId) {
      query.andWhere('material.categoryId = :categoryId', { categoryId: filters.categoryId });
    }

    const details = await query.getMany();
    const rows: MovementReportRow[] = details.map((detail) => {
      const movement = detail.movement;
      return {
        movementId: movement.id,
        code: movement.code,
        type: movement.type,
        status: movement.status,
        date: movement.date,
        documentNumber: movement.documentNumber,
        counterpart: movement.supplier?.businessName ?? movement.workFront?.name ?? null,
        requester: movement.requester,
        user: userName(movement.user),
        materialCode: detail.material.code,
        materialName: detail.material.name,
        unit: detail.material.unit?.abbreviation ?? '',
        quantity: detail.quantity,
        unitPrice: detail.unitPrice,
        subtotal: detail.subtotal,
        previousStock: detail.previousStock,
        resultingStock: detail.resultingStock,
      };
    });

    const registered = rows.filter((row) => row.status === MovementStatus.REGISTERED);
    const countByType = (type: MovementType) =>
      new Set(registered.filter((row) => row.type === type).map((row) => row.movementId)).size;

    return {
      generatedAt: new Date(),
      period: { from: filters.from ?? null, to: filters.to ?? null },
      rows,
      totals: {
        movements: new Set(rows.map((row) => row.movementId)).size,
        lines: rows.length,
        entries: countByType(MovementType.ENTRY),
        exits: countByType(MovementType.EXIT),
        adjustments: countByType(MovementType.ADJUSTMENT),
        value: Number(registered.reduce((sum, row) => sum + row.subtotal, 0).toFixed(2)),
      },
    };
  }

  async kardex(materialId: number, from?: Date, to?: Date): Promise<KardexReport> {
    const material = await AppDataSource.getRepository(Material).findOne({
      where: { id: materialId },
      relations: { category: true, unit: true },
    });
    if (!material) throw new NotFoundError('Material');

    const query = AppDataSource.getRepository(MovementDetail)
      .createQueryBuilder('detail')
      .innerJoinAndSelect('detail.movement', 'movement')
      .leftJoinAndSelect('movement.user', 'user')
      .leftJoinAndSelect('movement.supplier', 'supplier')
      .leftJoinAndSelect('movement.workFront', 'workFront')
      .where('detail.materialId = :materialId', { materialId })
      .orderBy('movement.date', 'ASC')
      .addOrderBy('detail.id', 'ASC');

    if (from) {
      query.andWhere('movement.date >= :from', { from });
    }
    if (to) {
      query.andWhere('movement.date <= :to', { to });
    }

    const details = await query.getMany();
    const openingBalance = details.length > 0 ? details[0].previousStock : material.currentStock;

    let entries = 0;
    let exits = 0;
    const rows: KardexReportRow[] = details.map((detail) => {
      const movement = detail.movement;
      const delta = detail.resultingStock - detail.previousStock;
      const entry = delta > 0 ? delta : 0;
      const exit = delta < 0 ? -delta : 0;
      entries += entry;
      exits += exit;
      return {
        date: movement.date,
        code: movement.code,
        type: movement.type,
        status: movement.status,
        isReversal: movement.reversesMovementId !== null,
        documentNumber: movement.documentNumber,
        counterpart: movement.supplier?.businessName ?? movement.workFront?.name ?? null,
        user: userName(movement.user),
        entry: Number(entry.toFixed(3)),
        exit: Number(exit.toFixed(3)),
        balance: detail.resultingStock,
        unitPrice: detail.unitPrice,
      };
    });

    return {
      generatedAt: new Date(),
      material: {
        code: material.code,
        name: material.name,
        category: material.category.name,
        unit: material.unit.abbreviation,
        currentStock: material.currentStock,
        minimumStock: material.minimumStock,
      },
      period: { from: from ?? null, to: to ?? null },
      openingBalance,
      rows,
      totals: {
        entries: Number(entries.toFixed(3)),
        exits: Number(exits.toFixed(3)),
        closingBalance: rows.length > 0 ? rows[rows.length - 1].balance : openingBalance,
      },
    };
  }
}

export const reportsService = new ReportsService();
