import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'frentes_obra' })
export class WorkFront {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ name: 'codigo', type: 'varchar', length: 20, unique: true })
  code: string;

  @Column({ name: 'nombre', type: 'varchar', length: 150 })
  name: string;

  @Column({ name: 'ubicacion', type: 'varchar', length: 200, nullable: true })
  location: string | null;

  @Column({ name: 'residente', type: 'varchar', length: 100, nullable: true })
  residentEngineer: string | null;

  @Column({ name: 'activo', type: 'boolean', default: true })
  active: boolean;

  @CreateDateColumn({ name: 'creado_en', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'actualizado_en', type: 'timestamptz' })
  updatedAt: Date;
}
