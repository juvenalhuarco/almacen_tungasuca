import { http } from '@/shared/api/http';
import type {
  CatalogBase,
  Category,
  PaginatedResult,
  Supplier,
  UnitOfMeasure,
  WorkFront,
} from '@/shared/types';

export interface CatalogFilters {
  search?: string;
  active?: boolean | '';
  page?: number;
  limit?: number;
}

export interface CatalogApi<T extends CatalogBase> {
  list(filters: CatalogFilters): Promise<PaginatedResult<T>>;
  listAll(onlyActive?: boolean): Promise<T[]>;
  create(input: Record<string, unknown>): Promise<T>;
  update(id: number, input: Record<string, unknown>): Promise<T>;
  setActive(id: number, active: boolean): Promise<T>;
}

function createCatalogApi<T extends CatalogBase>(path: string): CatalogApi<T> {
  return {
    async list(filters) {
      const params: Record<string, unknown> = { page: filters.page, limit: filters.limit };
      if (filters.search) params.search = filters.search;
      if (filters.active !== '' && filters.active !== undefined) params.active = filters.active;
      const { data } = await http.get<PaginatedResult<T>>(path, { params });
      return data;
    },
    async listAll(onlyActive = true) {
      const params: Record<string, unknown> = { all: true };
      if (onlyActive) params.active = true;
      const { data } = await http.get<PaginatedResult<T>>(path, { params });
      return data.data;
    },
    async create(input) {
      const { data } = await http.post<T>(path, input);
      return data;
    },
    async update(id, input) {
      const { data } = await http.put<T>(`${path}/${id}`, input);
      return data;
    },
    async setActive(id, active) {
      const { data } = await http.patch<T>(`${path}/${id}/status`, { active });
      return data;
    },
  };
}

export const categoriesApi = createCatalogApi<Category>('/categories');
export const unitsApi = createCatalogApi<UnitOfMeasure>('/units');
export const suppliersApi = createCatalogApi<Supplier>('/suppliers');
export const workFrontsApi = createCatalogApi<WorkFront>('/work-fronts');
