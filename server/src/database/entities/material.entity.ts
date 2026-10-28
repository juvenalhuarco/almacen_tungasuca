import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Category } from './category.entity';
import { UnitOfMeasure } from './unit-of-measure.entity';
import { StockAlert } from './stock-alert.entity';
import { decimalTransformer } from '../transformers/decimal.transformer';

@Entity({ name: 'materiales' })
export class Material {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ name: 'codigo', type: 'varchar', length: 20, unique: true })
  code: string;

  @Column({ name: 'nombre', type: 'varchar', length: 150 })
  name: string;

  @Column({ name: 'descripcion', type: 'varchar', length: 300, nullable: true })
  description: string | null;

  @Column({ name: 'categoria_id', type: 'int' })
  categoryId: number;

  @ManyToOne(() => Category, (category) => category.materials, { eager: true })
  @JoinColumn({ name: 'categoria_id' })
  category: Category;

  @Column({ name: 'unidad_medida_id', type: 'int' })
  unitId: number;

  @ManyToOne(() => UnitOfMeasure, (unit) => unit.materials, { eager: true })
  @JoinColumn({ name: 'unidad_medida_id' })
  unit: UnitOfMeasure;

  @Column({
    name: 'stock_actual',
    type: 'numeric',
    precision: 12,
    scale: 3,
    default: 0,
    transformer: decimalTransformer,
  })
  currentStock: number;

  @Column({
    name: 'stock_minimo',
    type: 'numeric',
    precision: 12,
    scale: 3,
    default: 0,
    transformer: decimalTransformer,
  })
  minimumStock: number;

  @Column({
    name: 'precio_referencial',
    type: 'numeric',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  referencePrice: number;

  @Column({ name: 'ubicacion', type: 'varchar', length: 100, nullable: true })
  location: string | null;

  @Column({ name: 'activo', type: 'boolean', default: true })
  active: boolean;

  @CreateDateColumn({ name: 'creado_en', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'actualizado_en', type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => StockAlert, (alert) => alert.material)
  alerts: StockAlert[];

  get isBelowMinimum(): boolean {
    return this.currentStock <= this.minimumStock;
  }
}
