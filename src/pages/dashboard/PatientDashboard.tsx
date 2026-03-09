import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, FileText, Clock, MapPin, CheckCircle, Loader2, XCircle, Bell } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { bookingTypeLabels } from '@/data/constants';

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: 'قيد الانتظار', color: 'bg-amber-50 text-amber-600 border-amber-200' },
  confirmed: { label: 'مؤكد', color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  completed: { label: 'مكتمل', color: 'bg-muted text-muted-foreground border-border' },
  cancelled: { label: 'ملغي', color: 'bg-destructive/10 text-destructive border-destructive/20' },
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

const PatientDashboard = () => {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const fetchBookings = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('bookings')
        .select('id, booking_date, start_time, status, booking_type, final_price, funding_amount, created_at, doctor_id, doctors(name_ar, specialty_ar, city_ar)')
        .eq('patient_id', user.id)
        .order('booking_date', { ascending: false });
      setBookings((data as BookingRow[]) || []);
      setLoading(false);
    };
    fetchBookings();
  }, [user]);

  const handleCancel = async (id: string) => {
    const { error } = await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', id);
    if (error) { toast({ title: 'خطأ', description: error.message, variant: 'destructive' }); return; }
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'cancelled' } : b));
    toast({ title: '✅ تم إلغاء الحجز' });
  };

  const upcoming = bookings.filter(b => b.status === 'confirmed' || b.status === 'pending');
  const past = bookings.filter(b => b.status === 'completed' || b.status === 'cancelled');

  const stats = {
    total: bookings.length,
    upcoming: upcoming.length,
    completed: bookings.filter(b => b.status === 'completed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
  };

  const renderBooking = (booking: BookingRow) => {
    const doctor = booking.doctors;
    const status = statusLabels[booking.status || 'pending'];
    return (
      <div key={booking.id} className="rounded-xl border border-border bg-card p-4 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between gap-3">
          <div className="flex gap-3">
            <div className="h-12 w-12 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center font-cairo text-lg font-bold text-primary">
              {doctor?.name_ar?.charAt(2) || '؟'}
            </div>
            <div className="min-w-0">
              <h3 className="font-cairo text-sm font-bold text-foreground">{doctor?.name_ar || 'طبيب'}</h3>
              <p className="font-cairo text-xs text-muted-foreground">{doctor?.specialty_ar || ''}</p>
              <div className="mt-1.5 flex flex-wrap gap-2 font-cairo text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {booking.booking_date}</span>
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {booking.start_time || '--:--'}</span>
                {doctor?.city_ar && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {doctor.city_ar}</span>}
                <span>{bookingTypeLabels[booking.booking_type || 'clinic']?.icon} {bookingTypeLabels[booking.booking_type || 'clinic']?.ar}</span>
              </div>
            </div>
          </div>
          <Badge className={`${status.color} border font-cairo text-[10px] shrink-0`}>{status.label}</Badge>
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
          <div className="font-cairo">
            <span className="text-xs text-muted-foreground">المبلغ: </span>
            <span className="text-sm font-bold text-primary">{(booking.final_price || 0).toLocaleString()} ر.ي</span>
            {(booking.funding_amount || 0) > 0 && (
              <span className="mr-1 text-[10px] text-emerald-500">(دعم: {(booking.funding_amount || 0).toLocaleString()})</span>
            )}
          </div>
          {(booking.status === 'confirmed' || booking.status === 'pending') && (
            <Button variant="outline" size="sm" className="font-cairo text-xs h-7 text-destructive hover:bg-destructive/10" onClick={() => handleCancel(booking.id)}>
              <XCircle className="h-3 w-3 ml-1" /> إلغاء
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* Header */}
        <div>
          <h1 className="font-cairo text-xl font-bold text-foreground">
            مرحباً {profile?.full_name_ar || profile?.full_name || 'بك'} 👋
          </h1>
          <p className="text-sm text-muted-foreground font-cairo">إدارة حجوزاتك ومواعيدك الطبية</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'إجمالي الحجوزات', value: stats.total, icon: Calendar, color: 'text-primary' },
            { label: 'القادمة', value: stats.upcoming, icon: Clock, color: 'text-amber-500' },
            { label: 'المكتملة', value: stats.completed, icon: CheckCircle, color: 'text-emerald-500' },
            { label: 'الملغية', value: stats.cancelled, icon: XCircle, color: 'text-destructive' },
          ].map(s => (
            <Card key={s.label} className="shadow-sm">
              <CardContent className="p-3 text-center">
                <s.icon className={`h-5 w-5 mx-auto mb-1 ${s.color}`} />
                <p className="font-cairo text-2xl font-bold text-foreground">{s.value}</p>
                <p className="font-cairo text-[10px] text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap gap-2">
          <Button className="font-cairo gap-1.5" onClick={() => navigate('/doctors')}>
            <Calendar className="h-4 w-4" /> حجز موعد جديد
          </Button>
          <Button variant="outline" className="font-cairo gap-1.5" onClick={() => navigate('/dashboard/notifications')}>
            <Bell className="h-4 w-4" /> الإشعارات
          </Button>
          <Button variant="outline" className="font-cairo gap-1.5" onClick={() => navigate('/dashboard/profile')}>
            <FileText className="h-4 w-4" /> ملفي الشخصي
          </Button>
        </div>

        {/* Bookings */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : bookings.length === 0 ? (
          <Card className="shadow-sm">
            <CardContent className="py-12 text-center">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground/30 mb-3" />
              <p className="font-cairo text-muted-foreground">لا توجد حجوزات بعد</p>
              <Button className="mt-4 font-cairo" onClick={() => navigate('/doctors')}>احجز موعدك الأول</Button>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="upcoming" dir="rtl">
            <TabsList className="font-cairo w-full sm:w-auto">
              <TabsTrigger value="upcoming" className="font-cairo gap-1.5">
                <CheckCircle className="h-3.5 w-3.5" /> القادمة ({upcoming.length})
              </TabsTrigger>
              <TabsTrigger value="past" className="font-cairo gap-1.5">
                <Clock className="h-3.5 w-3.5" /> السابقة ({past.length})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="upcoming" className="space-y-3 mt-3">
              {upcoming.length === 0 ? (
                <Card className="shadow-sm">
                  <CardContent className="py-8 text-center">
                    <p className="font-cairo text-muted-foreground">لا توجد حجوزات قادمة</p>
                    <Button className="mt-3 font-cairo" size="sm" onClick={() => navigate('/doctors')}>احجز الآن</Button>
                  </CardContent>
                </Card>
              ) : upcoming.map(renderBooking)}
            </TabsContent>
            <TabsContent value="past" className="space-y-3 mt-3">
              {past.length === 0 ? (
                <p className="font-cairo text-sm text-muted-foreground text-center py-8">لا توجد حجوزات سابقة</p>
              ) : past.map(renderBooking)}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </DashboardLayout>
  );
};

export default PatientDashboard;
