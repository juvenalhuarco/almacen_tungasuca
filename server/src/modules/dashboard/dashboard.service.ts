import { AppDataSource } from '../../config/data-source';
import { Material, Movement, MovementStatus, MovementType } from '../../database/entities';
import { materialsRepository } from '../materials/materials.repository';
import { alertsService } from '../alerts/alerts.service';

export interface KpiResult {
  key: 'TPA' | 'EIE' | 'IOSM';
  name: string;
  description: string;
  unit: 'min' | '%';
  baseline: number;
  target: number;
  actual: number | null;
  samples: number;
  lowerIsBetter: boolean;
  achieved: boolean;
}

export interface DashboardSummary {
  materials: { total: number; optimal: number; critical: number; outOfStock: number };
  alerts: { pending: number; attended: number; resolved: number; open: number };
  movements: { today: number; month: number; entriesMonth: number; exitsMonth: number };
  inventoryValue: number;
}

export interface DailyMovements {
  date: string;
  entradas: number;
  salidas: number;
  ajustes: number;
}

export interface CriticalMaterial {
  id: number;
  code: string;
  name: string;
  unit: string;
  currentStock: number;
  minimumStock: number;
  coverage: number;
}

export interface RecentMovement {
  id: number;
  code: string;
  type: MovementType;
  date: Date;
  documentNumber: string | null;
  counterpart: string | null;
  user: string;
  itemCount: number;
}

const KPI_TARGETS = {
  TPA: { baseline: 13, target: 3 },
  EIE: { baseline: 64, target: 95 },
  IOSM: { baseline: 33, target: 100 },
};

function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function daysAgo(days: number): Date {
  const result = startOfDay(new Date());
  result.setDate(result.getDate() - days);
  return result;
}

function toDateKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export class DashboardService {
  async summary(): Promise<DashboardSummary> {
    const now = new Date();

    const [materials, alerts, todayRows, monthRows, valueRows] = await Promise.all([
      materialsRepository.summary(),
      alertsService.summary(),
      AppDataSource.query(
        `SELECT COUNT(*) AS count FROM movimientos
         WHERE fecha >= $1 AND estado = 'REGISTRADO' AND anula_movimiento_id IS NULL`,
        [startOfDay(now)],
      ),
      AppDataSource.query(
        `SELECT tipo, COUNT(*) AS count FROM movimientos
         WHERE fecha >= $1 AND estado = 'REGISTRADO' AND anula_movimiento_id IS NULL
         GROUP BY tipo`,
        [startOfMonth(now)],
      ),
      AppDataSource.query(
        `SELECT COALESCE(SUM(stock_actual * precio_referencial), 0) AS value
         FROM materiales WHERE activo = TRUE`,
      ),
    ]);

    const countByType = (type: MovementType): number => {
      const row = monthRows.find((item: { tipo: string }) => item.tipo === type);
      return Number(row?.count ?? 0);
    };
    const entriesMonth = countByType(MovementType.ENTRY);
    const exitsMonth = countByType(MovementType.EXIT);
    const adjustmentsMonth = countByType(MovementType.ADJUSTMENT);

    return {
      materials,
      alerts,
      movements: {
        today: Number(todayRows[0]?.count ?? 0),
        month: entriesMonth + exitsMonth + adjustmentsMonth,
        entriesMonth,
        exitsMonth,
      },
      inventoryValue: Number(Number(valueRows[0]?.value ?? 0).toFixed(2)),
    };
  }

  async kpis(days = 30): Promise<KpiResult[]> {
    const from = daysAgo(days);

    // TPA: promedio en minutos del tiempo que tomó registrar cada movimiento.
    const [tpaRow] = await AppDataSource.query(
      `SELECT AVG(duracion_registro_seg) AS avg, COUNT(duracion_registro_seg) AS samples
       FROM movimientos
       WHERE fecha >= $1 AND duracion_registro_seg IS NOT NULL AND anula_movimiento_id IS NULL`,
      [from],
    );
    const tpaSamples = Number(tpaRow?.samples ?? 0);
    const tpaActual = tpaRow?.avg === null ? null : Number((Number(tpaRow.avg) / 60).toFixed(2));

    // EIE: materiales activos que no necesitaron ajuste por conteo físico en el periodo.
    const activeMaterials = await AppDataSource.getRepository(Material).count({
      where: { active: true },
    });
    const [adjustedRow] = await AppDataSource.query(
      `SELECT COUNT(DISTINCT d.material_id) AS count
       FROM detalle_movimientos d
       INNER JOIN movimientos m ON m.id = d.movimiento_id
       WHERE m.tipo = 'AJUSTE' AND m.estado = 'REGISTRADO'
         AND m.anula_movimiento_id IS NULL AND m.fecha >= $1`,
      [from],
    );
    const adjusted = Number(adjustedRow?.count ?? 0);
    const eieActual =
      activeMaterials > 0
        ? Number((((activeMaterials - adjusted) / activeMaterials) * 100).toFixed(1))
        : null;

    // IOSM: alertas emitidas cuando aún quedaba stock, antes del desabastecimiento.
    const [alertRow] = await AppDataSource.query(
      `SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE stock_al_generar > 0) AS timely
       FROM alertas_stock WHERE generada_en >= $1`,
      [from],
    );
    const alertTotal = Number(alertRow?.total ?? 0);
    const iosmActual =
      alertTotal > 0 ? Number(((Number(alertRow.timely) / alertTotal) * 100).toFixed(1)) : null;

    return [
      {
        key: 'TPA',
        name: 'Tiempo Promedio de Atención',
        description: 'Minutos que toma registrar cada movimiento de entrada o salida.',
        unit: 'min',
        ...KPI_TARGETS.TPA,
        actual: tpaActual,
        samples: tpaSamples,
        lowerIsBetter: true,
        achieved: tpaActual !== null && tpaActual <= KPI_TARGETS.TPA.target,
      },
      {
        key: 'EIE',
        name: 'Exactitud del Inventario de Existencias',
        description:
          'Materiales cuyo saldo digital coincidió con el físico (sin ajustes por conteo).',
        unit: '%',
        ...KPI_TARGETS.EIE,
        actual: eieActual,
        samples: activeMaterials,
        lowerIsBetter: false,
        achieved: eieActual !== null && eieActual >= KPI_TARGETS.EIE.target,
      },
      {
        key: 'IOSM',
        name: 'Identificación Oportuna de Stock Mínimo',
        description: 'Alertas emitidas antes de que el material se agotara por completo.',
        unit: '%',
        ...KPI_TARGETS.IOSM,
        actual: iosmActual,
        samples: alertTotal,
        lowerIsBetter: false,
        achieved: iosmActual !== null && iosmActual >= KPI_TARGETS.IOSM.target,
      },
    ];
  }

  async movementsByDay(days = 14): Promise<DailyMovements[]> {
    const from = daysAgo(days - 1);
    const rows: Array<{ date: string; tipo: MovementType; count: string }> =
      await AppDataSource.query(
        `SELECT TO_CHAR(fecha AT TIME ZONE 'America/Lima', 'YYYY-MM-DD') AS date, tipo, COUNT(*) AS count
         FROM movimientos
         WHERE fecha >= $1 AND estado = 'REGISTRADO' AND anula_movimiento_id IS NULL
         GROUP BY date, tipo`,
        [from],
      );

    const series: DailyMovements[] = [];
    for (let i = 0; i < days; i += 1) {
      const date = new Date(from);
      date.setDate(from.getDate() + i);
      series.push({ date: toDateKey(date), entradas: 0, salidas: 0, ajustes: 0 });
    }

    for (const row of rows) {
      const bucket = series.find((item) => item.date === row.date);
      if (!bucket) continue;
      if (row.tipo === MovementType.ENTRY) bucket.entradas = Number(row.count);
      if (row.tipo === MovementType.EXIT) bucket.salidas = Number(row.count);
      if (row.tipo === MovementType.ADJUSTMENT) bucket.ajustes = Number(row.count);
    }
    return series;
  }

  async criticalMaterials(limit = 6): Promise<CriticalMaterial[]> {
    const materials = await AppDataSource.getRepository(Material)
      .createQueryBuilder('material')
      .leftJoinAndSelect('material.unit', 'unit')
      .where('material.active = TRUE')
      .andWhere('material.currentStock <= material.minimumStock')
      .getMany();

    const coverageOf = (material: Material): number =>
      material.minimumStock > 0
        ? Math.round((material.currentStock / material.minimumStock) * 100)
        : 0;

    return materials
      .sort((a, b) => coverageOf(a) - coverageOf(b))
      .slice(0, limit)
      .map((material) => ({
        id: material.id,
        code: material.code,
        name: material.name,
        unit: material.unit.abbreviation,
        currentStock: material.currentStock,
        minimumStock: material.minimumStock,
        coverage: coverageOf(material),
      }));
  }

  async recentMovements(limit = 6): Promise<RecentMovement[]> {
    const movements = await AppDataSource.getRepository(Movement)
      .createQueryBuilder('movement')
      .leftJoinAndSelect('movement.user', 'user')
      .leftJoinAndSelect('movement.supplier', 'supplier')
      .leftJoinAndSelect('movement.workFront', 'workFront')
      .loadRelationCountAndMap('movement.itemCount', 'movement.details')
      .where('movement.status = :status', { status: MovementStatus.REGISTERED })
      .orderBy('movement.date', 'DESC')
      .addOrderBy('movement.id', 'DESC')
      .take(limit)
      .getMany();

    return movements.map((movement) => ({
      id: movement.id,
      code: movement.code,
      type: movement.type,
      date: movement.date,
      documentNumber: movement.documentNumber,
      counterpart: movement.supplier?.businessName ?? movement.workFront?.name ?? null,
      user: movement.user ? `${movement.user.firstName} ${movement.user.lastName}`.trim() : '',
      itemCount: (movement as Movement & { itemCount?: number }).itemCount ?? 0,
    }));
  }
}

export const dashboardService = new DashboardService();
