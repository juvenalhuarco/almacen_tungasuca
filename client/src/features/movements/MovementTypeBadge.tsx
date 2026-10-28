import { ArrowDownCircle, ArrowUpCircle, RefreshCcw } from 'lucide-react';
import { Badge } from '@/shared/components/ui';
import type { MovementType } from '@/shared/types';

const STYLES: Record<
  MovementType,
  { label: string; tone: 'success' | 'danger' | 'info'; icon: typeof ArrowDownCircle }
> = {
  ENTRADA: { label: 'Entrada', tone: 'success', icon: ArrowDownCircle },
  SALIDA: { label: 'Salida', tone: 'danger', icon: ArrowUpCircle },
  AJUSTE: { label: 'Ajuste', tone: 'info', icon: RefreshCcw },
};

export function MovementTypeBadge({ type }: { type: MovementType }) {
  const { label, tone, icon: Icon } = STYLES[type];
  return (
    <Badge tone={tone}>
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
}
