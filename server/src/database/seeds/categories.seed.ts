import { EntityManager } from 'typeorm';
import { Category } from '../entities';

const CATEGORIES = [
  { name: 'Estructuras', description: 'Cemento, concreto y afines' },
  { name: 'Acero', description: 'Fierro corrugado, alambres y perfiles' },
  { name: 'Aditivos', description: 'Aditivos y productos químicos para concreto' },
  { name: 'Tuberías', description: 'Tuberías y accesorios de PVC y HDPE' },
  { name: 'Agregados', description: 'Arena, piedra y materiales granulares' },
  { name: 'Eléctrico', description: 'Conductores, tableros y luminarias' },
  { name: 'Telecomunicaciones', description: 'Cableado estructurado y equipos de red' },
  { name: 'Herramientas', description: 'Herramientas manuales y eléctricas' },
];

export async function seedCategories(manager: EntityManager): Promise<void> {
  const repo = manager.getRepository(Category);
  for (const item of CATEGORIES) {
    const exists = await repo.findOne({ where: { name: item.name } });
    if (!exists) await repo.save(repo.create(item));
  }
}
