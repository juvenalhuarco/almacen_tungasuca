import { EntityManager } from 'typeorm';
import { Role, RoleName } from '../entities';

const ROLES = [
  {
    name: RoleName.ADMIN,
    description: 'Acceso total al sistema, gestión de usuarios y mantenimiento',
  },
  {
    name: RoleName.WAREHOUSE,
    description: 'Operación diaria del almacén: materiales, movimientos, alertas y reportes',
  },
];

export async function seedRoles(manager: EntityManager): Promise<void> {
  const repo = manager.getRepository(Role);
  for (const item of ROLES) {
    const exists = await repo.findOne({ where: { name: item.name } });
    if (!exists) await repo.save(repo.create(item));
  }
}
