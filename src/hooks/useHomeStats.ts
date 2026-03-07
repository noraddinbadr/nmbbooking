import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface HomeStats {
  doctorCount: number;
  bookingCount: number;
  avgRating: number;
  cityCount: number;
  specialtyCounts: { specialty: string; specialty_ar: string; count: number }[];
}

export function useHomeStats() {
  return useQuery({
    queryKey: ['home-stats'],
    queryFn: async () => {
      // Get doctor count and stats
      const { data: doctors } = await supabase
        .from('doctors')
        .select('id, specialty, specialty_ar, rating, city_ar');

      const doctorList = doctors || [];
      const doctorCount = doctorList.length;
      const avgRating = doctorCount > 0
        ? Math.round((doctorList.reduce((sum, d) => sum + (Number(d.rating) || 0), 0) / doctorCount) * 10) / 10
        : 0;

      // Unique cities
      const cities = new Set(doctorList.map(d => d.city_ar).filter(Boolean));
      const cityCount = cities.size;

      // Booking count
      const { count: bookingCount } = await supabase
        .from('bookings')
        .select('id', { count: 'exact', head: true });

      // Specialty counts
      const specMap = new Map<string, { specialty_ar: string; count: number }>();
      for (const d of doctorList) {
        if (d.specialty) {
          const existing = specMap.get(d.specialty);
          if (existing) {
            existing.count++;
          } else {
            specMap.set(d.specialty, { specialty_ar: d.specialty_ar || d.specialty, count: 1 });
          }
        }
      }
      const specialtyCounts = Array.from(specMap.entries()).map(([specialty, val]) => ({
        specialty,
        ...val,
      }));

      return {
        doctorCount,
        bookingCount: bookingCount || 0,
        avgRating,
        cityCount,
        specialtyCounts,
      } as HomeStats;
    },
    staleTime: 60000,
  });
}
