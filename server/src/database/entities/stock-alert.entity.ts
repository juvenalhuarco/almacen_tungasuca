import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Material } from './material.entity';
import { User } from './user.entity';
import { decimalTransformer } from '../transformers/decimal.transformer';

export enum StockAlertType {
  MINIMUM = 'STOCK_MINIMO',
  OUT_OF_STOCK = 'AGOTADO',
}

export enum StockAlertStatus {
  PENDING = 'PENDIENTE',
  ATTENDED = 'ATENDIDA',
  RESOLVED = 'RESUELTA',
}

@Entity({ name: 'alertas_stock' })
export class StockAlert {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ name: 'material_id', type: 'int' })
  materialId: number;

  @ManyToOne(() => Material, (material) => material.alerts, { eager: true })
  @JoinColumn({ name: 'material_id' })
  material: Material;

  @Column({ name: 'tipo', type: 'varchar', length: 15 })
  type: StockAlertType;

  @Column({
    name: 'stock_al_generar',
    type: 'numeric',
    precision: 12,
    scale: 3,
    transformer: decimalTransformer,
  })
  stockAtGeneration: number;

  @Column({
    name: 'stock_minimo',
    type: 'numeric',
    precision: 12,
    scale: 3,
    transformer: decimalTransformer,
  })
  minimumStock: number;

  @Column({ name: 'estado', type: 'varchar', length: 12, default: StockAlertStatus.PENDING })
  status: StockAlertStatus;

  @Column({ name: 'generada_en', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  generatedAt: Date;

  @Column({ name: 'atendida_en', type: 'timestamptz', nullable: true })
  attendedAt: Date | null;

  @Column({ name: 'atendida_por_id', type: 'int', nullable: true })
  attendedById: number | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'atendida_por_id' })
  attendedBy: User | null;

  @Column({ name: 'resuelta_en', type: 'timestamptz', nullable: true })
  resolvedAt: Date | null;

  @Column({ name: 'notificada_email', type: 'boolean', default: false })
  emailSent: boolean;

  get isOpen(): boolean {
    return this.status !== StockAlertStatus.RESOLVED;
  }
}
