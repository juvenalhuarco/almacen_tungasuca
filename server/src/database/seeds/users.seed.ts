import { EntityManager } from 'typeorm';
import { hashPassword } from '../../modules/auth/auth.service';
import { Role, RoleName, User } from '../entities';

export const ADMIN_USER = {
  username: 'admin',
  password: 'admin',
  dni: '00000001',
  firstName: 'Administrador',
  lastName: 'Sistema',
  email: 'admin@tungasuca.pe',
};

export const WAREHOUSE_USER = {
  username: 'jhuarco',
  password: 'Almacen2026*',
  dni: '70123456',
  firstName: 'Juvenal',
  lastName: 'Huarco Huamán',
  email: 'jhuarco@tungasuca.pe',
};

export async function seedUsers(manager: EntityManager): Promise<void> {
  const roleRepo = manager.getRepository(Role);
  const userRepo = manager.getRepository(User);

  const adminRole = await roleRepo.findOneOrFail({ where: { name: RoleName.ADMIN } });
  const warehouseRole = await roleRepo.findOneOrFail({ where: { name: RoleName.WAREHOUSE } });

  const adminExists = await userRepo.findOne({ where: { username: ADMIN_USER.username } });
  if (!adminExists) {
    await userRepo.save(
      userRepo.create({
        username: ADMIN_USER.username,
        dni: ADMIN_USER.dni,
        firstName: ADMIN_USER.firstName,
        lastName: ADMIN_USER.lastName,
        email: ADMIN_USER.email,
        passwordHash: await hashPassword(ADMIN_USER.password),
        roleId: adminRole.id,
        active: true,
      }),
    );
  }

  const warehouseExists = await userRepo.findOne({ where: { username: WAREHOUSE_USER.username } });
  if (!warehouseExists) {
    await userRepo.save(
      userRepo.create({
        username: WAREHOUSE_USER.username,
        dni: WAREHOUSE_USER.dni,
        firstName: WAREHOUSE_USER.firstName,
        lastName: WAREHOUSE_USER.lastName,
        email: WAREHOUSE_USER.email,
        passwordHash: await hashPassword(WAREHOUSE_USER.password),
        roleId: warehouseRole.id,
        active: true,
      }),
    );
  }
}
