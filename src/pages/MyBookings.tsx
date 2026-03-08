import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, MapPin, CheckCircle, Loader2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { bookingTypeLabels } from '@/data/constants';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: 'قيد الانتظار', color: 'bg-amber-50 text-amber-500' },
  confirmed: { label: 'مؤكد', color: 'bg-emerald-50 text-emerald-500' },
  completed: { label: 'مكتمل', color: 'bg-muted text-muted-foreground' },
  cancelled: { label: 'ملغي', color: 'bg-destructive/10 text-destructive' },
};

interface BookingRow {
  id: string;
  booking_date: string;
  start_time: string | null;
  status: string | null;
  booking_type: string | null;
  final_price: number | null;
  funding_amount: number | null;
  created_at: string;
  doctor_id: string;
  doctors: {
    name_ar: string;
    specialty_ar: string | null;
    city_ar: string | null;
  } | null;
}

const MyBookings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('bookings')
        .select('id, booking_date, start_time, status, booking_type, final_price, funding_amount, created_at, doctor_id, doctors(name_ar, specialty_ar, city_ar)')
        .eq('patient_id', user.id)
        .order('booking_date', { ascending: false });
      setBookings((data as BookingRow[]) || []);
      setLoading(false);
    };
    fetch();
  }, [user]);

  const handleCancel = async (id: string) => {
    const { error } = await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', id);
    if (error) { toast({ title: 'خطأ', description: error.message, variant: 'destructive' }); return; }
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'cancelled' } : b));
    toast({ title: 'تم إلغاء الحجز' });
  };

  const upcoming = bookings.filter(b => b.status === 'confirmed' || b.status === 'pending');
  const past = bookings.filter(b => b.status === 'completed' || b.status === 'cancelled');

  const renderBooking = (booking: BookingRow) => {
    const doctor = booking.doctors;
    const status = statusLabels[booking.status || 'pending'];

    return (
      <div key={booking.id} className="rounded-2xl border border-border bg-card p-5 shadow-card">
        <div className="flex items-start justify-between">
          <div className="flex gap-4">
            <div className="h-14 w-14 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center font-cairo text-xl font-bold text-primary">
              {doctor?.name_ar?.charAt(2) || '؟'}
            </div>
            <div>
              <h3 className="font-cairo text-base font-bold text-foreground">{doctor?.name_ar || 'طبيب'}</h3>
              <p className="font-cairo text-sm text-muted-foreground">{doctor?.specialty_ar || ''}</p>
              <div className="mt-2 flex flex-wrap gap-3 font-cairo text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {booking.booking_date}</span>
                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {booking.start_time || '--:--'}</span>
                <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {doctor?.city_ar || ''}</span>
                <span>{bookingTypeLabels[booking.booking_type || 'clinic']?.icon} {bookingTypeLabels[booking.booking_type || 'clinic']?.ar}</span>
              </div>
            </div>
          </div>
          <Badge className={`${status.color} border-0 font-cairo text-xs`}>{status.label}</Badge>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
          <div className="font-cairo">
            <span className="text-sm text-muted-foreground">المبلغ: </span>
            <span className="text-lg font-bold text-primary">{(booking.final_price || 0).toLocaleString()} ر.ي</span>
            {(booking.funding_amount || 0) > 0 && (
              <span className="mr-2 text-xs text-emerald-500">(مدعوم: {(booking.funding_amount || 0).toLocaleString()} ر.ي)</span>
            )}
          </div>
          {(booking.status === 'confirmed' || booking.status === 'pending') && (
            <Button variant="outline" size="sm" className="font-cairo text-destructive hover:bg-destructive/10" onClick={() => handleCancel(booking.id)}>
              إلغاء الحجز
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="font-cairo text-2xl font-bold text-foreground mb-6">حجوزاتي</h1>

        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : !user ? (
          <div className="rounded-2xl border border-border bg-card p-12 text-center shadow-card">
            <p className="font-cairo text-lg text-muted-foreground">يرجى تسجيل الدخول لعرض حجوزاتك</p>
            <Button className="mt-4 font-cairo" onClick={() => navigate('/sign-in')}>تسجيل الدخول</Button>
          </div>
        ) : (
          <Tabs defaultValue="upcoming" className="w-full">
            <TabsList className="font-cairo mb-6 w-full sm:w-auto">
              <TabsTrigger value="upcoming" className="font-cairo gap-2"><CheckCircle className="h-4 w-4" />القادمة ({upcoming.length})</TabsTrigger>
              <TabsTrigger value="past" className="font-cairo gap-2"><Clock className="h-4 w-4" />السابقة ({past.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="upcoming" className="space-y-4">
              {upcoming.length === 0 ? (
                <div className="rounded-2xl border border-border bg-card p-12 text-center shadow-card">
                  <Calendar className="mx-auto h-12 w-12 text-muted-foreground/30" />
                  <p className="mt-4 font-cairo text-lg text-muted-foreground">لا توجد حجوزات قادمة</p>
                  <Button className="mt-4 font-cairo bg-hero-gradient text-primary-foreground" onClick={() => navigate('/doctors')}>احجز موعدك الآن</Button>
                </div>
              ) : upcoming.map(renderBooking)}
            </TabsContent>
            <TabsContent value="past" className="space-y-4">
              {past.length === 0 ? (
                <div className="rounded-2xl border border-border bg-card p-12 text-center shadow-card">
                  <p className="font-cairo text-lg text-muted-foreground">لا توجد حجوزات سابقة</p>
                </div>
              ) : past.map(renderBooking)}
            </TabsContent>
          </Tabs>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default MyBookings;
