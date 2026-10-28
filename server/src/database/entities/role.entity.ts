import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';

export enum RoleName {
  ADMIN = 'ADMINISTRADOR',
  WAREHOUSE = 'ALMACENERO',
}

@Entity({ name: 'roles' })
export class Role {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ name: 'nombre', type: 'varchar', length: 30, unique: true })
  name: RoleName;

  @Column({ name: 'descripcion', type: 'varchar', length: 150, nullable: true })
  description: string | null;

  @CreateDateColumn({ name: 'creado_en', type: 'timestamptz' })
  createdAt: Date;

  @OneToMany(() => User, (user) => user.role)
  users: User[];
}
