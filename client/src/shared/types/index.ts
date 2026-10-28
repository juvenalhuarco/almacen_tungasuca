export type RoleName = 'ADMINISTRADOR' | 'ALMACENERO';

export interface Role {
  id: number;
  name: RoleName;
  description: string | null;
}

export interface User {
  id: number;
  username: string;
  dni: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  role: RoleName;
  active: boolean;
  lastLoginAt: string | null;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiErrorBody {
  code: string;
  message: string;
  details?: Record<string, string> | unknown;
}

export interface CatalogBase {
  id: number;
  active: boolean;
  createdAt: string;
}

export interface Category extends CatalogBase {
  name: string;
  description: string | null;
}

export interface UnitOfMeasure extends CatalogBase {
  name: string;
  abbreviation: string;
}

export interface Supplier extends CatalogBase {
  ruc: string;
  businessName: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
}

export interface WorkFront extends CatalogBase {
  code: string;
  name: string;
  location: string | null;
  residentEngineer: string | null;
}

export type StockStatus = 'OPTIMO' | 'CRITICO' | 'AGOTADO';

export interface Material {
  id: number;
  code: string;
  name: string;
  description: string | null;
  category: { id: number; name: string };
  unit: { id: number; name: string; abbreviation: string };
  currentStock: number;
  minimumStock: number;
  referencePrice: number;
  location: string | null;
  active: boolean;
  stockStatus: StockStatus;
  createdAt: string;
  updatedAt: string;
}

export interface MaterialSummary {
  total: number;
  optimal: number;
  critical: number;
  outOfStock: number;
}

export type MovementType = 'ENTRADA' | 'SALIDA' | 'AJUSTE';
export type MovementStatus = 'REGISTRADO' | 'ANULADO';

export interface MovementLine {
  id: number;
  material: { id: number; code: string; name: string; unit: string; category: string };
  quantity: number;
  unitPrice: number;
  subtotal: number;
  previousStock: number;
  resultingStock: number;
}

export interface Movement {
  id: number;
  code: string;
  type: MovementType;
  date: string;
  documentNumber: string | null;
  supplier: { id: number; name: string } | null;
  workFront: { id: number; code: string; name: string } | null;
  requester: string | null;
  user: { id: number; name: string };
  notes: string | null;
  status: MovementStatus;
  voidReason: string | null;
  voidedBy: { id: number; name: string } | null;
  voidedAt: string | null;
  registrationSeconds: number | null;
  total: number;
  itemCount: number;
  reversesMovement: { id: number; code: string } | null;
  createdAt: string;
  lines?: MovementLine[];
}

export interface KardexEntry {
  detailId: number;
  movementId: number;
  movementCode: string;
  movementType: MovementType;
  movementStatus: MovementStatus;
  isReversal: boolean;
  date: string;
  documentNumber: string | null;
  counterpart: string | null;
  user: string;
  quantity: number;
  previousStock: number;
  resultingStock: number;
  unitPrice: number;
}

export type StockAlertType = 'STOCK_MINIMO' | 'AGOTADO';
export type StockAlertStatus = 'PENDIENTE' | 'ATENDIDA' | 'RESUELTA';

export interface StockAlert {
  id: number;
  material: {
    id: number;
    code: string;
    name: string;
    unit: string;
    category: string;
    currentStock: number;
    minimumStock: number;
    location: string | null;
  };
  type: StockAlertType;
  stockAtGeneration: number;
  minimumStock: number;
  status: StockAlertStatus;
  generatedAt: string;
  attendedAt: string | null;
  attendedBy: { id: number; name: string } | null;
  resolvedAt: string | null;
  emailSent: boolean;
  suggestedQuantity: number;
}

export interface AlertSummary {
  pending: number;
  attended: number;
  resolved: number;
  open: number;
}

export interface CompanyInfo {
  name: string;
  ruc: string;
  address: string;
  phone: string;
  email: string;
}

export interface StockReportRow {
  code: string;
  name: string;
  category: string;
  unit: string;
  location: string | null;
  currentStock: number;
  minimumStock: number;
  referencePrice: number;
  stockValue: number;
  stockStatus: StockStatus;
  active: boolean;
}

export interface StockReport {
  generatedAt: string;
  rows: StockReportRow[];
  totals: {
    materials: number;
    optimal: number;
    critical: number;
    outOfStock: number;
    stockValue: number;
  };
}

export interface MovementReportRow {
  movementId: number;
  code: string;
  type: MovementType;
  status: MovementStatus;
  date: string;
  documentNumber: string | null;
  counterpart: string | null;
  requester: string | null;
  user: string;
  materialCode: string;
  materialName: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  previousStock: number;
  resultingStock: number;
}

export interface MovementReport {
  generatedAt: string;
  period: { from: string | null; to: string | null };
  rows: MovementReportRow[];
  totals: {
    movements: number;
    lines: number;
    entries: number;
    exits: number;
    adjustments: number;
    value: number;
  };
}

export interface KardexReportRow {
  date: string;
  code: string;
  type: MovementType;
  status: MovementStatus;
  isReversal: boolean;
  documentNumber: string | null;
  counterpart: string | null;
  user: string;
  entry: number;
  exit: number;
  balance: number;
  unitPrice: number;
}

export interface KardexReport {
  generatedAt: string;
  material: {
    code: string;
    name: string;
    category: string;
    unit: string;
    currentStock: number;
    minimumStock: number;
  };
  period: { from: string | null; to: string | null };
  openingBalance: number;
  rows: KardexReportRow[];
  totals: { entries: number; exits: number; closingBalance: number };
}

export interface KpiResult {
  key: 'TPA' | 'EIE' | 'IOSM';
  name: string;
  description: string;
  unit: 'min' | '%';
  baseline: number;
  target: number;
  actual: number | null;
  samples: number;
  lowerIsBetter: boolean;
  achieved: boolean;
}

export interface DashboardSummary {
  materials: MaterialSummary;
  alerts: AlertSummary;
  movements: { today: number; month: number; entriesMonth: number; exitsMonth: number };
  inventoryValue: number;
}

export interface DailyMovements {
  date: string;
  entradas: number;
  salidas: number;
  ajustes: number;
}

export interface CriticalMaterial {
  id: number;
  code: string;
  name: string;
  unit: string;
  currentStock: number;
  minimumStock: number;
  coverage: number;
}

export interface RecentMovement {
  id: number;
  code: string;
  type: MovementType;
  date: string;
  documentNumber: string | null;
  counterpart: string | null;
  user: string;
  itemCount: number;
}

export interface AuditLogEntry {
  id: number;
  user: { id: number; name: string; username: string } | null;
  action: string;
  entity: string;
  entityId: number | null;
  detail: Record<string, unknown> | null;
  ip: string | null;
  createdAt: string;
}

export interface SessionResponse {
  accessToken: string;
  user: User;
}
