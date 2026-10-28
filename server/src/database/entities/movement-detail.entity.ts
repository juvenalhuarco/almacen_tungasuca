import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Movement } from './movement.entity';
import { Material } from './material.entity';
import { decimalTransformer } from '../transformers/decimal.transformer';

@Entity({ name: 'detalle_movimientos' })
export class MovementDetail {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ name: 'movimiento_id', type: 'int' })
  movementId: number;

  @ManyToOne(() => Movement, (movement) => movement.details, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'movimiento_id' })
  movement: Movement;

  @Column({ name: 'material_id', type: 'int' })
  materialId: number;

  @ManyToOne(() => Material, { eager: true })
  @JoinColumn({ name: 'material_id' })
  material: Material;

  @Column({
    name: 'cantidad',
    type: 'numeric',
    precision: 12,
    scale: 3,
    transformer: decimalTransformer,
  })
  quantity: number;

  @Column({
    name: 'precio_unitario',
    type: 'numeric',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  unitPrice: number;

  @Column({
    name: 'subtotal',
    type: 'numeric',
    precision: 14,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  subtotal: number;

  @Column({
    name: 'stock_anterior',
    type: 'numeric',
    precision: 12,
    scale: 3,
    transformer: decimalTransformer,
  })
  previousStock: number;

  @Column({
    name: 'stock_resultante',
    type: 'numeric',
    precision: 12,
    scale: 3,
    transformer: decimalTransformer,
  })
  resultingStock: number;
}
