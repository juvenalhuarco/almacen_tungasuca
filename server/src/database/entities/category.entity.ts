import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Material } from './material.entity';

@Entity({ name: 'categorias' })
export class Category {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ name: 'nombre', type: 'varchar', length: 80, unique: true })
  name: string;

  @Column({ name: 'descripcion', type: 'varchar', length: 200, nullable: true })
  description: string | null;

  @Column({ name: 'activo', type: 'boolean', default: true })
  active: boolean;

  @CreateDateColumn({ name: 'creado_en', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'actualizado_en', type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => Material, (material) => material.category)
  materials: Material[];
}
