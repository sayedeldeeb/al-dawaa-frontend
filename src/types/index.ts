export type UserRole = 'admin' | 'manager' | 'viewer';
export type Lang = 'ar' | 'en';

export interface User {
  id: string;
  username: string;
  fullName: string;
  fullNameAr: string;
  role: UserRole;
  email: string;
}

export interface Project {
  id: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  icon: string;
  color: string;
  isActive: boolean;
  displayOrder: number;
  primaryKpi: string;
  lastUpdatedAt: string;
  lastUpdatedBy: string;
  recordCount: number;
  lastBatch?: { fileName: string; uploadedAt: string; uploadedBy: string; totalRows: number };
}

export interface GlobalSummary {
  totalPrescriptions: number;
  totalOrders: number;
  totalValue: number;
  basketValue: number;
  successRate: number;
  fulfillmentRate: number;
  topProject: { id: string; nameEn: string; nameAr: string; rate: number };
  lowestProject: { id: string; nameEn: string; nameAr: string; rate: number };
}

export interface FilterState {
  dateFrom?: string;
  dateTo?: string;
  dateColumn?: string;
  search?: string;
  columns?: Record<string, string[]>;
}

export interface KPIData {
  // medical devices
  total?: number; deliveredCount?: number; deliveredValue?: number;
  outForDeliveryCount?: number; outForDeliveryValue?: number; basketValue?: number;
  stockByProduct?: Record<string, number>;
  // churned/vip/high-value/p2p/pill-pack
  totalUploaded?: number; totalDispensed?: number; dispensedValue?: number;
  netValue?: number; estimatedValue?: number; missedValue?: number;
  remaining?: number; successRate?: number; valueSuccessRate?: number; totalValue?: number;
  // yusur
  totalOrders?: number; unavailableOrders?: number; unavailableRate?: number;
  allocatedOrders?: number; fulfilledOrders?: number; fulfillmentRate?: number;
  failures?: { otherReason: number; branchClosed: number; technicalIssue: number; cancelled: number; timeout: number; otherPct: number; branchPct: number; techPct: number; cancelPct: number; timeoutPct: number };
  invoices?: { count: number; totalValue: number; basketValue: number };
}

export interface UploadBatch {
  id: string; projectId: string; uploadedBy: string; fileName: string;
  uploadMode: 'append' | 'replace'; status: 'done' | 'failed' | 'rolled_back';
  totalRows: number; validRows: number; errorRows: number;
  uploadedAt: string; rolledBackAt?: string;
}

export interface AuditLog {
  id: string; userId: string; action: string; resource: string;
  detail: string; createdAt: string;
}

export interface Note {
  id: string; projectId: string; content: string;
  author: string; authorName: string; createdAt: string; isResolved: boolean;
}
