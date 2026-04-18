// ============================================================
// MS-RAG Module — TypeScript Types (Refactored: integrated with medical_cases & donations)
// ============================================================

export type AuctionInitiatorType = 'doctor' | 'patient' | 'admin';
export type AuctionRequestStatus = 'draft' | 'pending_doctor' | 'pending_patient_consent' | 'pending_admin' | 'published' | 'awarded' | 'fulfilled' | 'cancelled';
export type AuctionBidType = 'full_coverage' | 'partial' | 'split';
export type AuctionBidStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn';
export type DonationKind = 'donation' | 'bid';

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

/**
 * AuctionRequest is now a thin workflow/governance layer over a medical_case.
 * All clinical data (title, diagnosis, cost, funding, anonymization, doctor, camp, patient)
 * lives on the linked medical_case.
 */
export interface AuctionRequest {
  id: string;
  case_id: string;
  initiator_id: string;
  initiator_type: AuctionInitiatorType;
  status: AuctionRequestStatus;
  published_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined from medical_cases
  medical_case?: MedicalCaseLite;
  bids_count?: number;
}

/** Subset of medical_cases columns we project alongside an auction request. */
export interface MedicalCaseLite {
  id: string;
  case_code: string;
  title_ar: string | null;
  diagnosis_summary: string | null;
  treatment_plan: string | null;
  diagnosis_code: string | null;
  estimated_cost: number | null;
  funded_amount: number | null;
  specialty: string | null;
  city: string | null;
  patient_id: string | null;
  doctor_id: string | null;
  camp_id: string | null;
  medical_priority: number;
  poverty_score: number | null;
  anonymization_level: number;
  is_anonymous: boolean | null;
  patient_age: number | null;
  patient_gender: string | null;
  status: string | null;
  created_by: string;
}

/** A bid is now a row in `donations` with kind='bid'. */
export interface AuctionBid {
  id: string;
  case_id: string | null;
  amount: number;
  kind: DonationKind;
  bid_type: AuctionBidType | null;
  bid_status: AuctionBidStatus | null;
  provider_id: string | null;
  donor_id: string | null;
  donor_name: string | null;
  coverage_details: Record<string, unknown>;
  notes: string | null;
  is_anonymous: boolean;
  accepted_at: string | null;
  created_at: string;
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

export interface AuctionStateLog {
  id: string;
  request_id: string;
  from_status: AuctionRequestStatus | null;
  to_status: AuctionRequestStatus;
  changed_by: string;
  reason: string | null;
  created_at: string;
}

// ----------------- Labels -----------------
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
