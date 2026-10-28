import type { ReactNode } from 'react';
import { Loader2, Inbox } from 'lucide-react';
import { cn } from '@/shared/utils/cn';

export interface Column<T> {
  key: string;
  header: ReactNode;
  render: (row: T) => ReactNode;
  className?: string;
  headerClassName?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
}

export function Table<T>({
  columns,
  rows,
  rowKey,
  loading = false,
  emptyMessage = 'No se encontraron registros',
  onRowClick,
}: TableProps<T>) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="table-head">
          <tr>
            {columns.map((column) => (
              <th key={column.key} scope="col" className={cn('px-4 py-3', column.headerClassName)}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center text-slate-500">
                <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin text-brand-500" />
                Cargando...
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center text-slate-500">
                <Inbox className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn('transition', onRowClick && 'cursor-pointer hover:bg-slate-50')}
              >
                {columns.map((column) => (
                  <td key={column.key} className={cn('px-4 py-3 align-middle', column.className)}>
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
