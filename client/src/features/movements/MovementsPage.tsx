import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Eye, Plus, Search } from 'lucide-react';
import {
  Badge,
  Button,
  Input,
  PageHeader,
  Pagination,
  Select,
  Table,
  type Column,
} from '@/shared/components/ui';
import { usePagedQuery } from '@/shared/hooks/usePagedQuery';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { formatCurrency, formatDateTime } from '@/shared/utils/format';
import { cn } from '@/shared/utils/cn';
import type { Movement, WorkFront } from '@/shared/types';
import { workFrontsApi } from '@/features/maintenance/catalogs.api';
import { movementsApi, type MovementFilters } from './movements.api';
import { MovementTypeBadge } from './MovementTypeBadge';
import { MovementDetailModal } from './MovementDetailModal';
import { VoidMovementModal } from './VoidMovementModal';

function firstDayOfMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function MovementsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const highlightId = Number(searchParams.get('resaltar')) || null;
  const [workFronts, setWorkFronts] = useState<WorkFront[]>([]);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [voiding, setVoiding] = useState<Movement | null>(null);

  const fetcher = useCallback((params: MovementFilters) => movementsApi.list(params), []);
  const query = usePagedQuery<Movement, MovementFilters>(fetcher, {
    initialFilters: {
      from: firstDayOfMonth(),
      to: today(),
      type: '',
      status: '',
      workFrontId: '',
      search: '',
    },
  });
  const { setFilters } = query;

  useEffect(() => {
    workFrontsApi
      .listAll(false)
      .then(setWorkFronts)
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    setFilters({ search: debouncedSearch });
  }, [debouncedSearch, setFilters]);

  useEffect(() => {
    if (highlightId) {
      const timer = window.setTimeout(() => setSearchParams({}, { replace: true }), 6000);
      return () => window.clearTimeout(timer);
    }
  }, [highlightId, setSearchParams]);

  const columns: Column<Movement>[] = [
    {
      key: 'code',
      header: 'Código / Fecha',
      render: (row) => (
        <div>
          <p className="font-semibold text-slate-900">{row.code}</p>
          <p className="text-xs text-slate-500">{formatDateTime(row.date)}</p>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Operación',
      render: (row) => (
        <div className="flex flex-col items-start gap-1">
          <MovementTypeBadge type={row.type} />
          {row.reversesMovement && (
            <span className="text-[11px] text-slate-500">
              Reversión de {row.reversesMovement.code}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'document',
      header: 'Documento',
      render: (row) => <span className="text-slate-700">{row.documentNumber ?? '—'}</span>,
    },
    {
      key: 'counterpart',
      header: 'Proveedor / Frente de obra',
      render: (row) => (
        <span className="text-slate-700">
          {row.supplier?.name ??
            (row.workFront
              ? `${row.workFront.code} · ${row.workFront.name}`
              : row.type === 'AJUSTE'
                ? 'Ajuste de inventario'
                : 'Almacén central')}
        </span>
      ),
    },
    {
      key: 'items',
      header: 'Ítems',
      className: 'text-right',
      render: (row) => <span className="font-semibold text-slate-900">{row.itemCount}</span>,
    },
    {
      key: 'total',
      header: 'Valor',
      className: 'text-right text-slate-700',
      render: (row) => formatCurrency(row.total),
    },
    {
      key: 'user',
      header: 'Registrado por',
      render: (row) => <span className="text-slate-600">{row.user.name}</span>,
    },
    {
      key: 'status',
      header: 'Estado',
      render: (row) =>
        row.status === 'ANULADO' ? (
          <Badge tone="danger">Anulado</Badge>
        ) : (
          <Badge tone="success">Registrado</Badge>
        ),
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (row) => (
        <button
          type="button"
          onClick={() => setDetailId(row.id)}
          className="rounded-lg p-2 text-brand-600 hover:bg-brand-50"
          title="Ver detalle"
        >
          <Eye className="h-4 w-4" />
        </button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Historial de movimientos"
        description="Bitácora de entradas, salidas y ajustes con trazabilidad completa."
        actions={
          <Link to="/movimientos/nuevo">
            <Button icon={<Plus className="h-4 w-4" />}>Registrar movimiento</Button>
          </Link>
        }
      />

      <div className="card mb-5 grid gap-3 p-4 md:grid-cols-6">
        <Input
          label="Desde"
          name="from"
          type="date"
          value={query.filters.from ?? ''}
          onChange={(event) => setFilters({ from: event.target.value })}
        />
        <Input
          label="Hasta"
          name="to"
          type="date"
          value={query.filters.to ?? ''}
          onChange={(event) => setFilters({ to: event.target.value })}
        />
        <Select
          label="Tipo"
          name="type"
          value={query.filters.type ?? ''}
          onChange={(event) => setFilters({ type: event.target.value as MovementFilters['type'] })}
          placeholder="Todos"
          options={[
            { value: 'ENTRADA', label: 'Entradas' },
            { value: 'SALIDA', label: 'Salidas' },
            { value: 'AJUSTE', label: 'Ajustes' },
          ]}
        />
        <Select
          label="Frente de obra"
          name="workFrontId"
          value={String(query.filters.workFrontId ?? '')}
          onChange={(event) =>
            setFilters({ workFrontId: event.target.value ? Number(event.target.value) : '' })
          }
          placeholder="Todos"
          options={workFronts.map((front) => ({
            value: front.id,
            label: `${front.code} · ${front.name}`,
          }))}
        />
        <Select
          label="Estado"
          name="status"
          value={query.filters.status ?? ''}
          onChange={(event) =>
            setFilters({ status: event.target.value as MovementFilters['status'] })
          }
          placeholder="Todos"
          options={[
            { value: 'REGISTRADO', label: 'Registrados' },
            { value: 'ANULADO', label: 'Anulados' },
          ]}
        />
        <Input
          label="Buscar"
          name="search"
          placeholder="Código, documento..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          leftIcon={<Search className="h-4 w-4" />}
        />
      </div>

      <div
        className={cn(
          'card overflow-hidden',
          highlightId ? '[&_tbody_tr:first-child]:bg-emerald-50' : undefined,
        )}
      >
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
          onRowClick={(row) => setDetailId(row.id)}
          emptyMessage="No hay movimientos en el periodo seleccionado"
        />
        <Pagination
          page={query.meta.page}
          totalPages={query.meta.totalPages}
          total={query.meta.total}
          limit={query.meta.limit}
          onChange={query.setPage}
        />
      </div>

      <MovementDetailModal
        movementId={detailId}
        onClose={() => setDetailId(null)}
        onVoid={(movement) => {
          setDetailId(null);
          setVoiding(movement);
        }}
      />
      <VoidMovementModal
        movement={voiding}
        onClose={() => setVoiding(null)}
        onVoided={() => void query.reload()}
      />
    </>
  );
}
