export interface PaginationQuery {
  page: number;
  limit: number;
  skip: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export function parsePagination(query: Record<string, unknown>): PaginationQuery {
  const page = Math.max(1, Number(query.page) || 1);
  const limitRaw = Number(query.limit) || DEFAULT_LIMIT;
  const limit = Math.min(MAX_LIMIT, Math.max(1, limitRaw));
  return { page, limit, skip: (page - 1) * limit };
}

export function paginate<T>(
  data: T[],
  total: number,
  pagination: PaginationQuery,
): PaginatedResult<T> {
  return {
    data,
    meta: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / pagination.limit)),
    },
  };
}

export function parseString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

export function parseInteger(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : undefined;
}

export function parseBoolean(value: unknown): boolean | undefined {
  if (value === 'true' || value === true) return true;
  if (value === 'false' || value === false) return false;
  return undefined;
}

export function parseDate(value: unknown, endOfDay = false): Date | undefined {
  if (typeof value !== 'string' || value.trim() === '') return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  if (endOfDay && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    date.setHours(23, 59, 59, 999);
  }
  return date;
}
