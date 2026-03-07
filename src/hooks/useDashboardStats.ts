import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useDashboardStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['dashboard-stats', user?.id],
    queryFn: async () => {
      if (!user) return null;

      // Get doctor record
      const { data: doc } = await supabase
        .from('doctors')
        .select('id, rating, total_reviews')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!doc) return null;

      const today = new Date().toISOString().split('T')[0];
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

      // Today's bookings
      const { data: todayBookings } = await supabase
        .from('bookings')
        .select('id, status, start_time, patient_id, booking_type, final_price, notes')
        .eq('doctor_id', doc.id)
        .eq('booking_date', today);

      const bookings = todayBookings || [];
      const completed = bookings.filter(b => b.status === 'completed').length;
      const pending = bookings.filter(b => b.status === 'pending').length;
      const waiting = bookings.filter(b => b.status === 'confirmed').length;

      // Today's revenue
      const dailyRevenue = bookings
        .filter(b => b.status === 'completed' || b.status === 'confirmed')
        .reduce((sum, b) => sum + (Number(b.final_price) || 0), 0);

      // Tomorrow's bookings count
      const { count: tomorrowCount } = await supabase
        .from('bookings')
        .select('id', { count: 'exact', head: true })
        .eq('doctor_id', doc.id)
        .eq('booking_date', tomorrow);

      // Get patient profiles for today's bookings
      const patientIds = [...new Set(bookings.map(b => b.patient_id))];
      let profilesMap: Record<string, string> = {};
      if (patientIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, full_name_ar')
          .in('id', patientIds);
        if (profiles) {
          for (const p of profiles) {
            profilesMap[p.id] = p.full_name_ar || p.full_name || 'مريض';
          }
        }
      }

      const todayAppointments = bookings.map(b => ({
        id: b.id,
        patientName: profilesMap[b.patient_id] || 'مريض',
        slotTime: b.start_time || '--:--',
        status: b.status,
        bookingType: b.booking_type,
        price: Number(b.final_price) || 0,
        notes: b.notes || '',
      }));

      return {
        doctorId: doc.id,
        todayTotal: bookings.length,
        todayCompleted: completed,
        todayPending: pending,
        waitingPatients: waiting,
        dailyRevenue,
        rating: Number(doc.rating) || 0,
        totalReviews: doc.total_reviews || 0,
        tomorrowCount: tomorrowCount || 0,
        todayAppointments,
      };
    },
    enabled: !!user,
    refetchInterval: 30000,
  });
}
