const dateTimeFormatter = new Intl.DateTimeFormat('es-PE', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const dateFormatter = new Intl.DateTimeFormat('es-PE', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const numberFormatter = new Intl.NumberFormat('es-PE', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 3,
});

const currencyFormatter = new Intl.NumberFormat('es-PE', {
  style: 'currency',
  currency: 'PEN',
  minimumFractionDigits: 2,
});

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return '—';
  return dateTimeFormatter.format(new Date(value));
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '—';
  return dateFormatter.format(new Date(value));
}

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return numberFormatter.format(value);
}

export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return currencyFormatter.format(value);
}

export function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function roleLabel(role: string): string {
  switch (role) {
    case 'ADMINISTRADOR':
      return 'Administrador';
    case 'ALMACENERO':
      return 'Encargado de Almacén';
    default:
      return role;
  }
}
