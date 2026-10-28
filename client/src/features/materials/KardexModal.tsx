import { useEffect, useState } from 'react';
import { ArrowDownCircle, ArrowUpCircle, RefreshCcw } from 'lucide-react';
import { Badge, Modal, Table, type Column } from '@/shared/components/ui';
import { getErrorMessage } from '@/shared/api/http';
import type { KardexEntry, Material } from '@/shared/types';
import { formatDateTime, formatNumber } from '@/shared/utils/format';
import { materialsApi } from './materials.api';
import { StockStatusBadge } from './StockStatusBadge';

interface KardexModalProps {
  material: Material | null;
  onClose: () => void;
}

const TYPE_STYLES = {
  ENTRADA: { label: 'Entrada', tone: 'success' as const, icon: ArrowDownCircle },
  SALIDA: { label: 'Salida', tone: 'danger' as const, icon: ArrowUpCircle },
  AJUSTE: { label: 'Ajuste', tone: 'info' as const, icon: RefreshCcw },
};

export function KardexModal({ material, onClose }: KardexModalProps) {
  const [entries, setEntries] = useState<KardexEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!material) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    materialsApi
      .kardex(material.id)
      .then((data) => {
        if (!cancelled) setEntries(data);
      })
      .catch((err) => {
        if (!cancelled) setError(getErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [material]);

  const columns: Column<KardexEntry>[] = [
    {
      key: 'date',
      header: 'Fecha',
      render: (row) => (
        <div>
          <p className="text-slate-900">{formatDateTime(row.date)}</p>
          <p className="text-xs text-slate-500">{row.movementCode}</p>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Operación',
      render: (row) => {
        const style = TYPE_STYLES[row.movementType];
        return (
          <div className="flex flex-col items-start gap-1">
            <Badge tone={style.tone}>
              <style.icon className="h-3 w-3" />
              {style.label}
            </Badge>
            {row.movementStatus === 'ANULADO' && <Badge tone="danger">Anulado</Badge>}
            {row.isReversal && <span className="text-[11px] text-slate-500">Reversión</span>}
          </div>
        );
      },
    },
    {
      key: 'document',
      header: 'Documento / Destino',
      render: (row) => (
        <div>
          <p className="text-slate-900">{row.documentNumber ?? '—'}</p>
          <p className="text-xs text-slate-500">{row.counterpart ?? ''}</p>
        </div>
      ),
    },
    {
      key: 'quantity',
      header: 'Cantidad',
      className: 'text-right font-semibold',
      render: (row) => {
        const decreases = row.resultingStock < row.previousStock;
        return (
          <span className={decreases ? 'text-red-600' : 'text-emerald-700'}>
            {decreases ? '-' : '+'}
            {formatNumber(row.quantity)}
          </span>
        );
      },
    },
    {
      key: 'previous',
      header: 'Saldo anterior',
      className: 'text-right text-slate-500',
      render: (row) => formatNumber(row.previousStock),
    },
    {
      key: 'resulting',
      header: 'Saldo resultante',
      className: 'text-right font-semibold text-slate-900',
      render: (row) => formatNumber(row.resultingStock),
    },
    {
      key: 'user',
      header: 'Registrado por',
      render: (row) => <span className="text-slate-600">{row.user}</span>,
    },
  ];

  return (
    <Modal
      open={material !== null}
      onClose={onClose}
      size="xl"
      title="Kardex del material"
      description={material ? `${material.code} · ${material.name}` : undefined}
    >
      {material && (
        <div className="mb-4 grid gap-3 sm:grid-cols-4">
          <Stat
            label="Stock actual"
            value={`${formatNumber(material.currentStock)} ${material.unit.abbreviation}`}
          />
          <Stat
            label="Stock mínimo"
            value={`${formatNumber(material.minimumStock)} ${material.unit.abbreviation}`}
          />
          <Stat label="Categoría" value={material.category.name} />
          <div className="rounded-lg bg-slate-50 px-3 py-2">
            <p className="text-xs text-slate-500">Estado</p>
            <StockStatusBadge status={material.stockStatus} />
          </div>
        </div>
      )}
      {error && (
        <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}
      <div className="overflow-hidden rounded-lg border border-slate-200">
        <Table
          columns={columns}
          rows={entries}
          rowKey={(row) => row.detailId}
          loading={loading}
          emptyMessage="Este material aún no registra movimientos"
        />
      </div>
    </Modal>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}
