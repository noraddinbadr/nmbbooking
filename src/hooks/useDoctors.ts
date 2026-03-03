import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Doctor, DoctorShift, BookingType } from '@/data/types';

function mapDoctor(row: any): Doctor {
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
    clinicName: row.clinics?.name_en || '',
    clinicNameAr: row.clinics?.name_ar || '',
    clinicAddress: row.clinics?.address || '',
    bookingTypes: (row.booking_types || ['clinic']) as BookingType[],
    waitTime: row.wait_time || '15 دقيقة',
    availableToday: row.available_today ?? true,
    isSponsored: row.is_sponsored || false,
    freeCasesPerShift: row.free_cases_per_shift || 0,
    discountType: row.discount_type || 'none',
    discountValue: Number(row.discount_value) || 0,
    shifts,
  };
}

export function useDoctors() {
  return useQuery({
    queryKey: ['doctors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('doctors')
        .select('*, clinics(*), doctor_shifts(*)');
      if (error) throw error;
      return (data || []).map(mapDoctor);
    },
  });
}

export function useDoctor(id: string) {
  return useQuery({
    queryKey: ['doctor', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('doctors')
        .select('*, clinics(*), doctor_shifts(*)')
        .eq('id', id)
        .single();
      if (error) throw error;
      return mapDoctor(data);
    },
    enabled: !!id,
  });
}
