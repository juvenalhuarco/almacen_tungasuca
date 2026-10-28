import { Repository } from 'typeorm';
import { AppDataSource } from '../../config/data-source';
import { RoleName, User } from '../../database/entities';
import { PaginationQuery } from '../../common/utils/pagination';

export interface UserFilters {
  search?: string;
  roleId?: number;
  active?: boolean;
}

export class UsersRepository {
  private get repo(): Repository<User> {
    return AppDataSource.getRepository(User);
  }

  async findPaginated(
    filters: UserFilters,
    pagination: PaginationQuery,
  ): Promise<[User[], number]> {
    const query = this.repo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .orderBy('user.lastName', 'ASC')
      .addOrderBy('user.firstName', 'ASC')
      .skip(pagination.skip)
      .take(pagination.limit);

    if (filters.search) {
      query.andWhere(
        '(user.username ILIKE :search OR user.dni ILIKE :search OR user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.email ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }
    if (filters.roleId !== undefined) {
      query.andWhere('user.roleId = :roleId', { roleId: filters.roleId });
    }
    if (filters.active !== undefined) {
      query.andWhere('user.active = :active', { active: filters.active });
    }

    return query.getManyAndCount();
  }

  findById(id: number): Promise<User | null> {
    return this.repo.findOne({ where: { id } });
  }

  findByUsername(username: string): Promise<User | null> {
    return this.repo.findOne({ where: { username } });
  }

  findByDni(dni: string): Promise<User | null> {
    return this.repo.findOne({ where: { dni } });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.repo.findOne({ where: { email } });
  }

  findByUsernameWithPassword(username: string): Promise<User | null> {
    return this.repo
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .leftJoinAndSelect('user.role', 'role')
      .where('user.username = :username', { username })
      .getOne();
  }

  findByIdWithPassword(id: number): Promise<User | null> {
    return this.repo
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .leftJoinAndSelect('user.role', 'role')
      .where('user.id = :id', { id })
      .getOne();
  }

  create(data: Partial<User>): Promise<User> {
    return this.repo.save(this.repo.create(data));
  }

  async update(id: number, data: Partial<User>): Promise<void> {
    await this.repo.update({ id }, data);
  }

  async updatePassword(id: number, passwordHash: string): Promise<void> {
    await this.repo.update({ id }, { passwordHash });
  }

  async updateLastLogin(id: number): Promise<void> {
    await this.repo.update({ id }, { lastLoginAt: new Date() });
  }

  countActiveAdmins(): Promise<number> {
    return this.repo
      .createQueryBuilder('user')
      .innerJoin('user.role', 'role')
      .where('role.name = :name', { name: RoleName.ADMIN })
      .andWhere('user.active = TRUE')
      .getCount();
  }
}

export const usersRepository = new UsersRepository();
