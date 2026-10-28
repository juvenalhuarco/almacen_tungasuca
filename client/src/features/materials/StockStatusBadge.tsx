import { Badge } from '@/shared/components/ui';
import type { StockStatus } from '@/shared/types';
import { formatNumber } from '@/shared/utils/format';

const LABELS: Record<StockStatus, { label: string; tone: 'success' | 'warning' | 'danger' }> = {
  OPTIMO: { label: 'Óptimo', tone: 'success' },
  CRITICO: { label: 'Crítico', tone: 'warning' },
  AGOTADO: { label: 'Agotado', tone: 'danger' },
};

export function StockStatusBadge({
  status,
  minimumStock,
}: {
  status: StockStatus;
  minimumStock?: number;
}) {
  const { label, tone } = LABELS[status];
  return (
    <Badge tone={tone}>
      {label}
      {status === 'CRITICO' && minimumStock !== undefined && (
        <span className="font-normal">(≤ {formatNumber(minimumStock)})</span>
      )}
    </Badge>
  );
}
