import { EntityManager } from 'typeorm';
import { WorkFront } from '../entities';

const WORK_FRONTS = [
  {
    code: 'FR-01',
    name: 'Frente 01: Pasaje Los Incas - Saneamiento',
    location: 'Tungasuca, Cusco',
    residentEngineer: 'Ing. Yoel Pizarro Quispe',
  },
  {
    code: 'FR-02',
    name: 'Frente 02: Av. Tungasuca Tramo I',
    location: 'Tungasuca, Cusco',
    residentEngineer: 'Ing. Yoel Pizarro Quispe',
  },
  {
    code: 'FR-03',
    name: 'Frente 03: Puente Peatonal Huancaro',
    location: 'Huancaro, Cusco',
    residentEngineer: 'Ing. Yoel Pizarro Quispe',
  },
];

export async function seedWorkFronts(manager: EntityManager): Promise<void> {
  const repo = manager.getRepository(WorkFront);
  for (const item of WORK_FRONTS) {
    const exists = await repo.findOne({ where: { code: item.code } });
    if (!exists) await repo.save(repo.create(item));
  }
}
