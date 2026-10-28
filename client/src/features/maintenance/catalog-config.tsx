import type { ReactNode } from 'react';
import type { CatalogBase, Category, Supplier, UnitOfMeasure, WorkFront } from '@/shared/types';
import {
  categoriesApi,
  suppliersApi,
  unitsApi,
  workFrontsApi,
  type CatalogApi,
} from './catalogs.api';

export interface FieldConfig {
  name: string;
  label: string;
  type?: 'text' | 'textarea' | 'email';
  required?: boolean;
  maxLength?: number;
  placeholder?: string;
  hint?: string;
  validate?: (value: string) => string | undefined;
  transform?: (value: string) => string;
  fullWidth?: boolean;
}

export interface CatalogColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
}

export interface CatalogDefinition<T extends CatalogBase> {
  key: string;
  title: string;
  singular: string;
  description: string;
  api: CatalogApi<T>;
  fields: FieldConfig[];
  columns: CatalogColumn<T>[];
  searchPlaceholder: string;
  displayName: (row: T) => string;
}

const muted = (value: string | null) => <span className="text-slate-500">{value ?? '—'}</span>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const CATALOGS: CatalogDefinition<any>[] = [
  {
    key: 'categories',
    title: 'Categorías',
    singular: 'categoría',
    description: 'Clasificación de los materiales e insumos del almacén.',
    api: categoriesApi,
    searchPlaceholder: 'Buscar categoría...',
    displayName: (row: Category) => row.name,
    fields: [
      { name: 'name', label: 'Nombre', required: true, maxLength: 80 },
      {
        name: 'description',
        label: 'Descripción',
        type: 'textarea',
        maxLength: 200,
        fullWidth: true,
      },
    ],
    columns: [
      {
        key: 'name',
        header: 'Nombre',
        render: (row: Category) => <span className="font-medium text-slate-900">{row.name}</span>,
      },
      {
        key: 'description',
        header: 'Descripción',
        render: (row: Category) => muted(row.description),
      },
    ],
  } satisfies CatalogDefinition<Category>,
  {
    key: 'units',
    title: 'Unidades de medida',
    singular: 'unidad de medida',
    description: 'Unidades con las que se cuantifican los materiales.',
    api: unitsApi,
    searchPlaceholder: 'Buscar unidad...',
    displayName: (row: UnitOfMeasure) => row.name,
    fields: [
      { name: 'name', label: 'Nombre', required: true, maxLength: 50, placeholder: 'Kilogramo' },
      {
        name: 'abbreviation',
        label: 'Abreviatura',
        required: true,
        maxLength: 10,
        placeholder: 'kg',
      },
    ],
    columns: [
      {
        key: 'name',
        header: 'Nombre',
        render: (row: UnitOfMeasure) => (
          <span className="font-medium text-slate-900">{row.name}</span>
        ),
      },
      {
        key: 'abbreviation',
        header: 'Abreviatura',
        render: (row: UnitOfMeasure) => (
          <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs">
            {row.abbreviation}
          </span>
        ),
      },
    ],
  } satisfies CatalogDefinition<UnitOfMeasure>,
  {
    key: 'suppliers',
    title: 'Proveedores',
    singular: 'proveedor',
    description: 'Empresas que abastecen materiales al almacén.',
    api: suppliersApi,
    searchPlaceholder: 'Buscar por RUC, razón social o contacto...',
    displayName: (row: Supplier) => row.businessName,
    fields: [
      {
        name: 'ruc',
        label: 'RUC',
        required: true,
        maxLength: 11,
        transform: (value) => value.replace(/\D/g, ''),
        validate: (value) => (/^\d{11}$/.test(value) ? undefined : 'El RUC debe tener 11 dígitos'),
      },
      { name: 'businessName', label: 'Razón social', required: true, maxLength: 150 },
      { name: 'contactName', label: 'Contacto', maxLength: 100 },
      { name: 'phone', label: 'Teléfono', maxLength: 20 },
      { name: 'email', label: 'Correo electrónico', type: 'email', maxLength: 150 },
      { name: 'address', label: 'Dirección', maxLength: 200, fullWidth: true },
    ],
    columns: [
      {
        key: 'ruc',
        header: 'RUC',
        render: (row: Supplier) => (
          <span className="font-mono text-xs text-slate-700">{row.ruc}</span>
        ),
      },
      {
        key: 'businessName',
        header: 'Razón social',
        render: (row: Supplier) => (
          <div>
            <p className="font-medium text-slate-900">{row.businessName}</p>
            <p className="text-xs text-slate-500">{row.address ?? ''}</p>
          </div>
        ),
      },
      {
        key: 'contact',
        header: 'Contacto',
        render: (row: Supplier) => (
          <div className="text-slate-600">
            <p>{row.contactName ?? '—'}</p>
            <p className="text-xs text-slate-500">
              {[row.phone, row.email].filter(Boolean).join(' · ')}
            </p>
          </div>
        ),
      },
    ],
  } satisfies CatalogDefinition<Supplier>,
  {
    key: 'work-fronts',
    title: 'Frentes de obra',
    singular: 'frente de obra',
    description: 'Destinos a los que se despachan los materiales.',
    api: workFrontsApi,
    searchPlaceholder: 'Buscar por código, nombre o residente...',
    displayName: (row: WorkFront) => row.name,
    fields: [
      {
        name: 'code',
        label: 'Código',
        required: true,
        maxLength: 20,
        placeholder: 'FR-04',
        transform: (value) => value.toUpperCase(),
      },
      { name: 'name', label: 'Nombre', required: true, maxLength: 150 },
      { name: 'location', label: 'Ubicación', maxLength: 200 },
      { name: 'residentEngineer', label: 'Residente de obra', maxLength: 100 },
    ],
    columns: [
      {
        key: 'code',
        header: 'Código',
        render: (row: WorkFront) => (
          <span className="font-semibold text-slate-900">{row.code}</span>
        ),
      },
      {
        key: 'name',
        header: 'Nombre',
        render: (row: WorkFront) => (
          <div>
            <p className="font-medium text-slate-900">{row.name}</p>
            <p className="text-xs text-slate-500">{row.location ?? ''}</p>
          </div>
        ),
      },
      {
        key: 'resident',
        header: 'Residente',
        render: (row: WorkFront) => muted(row.residentEngineer),
      },
    ],
  } satisfies CatalogDefinition<WorkFront>,
];
