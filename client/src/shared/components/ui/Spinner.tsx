import { Loader2 } from 'lucide-react';

export function FullPageSpinner({ message = 'Cargando...' }: { message?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-100 text-slate-500">
      <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      <span className="text-sm">{message}</span>
    </div>
  );
}
