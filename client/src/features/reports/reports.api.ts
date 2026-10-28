import { http } from '@/shared/api/http';
import type { CompanyInfo, KardexReport, MovementReport, StockReport } from '@/shared/types';

function clean(params: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== '' && value !== undefined && value !== null,
    ),
  );
}

export const reportsApi = {
  async stock(params: {
    categoryId?: number | '';
    stockStatus?: string;
    active?: boolean | '';
  }): Promise<StockReport> {
    const { data } = await http.get<StockReport>('/reports/stock', { params: clean(params) });
    return data;
  },

  async movements(params: {
    from?: string;
    to?: string;
    type?: string;
    status?: string;
    workFrontId?: number | '';
    supplierId?: number | '';
    materialId?: number | '';
    categoryId?: number | '';
  }): Promise<MovementReport> {
    const { data } = await http.get<MovementReport>('/reports/movements', {
      params: clean(params),
    });
    return data;
  },

  async kardex(materialId: number, params: { from?: string; to?: string }): Promise<KardexReport> {
    const { data } = await http.get<KardexReport>(`/reports/kardex/${materialId}`, {
      params: clean(params),
    });
    return data;
  },

  async company(): Promise<CompanyInfo> {
    const { data } = await http.get<CompanyInfo>('/company');
    return data;
  },

  async logExport(report: string, format: 'xlsx' | 'pdf', rows: number): Promise<void> {
    await http.post('/reports/export-log', { report, format, rows }).catch(() => undefined);
  },
};
