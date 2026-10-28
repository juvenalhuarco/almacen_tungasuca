import { EntityManager } from 'typeorm';
import { movementsService } from '../../modules/movements/movements.service';
import { Material, Movement, MovementType, Supplier, User, WorkFront } from '../entities';
import { ADMIN_USER, WAREHOUSE_USER } from './users.seed';

interface DemoLine {
  material: string;
  quantity?: number;
  countedStock?: number;
}

interface DemoMovement {
  daysAgo: number;
  type: MovementType;
  supplier?: string;
  workFront?: string;
  document?: string;
  requester?: string;
  notes?: string;
  seconds?: number;
  lines: DemoLine[];
}

const YURA = '20100047218';
const ACEROS = '20100096341';
const CONSTRUCTOR = '20506874556';

const DEMO_MOVEMENTS: DemoMovement[] = [
  {
    daysAgo: 44,
    type: MovementType.ENTRY,
    supplier: ACEROS,
    document: 'F001-00458',
    seconds: 180,
    lines: [
      { material: 'MAT-002', quantity: 120 },
      { material: 'MAT-008', quantity: 60 },
    ],
  },
  {
    daysAgo: 42,
    type: MovementType.EXIT,
    workFront: 'FR-01',
    requester: 'Ing. Yoel Pizarro',
    seconds: 150,
    lines: [
      { material: 'MAT-001', quantity: 60 },
      { material: 'MAT-002', quantity: 40 },
      { material: 'MAT-008', quantity: 25 },
    ],
  },
  {
    daysAgo: 40,
    type: MovementType.ADJUSTMENT,
    notes: 'Conteo físico mensual de agregados',
    seconds: 210,
    lines: [{ material: 'MAT-007', countedStock: 82 }],
  },
  {
    daysAgo: 38,
    type: MovementType.EXIT,
    workFront: 'FR-02',
    requester: 'Maestro de obra Juan Ccahuana',
    seconds: 135,
    lines: [
      { material: 'MAT-004', quantity: 30 },
      { material: 'MAT-005', quantity: 80 },
    ],
  },
  {
    daysAgo: 35,
    type: MovementType.ENTRY,
    supplier: YURA,
    document: 'F002-11890',
    seconds: 120,
    lines: [{ material: 'MAT-001', quantity: 200 }],
  },
  {
    daysAgo: 33,
    type: MovementType.EXIT,
    workFront: 'FR-01',
    requester: 'Ing. Yoel Pizarro',
    seconds: 160,
    lines: [
      { material: 'MAT-001', quantity: 80 },
      { material: 'MAT-006', quantity: 5 },
    ],
  },
  {
    daysAgo: 30,
    type: MovementType.ENTRY,
    supplier: CONSTRUCTOR,
    document: 'F003-00231',
    seconds: 170,
    lines: [
      { material: 'MAT-006', quantity: 40 },
      { material: 'MAT-003', quantity: 12 },
    ],
  },
  {
    daysAgo: 28,
    type: MovementType.EXIT,
    workFront: 'FR-03',
    requester: 'Ing. Rosa Mamani',
    seconds: 145,
    lines: [
      { material: 'MAT-002', quantity: 30 },
      { material: 'MAT-008', quantity: 20 },
      { material: 'MAT-009', quantity: 4 },
    ],
  },
  {
    daysAgo: 25,
    type: MovementType.EXIT,
    workFront: 'FR-02',
    requester: 'Maestro de obra Juan Ccahuana',
    seconds: 130,
    lines: [
      { material: 'MAT-001', quantity: 70 },
      { material: 'MAT-004', quantity: 25 },
      { material: 'MAT-005', quantity: 60 },
    ],
  },
  {
    daysAgo: 22,
    type: MovementType.ENTRY,
    supplier: YURA,
    document: 'F002-11954',
    seconds: 110,
    lines: [{ material: 'MAT-001', quantity: 150 }],
  },
  {
    daysAgo: 20,
    type: MovementType.EXIT,
    workFront: 'FR-01',
    requester: 'Ing. Yoel Pizarro',
    seconds: 125,
    lines: [
      { material: 'MAT-003', quantity: 5 },
      { material: 'MAT-006', quantity: 10 },
    ],
  },
  {
    daysAgo: 18,
    type: MovementType.EXIT,
    workFront: 'FR-03',
    requester: 'Ing. Rosa Mamani',
    seconds: 140,
    lines: [
      { material: 'MAT-009', quantity: 3 },
      { material: 'MAT-010', quantity: 2 },
    ],
  },
  {
    daysAgo: 15,
    type: MovementType.EXIT,
    workFront: 'FR-02',
    requester: 'Maestro de obra Juan Ccahuana',
    seconds: 155,
    lines: [
      { material: 'MAT-002', quantity: 25 },
      { material: 'MAT-008', quantity: 30 },
    ],
  },
  {
    daysAgo: 14,
    type: MovementType.ENTRY,
    supplier: CONSTRUCTOR,
    document: 'F003-00262',
    seconds: 115,
    lines: [{ material: 'MAT-010', quantity: 10 }],
  },
  {
    daysAgo: 12,
    type: MovementType.EXIT,
    workFront: 'FR-01',
    requester: 'Ing. Yoel Pizarro',
    seconds: 150,
    lines: [
      { material: 'MAT-001', quantity: 90 },
      { material: 'MAT-007', quantity: 20 },
    ],
  },
  {
    daysAgo: 10,
    type: MovementType.EXIT,
    workFront: 'FR-01',
    requester: 'Ing. Yoel Pizarro',
    seconds: 100,
    lines: [{ material: 'MAT-006', quantity: 12 }],
  },
  {
    daysAgo: 9,
    type: MovementType.EXIT,
    workFront: 'FR-02',
    requester: 'Maestro de obra Juan Ccahuana',
    seconds: 135,
    lines: [
      { material: 'MAT-004', quantity: 20 },
      { material: 'MAT-005', quantity: 40 },
    ],
  },
  {
    daysAgo: 7,
    type: MovementType.ENTRY,
    supplier: ACEROS,
    document: 'F001-00512',
    seconds: 165,
    lines: [
      { material: 'MAT-002', quantity: 60 },
      { material: 'MAT-008', quantity: 50 },
    ],
  },
  {
    daysAgo: 6,
    type: MovementType.EXIT,
    workFront: 'FR-03',
    requester: 'Ing. Rosa Mamani',
    seconds: 140,
    lines: [
      { material: 'MAT-002', quantity: 35 },
      { material: 'MAT-003', quantity: 3 },
    ],
  },
  {
    daysAgo: 5,
    type: MovementType.EXIT,
    workFront: 'FR-01',
    requester: 'Ing. Yoel Pizarro',
    seconds: 120,
    lines: [
      { material: 'MAT-001', quantity: 60 },
      { material: 'MAT-007', quantity: 15 },
    ],
  },
  {
    daysAgo: 4,
    type: MovementType.EXIT,
    workFront: 'FR-02',
    requester: 'Maestro de obra Juan Ccahuana',
    notes: 'Despacho duplicado por error, ver anulación',
    seconds: 95,
    lines: [{ material: 'MAT-005', quantity: 30 }],
  },
  {
    daysAgo: 3,
    type: MovementType.EXIT,
    workFront: 'FR-01',
    requester: 'Ing. Yoel Pizarro',
    seconds: 130,
    lines: [{ material: 'MAT-002', quantity: 32 }],
  },
  {
    daysAgo: 2,
    type: MovementType.ENTRY,
    supplier: YURA,
    document: 'F002-12031',
    seconds: 105,
    lines: [{ material: 'MAT-001', quantity: 100 }],
  },
  {
    daysAgo: 1,
    type: MovementType.EXIT,
    workFront: 'FR-03',
    requester: 'Ing. Rosa Mamani',
    seconds: 145,
    lines: [
      { material: 'MAT-009', quantity: 5 },
      { material: 'MAT-008', quantity: 20 },
    ],
  },
  {
    daysAgo: 0,
    type: MovementType.EXIT,
    workFront: 'FR-02',
    requester: 'Maestro de obra Juan Ccahuana',
    seconds: 110,
    lines: [
      { material: 'MAT-004', quantity: 15 },
      { material: 'MAT-001', quantity: 40 },
    ],
  },
];

const VOIDED_MOVEMENT_DAYS_AGO = 4;
const VOID_REASON = 'Despacho registrado dos veces por error del solicitante';

function demoDate(daysAgo: number, index: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(8 + (index % 8), (index * 7) % 60, 0, 0);
  if (date.getTime() > Date.now()) return new Date();
  return date;
}

export async function seedDemoMovements(manager: EntityManager): Promise<void> {
  const existing = await manager.getRepository(Movement).count();
  if (existing > 0) return;

  const admin = await manager
    .getRepository(User)
    .findOneOrFail({ where: { username: ADMIN_USER.username } });
  const warehouseUser = await manager
    .getRepository(User)
    .findOneOrFail({ where: { username: WAREHOUSE_USER.username } });
  const materials = await manager.getRepository(Material).find();
  const suppliers = await manager.getRepository(Supplier).find();
  const workFronts = await manager.getRepository(WorkFront).find();

  const materialId = (code: string): number => {
    const material = materials.find((m) => m.code === code);
    if (!material) throw new Error(`Material de demostración no encontrado: ${code}`);
    return material.id;
  };
  const supplierId = (ruc?: string): number | undefined =>
    ruc ? suppliers.find((s) => s.ruc === ruc)?.id : undefined;
  const workFrontId = (code?: string): number | undefined =>
    code ? workFronts.find((w) => w.code === code)?.id : undefined;

  let movementToVoid: number | null = null;
  const actor = { id: warehouseUser.id, ip: null };

  for (const [index, item] of DEMO_MOVEMENTS.entries()) {
    const created = await movementsService.create(
      {
        type: item.type,
        date: demoDate(item.daysAgo, index),
        documentNumber: item.document,
        supplierId: supplierId(item.supplier),
        workFrontId: workFrontId(item.workFront),
        requester: item.requester,
        notes: item.notes,
        registrationSeconds: item.seconds,
        lines: item.lines.map((line) => ({
          materialId: materialId(line.material),
          quantity: line.quantity,
          countedStock: line.countedStock,
        })),
      },
      actor,
    );
    if (item.daysAgo === VOIDED_MOVEMENT_DAYS_AGO) movementToVoid = created.id;
  }

  if (movementToVoid !== null) {
    await movementsService.void(movementToVoid, VOID_REASON, { id: admin.id, ip: null });
  }
}
