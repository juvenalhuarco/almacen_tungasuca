import { useEffect, useState, type FormEvent } from 'react';
import { Button, Input, Modal, Select } from '@/shared/components/ui';
import { useToast } from '@/shared/components/toast/ToastProvider';
import { getErrorMessage, getFieldErrors } from '@/shared/api/http';
import type { Category, Material, UnitOfMeasure } from '@/shared/types';
import { materialsApi } from './materials.api';

interface MaterialFormModalProps {
  open: boolean;
  material: Material | null;
  categories: Category[];
  units: UnitOfMeasure[];
  onClose: () => void;
  onSaved: () => void;
}

interface FormState {
  code: string;
  name: string;
  description: string;
  categoryId: string;
  unitId: string;
  minimumStock: string;
  initialStock: string;
  referencePrice: string;
  location: string;
}

const EMPTY: FormState = {
  code: '',
  name: '',
  description: '',
  categoryId: '',
  unitId: '',
  minimumStock: '',
  initialStock: '0',
  referencePrice: '0',
  location: '',
};

export function MaterialFormModal({
  open,
  material,
  categories,
  units,
  onClose,
  onSaved,
}: MaterialFormModalProps) {
  const toast = useToast();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const isEdit = material !== null;

  useEffect(() => {
    if (!open) return;
    setErrors({});
    if (material) {
      setForm({
        code: material.code,
        name: material.name,
        description: material.description ?? '',
        categoryId: String(material.category.id),
        unitId: String(material.unit.id),
        minimumStock: String(material.minimumStock),
        initialStock: String(material.currentStock),
        referencePrice: String(material.referencePrice),
        location: material.location ?? '',
      });
    } else {
      setForm(EMPTY);
      materialsApi
        .nextCode()
        .then((code) => setForm((current) => ({ ...current, code })))
        .catch(() => undefined);
    }
  }, [open, material]);

  const update = (field: keyof FormState) => (event: { target: { value: string } }) =>
    setForm((current) => ({ ...current, [field]: event.target.value }));

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = 'Ingrese el nombre del material';
    if (!form.categoryId) next.categoryId = 'Seleccione una categoría';
    if (!form.unitId) next.unitId = 'Seleccione una unidad';
    if (form.minimumStock === '' || Number(form.minimumStock) < 0)
      next.minimumStock = 'Ingrese un valor mayor o igual a 0';
    if (!isEdit && (form.initialStock === '' || Number(form.initialStock) < 0))
      next.initialStock = 'Ingrese un valor mayor o igual a 0';
    if (form.referencePrice !== '' && Number(form.referencePrice) < 0)
      next.referencePrice = 'No puede ser negativo';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const base = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        categoryId: Number(form.categoryId),
        unitId: Number(form.unitId),
        minimumStock: Number(form.minimumStock),
        referencePrice: Number(form.referencePrice || 0),
        location: form.location.trim() || null,
      };
      if (isEdit) {
        await materialsApi.update(material.id, base);
        toast.success('Material actualizado correctamente');
      } else {
        await materialsApi.create({
          ...base,
          code: form.code.trim() || undefined,
          initialStock: Number(form.initialStock || 0),
        });
        toast.success('Material registrado correctamente');
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

  const selectedUnit = units.find((unit) => String(unit.id) === form.unitId);

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={isEdit ? 'Editar material' : 'Registrar nuevo material'}
      description={
        isEdit
          ? 'El stock actual solo se modifica mediante movimientos de entrada, salida o ajuste.'
          : 'Complete la ficha del material. El código se genera automáticamente si lo deja en blanco.'
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" form="material-form" loading={loading}>
            {isEdit ? 'Guardar cambios' : 'Registrar material'}
          </Button>
        </>
      }
    >
      <form
        id="material-form"
        onSubmit={handleSubmit}
        className="grid gap-4 sm:grid-cols-6"
        noValidate
      >
        <Input
          label="Código"
          name="code"
          value={form.code}
          onChange={(event) =>
            setForm((current) => ({ ...current, code: event.target.value.toUpperCase() }))
          }
          error={errors.code}
          disabled={isEdit}
          maxLength={20}
          className="sm:col-span-2"
        />
        <Input
          label="Nombre del material"
          name="name"
          value={form.name}
          onChange={update('name')}
          error={errors.name}
          maxLength={150}
          required
          className="sm:col-span-4"
        />
        <Select
          label="Categoría"
          name="categoryId"
          value={form.categoryId}
          onChange={update('categoryId')}
          error={errors.categoryId}
          placeholder="Seleccione"
          options={categories.map((category) => ({ value: category.id, label: category.name }))}
          required
          className="sm:col-span-3"
        />
        <Select
          label="Unidad de medida"
          name="unitId"
          value={form.unitId}
          onChange={update('unitId')}
          error={errors.unitId}
          placeholder="Seleccione"
          options={units.map((unit) => ({
            value: unit.id,
            label: `${unit.name} (${unit.abbreviation})`,
          }))}
          required
          className="sm:col-span-3"
        />
        <Input
          label="Stock mínimo"
          name="minimumStock"
          type="number"
          min={0}
          step="any"
          value={form.minimumStock}
          onChange={update('minimumStock')}
          error={errors.minimumStock}
          hint={selectedUnit ? `En ${selectedUnit.abbreviation}` : undefined}
          required
          className="sm:col-span-2"
        />
        <Input
          label={isEdit ? 'Stock actual' : 'Stock inicial'}
          name="initialStock"
          type="number"
          min={0}
          step="any"
          value={form.initialStock}
          onChange={update('initialStock')}
          error={errors.initialStock}
          disabled={isEdit}
          hint={isEdit ? 'Se modifica con movimientos' : 'Existencias de apertura'}
          className="sm:col-span-2"
        />
        <Input
          label="Precio referencial (S/)"
          name="referencePrice"
          type="number"
          min={0}
          step="0.01"
          value={form.referencePrice}
          onChange={update('referencePrice')}
          error={errors.referencePrice}
          className="sm:col-span-2"
        />
        <Input
          label="Ubicación en almacén"
          name="location"
          value={form.location}
          onChange={update('location')}
          error={errors.location}
          maxLength={100}
          placeholder="Zona A - Rack 1"
          className="sm:col-span-6"
        />
        <div className="sm:col-span-6">
          <label htmlFor="description" className="label">
            Descripción
          </label>
          <textarea
            id="description"
            name="description"
            rows={2}
            maxLength={300}
            value={form.description}
            onChange={update('description')}
            className="input resize-none"
          />
        </div>
      </form>
    </Modal>
  );
}
