import { http } from '@/shared/api/http';
import type {
  KardexEntry,
  Material,
  MaterialSummary,
  PaginatedResult,
  StockStatus,
} from '@/shared/types';

export interface MaterialFilters {
  search?: string;
  categoryId?: number | '';
  stockStatus?: StockStatus | '';
  active?: boolean | '';
  page?: number;
  limit?: number;
}

export interface MaterialInput {
  code?: string;
  name: string;
  description?: string | null;
  categoryId: number;
  unitId: number;
  minimumStock: number;
  initialStock?: number;
  referencePrice: number;
  location?: string | null;
}

export const materialsApi = {
  async list(filters: MaterialFilters): Promise<PaginatedResult<Material>> {
    const params: Record<string, unknown> = { page: filters.page, limit: filters.limit };
    if (filters.search) params.search = filters.search;
    if (filters.categoryId) params.categoryId = filters.categoryId;
    if (filters.stockStatus) params.stockStatus = filters.stockStatus;
    if (filters.active !== '' && filters.active !== undefined) params.active = filters.active;
    const { data } = await http.get<PaginatedResult<Material>>('/materials', { params });
    return data;
  },

  async listAll(): Promise<Material[]> {
    const { data } = await http.get<PaginatedResult<Material>>('/materials', {
      params: { all: true, active: true },
    });
    return data.data;
  },

  async summary(): Promise<MaterialSummary> {
    const { data } = await http.get<MaterialSummary>('/materials/summary');
    return data;
  },

  async nextCode(): Promise<string> {
    const { data } = await http.get<{ code: string }>('/materials/next-code');
    return data.code;
  },

  async getById(id: number): Promise<Material> {
    const { data } = await http.get<Material>(`/materials/${id}`);
    return data;
  },

  async kardex(id: number): Promise<KardexEntry[]> {
    const { data } = await http.get<KardexEntry[]>(`/materials/${id}/kardex`);
    return data;
  },

  async create(input: MaterialInput): Promise<Material> {
    const { data } = await http.post<Material>('/materials', input);
    return data;
  },

  async update(id: number, input: Omit<MaterialInput, 'code' | 'initialStock'>): Promise<Material> {
    const { data } = await http.put<Material>(`/materials/${id}`, input);
    return data;
  },

  async setMinimumStock(id: number, minimumStock: number): Promise<Material> {
    const { data } = await http.patch<Material>(`/materials/${id}/minimum-stock`, { minimumStock });
    return data;
  },

  async setActive(id: number, active: boolean): Promise<Material> {
    const { data } = await http.patch<Material>(`/materials/${id}/status`, { active });
    return data;
  },
};
