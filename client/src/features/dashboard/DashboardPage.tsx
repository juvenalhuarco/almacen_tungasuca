import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeftRight,
  Bell,
  Boxes,
  Coins,
  Target,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { PageHeader, Select } from '@/shared/components/ui';
import { useToast } from '@/shared/components/toast/ToastProvider';
import { useAuth } from '@/app/providers/AuthContext';
import { getErrorMessage } from '@/shared/api/http';
import { formatCurrency, formatDateTime, formatNumber } from '@/shared/utils/format';
import { cn } from '@/shared/utils/cn';
import type {
  CriticalMaterial,
  DailyMovements,
  DashboardSummary,
  KpiResult,
  RecentMovement,
} from '@/shared/types';
import { MovementTypeBadge } from '@/features/movements/MovementTypeBadge';
import { dashboardApi } from './dashboard.api';

export function DashboardPage() {
  const toast = useToast();
  const { user } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [kpis, setKpis] = useState<KpiResult[]>([]);
  const [kpiDays, setKpiDays] = useState(30);
  const [series, setSeries] = useState<DailyMovements[]>([]);
  const [critical, setCritical] = useState<CriticalMaterial[]>([]);
  const [recent, setRecent] = useState<RecentMovement[]>([]);

  useEffect(() => {
    Promise.all([
      dashboardApi.summary(),
      dashboardApi.movementsByDay(14),
      dashboardApi.criticalMaterials(),
      dashboardApi.recentMovements(),
    ])
      .then(([summaryData, seriesData, criticalData, recentData]) => {
        setSummary(summaryData);
        setSeries(seriesData);
        setCritical(criticalData);
        setRecent(recentData);
      })
      .catch((err) => toast.error(getErrorMessage(err)));
  }, [toast]);

  useEffect(() => {
    dashboardApi
      .kpis(kpiDays)
      .then(setKpis)
      .catch(() => undefined);
  }, [kpiDays]);

  return (
    <>
      <PageHeader
        title={`Bienvenido, ${user?.firstName ?? ''}`}
        description="Resumen general del almacén e indicadores clave de desempeño del proyecto."
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Boxes}
          label="Materiales activos"
          value={summary?.materials.total}
          detail={`${summary?.materials.critical ?? 0} críticos · ${summary?.materials.outOfStock ?? 0} agotados`}
          tone="bg-brand-50 text-brand-700"
          to="/materiales"
        />
        <StatCard
          icon={Bell}
          label="Alertas pendientes"
          value={summary?.alerts.pending}
          detail={`${summary?.alerts.attended ?? 0} en gestión`}
          tone="bg-amber-50 text-amber-700"
          to="/alertas"
        />
        <StatCard
          icon={ArrowLeftRight}
          label="Movimientos del mes"
          value={summary?.movements.month}
          detail={`${summary?.movements.entriesMonth ?? 0} entradas · ${summary?.movements.exitsMonth ?? 0} salidas · hoy ${summary?.movements.today ?? 0}`}
          tone="bg-emerald-50 text-emerald-700"
          to="/movimientos"
        />
        <StatCard
          icon={Coins}
          label="Valor del inventario"
          value={summary ? formatCurrency(summary.inventoryValue) : undefined}
          detail="Stock actual × precio referencial"
          tone="bg-violet-50 text-violet-700"
          to="/reportes"
        />
      </div>

      <div className="card mb-5 p-5">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
              <Target className="h-5 w-5 text-brand-600" />
              Indicadores clave de desempeño (KPIs)
            </h2>
            <p className="text-xs text-slate-500">
              Línea base del diagnóstico frente al valor real obtenido con el sistema.
            </p>
          </div>
          <Select
            name="kpiDays"
            value={String(kpiDays)}
            onChange={(event) => setKpiDays(Number(event.target.value))}
            options={[
              { value: 7, label: 'Últimos 7 días' },
              { value: 30, label: 'Últimos 30 días' },
              { value: 90, label: 'Últimos 90 días' },
              { value: 365, label: 'Último año' },
            ]}
            className="sm:w-44"
          />
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {kpis.map((kpi) => (
            <KpiCard key={kpi.key} kpi={kpi} />
          ))}
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <div className="card p-5 xl:col-span-2">
          <h2 className="mb-1 text-base font-semibold text-slate-900">
            Movimientos de los últimos 14 días
          </h2>
          <p className="mb-4 text-xs text-slate-500">
            Cantidad de operaciones registradas por día.
          </p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={series} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value: string) => value.slice(8, 10) + '/' + value.slice(5, 7)}
                  tick={{ fontSize: 11 }}
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  labelFormatter={(value) =>
                    `Fecha: ${String(value).split('-').reverse().join('/')}`
                  }
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="entradas" name="Entradas" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="salidas" name="Salidas" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="ajustes" name="Ajustes" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-5">
          <h2 className="mb-1 flex items-center gap-2 text-base font-semibold text-slate-900">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Materiales en nivel crítico
          </h2>
          <p className="mb-4 text-xs text-slate-500">
            Cobertura del stock actual respecto al mínimo configurado.
          </p>
          {critical.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              Todos los materiales superan su stock mínimo.
            </p>
          ) : (
            <ul className="space-y-3">
              {critical.map((item) => (
                <li key={item.id}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="truncate font-medium text-slate-900">
                      {item.code} · {item.name}
                    </span>
                    <span
                      className={cn(
                        'ml-2 shrink-0 text-xs font-semibold',
                        item.coverage === 0 ? 'text-red-600' : 'text-amber-600',
                      )}
                    >
                      {formatNumber(item.currentStock)} / {formatNumber(item.minimumStock)}{' '}
                      {item.unit}
                    </span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={cn(
                        'h-full rounded-full',
                        item.coverage === 0 ? 'bg-red-500' : 'bg-amber-500',
                      )}
                      style={{ width: `${Math.min(100, item.coverage)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
          <Link
            to="/alertas"
            className="mt-4 block text-center text-sm font-medium text-brand-600 hover:underline"
          >
            Ver todas las alertas
          </Link>
        </div>
      </div>

      <div className="card mt-5 p-5">
        <h2 className="mb-3 text-base font-semibold text-slate-900">Últimos movimientos</h2>
        {recent.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">
            Aún no se registran movimientos.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {recent.map((movement) => (
              <li
                key={movement.id}
                className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3">
                  <MovementTypeBadge type={movement.type} />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {movement.code}
                      {movement.documentNumber ? (
                        <span className="font-normal text-slate-500">
                          {' '}
                          · {movement.documentNumber}
                        </span>
                      ) : null}
                    </p>
                    <p className="text-xs text-slate-500">
                      {movement.counterpart ?? 'Almacén central'} · {movement.itemCount} ítem
                      {movement.itemCount === 1 ? '' : 's'}
                    </p>
                  </div>
                </div>
                <div className="text-xs text-slate-500 sm:text-right">
                  <p>{formatDateTime(movement.date)}</p>
                  <p>{movement.user}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
        <Link
          to="/movimientos"
          className="mt-2 block text-center text-sm font-medium text-brand-600 hover:underline"
        >
          Ver historial completo
        </Link>
      </div>
    </>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  detail,
  tone,
  to,
}: {
  icon: typeof Boxes;
  label: string;
  value: number | string | undefined;
  detail: string;
  tone: string;
  to: string;
}) {
  return (
    <Link
      to={to}
      className="card flex items-center gap-4 px-5 py-4 transition hover:border-brand-300"
    >
      <span className={cn('rounded-lg p-2.5', tone)}>
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-2xl font-bold text-slate-900">{value ?? '—'}</span>
        <span className="block text-xs font-medium text-slate-700">{label}</span>
        <span className="block truncate text-[11px] text-slate-500">{detail}</span>
      </span>
    </Link>
  );
}

function KpiCard({ kpi }: { kpi: KpiResult }) {
  const hasData = kpi.actual !== null;
  const format = (value: number) =>
    kpi.unit === 'min' ? `${formatNumber(value)} min` : `${formatNumber(value)} %`;
  const progress = (() => {
    if (!hasData) return 0;
    const actual = kpi.actual as number;
    if (kpi.lowerIsBetter) {
      const range = kpi.baseline - kpi.target;
      return Math.max(0, Math.min(100, ((kpi.baseline - actual) / range) * 100));
    }
    const range = kpi.target - kpi.baseline;
    return Math.max(0, Math.min(100, ((actual - kpi.baseline) / range) * 100));
  })();
  const Icon = kpi.lowerIsBetter ? TrendingDown : TrendingUp;

  return (
    <div
      className={cn(
        'rounded-xl border p-4',
        kpi.achieved ? 'border-emerald-200 bg-emerald-50/40' : 'border-slate-200 bg-slate-50/40',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{kpi.key}</p>
          <h3 className="text-sm font-semibold text-slate-900">{kpi.name}</h3>
        </div>
        <span
          className={cn(
            'rounded-full px-2 py-0.5 text-[11px] font-bold',
            kpi.achieved
              ? 'bg-emerald-100 text-emerald-800'
              : hasData
                ? 'bg-amber-100 text-amber-800'
                : 'bg-slate-200 text-slate-600',
          )}
        >
          {kpi.achieved ? 'Meta cumplida' : hasData ? 'En progreso' : 'Sin datos'}
        </span>
      </div>
      <p className="mt-2 flex items-baseline gap-2">
        <span className="text-3xl font-bold text-slate-900">
          {hasData ? format(kpi.actual as number) : '—'}
        </span>
        <Icon className={cn('h-4 w-4', kpi.achieved ? 'text-emerald-600' : 'text-slate-400')} />
      </p>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
        <div
          className={cn(
            'h-full rounded-full transition-all',
            kpi.achieved ? 'bg-emerald-500' : 'bg-brand-500',
          )}
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="mt-1 flex justify-between text-[11px] text-slate-500">
        <span>Línea base: {format(kpi.baseline)}</span>
        <span>Meta: {format(kpi.target)}</span>
      </div>
      <p className="mt-2 text-[11px] text-slate-500">
        {kpi.description} {hasData ? `Muestra: ${kpi.samples}.` : ''}
      </p>
    </div>
  );
}
