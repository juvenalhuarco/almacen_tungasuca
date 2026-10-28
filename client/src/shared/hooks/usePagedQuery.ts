import { useCallback, useEffect, useRef, useState } from 'react';
import type { PaginatedResult } from '@/shared/types';
import { getErrorMessage } from '@/shared/api/http';

interface Options<F> {
  initialFilters: F;
  limit?: number;
}

export function usePagedQuery<T, F extends object>(
  fetcher: (params: F & { page: number; limit: number }) => Promise<PaginatedResult<T>>,
  { initialFilters, limit = 20 }: Options<F>,
) {
  const [filters, setFiltersState] = useState<F>(initialFilters);
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<PaginatedResult<T> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const load = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const data = await fetcher({ ...filters, page, limit });
      if (id === requestId.current) setResult(data);
    } catch (err) {
      if (id === requestId.current) setError(getErrorMessage(err));
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [fetcher, filters, page, limit]);

  useEffect(() => {
    void load();
  }, [load]);

  const setFilters = useCallback((next: Partial<F>) => {
    setFiltersState((current) => ({ ...current, ...next }));
    setPage(1);
  }, []);

  return {
    rows: result?.data ?? [],
    meta: result?.meta ?? { page: 1, limit, total: 0, totalPages: 1 },
    loading,
    error,
    filters,
    setFilters,
    page,
    setPage,
    reload: load,
  };
}
