// ============================================================
// MS-RAG Module — TypeScript Types
// ============================================================

export type AuctionInitiatorType = 'doctor' | 'patient' | 'admin';
export type AuctionRequestStatus = 'draft' | 'pending_doctor' | 'pending_patient_consent' | 'pending_admin' | 'published' | 'awarded' | 'fulfilled' | 'cancelled';
export type AuctionBidType = 'full_coverage' | 'partial' | 'split';
export type AuctionBidStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn';

export interface AuctionSettings {
  id: string;
  can_patient_post_directly: boolean;
  require_doctor_signature: boolean;
  require_patient_otp_consent: boolean;
  require_social_report: boolean;
  auto_publish_after_verify: boolean;
  default_patient_action: string;
  bid_duration_hours: number;
  max_bids_per_request: number;
  updated_at: string;
  updated_by: string | null;
}

export interface AuctionRequest {
  id: string;
  patient_id: string;
  initiator_id: string;
  initiator_type: AuctionInitiatorType;
  status: AuctionRequestStatus;
  title_ar: string;
  title_en: string | null;
  description_ar: string | null;
  description_en: string | null;
  diagnosis_code: string | null;
  diagnosis_summary: string | null;
  treatment_plan: string | null;
  medical_priority: number;
  estimated_cost: number;
  funded_amount: number;
  anonymization_level: number;
  poverty_score: number | null;
  specialty: string | null;
  city: string | null;
  camp_id: string | null;
  doctor_id: string | null;
  published_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  patient?: { full_name_ar: string | null; full_name: string | null };
  doctor?: { name_ar: string; specialty_ar: string | null };
  bids_count?: number;
}

export interface AuctionVerification {
  id: string;
  request_id: string;
  verified_by: string;
  verification_type: string;
  is_verified: boolean;
  notes: string | null;
  verified_at: string | null;
  created_at: string;
}

export interface AuctionConsent {
  id: string;
  request_id: string;
  patient_id: string;
  consent_given: boolean;
  consent_method: string;
  consented_at: string | null;
  created_at: string;
}

export interface AuctionBid {
  id: string;
  request_id: string;
  provider_id: string | null;
  bidder_id: string;
  bid_type: AuctionBidType;
  status: AuctionBidStatus;
  amount: number;
  coverage_details: Record<string, unknown>;
  notes: string | null;
  is_anonymous: boolean;
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  provider?: { name_ar: string; provider_type: string | null };
  bidder_profile?: { full_name_ar: string | null };
}

export interface AuctionStateLog {
  id: string;
  request_id: string;
  from_status: AuctionRequestStatus | null;
  to_status: AuctionRequestStatus;
  changed_by: string;
  reason: string | null;
  created_at: string;
}

// Status labels
export const REQUEST_STATUS_LABELS: Record<AuctionRequestStatus, string> = {
  draft: 'مسودة',
  pending_doctor: 'بانتظار الطبيب',
  pending_patient_consent: 'بانتظار موافقة المريض',
  pending_admin: 'بانتظار المراجعة',
  published: 'منشور للمزايدة',
  awarded: 'تم الترسية',
  fulfilled: 'مكتمل',
  cancelled: 'ملغي',
};

export const REQUEST_STATUS_COLORS: Record<AuctionRequestStatus, string> = {
  draft: 'bg-muted text-muted-foreground',
  pending_doctor: 'bg-yellow-100 text-yellow-800',
  pending_patient_consent: 'bg-orange-100 text-orange-800',
  pending_admin: 'bg-blue-100 text-blue-800',
  published: 'bg-green-100 text-green-800',
  awarded: 'bg-purple-100 text-purple-800',
  fulfilled: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-red-100 text-red-800',
};

export const BID_TYPE_LABELS: Record<AuctionBidType, string> = {
  full_coverage: 'تغطية كاملة',
  partial: 'تغطية جزئية',
  split: 'تقسيم الخدمات',
};

export const PRIORITY_LABELS: Record<number, string> = {
  1: 'عادي',
  2: 'متوسط',
  3: 'مرتفع',
  4: 'عاجل',
  5: 'طارئ',
};
