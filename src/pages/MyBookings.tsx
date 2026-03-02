import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, MapPin, Video, CheckCircle, XCircle } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { sampleBookings, doctors, bookingTypeLabels } from '@/data/mockData';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: 'قيد الانتظار', color: 'bg-amber-50 text-amber-500' },
  confirmed: { label: 'مؤكد', color: 'bg-emerald-50 text-emerald-500' },
  completed: { label: 'مكتمل', color: 'bg-muted text-muted-foreground' },
  cancelled: { label: 'ملغي', color: 'bg-destructive/10 text-destructive' },
};

const MyBookings = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState(sampleBookings);

  const upcoming = bookings.filter(b => b.status === 'confirmed' || b.status === 'pending');
  const past = bookings.filter(b => b.status === 'completed' || b.status === 'cancelled');

  const handleCancel = (id: string) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'cancelled' as const } : b));
    toast({ title: 'تم إلغاء الحجز', description: 'تم إلغاء الحجز بنجاح' });
  };

  const renderBooking = (booking: typeof sampleBookings[0]) => {
    const doctor = doctors.find(d => d.id === booking.doctorId);
    if (!doctor) return null;
    const status = statusLabels[booking.status];

    return (
      <div key={booking.id} className="rounded-2xl border border-border bg-card p-5 shadow-card">
        <div className="flex items-start justify-between">
          <div className="flex gap-4">
            <div className="h-14 w-14 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center font-cairo text-xl font-bold text-primary">
              {doctor.nameAr.charAt(2)}
            </div>
            <div>
              <h3 className="font-cairo text-base font-bold text-foreground">{doctor.nameAr}</h3>
              <p className="font-cairo text-sm text-muted-foreground">{doctor.specialtyAr}</p>
              <div className="mt-2 flex flex-wrap gap-3 font-cairo text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {booking.createdAt}</span>
                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> 10:00</span>
                <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {doctor.cityAr}</span>
                <span>{bookingTypeLabels[booking.bookingType]?.icon} {bookingTypeLabels[booking.bookingType]?.ar}</span>
              </div>
            </div>
          </div>
          <Badge className={`${status.color} border-0 font-cairo text-xs`}>
            {status.label}
          </Badge>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
          <div className="font-cairo">
            <span className="text-sm text-muted-foreground">المبلغ: </span>
            <span className="text-lg font-bold text-primary">{booking.finalPrice.toLocaleString()} ر.ي</span>
            {booking.fundingAmount > 0 && (
              <span className="mr-2 text-xs text-emerald-500">(مدعوم: {booking.fundingAmount.toLocaleString()} ر.ي)</span>
            )}
          </div>
          {(booking.status === 'confirmed' || booking.status === 'pending') && (
            <Button
              variant="outline"
              size="sm"
              className="font-cairo text-destructive hover:bg-destructive/10"
              onClick={() => handleCancel(booking.id)}
            >
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

        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="font-cairo mb-6 w-full sm:w-auto">
            <TabsTrigger value="upcoming" className="font-cairo gap-2">
              <CheckCircle className="h-4 w-4" />
              القادمة ({upcoming.length})
            </TabsTrigger>
            <TabsTrigger value="past" className="font-cairo gap-2">
              <Clock className="h-4 w-4" />
              السابقة ({past.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-4">
            {upcoming.length === 0 ? (
              <div className="rounded-2xl border border-border bg-card p-12 text-center shadow-card">
                <Calendar className="mx-auto h-12 w-12 text-muted-foreground/30" />
                <p className="mt-4 font-cairo text-lg text-muted-foreground">لا توجد حجوزات قادمة</p>
                <Button className="mt-4 font-cairo bg-hero-gradient text-primary-foreground" onClick={() => navigate('/doctors')}>
                  احجز موعدك الآن
                </Button>
              </div>
            ) : (
              upcoming.map(renderBooking)
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-4">
            {past.length === 0 ? (
              <div className="rounded-2xl border border-border bg-card p-12 text-center shadow-card">
                <p className="font-cairo text-lg text-muted-foreground">لا توجد حجوزات سابقة</p>
              </div>
            ) : (
              past.map(renderBooking)
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
};

export default MyBookings;
