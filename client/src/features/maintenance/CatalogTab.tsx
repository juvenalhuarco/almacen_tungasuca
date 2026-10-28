import { useCallback, useEffect, useState } from 'react';
import { Pencil, Plus, Power, PowerOff, Search } from 'lucide-react';
import {
  Badge,
  Button,
  ConfirmDialog,
  Input,
  Pagination,
  Select,
  Table,
  type Column,
} from '@/shared/components/ui';
import { useToast } from '@/shared/components/toast/ToastProvider';
import { usePagedQuery } from '@/shared/hooks/usePagedQuery';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { getErrorMessage } from '@/shared/api/http';
import type { CatalogBase } from '@/shared/types';
import type { CatalogDefinition } from './catalog-config';
import type { CatalogFilters } from './catalogs.api';
import { CatalogFormModal } from './CatalogFormModal';

export function CatalogTab<T extends CatalogBase>({
  definition,
}: {
  definition: CatalogDefinition<T>;
}) {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);
  const [toggling, setToggling] = useState<T | null>(null);
  const [toggleLoading, setToggleLoading] = useState(false);

  const fetcher = useCallback(
    (params: CatalogFilters) => definition.api.list(params),
    [definition],
  );
  const query = usePagedQuery<T, CatalogFilters>(fetcher, {
    initialFilters: { search: '', active: '' },
  });
  const { setFilters } = query;

  useEffect(() => {
    setFilters({ search: debouncedSearch });
  }, [debouncedSearch, setFilters]);

  const confirmToggle = async () => {
    if (!toggling) return;
    setToggleLoading(true);
    try {
      await definition.api.setActive(toggling.id, !toggling.active);
      toast.success(toggling.active ? 'Registro desactivado' : 'Registro activado');
      setToggling(null);
      void query.reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setToggleLoading(false);
    }
  };

  const columns: Column<T>[] = [
    ...definition.columns.map((column) => ({
      key: column.key,
      header: column.header,
      render: column.render,
      className: column.className,
    })),
    {
      key: 'status',
      header: 'Estado',
      render: (row) => (
        <Badge tone={row.active ? 'success' : 'danger'}>{row.active ? 'Activo' : 'Inactivo'}</Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (row) => (
        <div className="flex justify-end gap-1">
          <button
            type="button"
            onClick={() => {
              setEditing(row);
              setFormOpen(true);
            }}
            className="rounded-lg p-2 text-brand-600 hover:bg-brand-50"
            title="Editar"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setToggling(row)}
            className={
              row.active
                ? 'rounded-lg p-2 text-red-600 hover:bg-red-50'
                : 'rounded-lg p-2 text-emerald-600 hover:bg-emerald-50'
            }
            title={row.active ? 'Desactivar' : 'Activar'}
          >
            {row.active ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex flex-col gap-3 border-b border-slate-200 p-4 md:flex-row md:items-center">
        <div>
          <h2 className="text-base font-semibold text-slate-900">{definition.title}</h2>
          <p className="text-xs text-slate-500">{definition.description}</p>
        </div>
        <div className="flex flex-1 flex-col gap-2 sm:flex-row md:justify-end">
          <Input
            name={`search-${definition.key}`}
            placeholder={definition.searchPlaceholder}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
            className="sm:w-72"
          />
          <Select
            name={`active-${definition.key}`}
            value={query.filters.active === '' ? '' : String(query.filters.active)}
            onChange={(event) =>
              setFilters({ active: event.target.value === '' ? '' : event.target.value === 'true' })
            }
            placeholder="Todos"
            options={[
              { value: 'true', label: 'Activos' },
              { value: 'false', label: 'Inactivos' },
            ]}
            className="sm:w-40"
          />
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
            icon={<Plus className="h-4 w-4" />}
          >
            Nuevo
          </Button>
        </div>
      </div>

      {query.error && (
        <div className="border-b border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {query.error}
        </div>
      )}
      <Table columns={columns} rows={query.rows} rowKey={(row) => row.id} loading={query.loading} />
      <Pagination
        page={query.meta.page}
        totalPages={query.meta.totalPages}
        total={query.meta.total}
        limit={query.meta.limit}
        onChange={query.setPage}
      />

      <CatalogFormModal
        open={formOpen}
        definition={definition}
        row={editing}
        onClose={() => setFormOpen(false)}
        onSaved={() => void query.reload()}
      />
      <ConfirmDialog
        open={toggling !== null}
        title={
          toggling?.active ? `Desactivar ${definition.singular}` : `Activar ${definition.singular}`
        }
        message={
          toggling
            ? toggling.active
              ? `"${definition.displayName(toggling)}" dejará de estar disponible para nuevos registros.`
              : `"${definition.displayName(toggling)}" volverá a estar disponible.`
            : ''
        }
        confirmLabel={toggling?.active ? 'Desactivar' : 'Activar'}
        variant={toggling?.active ? 'danger' : 'primary'}
        loading={toggleLoading}
        onConfirm={confirmToggle}
        onCancel={() => setToggling(null)}
      />
    </div>
  );
}
