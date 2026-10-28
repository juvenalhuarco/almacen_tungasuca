import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowDownCircle,
  BellRing,
  CheckCheck,
  MailCheck,
  PackageX,
  RefreshCw,
  Search,
} from 'lucide-react';
import { Badge, Button, Input, PageHeader, Pagination, Select } from '@/shared/components/ui';
import { useToast } from '@/shared/components/toast/ToastProvider';
import { usePagedQuery } from '@/shared/hooks/usePagedQuery';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { getErrorMessage } from '@/shared/api/http';
import { useAuth } from '@/app/providers/AuthContext';
import { useAlerts } from '@/app/providers/AlertsContext';
import { formatDateTime, formatNumber } from '@/shared/utils/format';
import { cn } from '@/shared/utils/cn';
import type { StockAlert, StockAlertStatus } from '@/shared/types';
import { alertsApi, type AlertFilters } from './alerts.api';

const STATUS_TABS: Array<{ value: StockAlertStatus | ''; label: string }> = [
  { value: 'PENDIENTE', label: 'Pendientes' },
  { value: 'ATENDIDA', label: 'Atendidas' },
  { value: 'RESUELTA', label: 'Resueltas' },
  { value: '', label: 'Todas' },
];

export function AlertsPage() {
  const toast = useToast();
  const { isAdmin } = useAuth();
  const { summary, refresh: refreshSummary } = useAlerts();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [attending, setAttending] = useState<number | null>(null);
  const [checking, setChecking] = useState(false);

  const fetcher = useCallback((params: AlertFilters) => alertsApi.list(params), []);
  const query = usePagedQuery<StockAlert, AlertFilters>(fetcher, {
    initialFilters: { status: 'PENDIENTE', type: '', search: '' },
    limit: 12,
  });
  const { setFilters } = query;

  useEffect(() => {
    setFilters({ search: debouncedSearch });
  }, [debouncedSearch, setFilters]);

  const attend = async (alert: StockAlert) => {
    setAttending(alert.id);
    try {
      await alertsApi.attend(alert.id);
      toast.success(`Alerta de ${alert.material.code} marcada como atendida`);
      void query.reload();
      void refreshSummary();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setAttending(null);
    }
  };

  const runCheck = async () => {
    setChecking(true);
    try {
      const result = await alertsApi.runCheck();
      toast.info(
        `Revisión completada: ${result.evaluated} materiales evaluados, ${result.created} alertas nuevas, ${result.resolved} resueltas.`,
      );
      void query.reload();
      void refreshSummary();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setChecking(false);
    }
  };

  const openCount = summary.open;

  return (
    <>
      <PageHeader
        title="Alertas de stock mínimo"
        description="Notificaciones automáticas emitidas al alcanzar el umbral de stock mínimo en obra."
        actions={
          isAdmin ? (
            <Button
              variant="secondary"
              loading={checking}
              icon={<RefreshCw className="h-4 w-4" />}
              onClick={runCheck}
            >
              Ejecutar revisión ahora
            </Button>
          ) : undefined
        }
      />

      <div className="mb-5 overflow-hidden rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow">
        <div className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="inline-block rounded bg-white/20 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider">
              Módulo de alertas preventivas de desabastecimiento
            </span>
            <h2 className="mt-2 text-xl font-bold">
              {openCount === 0
                ? 'Sin alertas abiertas'
                : `${openCount} material${openCount === 1 ? '' : 'es'} con nivel crítico`}
            </h2>
            <p className="text-sm text-amber-50">
              {summary.pending} pendiente{summary.pending === 1 ? '' : 's'} · {summary.attended} en
              gestión · {summary.resolved} resuelta{summary.resolved === 1 ? '' : 's'}
            </p>
          </div>
          <div className="flex items-center gap-4 rounded-lg bg-white/15 px-5 py-3">
            <BellRing className="h-8 w-8" />
            <div>
              <p className="text-3xl font-bold leading-none">{summary.pending}</p>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-50">
                Alertas pendientes
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="card mb-5 flex flex-col gap-3 p-4 md:flex-row md:items-center">
        <div className="flex overflow-x-auto rounded-lg bg-slate-100 p-1">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setFilters({ status: tab.value })}
              className={cn(
                'whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition',
                query.filters.status === tab.value
                  ? 'bg-white text-brand-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex flex-1 flex-col gap-2 sm:flex-row md:justify-end">
          <Select
            name="type"
            value={query.filters.type ?? ''}
            onChange={(event) => setFilters({ type: event.target.value as AlertFilters['type'] })}
            placeholder="Todos los tipos"
            options={[
              { value: 'STOCK_MINIMO', label: 'Stock mínimo' },
              { value: 'AGOTADO', label: 'Agotado' },
            ]}
            className="sm:w-44"
          />
          <Input
            name="search"
            placeholder="Buscar material..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
            className="sm:w-64"
          />
        </div>
      </div>

      {query.error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {query.error}
        </div>
      )}

      {query.loading ? (
        <div className="card px-6 py-12 text-center text-sm text-slate-500">
          Cargando alertas...
        </div>
      ) : query.rows.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 px-6 py-16 text-center">
          <CheckCheck className="h-10 w-10 text-emerald-500" />
          <p className="text-base font-semibold text-slate-900">No hay alertas en esta vista</p>
          <p className="text-sm text-slate-500">
            Las alertas se generan automáticamente cuando un material alcanza su stock mínimo.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {query.rows.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              attending={attending === alert.id}
              onAttend={() => attend(alert)}
            />
          ))}
        </div>
      )}

      <div className="card mt-5 overflow-hidden">
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

function AlertCard({
  alert,
  attending,
  onAttend,
}: {
  alert: StockAlert;
  attending: boolean;
  onAttend: () => void;
}) {
  const outOfStock = alert.type === 'AGOTADO';
  const resolved = alert.status === 'RESUELTA';
  const material = alert.material;

  return (
    <article
      className={cn(
        'card flex flex-col border-l-4 p-5',
        resolved
          ? 'border-l-emerald-500 opacity-80'
          : outOfStock
            ? 'border-l-red-500'
            : 'border-l-amber-500',
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider',
            resolved
              ? 'bg-emerald-100 text-emerald-800'
              : outOfStock
                ? 'bg-red-100 text-red-800'
                : 'bg-amber-100 text-amber-800',
          )}
        >
          {outOfStock ? <PackageX className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
          {outOfStock ? 'Material agotado' : 'Riesgo de desabastecimiento'}
        </span>
        <StatusBadge status={alert.status} />
      </div>

      <h3 className="text-base font-bold text-slate-900">
        {material.name} <span className="font-medium text-slate-500">({material.code})</span>
      </h3>
      <p className="text-xs text-slate-500">
        {material.category}
        {material.location ? ` · ${material.location}` : ''}
      </p>

      <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-lg bg-slate-50 px-3 py-2">
          <dt className="text-xs text-slate-500">Stock actual</dt>
          <dd className={cn('font-bold', resolved ? 'text-slate-900' : 'text-red-600')}>
            {formatNumber(material.currentStock)} {material.unit}
          </dd>
        </div>
        <div className="rounded-lg bg-slate-50 px-3 py-2">
          <dt className="text-xs text-slate-500">Mínimo configurado</dt>
          <dd className="font-bold text-slate-900">
            {formatNumber(material.minimumStock)} {material.unit}
          </dd>
        </div>
      </dl>

      <p className="mt-3 text-xs italic text-slate-500">
        {resolved
          ? `Resuelta el ${formatDateTime(alert.resolvedAt)}: el stock volvió a superar el mínimo.`
          : `Generada el ${formatDateTime(alert.generatedAt)}. Se sugiere reponer al menos ${formatNumber(alert.suggestedQuantity)} ${material.unit}.`}
      </p>
      {alert.status === 'ATENDIDA' && alert.attendedBy && (
        <p className="mt-1 text-xs text-slate-500">
          Atendida por {alert.attendedBy.name} el {formatDateTime(alert.attendedAt)}.
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {!resolved && (
          <Link to={`/movimientos/nuevo?tipo=ENTRADA&materialId=${material.id}`}>
            <Button size="sm" icon={<ArrowDownCircle className="h-4 w-4" />}>
              Registrar ingreso
            </Button>
          </Link>
        )}
        {alert.status === 'PENDIENTE' && (
          <Button
            size="sm"
            variant="secondary"
            loading={attending}
            icon={<CheckCheck className="h-4 w-4" />}
            onClick={onAttend}
          >
            Marcar atendida
          </Button>
        )}
        {alert.emailSent && (
          <span
            className="ml-auto inline-flex items-center gap-1 text-[11px] text-slate-500"
            title="Notificada por correo"
          >
            <MailCheck className="h-3.5 w-3.5" />
            Correo enviado
          </span>
        )}
      </div>
    </article>
  );
}

function StatusBadge({ status }: { status: StockAlertStatus }) {
  if (status === 'PENDIENTE') return <Badge tone="warning">Pendiente</Badge>;
  if (status === 'ATENDIDA') return <Badge tone="info">En gestión</Badge>;
  return <Badge tone="success">Resuelta</Badge>;
}
