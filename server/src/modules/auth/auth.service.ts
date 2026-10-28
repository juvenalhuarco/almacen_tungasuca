import bcrypt from 'bcryptjs';
import { BusinessRuleError, UnauthorizedError } from '../../common/errors/app-error';
import { User } from '../../database/entities';
import { usersRepository } from '../users/users.repository';
import { auditService, AuditAction } from '../audit/audit.service';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  expiresToMs,
} from './token.service';
import { env } from '../../config/env';

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  refreshMaxAge: number;
  user: PublicUser;
}

export interface PublicUser {
  id: number;
  username: string;
  dni: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  role: string;
  active: boolean;
  lastLoginAt: Date | null;
}

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    username: user.username,
    dni: user.dni,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: `${user.firstName} ${user.lastName}`.trim(),
    email: user.email,
    phone: user.phone,
    role: user.role.name,
    active: user.active,
    lastLoginAt: user.lastLoginAt,
  };
}

export class AuthService {
  async login(
    username: string,
    password: string,
    remember: boolean,
    ip: string | null,
  ): Promise<LoginResult> {
    const user = await usersRepository.findByUsernameWithPassword(username.toLowerCase());

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      await auditService.log({
        userId: user?.id ?? null,
        action: AuditAction.LOGIN_FAILED,
        entity: 'usuarios',
        entityId: user?.id ?? null,
        detail: { username },
        ip,
      });
      throw new UnauthorizedError('Usuario o contraseña incorrectos');
    }

    if (!user.active) {
      throw new UnauthorizedError('El usuario se encuentra inactivo. Contacte al administrador.');
    }

    await usersRepository.updateLastLogin(user.id);

    await auditService.log({
      userId: user.id,
      action: AuditAction.LOGIN,
      entity: 'usuarios',
      entityId: user.id,
      ip,
    });

    return this.buildSession(user, remember);
  }

  async refresh(refreshToken: string | undefined): Promise<LoginResult> {
    if (!refreshToken) throw new UnauthorizedError('Sesión no encontrada');

    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new UnauthorizedError('La sesión ha expirado. Inicie sesión nuevamente.');
    }

    const user = await usersRepository.findById(payload.sub);
    if (!user || !user.active) {
      throw new UnauthorizedError('El usuario ya no tiene acceso al sistema');
    }

    return this.buildSession(user, payload.remember);
  }

  async logout(userId: number | undefined, ip: string | null): Promise<void> {
    if (!userId) return;
    await auditService.log({
      userId,
      action: AuditAction.LOGOUT,
      entity: 'usuarios',
      entityId: userId,
      ip,
    });
  }

  async me(userId: number): Promise<PublicUser> {
    const user = await usersRepository.findById(userId);
    if (!user) throw new UnauthorizedError();
    return toPublicUser(user);
  }

  async changePassword(
    userId: number,
    currentPassword: string,
    newPassword: string,
    ip: string | null,
  ): Promise<void> {
    const user = await usersRepository.findByIdWithPassword(userId);
    if (!user) throw new UnauthorizedError();

    if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
      throw new BusinessRuleError('La contraseña actual es incorrecta');
    }
    if (currentPassword === newPassword) {
      throw new BusinessRuleError('La nueva contraseña debe ser diferente a la actual');
    }

    const passwordHash = await hashPassword(newPassword);
    await usersRepository.updatePassword(userId, passwordHash);

    await auditService.log({
      userId,
      action: AuditAction.PASSWORD_CHANGE,
      entity: 'usuarios',
      entityId: userId,
      ip,
    });
  }

  private buildSession(user: User, remember: boolean): LoginResult {
    const accessToken = signAccessToken({
      sub: user.id,
      username: user.username,
      name: `${user.firstName} ${user.lastName}`.trim(),
      role: user.role.name,
    });
    const refreshToken = signRefreshToken({ sub: user.id, remember });
    const refreshMaxAge = expiresToMs(
      remember ? env.jwt.refreshExpiresRemember : env.jwt.refreshExpires,
    );
    return { accessToken, refreshToken, refreshMaxAge, user: toPublicUser(user) };
  }
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export const authService = new AuthService();
