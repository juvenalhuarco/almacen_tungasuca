import { http } from '@/shared/api/http';
import type {
  AlertSummary,
  PaginatedResult,
  StockAlert,
  StockAlertStatus,
  StockAlertType,
} from '@/shared/types';

export interface AlertFilters {
  status?: StockAlertStatus | '';
  type?: StockAlertType | '';
  categoryId?: number | '';
  search?: string;
  page?: number;
  limit?: number;
}

export interface CheckResult {
  evaluated: number;
  created: number;
  resolved: number;
  notified: number;
}

export const alertsApi = {
  async list(filters: AlertFilters): Promise<PaginatedResult<StockAlert>> {
    const params: Record<string, unknown> = { page: filters.page, limit: filters.limit };
    for (const key of ['status', 'type', 'categoryId', 'search'] as const) {
      const value = filters[key];
      if (value !== '' && value !== undefined) params[key] = value;
    }
    const { data } = await http.get<PaginatedResult<StockAlert>>('/alerts', { params });
    return data;
  },

  async summary(): Promise<AlertSummary> {
    const { data } = await http.get<AlertSummary>('/alerts/summary');
    return data;
  },

  async attend(id: number): Promise<StockAlert> {
    const { data } = await http.patch<StockAlert>(`/alerts/${id}/attend`);
    return data;
  },

  async runCheck(): Promise<CheckResult> {
    const { data } = await http.post<CheckResult>('/alerts/check');
    return data;
  },
};
