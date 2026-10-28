import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Plus,
  RefreshCcw,
  Save,
  Timer,
  Trash2,
  Zap,
} from 'lucide-react';
import { Button, Input, PageHeader, Select } from '@/shared/components/ui';
import { useToast } from '@/shared/components/toast/ToastProvider';
import { getErrorMessage, getFieldErrors } from '@/shared/api/http';
import { formatCurrency, formatNumber } from '@/shared/utils/format';
import { cn } from '@/shared/utils/cn';
import type { Material, MovementType, Supplier, WorkFront } from '@/shared/types';
import { materialsApi } from '@/features/materials/materials.api';
import { suppliersApi, workFrontsApi } from '@/features/maintenance/catalogs.api';
import { movementsApi, type MovementInput } from './movements.api';
import { MaterialPicker } from './MaterialPicker';

interface Line {
  key: number;
  material: Material | null;
  quantity: string;
  unitPrice: string;
  countedStock: string;
}

const TYPE_OPTIONS: Array<{
  value: MovementType;
  label: string;
  icon: typeof ArrowDownCircle;
  active: string;
}> = [
  {
    value: 'ENTRADA',
    label: 'Entrada',
    icon: ArrowDownCircle,
    active: 'border-emerald-500 bg-emerald-50 text-emerald-800',
  },
  {
    value: 'SALIDA',
    label: 'Salida',
    icon: ArrowUpCircle,
    active: 'border-red-500 bg-red-50 text-red-800',
  },
  {
    value: 'AJUSTE',
    label: 'Ajuste',
    icon: RefreshCcw,
    active: 'border-brand-500 bg-brand-50 text-brand-800',
  },
];

let lineKey = 0;
const newLine = (material: Material | null = null): Line => ({
  key: ++lineKey,
  material,
  quantity: '',
  unitPrice: material ? String(material.referencePrice) : '',
  countedStock: '',
});

function toLocalDateTime(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function NewMovementPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [materials, setMaterials] = useState<Material[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [workFronts, setWorkFronts] = useState<WorkFront[]>([]);

  const [type, setType] = useState<MovementType>(() => {
    const param = searchParams.get('tipo')?.toUpperCase();
    return param === 'SALIDA' || param === 'AJUSTE' ? param : 'ENTRADA';
  });
  const [date, setDate] = useState(() => toLocalDateTime(new Date()));
  const [documentNumber, setDocumentNumber] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [workFrontId, setWorkFrontId] = useState('');
  const [requester, setRequester] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<Line[]>([newLine()]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const startedAt = useRef(Date.now());
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(
      () => setElapsed(Math.floor((Date.now() - startedAt.current) / 1000)),
      1000,
    );
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    Promise.all([materialsApi.listAll(), suppliersApi.listAll(), workFrontsApi.listAll()])
      .then(([materialRows, supplierRows, workFrontRows]) => {
        setMaterials(materialRows);
        setSuppliers(supplierRows);
        setWorkFronts(workFrontRows);
        const preselected = Number(searchParams.get('materialId'));
        if (preselected) {
          const material = materialRows.find((row) => row.id === preselected);
          if (material) setLines([newLine(material)]);
        }
      })
      .catch((err) => toast.error(getErrorMessage(err, 'No se pudieron cargar los catálogos')));
  }, [toast, searchParams]);

  const usedIds = lines.map((line) => line.material?.id ?? 0).filter(Boolean);

  const projected = (line: Line): number | null => {
    if (!line.material) return null;
    if (type === 'AJUSTE') {
      return line.countedStock === '' ? null : Number(line.countedStock);
    }
    const quantity = Number(line.quantity);
    if (line.quantity === '' || !Number.isFinite(quantity)) return null;
    return type === 'ENTRADA'
      ? line.material.currentStock + quantity
      : line.material.currentStock - quantity;
  };

  const total = useMemo(
    () =>
      lines.reduce((sum, line) => {
        if (!line.material) return sum;
        const qty =
          type === 'AJUSTE'
            ? Math.abs(Number(line.countedStock || 0) - line.material.currentStock)
            : Number(line.quantity || 0);
        return sum + qty * Number(line.unitPrice || 0);
      }, 0),
    [lines, type],
  );

  const updateLine = (key: number, patch: Partial<Line>) =>
    setLines((current) => current.map((line) => (line.key === key ? { ...line, ...patch } : line)));

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (type === 'SALIDA' && !workFrontId)
      next.workFrontId = 'Seleccione el frente de obra de destino';
    if (type === 'AJUSTE' && notes.trim().length < 5) next.notes = 'Indique el motivo del ajuste';
    lines.forEach((line) => {
      if (!line.material) {
        next[`line-${line.key}`] = 'Seleccione un material';
        return;
      }
      if (type === 'AJUSTE') {
        if (line.countedStock === '' || Number(line.countedStock) < 0) {
          next[`line-${line.key}`] = 'Ingrese el stock físico contado';
        } else if (Number(line.countedStock) === line.material.currentStock) {
          next[`line-${line.key}`] =
            'El stock contado es igual al actual; no hay diferencia que ajustar';
        }
      } else {
        const qty = Number(line.quantity);
        if (line.quantity === '' || !(qty > 0)) {
          next[`line-${line.key}`] = 'Ingrese una cantidad mayor que cero';
        } else if (type === 'SALIDA' && qty > line.material.currentStock) {
          next[`line-${line.key}`] =
            `Stock insuficiente: disponible ${formatNumber(line.material.currentStock)} ${line.material.unit.abbreviation}`;
        }
      }
    });
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload: MovementInput = {
        type,
        date: new Date(date).toISOString(),
        documentNumber: documentNumber.trim() || undefined,
        supplierId: type === 'ENTRADA' && supplierId ? Number(supplierId) : undefined,
        workFrontId: type === 'SALIDA' && workFrontId ? Number(workFrontId) : undefined,
        requester: type === 'SALIDA' ? requester.trim() || undefined : undefined,
        notes: notes.trim() || undefined,
        registrationSeconds: Math.floor((Date.now() - startedAt.current) / 1000),
        lines: lines.map((line) => ({
          materialId: line.material!.id,
          quantity: type === 'AJUSTE' ? undefined : Number(line.quantity),
          unitPrice: line.unitPrice === '' ? undefined : Number(line.unitPrice),
          countedStock: type === 'AJUSTE' ? Number(line.countedStock) : undefined,
        })),
      };
      const movement = await movementsApi.create(payload);
      toast.success(`Movimiento ${movement.code} registrado correctamente`);
      navigate(`/movimientos?resaltar=${movement.id}`);
    } catch (err) {
      setErrors(getFieldErrors(err));
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;

  return (
    <>
      <PageHeader
        title="Registro de entradas y salidas"
        description="Captura rápida de movimientos de almacén con cálculo de stock proyectado en tiempo real."
        actions={
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            <Zap className="h-3.5 w-3.5" />
            Captura rápida activa
            <span className="ml-1 inline-flex items-center gap-1 text-emerald-600">
              <Timer className="h-3.5 w-3.5" />
              {minutes}:{String(seconds).padStart(2, '0')}
            </span>
          </span>
        }
      />

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <div className="card p-5">
          <p className="label">
            Tipo de operación <span className="text-red-500">*</span>
          </p>
          <div className="grid grid-cols-3 gap-3">
            {TYPE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  setType(option.value);
                  setErrors({});
                }}
                className={cn(
                  'flex items-center justify-center gap-2 rounded-lg border-2 px-3 py-3 text-sm font-semibold transition',
                  type === option.value
                    ? option.active
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
                )}
              >
                <option.icon className="h-5 w-5" />
                {option.label}
              </button>
            ))}
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <Input
              label="Fecha y hora"
              name="date"
              type="datetime-local"
              value={date}
              max={toLocalDateTime(new Date())}
              onChange={(event) => setDate(event.target.value)}
              error={errors.date}
              required
            />
            <Input
              label={
                type === 'ENTRADA'
                  ? 'Nro. guía / factura'
                  : type === 'SALIDA'
                    ? 'Nro. vale de salida'
                    : 'Documento de referencia'
              }
              name="documentNumber"
              placeholder={
                type === 'ENTRADA'
                  ? 'Ej. GUIA-4401'
                  : type === 'SALIDA'
                    ? 'Ej. VALE-2026-089'
                    : 'Ej. ACTA-CONTEO-03'
              }
              value={documentNumber}
              onChange={(event) => setDocumentNumber(event.target.value)}
              error={errors.documentNumber}
              maxLength={50}
            />
            {type === 'ENTRADA' && (
              <Select
                label="Proveedor"
                name="supplierId"
                value={supplierId}
                onChange={(event) => setSupplierId(event.target.value)}
                placeholder="Sin proveedor / compra menor"
                options={suppliers.map((supplier) => ({
                  value: supplier.id,
                  label: supplier.businessName,
                }))}
                error={errors.supplierId}
              />
            )}
            {type === 'SALIDA' && (
              <>
                <Select
                  label="Frente de obra / destino"
                  name="workFrontId"
                  value={workFrontId}
                  onChange={(event) => setWorkFrontId(event.target.value)}
                  placeholder="Seleccione el destino"
                  options={workFronts.map((front) => ({
                    value: front.id,
                    label: `${front.code} · ${front.name}`,
                  }))}
                  error={errors.workFrontId}
                  required
                />
                <Input
                  label="Solicitante"
                  name="requester"
                  placeholder="Nombre de quien retira el material"
                  value={requester}
                  onChange={(event) => setRequester(event.target.value)}
                  maxLength={150}
                />
              </>
            )}
            <div
              className={cn(
                type === 'SALIDA' ? 'md:col-span-2' : 'md:col-span-3',
                type === 'ENTRADA' && 'md:col-span-3',
              )}
            >
              <label htmlFor="notes" className="label">
                {type === 'AJUSTE' ? 'Motivo del ajuste' : 'Observaciones'}
                {type === 'AJUSTE' && <span className="ml-0.5 text-red-500">*</span>}
              </label>
              <textarea
                id="notes"
                rows={2}
                maxLength={500}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder={
                  type === 'AJUSTE' ? 'Ej. Conteo físico mensual: diferencia por merma' : 'Opcional'
                }
                className={cn('input resize-none', errors.notes && 'input-error')}
              />
              {errors.notes && <p className="mt-1 text-xs text-red-600">{errors.notes}</p>}
            </div>
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
            <h2 className="text-sm font-semibold text-slate-900">Materiales del movimiento</h2>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              icon={<Plus className="h-4 w-4" />}
              onClick={() => setLines((current) => [...current, newLine()])}
            >
              Agregar línea
            </Button>
          </div>

          <div className="divide-y divide-slate-100">
            {lines.map((line, index) => {
              const projection = projected(line);
              const negative = projection !== null && projection < 0;
              return (
                <div key={line.key} className="grid gap-3 px-5 py-4 lg:grid-cols-12 lg:items-start">
                  <div className="lg:col-span-5">
                    {index === 0 && <span className="label">Material / insumo</span>}
                    <MaterialPicker
                      materials={materials}
                      value={line.material}
                      excludeIds={usedIds}
                      onChange={(material) =>
                        updateLine(line.key, {
                          material,
                          unitPrice: material ? String(material.referencePrice) : '',
                        })
                      }
                      error={errors[`line-${line.key}`]}
                      autoFocus={index === lines.length - 1 && index > 0}
                    />
                  </div>

                  {type === 'AJUSTE' ? (
                    <Input
                      label={index === 0 ? 'Stock físico contado' : undefined}
                      name={`counted-${line.key}`}
                      type="number"
                      min={0}
                      step="any"
                      value={line.countedStock}
                      onChange={(event) =>
                        updateLine(line.key, { countedStock: event.target.value })
                      }
                      placeholder="Cantidad contada"
                      className="lg:col-span-2"
                    />
                  ) : (
                    <Input
                      label={index === 0 ? 'Cantidad' : undefined}
                      name={`quantity-${line.key}`}
                      type="number"
                      min={0}
                      step="any"
                      value={line.quantity}
                      onChange={(event) => updateLine(line.key, { quantity: event.target.value })}
                      placeholder="0"
                      className="lg:col-span-2"
                    />
                  )}

                  <Input
                    label={index === 0 ? 'Precio unit. (S/)' : undefined}
                    name={`price-${line.key}`}
                    type="number"
                    min={0}
                    step="0.01"
                    value={line.unitPrice}
                    onChange={(event) => updateLine(line.key, { unitPrice: event.target.value })}
                    className="lg:col-span-2"
                  />

                  <div className="lg:col-span-2">
                    {index === 0 && <span className="label">Stock proyectado</span>}
                    <div
                      className={cn(
                        'flex h-10 items-center rounded-lg border px-3 text-sm',
                        negative
                          ? 'border-red-300 bg-red-50 text-red-700'
                          : 'border-slate-200 bg-slate-50 text-slate-700',
                      )}
                    >
                      {line.material ? (
                        <>
                          <span className="text-slate-500">
                            {formatNumber(line.material.currentStock)}
                          </span>
                          <span className="mx-1 text-slate-400">→</span>
                          <strong>{projection === null ? '—' : formatNumber(projection)}</strong>
                          <span className="ml-1 text-xs text-slate-500">
                            {line.material.unit.abbreviation}
                          </span>
                        </>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </div>
                  </div>

                  <div
                    className={cn('flex lg:col-span-1 lg:justify-end', index === 0 && 'lg:pt-6')}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setLines((current) =>
                          current.length > 1
                            ? current.filter((l) => l.key !== line.key)
                            : [newLine()],
                        )
                      }
                      className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                      title="Quitar línea"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-slate-600">
              <span>
                Líneas: <strong>{lines.filter((line) => line.material).length}</strong>
              </span>
              <span className="mx-3 text-slate-300">|</span>
              <span>
                Valor del movimiento:{' '}
                <strong className="text-slate-900">{formatCurrency(total)}</strong>
              </span>
            </div>
            <Button
              type="submit"
              size="lg"
              loading={submitting}
              icon={<Save className="h-4 w-4" />}
            >
              Confirmar y guardar movimiento
            </Button>
          </div>
        </div>
      </form>
    </>
  );
}
