// ============================================================
// Medical Events / Camps Module — TypeScript Types
// ============================================================

export type AppRole = 'admin' | 'doctor' | 'clinic_admin' | 'staff' | 'patient' | 'donor' | 'provider';
export type CampStatus = 'draft' | 'published' | 'active' | 'completed' | 'cancelled';
export type RegistrationStatus = 'held' | 'confirmed' | 'checked_in' | 'completed' | 'expired' | 'cancelled';
export type CaseStatus = 'open' | 'funded' | 'partially_funded' | 'in_treatment' | 'closed';
export type DonationStatus = 'pledged' | 'received' | 'verified' | 'refunded';
export type OrderStatus = 'pending' | 'received' | 'sample_taken' | 'results_uploaded' | 'delivered';

export interface Clinic {
  id: string;
  nameAr: string;
  nameEn: string;
  city: string;
  address: string;
  phone: string;
  ownerId: string;
}

export interface MedicalCamp {
  id: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn?: string;
  clinicId: string;
  organizerId: string;
  locationName: string;
  locationCity: string;
  status: CampStatus;
  startDate: string;
  endDate: string;
  totalCapacity: number;
  services: string[];
  sponsors: CampSponsor[];
  coverImage?: string;
  isFree: boolean;
  targetFund: number;
  raisedFund: number;
  createdAt: string;
}

export interface CampSponsor {
  name: string;
  logoUrl?: string;
  tier: 'gold' | 'silver' | 'bronze';
}

export interface EventSchedule {
  id: string;
  campId: string;
  scheduleDate: string;
  startTime: string;
  endTime: string;
  serviceType: string;
  totalSlots: number;
  availableSlots: number;
  locationNote?: string;
}

export interface Registration {
  id: string;
  campId: string;
  scheduleId: string;
  bookedBy: string;
  patientProfileId?: string;
  patientInfo?: PatientInfo;
  status: RegistrationStatus;
  holdToken?: string;
  holdExpiresAt?: string;
  caseCode: string;
  checkedInAt?: string;
  notes?: string;
  createdAt: string;
}

export interface PatientInfo {
  name: string;
  phone: string;
  gender: 'male' | 'female';
  age: number;
}

export interface MedicalCase {
  id: string;
  registrationId: string;
  caseCode: string;
  diagnosisSummary: string;
  treatmentPlan: string;
  estimatedCost: number;
  fundedAmount: number;
  status: CaseStatus;
  isAnonymous: boolean;
  patientAge?: number;
  patientGender?: string;
  createdBy: string;
  createdAt: string;
}

export interface Donation {
  id: string;
  caseId?: string;
  campId?: string;
  donorId?: string;
  donorName: string;
  amount: number;
  paymentMethod: 'bank_transfer' | 'wallet' | 'cash';
  paymentReference?: string;
  status: DonationStatus;
  createdAt: string;
}

export interface Provider {
  id: string;
  nameAr: string;
  nameEn: string;
  type: 'lab' | 'pharmacy' | 'imaging' | 'supplies';
  contactPhone: string;
  isActive: boolean;
}

export interface ProviderOrder {
  id: string;
  providerId: string;
  campId: string;
  registrationId?: string;
  orderType: 'lab_test' | 'medicine' | 'imaging';
  orderDetails: Record<string, unknown>;
  status: OrderStatus;
  resultsUrl?: string;
  notes?: string;
  createdAt: string;
}

export interface HoldResult {
  registrationId: string;
  holdToken: string;
  holdExpiresAt: string;
}
