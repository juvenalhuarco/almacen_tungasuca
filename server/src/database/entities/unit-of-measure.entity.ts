import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Material } from './material.entity';

@Entity({ name: 'unidades_medida' })
export class UnitOfMeasure {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ name: 'nombre', type: 'varchar', length: 50, unique: true })
  name: string;

  @Column({ name: 'abreviatura', type: 'varchar', length: 10, unique: true })
  abbreviation: string;

  @Column({ name: 'activo', type: 'boolean', default: true })
  active: boolean;

  @CreateDateColumn({ name: 'creado_en', type: 'timestamptz' })
  createdAt: Date;

  @OneToMany(() => Material, (material) => material.unit)
  materials: Material[];
}
