import { useEffect, useState, type FormEvent } from 'react';
import { Button, Input, Modal } from '@/shared/components/ui';
import { useToast } from '@/shared/components/toast/ToastProvider';
import { getErrorMessage, getFieldErrors } from '@/shared/api/http';
import type { Material } from '@/shared/types';
import { formatNumber } from '@/shared/utils/format';
import { materialsApi } from './materials.api';

interface MinimumStockModalProps {
  material: Material | null;
  onClose: () => void;
  onSaved: () => void;
}

export function MinimumStockModal({ material, onClose, onSaved }: MinimumStockModalProps) {
  const toast = useToast();
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setValue(material ? String(material.minimumStock) : '');
    setError(undefined);
  }, [material]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!material) return;
    const minimumStock = Number(value);
    if (value === '' || !Number.isFinite(minimumStock) || minimumStock < 0) {
      setError('Ingrese un valor mayor o igual a 0');
      return;
    }
    setLoading(true);
    try {
      await materialsApi.setMinimumStock(material.id, minimumStock);
      toast.success('Stock mínimo actualizado');
      onSaved();
      onClose();
    } catch (err) {
      setError(getFieldErrors(err).minimumStock);
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const projected =
    material && value !== '' && Number.isFinite(Number(value))
      ? material.currentStock <= 0
        ? 'Agotado'
        : material.currentStock <= Number(value)
          ? 'Crítico'
          : 'Óptimo'
      : null;

  return (
    <Modal
      open={material !== null}
      onClose={onClose}
      size="sm"
      title="Configurar stock mínimo"
      description={material ? `${material.code} · ${material.name}` : undefined}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" form="minimum-stock-form" loading={loading}>
            Guardar
          </Button>
        </>
      }
    >
      <form id="minimum-stock-form" onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
          Stock actual:{' '}
          <strong className="text-slate-900">
            {material ? `${formatNumber(material.currentStock)} ${material.unit.abbreviation}` : ''}
          </strong>
        </div>
        <Input
          label="Nivel mínimo de existencias"
          name="minimumStock"
          type="number"
          min={0}
          step="any"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          error={error}
          hint="Cuando el stock sea igual o menor a este valor se generará una alerta automática."
          required
          autoFocus
        />
        {projected && (
          <p className="text-sm text-slate-600">
            Estado resultante: <strong>{projected}</strong>
          </p>
        )}
      </form>
    </Modal>
  );
}
