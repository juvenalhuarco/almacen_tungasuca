import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Role } from './role.entity';

@Entity({ name: 'usuarios' })
export class User {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ name: 'nombre_usuario', type: 'varchar', length: 30, unique: true })
  username: string;

  @Column({ name: 'dni', type: 'varchar', length: 8, unique: true })
  dni: string;

  @Column({ name: 'nombres', type: 'varchar', length: 100 })
  firstName: string;

  @Column({ name: 'apellidos', type: 'varchar', length: 100 })
  lastName: string;

  @Column({ name: 'email', type: 'varchar', length: 150, nullable: true, unique: true })
  email: string | null;

  @Column({ name: 'telefono', type: 'varchar', length: 20, nullable: true })
  phone: string | null;

  @Column({ name: 'password_hash', type: 'varchar', length: 100, select: false })
  passwordHash: string;

  @Column({ name: 'rol_id', type: 'int' })
  roleId: number;

  @ManyToOne(() => Role, (role) => role.users, { eager: true })
  @JoinColumn({ name: 'rol_id' })
  role: Role;

  @Column({ name: 'activo', type: 'boolean', default: true })
  active: boolean;

  @Column({ name: 'ultimo_acceso', type: 'timestamptz', nullable: true })
  lastLoginAt: Date | null;

  @CreateDateColumn({ name: 'creado_en', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'actualizado_en', type: 'timestamptz' })
  updatedAt: Date;

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`.trim();
  }
}
