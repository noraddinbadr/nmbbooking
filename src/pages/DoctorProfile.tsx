import { useParams, useNavigate } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { Star, MapPin, Clock, CheckCircle, GraduationCap, Languages, Calendar, Sparkles, ArrowRight } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { doctors, reviews as allReviews, generateTimeSlots, bookingTypeLabels } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { BookingType } from '@/data/types';

const DoctorProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const doctor = doctors.find(d => d.id === id);

  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<BookingType>('clinic');
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');

  const slots = useMemo(() => {
    if (!doctor) return [];
    return generateTimeSlots(doctor.id, selectedDate);
  }, [doctor, selectedDate]);

  const doctorReviews = allReviews.filter(r => r.doctorId === id);

  // Generate next 7 days
  const dates = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      arr.push({
        value: d.toISOString().split('T')[0],
        dayName: d.toLocaleDateString('ar-YE', { weekday: 'short' }),
        dayNum: d.getDate(),
        month: d.toLocaleDateString('ar-YE', { month: 'short' }),
      });
    }
    return arr;
  }, []);

  const handleConfirmBooking = () => {
    if (!patientName.trim()) return;
    toast({
      title: '✅ تم الحجز بنجاح!',
      description: `تم حجز موعدك مع ${doctor?.nameAr} - ${selectedDate} الساعة ${slots.find(s => s.id === selectedSlot)?.startTime}`,
    });
    setShowBookingDialog(false);
    setSelectedSlot(null);
    setPatientName('');
    setPatientPhone('');
  };

  if (!doctor) {
    return (
      <div className="min-h-screen bg-background" dir="rtl">
        <Navbar />
        <div className="container mx-auto p-8 text-center">
          <p className="font-cairo text-xl text-muted-foreground">لم يتم العثور على الطبيب</p>
          <Button className="mt-4 font-cairo" onClick={() => navigate('/doctors')}>العودة للأطباء</Button>
        </div>
      </div>
    );
  }

  const discountedPrice = doctor.basePrice * (1 - doctor.discountPercent / 100);

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 font-cairo text-sm text-muted-foreground">
          <button onClick={() => navigate('/')} className="hover:text-primary transition-colors">الرئيسية</button>
          <ArrowRight className="h-3 w-3 rotate-180" />
          <button onClick={() => navigate('/doctors')} className="hover:text-primary transition-colors">الأطباء</button>
          <ArrowRight className="h-3 w-3 rotate-180" />
          <span className="text-foreground">{doctor.nameAr}</span>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile header */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <div className="flex gap-5">
                <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl bg-primary/10">
                  <div className="flex h-full w-full items-center justify-center font-cairo text-4xl font-bold text-primary">
                    {doctor.nameAr.charAt(2)}
                  </div>
                  {doctor.isVerified && (
                    <div className="absolute -bottom-1 -right-1 rounded-full bg-card p-1">
                      <CheckCircle className="h-6 w-6 text-primary fill-primary/20" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h1 className="font-cairo text-2xl font-bold text-foreground">{doctor.nameAr}</h1>
                      <p className="font-cairo text-muted-foreground">{doctor.specialtyAr}</p>
                    </div>
                    {doctor.isSponsored && (
                      <Badge className="gap-1 bg-amber-50 text-amber-500 border-0 font-cairo">
                        <Sparkles className="h-3 w-3" /> خدمات مدعومة
                      </Badge>
                    )}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                      <strong className="text-foreground">{doctor.rating}</strong> ({doctor.totalReviews} تقييم)
                    </span>
                    <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {doctor.clinicNameAr} - {doctor.cityAr}</span>
                    <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> انتظار: {doctor.waitTime}</span>
                    <span className="flex items-center gap-1"><GraduationCap className="h-4 w-4" /> {doctor.yearsExperience} سنة خبرة</span>
                  </div>
                </div>
              </div>
            </div>

            {/* About */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <h2 className="font-cairo text-lg font-bold text-foreground mb-3">نبذة عن الطبيب</h2>
              <p className="font-cairo text-sm text-muted-foreground leading-relaxed">{doctor.aboutAr}</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <h3 className="font-cairo text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-primary" /> التعليم
                  </h3>
                  <ul className="space-y-1">
                    {doctor.education.map((edu, i) => (
                      <li key={i} className="font-cairo text-sm text-muted-foreground">• {edu}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="font-cairo text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                    <Languages className="h-4 w-4 text-primary" /> اللغات
                  </h3>
                  <div className="flex gap-2">
                    {doctor.languages.map((lang, i) => (
                      <Badge key={i} variant="secondary" className="font-cairo">{lang}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Reviews */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <h2 className="font-cairo text-lg font-bold text-foreground mb-4">التقييمات ({doctorReviews.length})</h2>
              {doctorReviews.length === 0 ? (
                <p className="font-cairo text-sm text-muted-foreground">لا توجد تقييمات بعد</p>
              ) : (
                <div className="space-y-4">
                  {doctorReviews.map(review => (
                    <div key={review.id} className="border-b border-border pb-4 last:border-0">
                      <div className="flex items-center justify-between">
                        <span className="font-cairo text-sm font-semibold text-foreground">{review.patientName}</span>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: review.rating }).map((_, i) => (
                            <Star key={i} className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                          ))}
                        </div>
                      </div>
                      <p className="mt-1 font-cairo text-sm text-muted-foreground">{review.comment}</p>
                      <span className="mt-1 block font-cairo text-xs text-muted-foreground">{review.date}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Booking sidebar */}
          <div className="space-y-4">
            {/* Price card */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-card sticky top-24">
              <div className="mb-4 text-center">
                <p className="font-cairo text-sm text-muted-foreground">سعر الكشف</p>
                {doctor.discountPercent > 0 ? (
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <span className="font-cairo text-3xl font-bold text-primary">{discountedPrice.toLocaleString()}</span>
                    <span className="font-cairo text-sm text-muted-foreground line-through">{doctor.basePrice.toLocaleString()}</span>
                    <Badge variant="destructive" className="font-cairo">-{doctor.discountPercent}%</Badge>
                  </div>
                ) : (
                  <span className="font-cairo text-3xl font-bold text-primary">{doctor.basePrice.toLocaleString()}</span>
                )}
                <span className="font-cairo text-sm text-muted-foreground"> ر.ي</span>
              </div>

              {/* Booking type */}
              <div className="mb-4">
                <p className="font-cairo text-xs font-medium text-muted-foreground mb-2">نوع الحجز</p>
                <div className="flex flex-wrap gap-2">
                  {doctor.bookingTypes.map(type => (
                    <button
                      key={type}
                      onClick={() => setSelectedType(type)}
                      className={`rounded-xl px-3 py-2 font-cairo text-xs transition-all ${
                        selectedType === type
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      {bookingTypeLabels[type]?.icon} {bookingTypeLabels[type]?.ar}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date selector */}
              <div className="mb-4">
                <p className="font-cairo text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" /> اختر التاريخ
                </p>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {dates.map(d => (
                    <button
                      key={d.value}
                      onClick={() => { setSelectedDate(d.value); setSelectedSlot(null); }}
                      className={`flex shrink-0 flex-col items-center rounded-xl px-3 py-2 text-center transition-all ${
                        selectedDate === d.value
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      <span className="font-cairo text-xs">{d.dayName}</span>
                      <span className="font-cairo text-lg font-bold">{d.dayNum}</span>
                      <span className="font-cairo text-xs">{d.month}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Time slots */}
              <div className="mb-4">
                <p className="font-cairo text-xs font-medium text-muted-foreground mb-2">المواعيد المتاحة</p>
                <div className="grid grid-cols-3 gap-2">
                  {slots.filter(s => s.isAvailable).map(slot => (
                    <button
                      key={slot.id}
                      onClick={() => setSelectedSlot(slot.id)}
                      className={`rounded-xl px-2 py-2.5 font-cairo text-sm font-medium transition-all ${
                        selectedSlot === slot.id
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-foreground hover:bg-primary/10'
                      }`}
                    >
                      {slot.startTime}
                    </button>
                  ))}
                </div>
                {slots.filter(s => s.isAvailable).length === 0 && (
                  <p className="mt-2 text-center font-cairo text-xs text-muted-foreground">لا مواعيد متاحة في هذا اليوم</p>
                )}
              </div>

              <Button
                className="w-full font-cairo bg-hero-gradient text-primary-foreground hover:opacity-90 text-base"
                size="lg"
                disabled={!selectedSlot}
                onClick={() => setShowBookingDialog(true)}
              >
                تأكيد الحجز
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Booking confirmation dialog */}
      <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="font-cairo text-xl">تأكيد الحجز</DialogTitle>
            <DialogDescription className="font-cairo text-sm text-muted-foreground">
              أكمل بياناتك لتأكيد الحجز مع {doctor.nameAr}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="rounded-xl bg-muted p-4 space-y-2">
              <div className="flex justify-between font-cairo text-sm">
                <span className="text-muted-foreground">الطبيب</span>
                <span className="font-semibold text-foreground">{doctor.nameAr}</span>
              </div>
              <div className="flex justify-between font-cairo text-sm">
                <span className="text-muted-foreground">التاريخ</span>
                <span className="font-semibold text-foreground">{selectedDate}</span>
              </div>
              <div className="flex justify-between font-cairo text-sm">
                <span className="text-muted-foreground">الوقت</span>
                <span className="font-semibold text-foreground">{slots.find(s => s.id === selectedSlot)?.startTime}</span>
              </div>
              <div className="flex justify-between font-cairo text-sm">
                <span className="text-muted-foreground">نوع الحجز</span>
                <span className="font-semibold text-foreground">{bookingTypeLabels[selectedType]?.ar}</span>
              </div>
              <div className="flex justify-between font-cairo text-sm border-t border-border pt-2">
                <span className="text-muted-foreground">المبلغ</span>
                <span className="font-bold text-primary text-lg">{discountedPrice.toLocaleString()} ر.ي</span>
              </div>
            </div>

            <div>
              <label className="font-cairo text-sm font-medium text-foreground mb-1.5 block">الاسم الكامل *</label>
              <input
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="أدخل اسمك"
                className="w-full rounded-xl bg-muted px-4 py-3 font-cairo text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="font-cairo text-sm font-medium text-foreground mb-1.5 block">رقم الهاتف</label>
              <input
                type="tel"
                value={patientPhone}
                onChange={(e) => setPatientPhone(e.target.value)}
                placeholder="7XX-XXX-XXX"
                className="w-full rounded-xl bg-muted px-4 py-3 font-cairo text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <Button
              className="w-full font-cairo bg-hero-gradient text-primary-foreground hover:opacity-90"
              size="lg"
              disabled={!patientName.trim()}
              onClick={handleConfirmBooking}
            >
              تأكيد الحجز ✅
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default DoctorProfile;
