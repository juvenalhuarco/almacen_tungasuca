import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'proveedores' })
export class Supplier {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ name: 'ruc', type: 'varchar', length: 11, unique: true })
  ruc: string;

  @Column({ name: 'razon_social', type: 'varchar', length: 150 })
  businessName: string;

  @Column({ name: 'contacto', type: 'varchar', length: 100, nullable: true })
  contactName: string | null;

  @Column({ name: 'telefono', type: 'varchar', length: 20, nullable: true })
  phone: string | null;

  @Column({ name: 'email', type: 'varchar', length: 150, nullable: true })
  email: string | null;

  @Column({ name: 'direccion', type: 'varchar', length: 200, nullable: true })
  address: string | null;

  @Column({ name: 'activo', type: 'boolean', default: true })
  active: boolean;

  @CreateDateColumn({ name: 'creado_en', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'actualizado_en', type: 'timestamptz' })
  updatedAt: Date;
}
