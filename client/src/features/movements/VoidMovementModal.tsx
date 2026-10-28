import { useEffect, useState, type FormEvent } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button, Modal } from '@/shared/components/ui';
import { useToast } from '@/shared/components/toast/ToastProvider';
import { getErrorMessage, getFieldErrors } from '@/shared/api/http';
import type { Movement } from '@/shared/types';
import { cn } from '@/shared/utils/cn';
import { movementsApi } from './movements.api';

interface VoidMovementModalProps {
  movement: Movement | null;
  onClose: () => void;
  onVoided: () => void;
}

export function VoidMovementModal({ movement, onClose, onVoided }: VoidMovementModalProps) {
  const toast = useToast();
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setReason('');
    setError(undefined);
  }, [movement]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!movement) return;
    if (reason.trim().length < 5) {
      setError('Describa el motivo de la anulación (mínimo 5 caracteres)');
      return;
    }
    setLoading(true);
    try {
      await movementsApi.void(movement.id, reason.trim());
      toast.success(`Movimiento ${movement.code} anulado. El stock fue revertido.`);
      onVoided();
      onClose();
    } catch (err) {
      setError(getFieldErrors(err).reason);
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={movement !== null}
      onClose={onClose}
      size="sm"
      title="Anular movimiento"
      description={
        movement ? `${movement.code} · ${movement.documentNumber ?? 'sin documento'}` : undefined
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" form="void-form" variant="danger" loading={loading}>
            Anular y revertir stock
          </Button>
        </>
      }
    >
      <form id="void-form" onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            El movimiento no se elimina: quedará marcado como anulado y se generará un ajuste
            inverso que devuelve el stock a su valor anterior. Esta acción queda registrada en la
            bitácora.
          </p>
        </div>
        <div>
          <label htmlFor="reason" className="label">
            Motivo de la anulación <span className="text-red-500">*</span>
          </label>
          <textarea
            id="reason"
            rows={3}
            maxLength={300}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            className={cn('input resize-none', error && 'input-error')}
            placeholder="Ej. Vale duplicado por error de digitación"
            autoFocus
          />
          {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
      </form>
    </Modal>
  );
}
