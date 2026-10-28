import { BusinessRuleError, ConflictError, NotFoundError } from '../../common/errors/app-error';
import { PaginatedResult, PaginationQuery, paginate } from '../../common/utils/pagination';
import { Role, RoleName, User } from '../../database/entities';
import { AppDataSource } from '../../config/data-source';
import { usersRepository, UserFilters } from './users.repository';
import { auditService, AuditAction } from '../audit/audit.service';
import { hashPassword, PublicUser, toPublicUser } from '../auth/auth.service';

export interface CreateUserInput {
  username: string;
  dni: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  password: string;
  roleId: number;
}

export interface UpdateUserInput {
  dni?: string;
  firstName?: string;
  lastName?: string;
  email?: string | null;
  phone?: string | null;
  roleId?: number;
}

interface Actor {
  id: number;
  ip: string | null;
}

export class UsersService {
  async list(
    filters: UserFilters,
    pagination: PaginationQuery,
  ): Promise<PaginatedResult<PublicUser>> {
    const [users, total] = await usersRepository.findPaginated(filters, pagination);
    return paginate(users.map(toPublicUser), total, pagination);
  }

  async getById(id: number): Promise<PublicUser> {
    const user = await this.findOrFail(id);
    return toPublicUser(user);
  }

  async create(input: CreateUserInput, actor: Actor): Promise<PublicUser> {
    if (await usersRepository.findByUsername(input.username)) {
      throw new ConflictError('Ya existe un usuario con ese nombre de usuario');
    }
    if (await usersRepository.findByDni(input.dni)) {
      throw new ConflictError('Ya existe un usuario con ese DNI');
    }
    if (input.email && (await usersRepository.findByEmail(input.email))) {
      throw new ConflictError('Ya existe un usuario con ese correo electrónico');
    }
    await this.ensureRoleExists(input.roleId);

    const user = await usersRepository.create({
      username: input.username,
      dni: input.dni,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email ?? null,
      phone: input.phone ?? null,
      passwordHash: await hashPassword(input.password),
      roleId: input.roleId,
      active: true,
    });

    const created = await this.findOrFail(user.id);
    await auditService.log({
      userId: actor.id,
      action: AuditAction.CREATE,
      entity: 'usuarios',
      entityId: created.id,
      detail: { username: created.username, dni: created.dni, role: created.role.name },
      ip: actor.ip,
    });
    return toPublicUser(created);
  }

  async update(id: number, input: UpdateUserInput, actor: Actor): Promise<PublicUser> {
    const user = await this.findOrFail(id);

    if (input.dni && input.dni !== user.dni) {
      const existing = await usersRepository.findByDni(input.dni);
      if (existing && existing.id !== id) {
        throw new ConflictError('Ya existe un usuario con ese DNI');
      }
    }
    if (input.email && input.email !== user.email) {
      const existing = await usersRepository.findByEmail(input.email);
      if (existing && existing.id !== id) {
        throw new ConflictError('Ya existe un usuario con ese correo electrónico');
      }
    }
    if (input.roleId !== undefined && input.roleId !== user.roleId) {
      await this.ensureRoleExists(input.roleId);
      if (user.role.name === RoleName.ADMIN) {
        await this.ensureNotLastAdmin('No se puede cambiar el rol del único administrador activo');
      }
    }

    await usersRepository.update(id, {
      ...(input.dni !== undefined ? { dni: input.dni } : {}),
      ...(input.firstName !== undefined ? { firstName: input.firstName } : {}),
      ...(input.lastName !== undefined ? { lastName: input.lastName } : {}),
      ...(input.email !== undefined ? { email: input.email } : {}),
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
      ...(input.roleId !== undefined ? { roleId: input.roleId } : {}),
    });

    const updated = await this.findOrFail(id);
    await auditService.log({
      userId: actor.id,
      action: AuditAction.UPDATE,
      entity: 'usuarios',
      entityId: id,
      detail: { changes: input },
      ip: actor.ip,
    });
    return toPublicUser(updated);
  }

  async setActive(id: number, active: boolean, actor: Actor): Promise<PublicUser> {
    const user = await this.findOrFail(id);

    if (!active) {
      if (id === actor.id) {
        throw new BusinessRuleError('No puede desactivar su propio usuario');
      }
      if (user.active && user.role.name === RoleName.ADMIN) {
        await this.ensureNotLastAdmin('No se puede desactivar al único administrador activo');
      }
    }

    await usersRepository.update(id, { active });
    const updated = await this.findOrFail(id);
    await auditService.log({
      userId: actor.id,
      action: active ? AuditAction.ACTIVATE : AuditAction.DEACTIVATE,
      entity: 'usuarios',
      entityId: id,
      ip: actor.ip,
    });
    return toPublicUser(updated);
  }

  async resetPassword(id: number, newPassword: string, actor: Actor): Promise<void> {
    await this.findOrFail(id);
    await usersRepository.updatePassword(id, await hashPassword(newPassword));
    await auditService.log({
      userId: actor.id,
      action: AuditAction.PASSWORD_RESET,
      entity: 'usuarios',
      entityId: id,
      ip: actor.ip,
    });
  }

  private async findOrFail(id: number): Promise<User> {
    const user = await usersRepository.findById(id);
    if (!user) throw new NotFoundError('Usuario');
    return user;
  }

  private async ensureRoleExists(roleId: number): Promise<void> {
    const role = await AppDataSource.getRepository(Role).findOne({ where: { id: roleId } });
    if (!role) throw new BusinessRuleError('El rol indicado no existe');
  }

  private async ensureNotLastAdmin(message: string): Promise<void> {
    const admins = await usersRepository.countActiveAdmins();
    if (admins <= 1) throw new BusinessRuleError(message);
  }
}

export const usersService = new UsersService();
