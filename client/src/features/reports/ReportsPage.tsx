import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FileSpreadsheet, FileText, Search } from 'lucide-react';
import {
  Badge,
  Button,
  Input,
  PageHeader,
  Select,
  Table,
  type Column,
} from '@/shared/components/ui';
import { useToast } from '@/shared/components/toast/ToastProvider';
import { useAuth } from '@/app/providers/AuthContext';
import { getErrorMessage } from '@/shared/api/http';
import { formatCurrency, formatDate, formatDateTime, formatNumber } from '@/shared/utils/format';
import { exportToExcel, exportToPdf, type ExportColumn } from '@/shared/utils/export';
import { cn } from '@/shared/utils/cn';
import type {
  Category,
  CompanyInfo,
  KardexReport,
  KardexReportRow,
  Material,
  MovementReport,
  MovementReportRow,
  StockReport,
  StockReportRow,
  WorkFront,
} from '@/shared/types';
import { categoriesApi, workFrontsApi } from '@/features/maintenance/catalogs.api';
import { materialsApi } from '@/features/materials/materials.api';
import { StockStatusBadge } from '@/features/materials/StockStatusBadge';
import { MovementTypeBadge } from '@/features/movements/MovementTypeBadge';
import { MaterialPicker } from '@/features/movements/MaterialPicker';
import { reportsApi } from './reports.api';

type Tab = 'existencias' | 'movimientos' | 'kardex';

const TABS: Array<{ key: Tab; label: string }> = [
  { key: 'existencias', label: 'Existencias' },
  { key: 'movimientos', label: 'Movimientos' },
  { key: 'kardex', label: 'Kardex por material' },
];

const TYPE_LABEL = { ENTRADA: 'Entrada', SALIDA: 'Salida', AJUSTE: 'Ajuste' };
const STATUS_LABEL = { OPTIMO: 'Óptimo', CRITICO: 'Crítico', AGOTADO: 'Agotado' };

function firstDayOfMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function ReportsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = (searchParams.get('tab') as Tab) || 'existencias';
  const [company, setCompany] = useState<CompanyInfo | null>(null);

  useEffect(() => {
    reportsApi
      .company()
      .then(setCompany)
      .catch(() => undefined);
  }, []);

  return (
    <>
      <PageHeader
        title="Reportes"
        description="Consulta detallada de existencias y movimientos con exportación para auditoría de obra."
      />
      <div className="card overflow-hidden">
        <div className="flex overflow-x-auto border-b border-slate-200 bg-slate-50 px-2">
          {TABS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setSearchParams({ tab: item.key })}
              className={cn(
                'whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition',
                tab === item.key
                  ? 'border-brand-600 text-brand-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
        {tab === 'existencias' && <StockTab company={company} />}
        {tab === 'movimientos' && <MovementsTab company={company} />}
        {tab === 'kardex' && <KardexTab company={company} />}
      </div>
    </>
  );
}

function useExporter(company: CompanyInfo | null) {
  const toast = useToast();
  const { user } = useAuth();
  const [exporting, setExporting] = useState<'xlsx' | 'pdf' | null>(null);

  const run = async <T,>(
    format: 'xlsx' | 'pdf',
    report: string,
    options: Omit<Parameters<typeof exportToExcel<T>>[0], 'company' | 'generatedBy'>,
  ) => {
    if (!company) {
      toast.error('No se pudieron cargar los datos de la empresa');
      return;
    }
    if (options.rows.length === 0) {
      toast.warning('No hay datos para exportar');
      return;
    }
    setExporting(format);
    try {
      const full = { ...options, company, generatedBy: user?.fullName ?? '' };
      if (format === 'xlsx') await exportToExcel(full);
      else await exportToPdf(full);
      void reportsApi.logExport(report, format, options.rows.length);
      toast.success(format === 'xlsx' ? 'Archivo Excel generado' : 'PDF membretado generado');
    } catch (err) {
      toast.error(getErrorMessage(err, 'No se pudo generar el archivo'));
    } finally {
      setExporting(null);
    }
  };

  return { run, exporting };
}

function ExportButtons({
  exporting,
  onExcel,
  onPdf,
}: {
  exporting: 'xlsx' | 'pdf' | null;
  onExcel: () => void;
  onPdf: () => void;
}) {
  return (
    <div className="flex gap-2">
      <Button
        variant="success"
        size="sm"
        loading={exporting === 'xlsx'}
        icon={<FileSpreadsheet className="h-4 w-4" />}
        onClick={onExcel}
      >
        Exportar Excel
      </Button>
      <Button
        variant="danger"
        size="sm"
        loading={exporting === 'pdf'}
        icon={<FileText className="h-4 w-4" />}
        onClick={onPdf}
      >
        Exportar PDF membretado
      </Button>
    </div>
  );
}

function StockTab({ company }: { company: CompanyInfo | null }) {
  const toast = useToast();
  const { run, exporting } = useExporter(company);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [stockStatus, setStockStatus] = useState('');
  const [report, setReport] = useState<StockReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    categoriesApi
      .listAll(false)
      .then(setCategories)
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    setLoading(true);
    reportsApi
      .stock({ categoryId: categoryId ? Number(categoryId) : '', stockStatus })
      .then(setReport)
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [categoryId, stockStatus, toast]);

  const columns: Column<StockReportRow>[] = [
    {
      key: 'code',
      header: 'Código',
      render: (row) => <span className="font-semibold">{row.code}</span>,
    },
    { key: 'name', header: 'Material', render: (row) => row.name },
    {
      key: 'category',
      header: 'Categoría',
      render: (row) => <span className="text-slate-600">{row.category}</span>,
    },
    { key: 'unit', header: 'U.M.', render: (row) => row.unit },
    {
      key: 'stock',
      header: 'Stock',
      className: 'text-right font-semibold',
      render: (row) => formatNumber(row.currentStock),
    },
    {
      key: 'min',
      header: 'Mínimo',
      className: 'text-right text-slate-600',
      render: (row) => formatNumber(row.minimumStock),
    },
    {
      key: 'price',
      header: 'P. ref.',
      className: 'text-right text-slate-600',
      render: (row) => formatCurrency(row.referencePrice),
    },
    {
      key: 'value',
      header: 'Valorizado',
      className: 'text-right',
      render: (row) => formatCurrency(row.stockValue),
    },
    {
      key: 'status',
      header: 'Estado',
      render: (row) => <StockStatusBadge status={row.stockStatus} />,
    },
  ];

  const exportColumns: ExportColumn<StockReportRow>[] = [
    { header: 'Código', key: 'code', width: 12 },
    { header: 'Material', key: 'name', width: 40 },
    { header: 'Categoría', key: 'category', width: 18 },
    { header: 'U.M.', key: 'unit', width: 8 },
    { header: 'Ubicación', key: 'location', width: 18 },
    {
      header: 'Stock actual',
      key: 'currentStock',
      width: 12,
      align: 'right',
      numberFormat: '#,##0.###',
    },
    {
      header: 'Stock mínimo',
      key: 'minimumStock',
      width: 12,
      align: 'right',
      numberFormat: '#,##0.###',
    },
    {
      header: 'Precio ref. (S/)',
      key: 'referencePrice',
      width: 14,
      align: 'right',
      numberFormat: '#,##0.00',
    },
    {
      header: 'Valorizado (S/)',
      key: 'stockValue',
      width: 14,
      align: 'right',
      numberFormat: '#,##0.00',
    },
    {
      header: 'Estado',
      key: 'stockStatus',
      width: 10,
      value: (row) => STATUS_LABEL[row.stockStatus],
    },
  ];

  const exportOptions = () => ({
    title: 'Reporte de existencias valorizado',
    subtitle:
      [
        categoryId
          ? `Categoría: ${categories.find((c) => String(c.id) === categoryId)?.name}`
          : null,
        stockStatus ? `Estado: ${STATUS_LABEL[stockStatus as keyof typeof STATUS_LABEL]}` : null,
      ]
        .filter(Boolean)
        .join(' · ') || 'Todos los materiales activos',
    fileName: 'existencias',
    columns: exportColumns,
    rows: report?.rows ?? [],
    landscape: true,
    summary: report
      ? [
          { label: 'Materiales', value: report.totals.materials },
          {
            label: 'Óptimos / Críticos / Agotados',
            value: `${report.totals.optimal} / ${report.totals.critical} / ${report.totals.outOfStock}`,
          },
          { label: 'Valor total del inventario', value: formatCurrency(report.totals.stockValue) },
        ]
      : [],
  });

  return (
    <div>
      <div className="flex flex-col gap-3 border-b border-slate-200 p-4 md:flex-row md:items-end md:justify-between">
        <div className="grid flex-1 gap-3 sm:grid-cols-2 md:max-w-xl">
          <Select
            label="Categoría"
            name="categoryId"
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            placeholder="Todas"
            options={categories.map((category) => ({ value: category.id, label: category.name }))}
          />
          <Select
            label="Estado de stock"
            name="stockStatus"
            value={stockStatus}
            onChange={(event) => setStockStatus(event.target.value)}
            placeholder="Todos"
            options={[
              { value: 'OPTIMO', label: 'Óptimo' },
              { value: 'CRITICO', label: 'Crítico' },
              { value: 'AGOTADO', label: 'Agotado' },
            ]}
          />
        </div>
        <ExportButtons
          exporting={exporting}
          onExcel={() => run('xlsx', 'existencias', exportOptions())}
          onPdf={() => run('pdf', 'existencias', exportOptions())}
        />
      </div>
      {report && (
        <div className="grid gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm sm:grid-cols-4">
          <Summary label="Materiales" value={report.totals.materials} />
          <Summary label="Críticos" value={report.totals.critical} tone="text-amber-700" />
          <Summary label="Agotados" value={report.totals.outOfStock} tone="text-red-700" />
          <Summary label="Valor del inventario" value={formatCurrency(report.totals.stockValue)} />
        </div>
      )}
      <Table
        columns={columns}
        rows={report?.rows ?? []}
        rowKey={(row) => row.code}
        loading={loading}
      />
    </div>
  );
}

function MovementsTab({ company }: { company: CompanyInfo | null }) {
  const toast = useToast();
  const { run, exporting } = useExporter(company);
  const [workFronts, setWorkFronts] = useState<WorkFront[]>([]);
  const [filters, setFilters] = useState({
    from: firstDayOfMonth(),
    to: today(),
    type: '',
    status: '',
    workFrontId: '',
  });
  const [report, setReport] = useState<MovementReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    workFrontsApi
      .listAll(false)
      .then(setWorkFronts)
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    setLoading(true);
    reportsApi
      .movements({
        ...filters,
        workFrontId: filters.workFrontId ? Number(filters.workFrontId) : '',
      })
      .then(setReport)
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [filters, toast]);

  const update = (key: keyof typeof filters) => (event: { target: { value: string } }) =>
    setFilters((current) => ({ ...current, [key]: event.target.value }));

  const columns: Column<MovementReportRow>[] = [
    {
      key: 'code',
      header: 'Código / Fecha',
      render: (row) => (
        <div>
          <p className="font-semibold">{row.code}</p>
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
          {row.status === 'ANULADO' && <Badge tone="danger">Anulado</Badge>}
        </div>
      ),
    },
    {
      key: 'material',
      header: 'Material',
      render: (row) => `${row.materialCode} · ${row.materialName}`,
    },
    {
      key: 'quantity',
      header: 'Cantidad',
      className: 'text-right font-semibold',
      render: (row) => `${formatNumber(row.quantity)} ${row.unit}`,
    },
    {
      key: 'subtotal',
      header: 'Valor',
      className: 'text-right text-slate-600',
      render: (row) => formatCurrency(row.subtotal),
    },
    { key: 'document', header: 'Documento', render: (row) => row.documentNumber ?? '—' },
    {
      key: 'counterpart',
      header: 'Proveedor / Frente',
      render: (row) => <span className="text-slate-600">{row.counterpart ?? '—'}</span>,
    },
    {
      key: 'user',
      header: 'Registrado por',
      render: (row) => <span className="text-slate-600">{row.user}</span>,
    },
  ];

  const exportColumns: ExportColumn<MovementReportRow>[] = [
    { header: 'Código', key: 'code', width: 14 },
    { header: 'Fecha', key: 'date', width: 16, value: (row) => formatDateTime(row.date) },
    { header: 'Operación', key: 'type', width: 10, value: (row) => TYPE_LABEL[row.type] },
    {
      header: 'Estado',
      key: 'status',
      width: 11,
      value: (row) => (row.status === 'ANULADO' ? 'Anulado' : 'Registrado'),
    },
    { header: 'Documento', key: 'documentNumber', width: 14 },
    { header: 'Proveedor / Frente', key: 'counterpart', width: 28 },
    { header: 'Cód. material', key: 'materialCode', width: 12 },
    { header: 'Material', key: 'materialName', width: 34 },
    { header: 'Cantidad', key: 'quantity', width: 10, align: 'right', numberFormat: '#,##0.###' },
    { header: 'U.M.', key: 'unit', width: 7 },
    {
      header: 'P. unit. (S/)',
      key: 'unitPrice',
      width: 11,
      align: 'right',
      numberFormat: '#,##0.00',
    },
    {
      header: 'Subtotal (S/)',
      key: 'subtotal',
      width: 12,
      align: 'right',
      numberFormat: '#,##0.00',
    },
    {
      header: 'Stock anterior',
      key: 'previousStock',
      width: 12,
      align: 'right',
      numberFormat: '#,##0.###',
    },
    {
      header: 'Stock resultante',
      key: 'resultingStock',
      width: 13,
      align: 'right',
      numberFormat: '#,##0.###',
    },
    { header: 'Registrado por', key: 'user', width: 22 },
  ];

  const exportOptions = () => ({
    title: 'Reporte de movimientos de almacén',
    subtitle: `Periodo ${formatDate(filters.from)} al ${formatDate(filters.to)}`,
    fileName: 'movimientos',
    columns: exportColumns,
    rows: report?.rows ?? [],
    landscape: true,
    summary: report
      ? [
          { label: 'Movimientos', value: report.totals.movements },
          {
            label: 'Entradas / Salidas / Ajustes',
            value: `${report.totals.entries} / ${report.totals.exits} / ${report.totals.adjustments}`,
          },
          {
            label: 'Valor de los movimientos registrados',
            value: formatCurrency(report.totals.value),
          },
        ]
      : [],
  });

  return (
    <div>
      <div className="flex flex-col gap-3 border-b border-slate-200 p-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Input
            label="Desde"
            name="from"
            type="date"
            value={filters.from}
            onChange={update('from')}
          />
          <Input label="Hasta" name="to" type="date" value={filters.to} onChange={update('to')} />
          <Select
            label="Tipo"
            name="type"
            value={filters.type}
            onChange={update('type')}
            placeholder="Todos"
            options={[
              { value: 'ENTRADA', label: 'Entradas' },
              { value: 'SALIDA', label: 'Salidas' },
              { value: 'AJUSTE', label: 'Ajustes' },
            ]}
          />
          <Select
            label="Estado"
            name="status"
            value={filters.status}
            onChange={update('status')}
            placeholder="Todos"
            options={[
              { value: 'REGISTRADO', label: 'Registrados' },
              { value: 'ANULADO', label: 'Anulados' },
            ]}
          />
          <Select
            label="Frente de obra"
            name="workFrontId"
            value={filters.workFrontId}
            onChange={update('workFrontId')}
            placeholder="Todos"
            options={workFronts.map((front) => ({
              value: front.id,
              label: `${front.code} · ${front.name}`,
            }))}
          />
        </div>
        <ExportButtons
          exporting={exporting}
          onExcel={() => run('xlsx', 'movimientos', exportOptions())}
          onPdf={() => run('pdf', 'movimientos', exportOptions())}
        />
      </div>
      {report && (
        <div className="grid gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm sm:grid-cols-4">
          <Summary label="Movimientos" value={report.totals.movements} />
          <Summary label="Entradas" value={report.totals.entries} tone="text-emerald-700" />
          <Summary label="Salidas" value={report.totals.exits} tone="text-red-700" />
          <Summary label="Valor registrado" value={formatCurrency(report.totals.value)} />
        </div>
      )}
      <Table
        columns={columns}
        rows={report?.rows ?? []}
        rowKey={(row) => `${row.movementId}-${row.materialCode}`}
        loading={loading}
        emptyMessage="No hay movimientos en el periodo"
      />
    </div>
  );
}

function KardexTab({ company }: { company: CompanyInfo | null }) {
  const toast = useToast();
  const { run, exporting } = useExporter(company);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [material, setMaterial] = useState<Material | null>(null);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [report, setReport] = useState<KardexReport | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    materialsApi
      .listAll()
      .then(setMaterials)
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!material) {
      setReport(null);
      return;
    }
    setLoading(true);
    reportsApi
      .kardex(material.id, { from, to })
      .then(setReport)
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [material, from, to, toast]);

  const columns: Column<KardexReportRow>[] = [
    { key: 'date', header: 'Fecha', render: (row) => formatDateTime(row.date) },
    {
      key: 'code',
      header: 'Movimiento',
      render: (row) => (
        <div>
          <p className="font-semibold">{row.code}</p>
          <div className="flex gap-1">
            <MovementTypeBadge type={row.type} />
            {row.status === 'ANULADO' && <Badge tone="danger">Anulado</Badge>}
          </div>
        </div>
      ),
    },
    {
      key: 'document',
      header: 'Documento / Contraparte',
      render: (row) =>
        `${row.documentNumber ?? '—'}${row.counterpart ? ` · ${row.counterpart}` : ''}`,
    },
    {
      key: 'entry',
      header: 'Entrada',
      className: 'text-right text-emerald-700 font-semibold',
      render: (row) => (row.entry ? formatNumber(row.entry) : ''),
    },
    {
      key: 'exit',
      header: 'Salida',
      className: 'text-right text-red-700 font-semibold',
      render: (row) => (row.exit ? formatNumber(row.exit) : ''),
    },
    {
      key: 'balance',
      header: 'Saldo',
      className: 'text-right font-bold',
      render: (row) => formatNumber(row.balance),
    },
    {
      key: 'user',
      header: 'Registrado por',
      render: (row) => <span className="text-slate-600">{row.user}</span>,
    },
  ];

  const exportColumns: ExportColumn<KardexReportRow>[] = [
    { header: 'Fecha', key: 'date', width: 16, value: (row) => formatDateTime(row.date) },
    { header: 'Movimiento', key: 'code', width: 14 },
    {
      header: 'Operación',
      key: 'type',
      width: 10,
      value: (row) =>
        `${TYPE_LABEL[row.type]}${row.status === 'ANULADO' ? ' (anulado)' : ''}${row.isReversal ? ' (reversión)' : ''}`,
    },
    { header: 'Documento', key: 'documentNumber', width: 14 },
    { header: 'Proveedor / Frente', key: 'counterpart', width: 28 },
    {
      header: 'Entrada',
      key: 'entry',
      width: 10,
      align: 'right',
      numberFormat: '#,##0.###',
      value: (row) => row.entry || null,
    },
    {
      header: 'Salida',
      key: 'exit',
      width: 10,
      align: 'right',
      numberFormat: '#,##0.###',
      value: (row) => row.exit || null,
    },
    { header: 'Saldo', key: 'balance', width: 10, align: 'right', numberFormat: '#,##0.###' },
    {
      header: 'P. unit. (S/)',
      key: 'unitPrice',
      width: 11,
      align: 'right',
      numberFormat: '#,##0.00',
    },
    { header: 'Registrado por', key: 'user', width: 22 },
  ];

  const exportOptions = () => ({
    title: `Kardex: ${report?.material.code} · ${report?.material.name}`,
    subtitle:
      from || to
        ? `Periodo ${from ? formatDate(from) : 'inicio'} al ${to ? formatDate(to) : 'hoy'}`
        : 'Historial completo',
    fileName: `kardex_${report?.material.code ?? ''}`,
    columns: exportColumns,
    rows: report?.rows ?? [],
    landscape: true,
    summary: report
      ? [
          {
            label: 'Saldo inicial',
            value: `${formatNumber(report.openingBalance)} ${report.material.unit}`,
          },
          {
            label: 'Total entradas',
            value: `${formatNumber(report.totals.entries)} ${report.material.unit}`,
          },
          {
            label: 'Total salidas',
            value: `${formatNumber(report.totals.exits)} ${report.material.unit}`,
          },
          {
            label: 'Saldo final',
            value: `${formatNumber(report.totals.closingBalance)} ${report.material.unit}`,
          },
        ]
      : [],
  });

  return (
    <div>
      <div className="flex flex-col gap-3 border-b border-slate-200 p-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="grid flex-1 gap-3 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <span className="label">Material</span>
            <MaterialPicker materials={materials} value={material} onChange={setMaterial} />
          </div>
          <Input
            label="Desde"
            name="from"
            type="date"
            value={from}
            onChange={(event) => setFrom(event.target.value)}
          />
          <Input
            label="Hasta"
            name="to"
            type="date"
            value={to}
            onChange={(event) => setTo(event.target.value)}
          />
        </div>
        <ExportButtons
          exporting={exporting}
          onExcel={() => run('xlsx', 'kardex', exportOptions())}
          onPdf={() => run('pdf', 'kardex', exportOptions())}
        />
      </div>
      {report ? (
        <>
          <div className="grid gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm sm:grid-cols-4">
            <Summary
              label="Saldo inicial"
              value={`${formatNumber(report.openingBalance)} ${report.material.unit}`}
            />
            <Summary
              label="Entradas"
              value={`${formatNumber(report.totals.entries)} ${report.material.unit}`}
              tone="text-emerald-700"
            />
            <Summary
              label="Salidas"
              value={`${formatNumber(report.totals.exits)} ${report.material.unit}`}
              tone="text-red-700"
            />
            <Summary
              label="Saldo final"
              value={`${formatNumber(report.totals.closingBalance)} ${report.material.unit}`}
            />
          </div>
          <Table
            columns={columns}
            rows={report.rows}
            rowKey={(row) => `${row.code}-${row.date}`}
            loading={loading}
            emptyMessage="El material no registra movimientos en el periodo"
          />
        </>
      ) : (
        <div className="flex flex-col items-center gap-2 px-6 py-16 text-center text-slate-500">
          <Search className="h-8 w-8 text-slate-300" />
          <p className="text-sm">Seleccione un material para ver su kardex.</p>
        </div>
      )}
    </div>
  );
}

function Summary({ label, value, tone }: { label: string; value: string | number; tone?: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className={cn('text-base font-bold text-slate-900', tone)}>{value}</p>
    </div>
  );
}
