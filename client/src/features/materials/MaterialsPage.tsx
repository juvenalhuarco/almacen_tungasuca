import { useCallback, useEffect, useState } from 'react';
import {
  Boxes,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  History,
  Power,
  PowerOff,
} from 'lucide-react';
import {
  Button,
  ConfirmDialog,
  Input,
  PageHeader,
  Pagination,
  Select,
  Table,
  type Column,
} from '@/shared/components/ui';
import { useToast } from '@/shared/components/toast/ToastProvider';
import { usePagedQuery } from '@/shared/hooks/usePagedQuery';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { getErrorMessage } from '@/shared/api/http';
import { useAuth } from '@/app/providers/AuthContext';
import { formatCurrency, formatNumber } from '@/shared/utils/format';
import { cn } from '@/shared/utils/cn';
import type { Category, Material, MaterialSummary, UnitOfMeasure } from '@/shared/types';
import { categoriesApi, unitsApi } from '@/features/maintenance/catalogs.api';
import { materialsApi, type MaterialFilters } from './materials.api';
import { MaterialFormModal } from './MaterialFormModal';
import { MinimumStockModal } from './MinimumStockModal';
import { KardexModal } from './KardexModal';
import { StockStatusBadge } from './StockStatusBadge';

export function MaterialsPage() {
  const toast = useToast();
  const { isAdmin } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [units, setUnits] = useState<UnitOfMeasure[]>([]);
  const [summary, setSummary] = useState<MaterialSummary | null>(null);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Material | null>(null);
  const [minimumFor, setMinimumFor] = useState<Material | null>(null);
  const [kardexFor, setKardexFor] = useState<Material | null>(null);
  const [toggling, setToggling] = useState<Material | null>(null);
  const [toggleLoading, setToggleLoading] = useState(false);

  const fetcher = useCallback((params: MaterialFilters) => materialsApi.list(params), []);
  const query = usePagedQuery<Material, MaterialFilters>(fetcher, {
    initialFilters: { search: '', categoryId: '', stockStatus: '', active: true },
  });
  const { setFilters } = query;

  const loadSummary = useCallback(() => {
    materialsApi
      .summary()
      .then(setSummary)
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    categoriesApi
      .listAll()
      .then(setCategories)
      .catch(() => toast.error('No se pudieron cargar las categorías'));
    unitsApi
      .listAll()
      .then(setUnits)
      .catch(() => toast.error('No se pudieron cargar las unidades'));
    loadSummary();
  }, [toast, loadSummary]);

  useEffect(() => {
    setFilters({ search: debouncedSearch });
  }, [debouncedSearch, setFilters]);

  const refresh = () => {
    void query.reload();
    loadSummary();
  };

  const confirmToggle = async () => {
    if (!toggling) return;
    setToggleLoading(true);
    try {
      await materialsApi.setActive(toggling.id, !toggling.active);
      toast.success(toggling.active ? 'Material desactivado' : 'Material activado');
      setToggling(null);
      refresh();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setToggleLoading(false);
    }
  };

  const columns: Column<Material>[] = [
    {
      key: 'code',
      header: 'Código',
      render: (row) => <span className="font-semibold text-slate-900">{row.code}</span>,
    },
    {
      key: 'name',
      header: 'Nombre del material',
      render: (row) => (
        <div>
          <p className="font-medium text-slate-900">{row.name}</p>
          <p className="text-xs text-slate-500">{row.location ?? row.description ?? ''}</p>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Categoría',
      render: (row) => <span className="text-slate-600">{row.category.name}</span>,
    },
    {
      key: 'unit',
      header: 'U.M.',
      render: (row) => <span className="text-slate-600">{row.unit.name}</span>,
    },
    {
      key: 'stock',
      header: 'Stock actual',
      className: 'text-right',
      render: (row) => (
        <span
          className={cn(
            'text-base font-bold',
            row.stockStatus === 'OPTIMO' ? 'text-slate-900' : 'text-red-600',
          )}
        >
          {formatNumber(row.currentStock)}
        </span>
      ),
    },
    {
      key: 'minimum',
      header: 'Stock mínimo',
      className: 'text-right',
      render: (row) => (
        <button
          type="button"
          onClick={() => setMinimumFor(row)}
          className="inline-flex items-center gap-1 rounded px-1 text-slate-600 hover:bg-slate-100 hover:text-brand-700"
          title="Configurar stock mínimo"
        >
          {formatNumber(row.minimumStock)}
          <SlidersHorizontal className="h-3 w-3" />
        </button>
      ),
    },
    {
      key: 'price',
      header: 'Precio ref.',
      className: 'text-right text-slate-600',
      render: (row) => formatCurrency(row.referencePrice),
    },
    {
      key: 'status',
      header: 'Estado',
      render: (row) =>
        row.active ? (
          <StockStatusBadge status={row.stockStatus} minimumStock={row.minimumStock} />
        ) : (
          <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
            Inactivo
          </span>
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
            onClick={() => setKardexFor(row)}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
            title="Ver kardex"
          >
            <History className="h-4 w-4" />
          </button>
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
          {isAdmin && (
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
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Lista de materiales e insumos"
        description="Registro centralizado con parámetros de stock mínimo para obra."
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
            icon={<Plus className="h-4 w-4" />}
          >
            Registrar nuevo material
          </Button>
        }
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={Boxes}
          label="Materiales activos"
          value={summary?.total}
          tone="bg-brand-50 text-brand-700"
          onClick={() => setFilters({ stockStatus: '', active: true })}
          active={query.filters.stockStatus === ''}
        />
        <SummaryCard
          icon={CheckCircle2}
          label="Con stock óptimo"
          value={summary?.optimal}
          tone="bg-emerald-50 text-emerald-700"
          onClick={() => setFilters({ stockStatus: 'OPTIMO', active: true })}
          active={query.filters.stockStatus === 'OPTIMO'}
        />
        <SummaryCard
          icon={AlertTriangle}
          label="En nivel crítico"
          value={summary?.critical}
          tone="bg-amber-50 text-amber-700"
          onClick={() => setFilters({ stockStatus: 'CRITICO', active: true })}
          active={query.filters.stockStatus === 'CRITICO'}
        />
        <SummaryCard
          icon={XCircle}
          label="Agotados"
          value={summary?.outOfStock}
          tone="bg-red-50 text-red-700"
          onClick={() => setFilters({ stockStatus: 'AGOTADO', active: true })}
          active={query.filters.stockStatus === 'AGOTADO'}
        />
      </div>

      <div className="card mb-5 grid gap-3 p-4 md:grid-cols-5">
        <Input
          name="search"
          placeholder="Buscar por código, nombre o categoría..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          leftIcon={<Search className="h-4 w-4" />}
          className="md:col-span-2"
        />
        <Select
          name="categoryId"
          value={String(query.filters.categoryId ?? '')}
          onChange={(event) =>
            setFilters({ categoryId: event.target.value ? Number(event.target.value) : '' })
          }
          placeholder="Todas las categorías"
          options={categories.map((category) => ({ value: category.id, label: category.name }))}
        />
        <Select
          name="stockStatus"
          value={query.filters.stockStatus ?? ''}
          onChange={(event) =>
            setFilters({ stockStatus: event.target.value as MaterialFilters['stockStatus'] })
          }
          placeholder="Todos los estados"
          options={[
            { value: 'OPTIMO', label: 'Óptimo' },
            { value: 'CRITICO', label: 'Crítico' },
            { value: 'AGOTADO', label: 'Agotado' },
          ]}
        />
        <Select
          name="active"
          value={query.filters.active === '' ? '' : String(query.filters.active)}
          onChange={(event) =>
            setFilters({ active: event.target.value === '' ? '' : event.target.value === 'true' })
          }
          placeholder="Activos e inactivos"
          options={[
            { value: 'true', label: 'Solo activos' },
            { value: 'false', label: 'Solo inactivos' },
          ]}
        />
      </div>

      <div className="card overflow-hidden">
        {query.error && (
          <div className="border-b border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {query.error}
          </div>
        )}
        <Table
          columns={columns}
          rows={query.rows}
          rowKey={(row) => row.id}
          loading={query.loading}
        />
        <Pagination
          page={query.meta.page}
          totalPages={query.meta.totalPages}
          total={query.meta.total}
          limit={query.meta.limit}
          onChange={query.setPage}
        />
      </div>

      <MaterialFormModal
        open={formOpen}
        material={editing}
        categories={categories}
        units={units}
        onClose={() => setFormOpen(false)}
        onSaved={refresh}
      />
      <MinimumStockModal
        material={minimumFor}
        onClose={() => setMinimumFor(null)}
        onSaved={refresh}
      />
      <KardexModal material={kardexFor} onClose={() => setKardexFor(null)} />
      <ConfirmDialog
        open={toggling !== null}
        title={toggling?.active ? 'Desactivar material' : 'Activar material'}
        message={
          toggling?.active
            ? `"${toggling.name}" dejará de aparecer en el catálogo activo y no podrá usarse en nuevos movimientos.`
            : `"${toggling?.name}" volverá a estar disponible en el catálogo.`
        }
        confirmLabel={toggling?.active ? 'Desactivar' : 'Activar'}
        variant={toggling?.active ? 'danger' : 'primary'}
        loading={toggleLoading}
        onConfirm={confirmToggle}
        onCancel={() => setToggling(null)}
      />
    </>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  tone,
  onClick,
  active,
}: {
  icon: typeof Boxes;
  label: string;
  value: number | undefined;
  tone: string;
  onClick: () => void;
  active: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'card flex items-center gap-4 px-5 py-4 text-left transition hover:border-brand-300',
        active && 'ring-2 ring-brand-500/40',
      )}
    >
      <span className={cn('rounded-lg p-2.5', tone)}>
        <Icon className="h-5 w-5" />
      </span>
      <span>
        <span className="block text-2xl font-bold text-slate-900">{value ?? '—'}</span>
        <span className="block text-xs font-medium text-slate-500">{label}</span>
      </span>
    </button>
  );
}
