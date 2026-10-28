import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/shared/components/ui';
import { cn } from '@/shared/utils/cn';
import { CATALOGS } from './catalog-config';
import { CatalogTab } from './CatalogTab';

export function MaintenancePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeKey = searchParams.get('tab') ?? CATALOGS[0].key;
  const active = CATALOGS.find((catalog) => catalog.key === activeKey) ?? CATALOGS[0];

  return (
    <>
      <PageHeader
        title="Mantenimiento"
        description="Tablas maestras que alimentan el catálogo y los movimientos del almacén."
      />

      <div className="card overflow-hidden">
        <div className="flex overflow-x-auto border-b border-slate-200 bg-slate-50 px-2">
          {CATALOGS.map((catalog) => (
            <button
              key={catalog.key}
              type="button"
              onClick={() => setSearchParams({ tab: catalog.key })}
              className={cn(
                'whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition',
                catalog.key === active.key
                  ? 'border-brand-600 text-brand-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800',
              )}
            >
              {catalog.title}
            </button>
          ))}
        </div>
        <CatalogTab key={active.key} definition={active} />
      </div>
    </>
  );
}
