import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronsUpDown, Search } from 'lucide-react';
import type { Material } from '@/shared/types';
import { formatNumber } from '@/shared/utils/format';
import { cn } from '@/shared/utils/cn';
import { StockStatusBadge } from '@/features/materials/StockStatusBadge';

interface MaterialPickerProps {
  materials: Material[];
  value: Material | null;
  onChange: (material: Material | null) => void;
  excludeIds?: number[];
  error?: string;
  autoFocus?: boolean;
}

export function MaterialPicker({
  materials,
  value,
  onChange,
  excludeIds = [],
  error,
  autoFocus,
}: MaterialPickerProps) {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState('');
  const [highlight, setHighlight] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const options = useMemo(() => {
    const needle = term.trim().toLowerCase();
    return materials
      .filter((material) => !excludeIds.includes(material.id) || material.id === value?.id)
      .filter((material) =>
        needle === ''
          ? true
          : material.code.toLowerCase().includes(needle) ||
            material.name.toLowerCase().includes(needle) ||
            material.category.name.toLowerCase().includes(needle),
      )
      .slice(0, 50);
  }, [materials, term, excludeIds, value]);

  useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node))
        setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  useEffect(() => setHighlight(0), [term, open]);

  const select = (material: Material) => {
    onChange(material);
    setTerm('');
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      {value && !open ? (
        <button
          type="button"
          onClick={() => {
            setOpen(true);
            window.setTimeout(() => inputRef.current?.focus(), 0);
          }}
          className={cn(
            'input flex items-center justify-between gap-2 text-left',
            error && 'input-error',
          )}
        >
          <span className="truncate">
            <span className="font-semibold text-slate-900">{value.code}</span>
            <span className="text-slate-700"> · {value.name}</span>
            <span className="text-xs text-slate-500">
              {' '}
              (Stock: {formatNumber(value.currentStock)} {value.unit.abbreviation})
            </span>
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 text-slate-400" />
        </button>
      ) : (
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
            <Search className="h-4 w-4" />
          </span>
          <input
            ref={inputRef}
            type="text"
            autoFocus={autoFocus}
            value={term}
            placeholder="Buscar material por código o nombre..."
            onChange={(event) => {
              setTerm(event.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={(event) => {
              if (event.key === 'ArrowDown') {
                event.preventDefault();
                setHighlight((h) => Math.min(h + 1, options.length - 1));
              } else if (event.key === 'ArrowUp') {
                event.preventDefault();
                setHighlight((h) => Math.max(h - 1, 0));
              } else if (event.key === 'Enter' && options[highlight]) {
                event.preventDefault();
                select(options[highlight]);
              } else if (event.key === 'Escape') {
                setOpen(false);
              }
            }}
            className={cn('input pl-9', error && 'input-error')}
            aria-autocomplete="list"
            aria-expanded={open}
          />
        </div>
      )}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}

      {open && (
        <ul
          role="listbox"
          className="absolute z-30 mt-1 max-h-72 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
        >
          {options.length === 0 ? (
            <li className="px-3 py-2 text-sm text-slate-500">No se encontraron materiales</li>
          ) : (
            options.map((material, index) => (
              <li
                key={material.id}
                role="option"
                aria-selected={index === highlight}
                onMouseDown={(event) => {
                  event.preventDefault();
                  select(material);
                }}
                onMouseEnter={() => setHighlight(index)}
                className={cn(
                  'flex cursor-pointer items-center justify-between gap-3 px-3 py-2 text-sm',
                  index === highlight ? 'bg-brand-50' : 'hover:bg-slate-50',
                )}
              >
                <span className="min-w-0">
                  <span className="block truncate">
                    <span className="font-semibold text-slate-900">{material.code}</span>
                    <span className="text-slate-700"> · {material.name}</span>
                  </span>
                  <span className="block text-xs text-slate-500">
                    {material.category.name} · Stock {formatNumber(material.currentStock)}{' '}
                    {material.unit.abbreviation}
                  </span>
                </span>
                <StockStatusBadge status={material.stockStatus} />
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
