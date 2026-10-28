import { Repository, SelectQueryBuilder } from 'typeorm';
import { AppDataSource } from '../../config/data-source';
import { Movement, MovementStatus, MovementType } from '../../database/entities';
import { PaginationQuery } from '../../common/utils/pagination';

export interface MovementFilters {
  from?: Date;
  to?: Date;
  type?: MovementType;
  status?: MovementStatus;
  materialId?: number;
  workFrontId?: number;
  supplierId?: number;
  userId?: number;
  search?: string;
}

export class MovementsRepository {
  private get repo(): Repository<Movement> {
    return AppDataSource.getRepository(Movement);
  }

  private baseQuery(): SelectQueryBuilder<Movement> {
    return this.repo
      .createQueryBuilder('movement')
      .leftJoinAndSelect('movement.user', 'user')
      .leftJoinAndSelect('movement.supplier', 'supplier')
      .leftJoinAndSelect('movement.workFront', 'workFront')
      .leftJoinAndSelect('movement.voidedBy', 'voidedBy')
      .leftJoinAndSelect('movement.reversesMovement', 'reversesMovement');
  }

  async findPaginated(
    filters: MovementFilters,
    pagination: PaginationQuery,
  ): Promise<[Movement[], number]> {
    const query = this.baseQuery()
      .loadRelationCountAndMap('movement.itemCount', 'movement.details')
      .orderBy('movement.date', 'DESC')
      .addOrderBy('movement.id', 'DESC')
      .skip(pagination.skip)
      .take(pagination.limit);

    if (filters.from) {
      query.andWhere('movement.date >= :from', { from: filters.from });
    }
    if (filters.to) {
      query.andWhere('movement.date <= :to', { to: filters.to });
    }
    if (filters.type) {
      query.andWhere('movement.type = :type', { type: filters.type });
    }
    if (filters.status) {
      query.andWhere('movement.status = :status', { status: filters.status });
    }
    if (filters.workFrontId) {
      query.andWhere('movement.workFrontId = :workFrontId', { workFrontId: filters.workFrontId });
    }
    if (filters.supplierId) {
      query.andWhere('movement.supplierId = :supplierId', { supplierId: filters.supplierId });
    }
    if (filters.userId) {
      query.andWhere('movement.userId = :userId', { userId: filters.userId });
    }
    if (filters.materialId) {
      query.andWhere(
        'EXISTS (SELECT 1 FROM detalle_movimientos d WHERE d.movimiento_id = movement.id AND d.material_id = :materialId)',
        { materialId: filters.materialId },
      );
    }
    if (filters.search) {
      query.andWhere(
        '(movement.code ILIKE :search OR movement.documentNumber ILIKE :search OR movement.requester ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    return query.getManyAndCount();
  }

  findById(id: number): Promise<Movement | null> {
    return this.baseQuery()
      .leftJoinAndSelect('movement.details', 'details')
      .leftJoinAndSelect('details.material', 'material')
      .leftJoinAndSelect('material.unit', 'unit')
      .leftJoinAndSelect('material.category', 'category')
      .where('movement.id = :id', { id })
      .orderBy('details.id', 'ASC')
      .getOne();
  }
}

export const movementsRepository = new MovementsRepository();
