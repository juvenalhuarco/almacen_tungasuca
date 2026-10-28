import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Supplier } from './supplier.entity';
import { WorkFront } from './work-front.entity';
import { MovementDetail } from './movement-detail.entity';
import { decimalTransformer } from '../transformers/decimal.transformer';

export enum MovementType {
  ENTRY = 'ENTRADA',
  EXIT = 'SALIDA',
  ADJUSTMENT = 'AJUSTE',
}

export enum MovementStatus {
  REGISTERED = 'REGISTRADO',
  VOIDED = 'ANULADO',
}

@Entity({ name: 'movimientos' })
export class Movement {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ name: 'codigo', type: 'varchar', length: 20, unique: true })
  code: string;

  @Column({ name: 'tipo', type: 'varchar', length: 10 })
  type: MovementType;

  @Column({ name: 'fecha', type: 'timestamptz' })
  date: Date;

  @Column({ name: 'numero_documento', type: 'varchar', length: 50, nullable: true })
  documentNumber: string | null;

  @Column({ name: 'proveedor_id', type: 'int', nullable: true })
  supplierId: number | null;

  @ManyToOne(() => Supplier, { nullable: true })
  @JoinColumn({ name: 'proveedor_id' })
  supplier: Supplier | null;

  @Column({ name: 'frente_obra_id', type: 'int', nullable: true })
  workFrontId: number | null;

  @ManyToOne(() => WorkFront, { nullable: true })
  @JoinColumn({ name: 'frente_obra_id' })
  workFront: WorkFront | null;

  @Column({ name: 'solicitante', type: 'varchar', length: 150, nullable: true })
  requester: string | null;

  @Column({ name: 'usuario_id', type: 'int' })
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'usuario_id' })
  user: User;

  @Column({ name: 'observaciones', type: 'varchar', length: 500, nullable: true })
  notes: string | null;

  @Column({ name: 'estado', type: 'varchar', length: 12, default: MovementStatus.REGISTERED })
  status: MovementStatus;

  @Column({ name: 'motivo_anulacion', type: 'varchar', length: 300, nullable: true })
  voidReason: string | null;

  @Column({ name: 'anulado_por_id', type: 'int', nullable: true })
  voidedById: number | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'anulado_por_id' })
  voidedBy: User | null;

  @Column({ name: 'anulado_en', type: 'timestamptz', nullable: true })
  voidedAt: Date | null;

  @Column({ name: 'duracion_registro_seg', type: 'int', nullable: true })
  registrationSeconds: number | null;

  @Column({
    name: 'total',
    type: 'numeric',
    precision: 14,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  total: number;

  @Column({ name: 'anula_movimiento_id', type: 'int', nullable: true })
  reversesMovementId: number | null;

  @ManyToOne(() => Movement, { nullable: true })
  @JoinColumn({ name: 'anula_movimiento_id' })
  reversesMovement: Movement | null;

  @CreateDateColumn({ name: 'creado_en', type: 'timestamptz' })
  createdAt: Date;

  @OneToMany(() => MovementDetail, (detail) => detail.movement, { cascade: ['insert'] })
  details: MovementDetail[];

  get isReversal(): boolean {
    return this.reversesMovementId !== null;
  }
}
