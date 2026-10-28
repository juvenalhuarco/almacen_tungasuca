import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity({ name: 'bitacora' })
export class AuditLog {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ name: 'usuario_id', type: 'int', nullable: true })
  userId: number | null;

  @ManyToOne(() => User, { nullable: true, eager: true })
  @JoinColumn({ name: 'usuario_id' })
  user: User | null;

  @Column({ name: 'accion', type: 'varchar', length: 50 })
  action: string;

  @Column({ name: 'entidad', type: 'varchar', length: 50 })
  entity: string;

  @Column({ name: 'entidad_id', type: 'int', nullable: true })
  entityId: number | null;

  @Column({ name: 'detalle', type: 'jsonb', nullable: true })
  detail: Record<string, unknown> | null;

  @Column({ name: 'ip', type: 'varchar', length: 45, nullable: true })
  ip: string | null;

  @CreateDateColumn({ name: 'creado_en', type: 'timestamptz' })
  createdAt: Date;
}
