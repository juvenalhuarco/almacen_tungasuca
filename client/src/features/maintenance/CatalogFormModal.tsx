import { useEffect, useState, type FormEvent } from 'react';
import { Button, Input, Modal } from '@/shared/components/ui';
import { useToast } from '@/shared/components/toast/ToastProvider';
import { getErrorMessage, getFieldErrors } from '@/shared/api/http';
import { cn } from '@/shared/utils/cn';
import type { CatalogBase } from '@/shared/types';
import type { CatalogDefinition } from './catalog-config';

interface CatalogFormModalProps<T extends CatalogBase> {
  open: boolean;
  definition: CatalogDefinition<T>;
  row: T | null;
  onClose: () => void;
  onSaved: () => void;
}

export function CatalogFormModal<T extends CatalogBase>({
  open,
  definition,
  row,
  onClose,
  onSaved,
}: CatalogFormModalProps<T>) {
  const toast = useToast();
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const isEdit = row !== null;

  useEffect(() => {
    if (!open) return;
    const next: Record<string, string> = {};
    for (const field of definition.fields) {
      const value = row ? (row as Record<string, unknown>)[field.name] : '';
      next[field.name] = value === null || value === undefined ? '' : String(value);
    }
    setValues(next);
    setErrors({});
  }, [open, row, definition]);

  const handleChange = (name: string, raw: string) => {
    const field = definition.fields.find((f) => f.name === name);
    const value = field?.transform ? field.transform(raw) : raw;
    setValues((current) => ({ ...current, [name]: value }));
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    for (const field of definition.fields) {
      const value = values[field.name]?.trim() ?? '';
      if (field.required && !value) {
        next[field.name] = 'Este campo es obligatorio';
        continue;
      }
      if (value && field.validate) {
        const message = field.validate(value);
        if (message) next[field.name] = message;
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!validate()) return;
    const payload: Record<string, unknown> = {};
    for (const field of definition.fields) {
      const value = values[field.name]?.trim() ?? '';
      payload[field.name] = value === '' ? null : value;
    }
    setLoading(true);
    try {
      if (isEdit) {
        await definition.api.update(row.id, payload);
        toast.success(`${capitalize(definition.singular)} actualizada correctamente`);
      } else {
        await definition.api.create(payload);
        toast.success(`${capitalize(definition.singular)} registrada correctamente`);
      }
      onSaved();
      onClose();
    } catch (err) {
      setErrors(getFieldErrors(err));
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? `Editar ${definition.singular}` : `Nueva ${definition.singular}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" form="catalog-form" loading={loading}>
            {isEdit ? 'Guardar cambios' : 'Registrar'}
          </Button>
        </>
      }
    >
      <form
        id="catalog-form"
        onSubmit={handleSubmit}
        className="grid gap-4 sm:grid-cols-2"
        noValidate
      >
        {definition.fields.map((field) =>
          field.type === 'textarea' ? (
            <div key={field.name} className={cn(field.fullWidth && 'sm:col-span-2')}>
              <label htmlFor={field.name} className="label">
                {field.label}
                {field.required && <span className="ml-0.5 text-red-500">*</span>}
              </label>
              <textarea
                id={field.name}
                name={field.name}
                rows={3}
                maxLength={field.maxLength}
                value={values[field.name] ?? ''}
                onChange={(event) => handleChange(field.name, event.target.value)}
                className={cn('input resize-none', errors[field.name] && 'input-error')}
              />
              {errors[field.name] && (
                <p className="mt-1 text-xs text-red-600">{errors[field.name]}</p>
              )}
            </div>
          ) : (
            <Input
              key={field.name}
              label={field.label}
              name={field.name}
              type={field.type ?? 'text'}
              maxLength={field.maxLength}
              placeholder={field.placeholder}
              hint={field.hint}
              required={field.required}
              value={values[field.name] ?? ''}
              onChange={(event) => handleChange(field.name, event.target.value)}
              error={errors[field.name]}
              className={cn(field.fullWidth && 'sm:col-span-2')}
            />
          ),
        )}
      </form>
    </Modal>
  );
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
