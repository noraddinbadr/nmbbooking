// ============================================================
// Procurement Marketplace types
// ============================================================

export type ProcurementStatus = 'draft' | 'published' | 'closed' | 'awarded' | 'fulfilled' | 'cancelled';
export type ProcurementBidStatus = 'submitted' | 'shortlisted' | 'accepted' | 'rejected' | 'withdrawn';
export type ProcurementAwardMode = 'manual' | 'auto_suggest' | 'auto_award';
export type CatalogKind = 'product' | 'service' | 'consultation' | 'device';

export interface CatalogCategory {
  id: string;
  parent_id: string | null;
  name_ar: string;
  name_en: string | null;
  kind: CatalogKind;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface ProviderCatalogItem {
  id: string;
  provider_id: string;
  owner_type: string;
  category_id: string | null;
  name_ar: string;
  name_en: string | null;
  brand: string | null;
  unit: string | null;
  default_price: number;
  currency: string;
  lead_time_days: number;
  stock_qty: number | null;
  specs: Record<string, unknown>;
  tags: string[];
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ProcurementRequest {
  id: string;
  rfq_code: string;
  buyer_id: string;
  buyer_org_type: string | null;
  buyer_org_id: string | null;
  title_ar: string;
  description_ar: string | null;
  category_kind: string;
  delivery_city: string | null;
  delivery_address: string | null;
  budget_max: number | null;
  currency: string;
  closes_at: string;
  status: ProcurementStatus;
  award_mode: ProcurementAwardMode;
  award_weights: { price: number; rating: number; speed: number; coverage: number };
  allow_partial_bids: boolean;
  awarded_bid_id: string | null;
  awarded_at: string | null;
  published_at: string | null;
  attachments: unknown[];
  notes: string | null;
  created_at: string;
  updated_at: string;
  items?: ProcurementRequestItem[];
  bids_count?: number;
}

export interface ProcurementRequestItem {
  id: string;
  request_id: string;
  category_id: string | null;
  name_ar: string;
  brand_preferred: string | null;
  unit: string | null;
  qty: number;
  specs: Record<string, unknown>;
  notes: string | null;
  position: number;
}

export interface ProcurementBid {
  id: string;
  request_id: string;
  bidder_id: string;
  bidder_org_type: string | null;
  bidder_org_id: string | null;
  total_amount: number;
  currency: string;
  delivery_days: number | null;
  warranty_months: number | null;
  payment_terms: string | null;
  coverage_pct: number;
  notes: string | null;
  attachments: unknown[];
  status: ProcurementBidStatus;
  score: number | null;
  rejected_reason: string | null;
  is_anonymous: boolean;
  created_at: string;
  updated_at: string;
  lines?: ProcurementBidLine[];
}

export interface ProcurementBidLine {
  id: string;
  bid_id: string;
  request_item_id: string;
  catalog_item_id: string | null;
  unit_price: number;
  qty_offered: number;
  brand_offered: string | null;
  notes: string | null;
}

export const PROCUREMENT_STATUS_LABELS: Record<ProcurementStatus, string> = {
  draft: 'مسودة',
  published: 'منشور',
  closed: 'مغلق',
  awarded: 'تمت الترسية',
  fulfilled: 'مكتمل',
  cancelled: 'ملغي',
};

export const PROCUREMENT_STATUS_COLORS: Record<ProcurementStatus, string> = {
  draft: 'bg-muted text-muted-foreground',
  published: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  closed: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  awarded: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  fulfilled: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

export const BID_STATUS_LABELS: Record<ProcurementBidStatus, string> = {
  submitted: 'مُقدَّم',
  shortlisted: 'مرشح',
  accepted: 'مقبول',
  rejected: 'مرفوض',
  withdrawn: 'مسحوب',
};

export const AWARD_MODE_LABELS: Record<ProcurementAwardMode, string> = {
  manual: 'يدوي (المعلن يختار)',
  auto_suggest: 'تلقائي مقترح (المعلن يقرر)',
  auto_award: 'تلقائي بالكامل عند الإغلاق',
};
