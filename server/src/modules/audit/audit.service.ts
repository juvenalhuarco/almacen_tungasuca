import { EntityManager } from 'typeorm';
import { AppDataSource } from '../../config/data-source';
import { AuditLog } from '../../database/entities';
import { logger } from '../../common/utils/logger';

export interface AuditEntry {
  userId: number | null;
  action: string;
  entity: string;
  entityId?: number | null;
  detail?: Record<string, unknown> | null;
  ip?: string | null;
}

export const AuditAction = {
  LOGIN: 'INICIO_SESION',
  LOGIN_FAILED: 'INICIO_SESION_FALLIDO',
  LOGOUT: 'CIERRE_SESION',
  PASSWORD_CHANGE: 'CAMBIO_CONTRASENA',
  PASSWORD_RESET: 'RESTABLECER_CONTRASENA',
  CREATE: 'CREAR',
  UPDATE: 'ACTUALIZAR',
  ACTIVATE: 'ACTIVAR',
  DEACTIVATE: 'DESACTIVAR',
  VOID: 'ANULAR',
  ATTEND: 'ATENDER',
  EXPORT: 'EXPORTAR',
} as const;

export class AuditService {
  async log(entry: AuditEntry, manager?: EntityManager): Promise<void> {
    const repository = (manager ?? AppDataSource.manager).getRepository(AuditLog);
    try {
      const log = repository.create({
        userId: entry.userId,
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId ?? null,
        detail: entry.detail ?? null,
        ip: entry.ip ?? null,
      });
      await repository.save(log);
    } catch (error) {
      if (manager) throw error;
      logger.error('No se pudo registrar la bitácora', error);
    }
  }
}

export const auditService = new AuditService();
