import { http } from '@/shared/api/http';
import type { Movement, MovementStatus, MovementType, PaginatedResult } from '@/shared/types';

export interface MovementFilters {
  from?: string;
  to?: string;
  type?: MovementType | '';
  status?: MovementStatus | '';
  materialId?: number | '';
  workFrontId?: number | '';
  supplierId?: number | '';
  search?: string;
  page?: number;
  limit?: number;
}

export interface MovementLineInput {
  materialId: number;
  quantity?: number;
  unitPrice?: number;
  countedStock?: number;
}

export interface MovementInput {
  type: MovementType;
  date?: string;
  documentNumber?: string;
  supplierId?: number;
  workFrontId?: number;
  requester?: string;
  notes?: string;
  registrationSeconds?: number;
  lines: MovementLineInput[];
}

export const movementsApi = {
  async list(filters: MovementFilters): Promise<PaginatedResult<Movement>> {
    const params: Record<string, unknown> = { page: filters.page, limit: filters.limit };
    for (const key of [
      'from',
      'to',
      'type',
      'status',
      'materialId',
      'workFrontId',
      'supplierId',
      'search',
    ] as const) {
      const value = filters[key];
      if (value !== '' && value !== undefined) params[key] = value;
    }
    const { data } = await http.get<PaginatedResult<Movement>>('/movements', { params });
    return data;
  },

  async getById(id: number): Promise<Movement> {
    const { data } = await http.get<Movement>(`/movements/${id}`);
    return data;
  },

  async create(input: MovementInput): Promise<Movement> {
    const { data } = await http.post<Movement>('/movements', input);
    return data;
  },

  async void(id: number, reason: string): Promise<Movement> {
    const { data } = await http.post<Movement>(`/movements/${id}/void`, { reason });
    return data;
  },
};
