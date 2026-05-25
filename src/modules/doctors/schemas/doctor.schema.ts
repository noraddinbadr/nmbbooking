import type { BookingType } from '@/data/types';

export type DiscountType = 'none' | 'percentage' | 'fixed';

export interface DoctorShift {
  id: string;
  label: string;
  startTime: string;
  endTime: string;
  daysOfWeek: number[];
  enableSlotGeneration: boolean;
  consultationDurationMin: number | null;
  maxCapacity: number | null;
}

export interface Doctor {
  id: string;
  nameAr: string;
  nameEn: string;
  specialty: string;
  specialtyAr: string;
  city: string;
  cityAr: string;
  rating: number;
  totalReviews: number;
  basePrice: number;
  discountPercent: number;
  isVerified: boolean;
  profileImage: string;
  gender: 'male' | 'female';
  yearsExperience: number;
  aboutAr: string;
  aboutEn: string;
  languages: string[];
  education: string[];
  clinicId: string;
  clinicName: string;
  clinicNameAr: string;
  clinicAddress: string;
  bookingTypes: BookingType[];
  waitTime: string;
  availableToday: boolean;
  isSponsored: boolean;
  freeCasesPerShift: number;
  discountType: DiscountType;
  discountValue: number;
  shifts: DoctorShift[];
}

export function mapDoctor(row: any): Doctor {
  const discountPercent =
    row.discount_type === 'percentage' ? Number(row.discount_value) :
    row.discount_type === 'fixed' && Number(row.base_price) > 0
      ? Math.round((Number(row.discount_value) / Number(row.base_price)) * 100)
      : 0;

  const shifts: DoctorShift[] = (row.doctor_shifts || []).map((s: any) => ({
    id: s.id,
    label: s.label,
    startTime: s.start_time,
    endTime: s.end_time,
    daysOfWeek: s.days_of_week || [],
    enableSlotGeneration: s.enable_slot_generation || false,
    consultationDurationMin: s.consultation_duration_min,
    maxCapacity: s.max_capacity,
  }));

  return {
    id: row.id,
    nameAr: row.name_ar,
    nameEn: row.name_en || '',
    specialty: row.specialty || '',
    specialtyAr: row.specialty_ar || '',
    city: row.city || '',
    cityAr: row.city_ar || '',
    rating: Number(row.rating) || 0,
    totalReviews: row.total_reviews || 0,
    basePrice: Number(row.base_price) || 0,
    discountPercent,
    isVerified: row.is_verified || false,
    profileImage: row.profile_image || '',
    gender: (row.gender as 'male' | 'female') || 'male',
    yearsExperience: row.years_experience || 0,
    aboutAr: row.about_ar || '',
    aboutEn: row.about_en || '',
    languages: row.languages || [],
    education: row.education || [],
    clinicId: row.clinic_id || row.clinics?.id || '',
    clinicName: row.clinics?.name_en || '',
    clinicNameAr: row.clinics?.name_ar || '',
    clinicAddress: row.clinics?.address || '',
    bookingTypes: (row.booking_types || ['clinic']) as BookingType[],
    waitTime: row.wait_time || '15 دقيقة',
    availableToday: row.available_today ?? true,
    isSponsored: row.is_sponsored || false,
    freeCasesPerShift: row.free_cases_per_shift || 0,
    discountType: (row.discount_type || 'none') as DiscountType,
    discountValue: Number(row.discount_value) || 0,
    shifts,
  };
}