import { useCallback, useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import {
  Badge,
  Input,
  PageHeader,
  Pagination,
  Select,
  Table,
  type Column,
} from '@/shared/components/ui';
import { usePagedQuery } from '@/shared/hooks/usePagedQuery';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { formatDateTime } from '@/shared/utils/format';
import type { AuditLogEntry } from '@/shared/types';
import { auditApi, type AuditFilters } from './audit.api';

const ACTION_LABELS: Record<string, string> = {
  INICIO_SESION: 'Inicio de sesión',
  INICIO_SESION_FALLIDO: 'Inicio de sesión fallido',
  CIERRE_SESION: 'Cierre de sesión',
  CAMBIO_CONTRASENA: 'Cambio de contraseña',
  RESTABLECER_CONTRASENA: 'Restablecer contraseña',
  CREAR: 'Crear',
  ACTUALIZAR: 'Actualizar',
  ACTIVAR: 'Activar',
  DESACTIVAR: 'Desactivar',
  ANULAR: 'Anular',
  ATENDER: 'Atender',
  EXPORTAR: 'Exportar',
  REVISION_STOCK: 'Revisión de stock',
};

const ENTITY_LABELS: Record<string, string> = {
  usuarios: 'Usuarios',
  categorias: 'Categorías',
  unidades_medida: 'Unidades de medida',
  proveedores: 'Proveedores',
  frentes_obra: 'Frentes de obra',
  materiales: 'Materiales',
  movimientos: 'Movimientos',
  alertas_stock: 'Alertas',
  reportes: 'Reportes',
};

function actionTone(action: string): 'neutral' | 'success' | 'warning' | 'danger' | 'info' {
  if (action === 'INICIO_SESION_FALLIDO' || action === 'ANULAR' || action === 'DESACTIVAR')
    return 'danger';
  if (action === 'CREAR' || action === 'ACTIVAR') return 'success';
  if (action === 'ACTUALIZAR' || action === 'ATENDER') return 'info';
  if (action === 'EXPORTAR' || action === 'REVISION_STOCK') return 'warning';
  return 'neutral';
}

function describe(entry: AuditLogEntry): string {
  const detail = entry.detail ?? {};
  const parts: string[] = [];
  for (const [key, value] of Object.entries(detail)) {
    if (value === null || value === undefined) continue;
    if (typeof value === 'object') {
      parts.push(`${key}: ${JSON.stringify(value)}`);
    } else {
      parts.push(`${key}: ${String(value)}`);
    }
  }
  return parts.join(' · ');
}

export function AuditPage() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [options, setOptions] = useState<{ actions: string[]; entities: string[] }>({
    actions: [],
    entities: [],
  });

  const fetcher = useCallback((params: AuditFilters) => auditApi.list(params), []);
  const query = usePagedQuery<AuditLogEntry, AuditFilters>(fetcher, {
    initialFilters: { from: '', to: '', action: '', entity: '', search: '' },
    limit: 25,
  });
  const { setFilters } = query;

  useEffect(() => {
    auditApi
      .filters()
      .then(setOptions)
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    setFilters({ search: debouncedSearch });
  }, [debouncedSearch, setFilters]);

  const columns: Column<AuditLogEntry>[] = [
    {
      key: 'date',
      header: 'Fecha y hora',
      render: (row) => (
        <span className="whitespace-nowrap text-slate-700">{formatDateTime(row.createdAt)}</span>
      ),
    },
    {
      key: 'user',
      header: 'Usuario',
      render: (row) =>
        row.user ? (
          <div>
            <p className="font-medium text-slate-900">{row.user.name}</p>
            <p className="text-xs text-slate-500">{row.user.username}</p>
          </div>
        ) : (
          <span className="text-slate-500">Sistema</span>
        ),
    },
    {
      key: 'action',
      header: 'Acción',
      render: (row) => (
        <Badge tone={actionTone(row.action)}>{ACTION_LABELS[row.action] ?? row.action}</Badge>
      ),
    },
    {
      key: 'entity',
      header: 'Entidad',
      render: (row) => (
        <span className="text-slate-700">
          {ENTITY_LABELS[row.entity] ?? row.entity}
          {row.entityId ? <span className="text-slate-400"> #{row.entityId}</span> : null}
        </span>
      ),
    },
    {
      key: 'detail',
      header: 'Detalle',
      render: (row) => (
        <span className="block max-w-md truncate text-xs text-slate-600" title={describe(row)}>
          {describe(row) || '—'}
        </span>
      ),
    },
    {
      key: 'ip',
      header: 'IP',
      render: (row) => <span className="font-mono text-xs text-slate-500">{row.ip ?? '—'}</span>,
    },
  ];

  return (
    <>
      <PageHeader
        title="Bitácora del sistema"
        description="Registro de auditoría de todas las operaciones realizadas por los usuarios."
      />

      <div className="card mb-5 grid gap-3 p-4 md:grid-cols-5">
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
          label="Acción"
          name="action"
          value={query.filters.action ?? ''}
          onChange={(event) => setFilters({ action: event.target.value })}
          placeholder="Todas"
          options={options.actions.map((action) => ({
            value: action,
            label: ACTION_LABELS[action] ?? action,
          }))}
        />
        <Select
          label="Entidad"
          name="entity"
          value={query.filters.entity ?? ''}
          onChange={(event) => setFilters({ entity: event.target.value })}
          placeholder="Todas"
          options={options.entities.map((entity) => ({
            value: entity,
            label: ENTITY_LABELS[entity] ?? entity,
          }))}
        />
        <Input
          label="Buscar en detalle"
          name="search"
          placeholder="Código, DNI, usuario..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          leftIcon={<Search className="h-4 w-4" />}
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
          emptyMessage="No hay registros para los filtros seleccionados"
        />
        <Pagination
          page={query.meta.page}
          totalPages={query.meta.totalPages}
          total={query.meta.total}
          limit={query.meta.limit}
          onChange={query.setPage}
        />
      </div>
    </>
  );
}
