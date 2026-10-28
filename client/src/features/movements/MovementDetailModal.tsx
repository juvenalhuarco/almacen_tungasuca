import { useEffect, useState } from 'react';
import { Ban } from 'lucide-react';
import { Badge, Button, Modal, Table, type Column } from '@/shared/components/ui';
import { getErrorMessage } from '@/shared/api/http';
import { useAuth } from '@/app/providers/AuthContext';
import { formatCurrency, formatDateTime, formatNumber } from '@/shared/utils/format';
import type { Movement, MovementLine } from '@/shared/types';
import { movementsApi } from './movements.api';
import { MovementTypeBadge } from './MovementTypeBadge';

interface MovementDetailModalProps {
  movementId: number | null;
  onClose: () => void;
  onVoid: (movement: Movement) => void;
}

export function MovementDetailModal({ movementId, onClose, onVoid }: MovementDetailModalProps) {
  const { isAdmin } = useAuth();
  const [movement, setMovement] = useState<Movement | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (movementId === null) {
      setMovement(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    movementsApi
      .getById(movementId)
      .then((data) => {
        if (!cancelled) setMovement(data);
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
  }, [movementId]);

  const columns: Column<MovementLine>[] = [
    {
      key: 'material',
      header: 'Material',
      render: (line) => (
        <div>
          <p className="font-medium text-slate-900">
            {line.material.code} · {line.material.name}
          </p>
          <p className="text-xs text-slate-500">{line.material.category}</p>
        </div>
      ),
    },
    {
      key: 'quantity',
      header: 'Cantidad',
      className: 'text-right font-semibold text-slate-900',
      render: (line) => `${formatNumber(line.quantity)} ${line.material.unit}`,
    },
    {
      key: 'price',
      header: 'P. unit.',
      className: 'text-right text-slate-600',
      render: (line) => formatCurrency(line.unitPrice),
    },
    {
      key: 'subtotal',
      header: 'Subtotal',
      className: 'text-right text-slate-700',
      render: (line) => formatCurrency(line.subtotal),
    },
    {
      key: 'previous',
      header: 'Stock anterior',
      className: 'text-right text-slate-500',
      render: (line) => formatNumber(line.previousStock),
    },
    {
      key: 'resulting',
      header: 'Stock resultante',
      className: 'text-right font-semibold text-slate-900',
      render: (line) => formatNumber(line.resultingStock),
    },
  ];

  const canVoid =
    isAdmin && movement?.status === 'REGISTRADO' && movement.reversesMovement === null;

  return (
    <Modal
      open={movementId !== null}
      onClose={onClose}
      size="xl"
      title={movement ? `Movimiento ${movement.code}` : 'Movimiento'}
      description={
        movement
          ? `Registrado por ${movement.user.name} el ${formatDateTime(movement.createdAt)}`
          : undefined
      }
      footer={
        <>
          {canVoid && (
            <Button
              variant="danger"
              icon={<Ban className="h-4 w-4" />}
              onClick={() => movement && onVoid(movement)}
            >
              Anular movimiento
            </Button>
          )}
          <Button variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
        </>
      }
    >
      {error && (
        <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}
      {movement && (
        <>
          <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Info label="Tipo">
              <MovementTypeBadge type={movement.type} />
            </Info>
            <Info label="Fecha del movimiento">{formatDateTime(movement.date)}</Info>
            <Info label="Documento">{movement.documentNumber ?? '—'}</Info>
            <Info label="Estado">
              {movement.status === 'ANULADO' ? (
                <Badge tone="danger">Anulado</Badge>
              ) : movement.reversesMovement ? (
                <Badge tone="info">Reversión de {movement.reversesMovement.code}</Badge>
              ) : (
                <Badge tone="success">Registrado</Badge>
              )}
            </Info>
            {movement.supplier && <Info label="Proveedor">{movement.supplier.name}</Info>}
            {movement.workFront && (
              <Info label="Frente de obra">
                {movement.workFront.code} · {movement.workFront.name}
              </Info>
            )}
            {movement.requester && <Info label="Solicitante">{movement.requester}</Info>}
            <Info label="Valor total">{formatCurrency(movement.total)}</Info>
            {movement.registrationSeconds !== null && (
              <Info label="Tiempo de registro">{formatSeconds(movement.registrationSeconds)}</Info>
            )}
            {movement.notes && (
              <Info label="Observaciones" className="sm:col-span-2 lg:col-span-4">
                {movement.notes}
              </Info>
            )}
            {movement.status === 'ANULADO' && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 sm:col-span-2 lg:col-span-4">
                <p>
                  <strong>Anulado</strong> por {movement.voidedBy?.name} el{' '}
                  {formatDateTime(movement.voidedAt)}.
                </p>
                <p>Motivo: {movement.voidReason}</p>
              </div>
            )}
          </div>
          <div className="overflow-hidden rounded-lg border border-slate-200">
            <Table
              columns={columns}
              rows={movement.lines ?? []}
              rowKey={(line) => line.id}
              loading={loading}
            />
          </div>
        </>
      )}
      {!movement && loading && (
        <p className="py-8 text-center text-sm text-slate-500">Cargando...</p>
      )}
    </Modal>
  );
}

function Info({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-lg bg-slate-50 px-3 py-2 ${className ?? ''}`}>
      <p className="text-xs text-slate-500">{label}</p>
      <div className="text-sm font-medium text-slate-900">{children}</div>
    </div>
  );
}

function formatSeconds(total: number): string {
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return minutes > 0 ? `${minutes} min ${seconds} s` : `${seconds} s`;
}
