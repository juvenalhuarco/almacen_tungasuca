import { Link } from 'react-router-dom';
import { FileQuestion } from 'lucide-react';
import { Button } from '@/shared/components/ui';

export function NotFoundPage() {
  return (
    <div className="card flex flex-col items-center gap-4 px-6 py-16 text-center">
      <FileQuestion className="h-10 w-10 text-slate-300" />
      <h1 className="text-xl font-bold text-slate-900">Página no encontrada</h1>
      <p className="text-sm text-slate-500">La ruta solicitada no existe o fue movida.</p>
      <Link to="/">
        <Button variant="secondary">Volver al inicio</Button>
      </Link>
    </div>
  );
}
