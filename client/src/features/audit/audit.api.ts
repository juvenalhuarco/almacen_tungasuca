import { http } from '@/shared/api/http';
import type { AuditLogEntry, PaginatedResult } from '@/shared/types';

export interface AuditFilters {
  from?: string;
  to?: string;
  userId?: number | '';
  action?: string;
  entity?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export const auditApi = {
  async list(filters: AuditFilters): Promise<PaginatedResult<AuditLogEntry>> {
    const params: Record<string, unknown> = { page: filters.page, limit: filters.limit };
    for (const key of ['from', 'to', 'userId', 'action', 'entity', 'search'] as const) {
      const value = filters[key];
      if (value !== '' && value !== undefined) params[key] = value;
    }
    const { data } = await http.get<PaginatedResult<AuditLogEntry>>('/audit', { params });
    return data;
  },

  async filters(): Promise<{ actions: string[]; entities: string[] }> {
    const { data } = await http.get<{ actions: string[]; entities: string[] }>('/audit/filters');
    return data;
  },
};
