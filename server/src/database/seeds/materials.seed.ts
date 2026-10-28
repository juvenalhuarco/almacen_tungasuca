import { EntityManager } from 'typeorm';
import { Category, Material, UnitOfMeasure } from '../entities';

const MATERIALS = [
  {
    code: 'MAT-001',
    name: 'Cemento Yura Tipo IP 42.5kg',
    category: 'Estructuras',
    unit: 'bls',
    stock: 450,
    min: 100,
    price: 28.5,
    location: 'Zona A - Rack 1',
  },
  {
    code: 'MAT-002',
    name: 'Fierro Corrugado 1/2" Grade 60',
    category: 'Acero',
    unit: 'var',
    stock: 28,
    min: 50,
    price: 32.9,
    location: 'Patio de acero',
  },
  {
    code: 'MAT-003',
    name: 'Aditivo Acelerante Chema 3',
    category: 'Aditivos',
    unit: 'cil',
    stock: 4,
    min: 10,
    price: 185,
    location: 'Zona B - Rack 3',
  },
  {
    code: 'MAT-004',
    name: 'Tubería PVC SAP 4" Clase 10',
    category: 'Tuberías',
    unit: 'tubo',
    stock: 180,
    min: 40,
    price: 45.8,
    location: 'Zona C',
  },
  {
    code: 'MAT-005',
    name: 'Tubería HDPE 110mm PN10',
    category: 'Tuberías',
    unit: 'm',
    stock: 320,
    min: 80,
    price: 18.2,
    location: 'Zona C',
  },
  {
    code: 'MAT-006',
    name: 'Arena Gruesa',
    category: 'Agregados',
    unit: 'm³',
    stock: 12,
    min: 30,
    price: 65,
    location: 'Patio de agregados',
  },
  {
    code: 'MAT-007',
    name: 'Piedra Chancada 1/2"',
    category: 'Agregados',
    unit: 'm³',
    stock: 85,
    min: 25,
    price: 70,
    location: 'Patio de agregados',
  },
  {
    code: 'MAT-008',
    name: 'Alambre Negro Recocido #16',
    category: 'Acero',
    unit: 'kg',
    stock: 140,
    min: 30,
    price: 5.4,
    location: 'Zona A - Rack 2',
  },
  {
    code: 'MAT-009',
    name: 'Cable THW 12 AWG',
    category: 'Eléctrico',
    unit: 'rollo',
    stock: 25,
    min: 10,
    price: 210,
    location: 'Zona D - Rack 1',
  },
  {
    code: 'MAT-010',
    name: 'Cable UTP Cat 6A',
    category: 'Telecomunicaciones',
    unit: 'caja',
    stock: 6,
    min: 5,
    price: 520,
    location: 'Zona D - Rack 2',
  },
];

export async function seedMaterials(manager: EntityManager): Promise<void> {
  const repo = manager.getRepository(Material);
  const categories = await manager.getRepository(Category).find();
  const units = await manager.getRepository(UnitOfMeasure).find();

  for (const item of MATERIALS) {
    const exists = await repo.findOne({ where: { code: item.code } });
    if (exists) continue;

    const category = categories.find((c) => c.name === item.category);
    const unit = units.find((u) => u.abbreviation === item.unit);
    if (!category || !unit) {
      throw new Error(`Categoría o unidad no encontrada para el material ${item.code}`);
    }

    await repo.save(
      repo.create({
        code: item.code,
        name: item.name,
        categoryId: category.id,
        unitId: unit.id,
        currentStock: item.stock,
        minimumStock: item.min,
        referencePrice: item.price,
        location: item.location,
        active: true,
      }),
    );
  }
}
