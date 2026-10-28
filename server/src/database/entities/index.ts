import { Role } from './role.entity';
import { User } from './user.entity';
import { Category } from './category.entity';
import { UnitOfMeasure } from './unit-of-measure.entity';
import { Material } from './material.entity';
import { Supplier } from './supplier.entity';
import { WorkFront } from './work-front.entity';
import { Movement } from './movement.entity';
import { MovementDetail } from './movement-detail.entity';
import { StockAlert } from './stock-alert.entity';
import { AuditLog } from './audit-log.entity';

export const entities = [
  Role,
  User,
  Category,
  UnitOfMeasure,
  Material,
  Supplier,
  WorkFront,
  Movement,
  MovementDetail,
  StockAlert,
  AuditLog,
];

export * from './role.entity';
export * from './user.entity';
export * from './category.entity';
export * from './unit-of-measure.entity';
export * from './material.entity';
export * from './supplier.entity';
export * from './work-front.entity';
export * from './movement.entity';
export * from './movement-detail.entity';
export * from './stock-alert.entity';
export * from './audit-log.entity';
