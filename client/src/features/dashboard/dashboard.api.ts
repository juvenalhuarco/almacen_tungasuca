import { http } from '@/shared/api/http';
import type {
  CriticalMaterial,
  DailyMovements,
  DashboardSummary,
  KpiResult,
  RecentMovement,
} from '@/shared/types';

export const dashboardApi = {
  async summary(): Promise<DashboardSummary> {
    const { data } = await http.get<DashboardSummary>('/dashboard/summary');
    return data;
  },
  async kpis(days = 30): Promise<KpiResult[]> {
    const { data } = await http.get<KpiResult[]>('/dashboard/kpis', { params: { days } });
    return data;
  },
  async movementsByDay(days = 14): Promise<DailyMovements[]> {
    const { data } = await http.get<DailyMovements[]>('/dashboard/movements-by-day', {
      params: { days },
    });
    return data;
  },
  async criticalMaterials(): Promise<CriticalMaterial[]> {
    const { data } = await http.get<CriticalMaterial[]>('/dashboard/critical-materials');
    return data;
  },
  async recentMovements(): Promise<RecentMovement[]> {
    const { data } = await http.get<RecentMovement[]>('/dashboard/recent-movements');
    return data;
  },
};
