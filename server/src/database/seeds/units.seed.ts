import { EntityManager } from 'typeorm';
import { UnitOfMeasure } from '../entities';

const UNITS = [
  { name: 'Unidad', abbreviation: 'und' },
  { name: 'Bolsa', abbreviation: 'bls' },
  { name: 'Varilla', abbreviation: 'var' },
  { name: 'Cilindro', abbreviation: 'cil' },
  { name: 'Tubo', abbreviation: 'tubo' },
  { name: 'Metro', abbreviation: 'm' },
  { name: 'Metro cúbico', abbreviation: 'm³' },
  { name: 'Kilogramo', abbreviation: 'kg' },
  { name: 'Galón', abbreviation: 'gal' },
  { name: 'Rollo', abbreviation: 'rollo' },
  { name: 'Caja', abbreviation: 'caja' },
];

export async function seedUnits(manager: EntityManager): Promise<void> {
  const repo = manager.getRepository(UnitOfMeasure);
  for (const item of UNITS) {
    const exists = await repo.findOne({ where: { abbreviation: item.abbreviation } });
    if (!exists) await repo.save(repo.create(item));
  }
}
