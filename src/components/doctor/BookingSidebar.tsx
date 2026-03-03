import { useState, useMemo } from 'react';
import { MapPin, Clock, Users, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Doctor, BookingType } from '@/data/types';
import { generateTimeSlots, getShiftsForDate } from '@/lib/slots';
import { bookingTypeLabels } from '@/data/mockData';

interface Props {
  doctor: Doctor;
}

const BookingSidebar = ({ doctor }: Props) => {
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedShift, setSelectedShift] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<BookingType>('clinic');
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');

  const shifts = useMemo(() => getShiftsForDate(doctor, selectedDate), [doctor, selectedDate]);
  const slots = useMemo(() => generateTimeSlots(doctor, selectedDate), [doctor, selectedDate]);

  const activeShiftId = selectedShift || (shifts.length > 0 ? shifts[0].id : null);
  const activeShift = shifts.find(s => s.id === activeShiftId);
  const shiftSlots = slots.filter(s => s.shiftId === activeShiftId);
  const availableSlots = shiftSlots.filter(s => s.isAvailable);
  const isFlexibleShift = activeShift && !activeShift.enableSlotGeneration;

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
        isToday: i === 0,
      });
    }
    return arr;
  }, []);

  const computedPrice = useMemo(() => {
    if (doctor.discountType === 'percentage') return doctor.basePrice * (1 - doctor.discountValue / 100);
    if (doctor.discountType === 'fixed') return Math.max(0, doctor.basePrice - doctor.discountValue);
    return doctor.basePrice;
  }, [doctor]);

  const handleConfirmBooking = () => {
    if (!patientName.trim()) return;
    const slotInfo = shiftSlots.find(s => s.id === selectedSlot);
    toast({
      title: '✅ تم الحجز بنجاح!',
      description: `تم حجز موعدك مع ${doctor.nameAr} — ${selectedDate} ${
        isFlexibleShift ? `(${activeShift?.label} — ترتيبك: ${slotInfo?.queuePosition})` : `الساعة ${slotInfo?.startTime}`
      }`,
    });
    setShowBookingDialog(false);
    setSelectedSlot(null);
    setPatientName('');
    setPatientPhone('');
  };

  return (
    <>
      <div className="rounded-2xl border border-border bg-card shadow-card sticky top-24 overflow-hidden">
        <div className="bg-hero-gradient px-5 py-3 text-center">
          <p className="font-cairo text-sm font-medium text-primary-foreground">معلومات الحجز</p>
        </div>
        <div className="p-5 space-y-5">
          {/* Price & Info */}
          <div className="flex items-center justify-around text-center">
            <div>
              <span className="font-cairo text-xs text-muted-foreground">احجز</span>
              <p className="font-cairo text-sm font-bold text-foreground">كشف طبي</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div>
              <span className="text-lg">⏱️</span>
              <p className="font-cairo text-xs text-muted-foreground">مدة الانتظار: {doctor.waitTime}</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div>
              {computedPrice < doctor.basePrice ? (
                <>
                  <div className="flex items-center gap-1">
                    <span className="font-cairo text-lg font-bold text-primary">{computedPrice.toLocaleString()}</span>
                    <span className="font-cairo text-xs text-muted-foreground line-through">{doctor.basePrice.toLocaleString()}</span>
                  </div>
                  <span className="font-cairo text-xs text-muted-foreground">ر.ي</span>
                </>
              ) : (
                <>
                  <span className="font-cairo text-lg font-bold text-primary">{doctor.basePrice.toLocaleString()}</span>
                  <p className="font-cairo text-xs text-muted-foreground">ر.ي الكشف</p>
                </>
              )}
            </div>
          </div>

          {doctor.freeCasesPerShift > 0 && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 px-3 py-2">
              <Gift className="h-4 w-4 text-emerald-600" />
              <span className="font-cairo text-xs font-medium text-emerald-700">{doctor.freeCasesPerShift} حالات مجانية في كل فترة</span>
            </div>
          )}

          {/* Booking type */}
          <div>
            <p className="font-cairo text-xs font-medium text-muted-foreground mb-2">نوع الحجز</p>
            <div className="flex flex-wrap gap-2">
              {doctor.bookingTypes.map(type => (
                <button key={type} onClick={() => setSelectedType(type)} className={`rounded-xl px-3 py-2 font-cairo text-xs transition-all ${selectedType === type ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
                  {bookingTypeLabels[type]?.icon} {bookingTypeLabels[type]?.ar}
                </button>
              ))}
            </div>
          </div>

          {/* Clinic location */}
          <div>
            <p className="font-cairo text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> مكان العيادة</p>
            <div className="rounded-xl bg-muted p-3">
              <p className="font-cairo text-sm font-semibold text-foreground">{doctor.clinicNameAr}</p>
              <p className="font-cairo text-xs text-muted-foreground mt-1">{doctor.clinicAddress}</p>
            </div>
          </div>

          {/* Date selector */}
          <div>
            <p className="font-cairo text-sm font-bold text-foreground mb-3 text-center">اختـــار ميعاد الحجز</p>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {dates.map(d => (
                <button key={d.value} onClick={() => { setSelectedDate(d.value); setSelectedSlot(null); setSelectedShift(null); }} className={`flex shrink-0 flex-col items-center rounded-xl border-2 px-3 py-2 text-center transition-all ${selectedDate === d.value ? 'border-primary bg-primary/5' : 'border-transparent bg-muted hover:border-primary/30'}`}>
                  {d.isToday && <span className="font-cairo text-[10px] font-bold text-primary">اليوم</span>}
                  <span className="font-cairo text-xs text-muted-foreground">{d.dayName}</span>
                  <span className="font-cairo text-lg font-bold text-foreground">{d.dayNum}</span>
                  <span className="font-cairo text-xs text-muted-foreground">{d.month}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Shift selector */}
          {shifts.length > 0 ? (
            <div>
              <p className="font-cairo text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> اختر الفترة</p>
              <div className="flex gap-2">
                {shifts.map(shift => (
                  <button key={shift.id} onClick={() => { setSelectedShift(shift.id); setSelectedSlot(null); }} className={`flex-1 rounded-xl px-3 py-2.5 font-cairo text-xs transition-all text-center ${activeShiftId === shift.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-primary/10'}`}>
                    <p className="font-bold">{shift.label}</p>
                    <p className="mt-0.5 opacity-80">{shift.startTime} — {shift.endTime}</p>
                    {shift.maxCapacity && (
                      <div className="flex items-center justify-center gap-1 mt-1 opacity-80"><Users className="h-3 w-3" /><span>{shift.maxCapacity} مريض</span></div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-center font-cairo text-xs text-muted-foreground py-4">لا توجد فترات في هذا اليوم</p>
          )}

          {/* Time slots */}
          {activeShift && (
            <div>
              {isFlexibleShift ? (
                <div>
                  <p className="font-cairo text-xs font-medium text-muted-foreground mb-2">حجز بأسبقية الحضور</p>
                  {availableSlots.length > 0 ? (
                    <button onClick={() => setSelectedSlot(availableSlots[0].id)} className={`w-full rounded-xl p-4 font-cairo text-center transition-all ${selectedSlot === availableSlots[0].id ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground hover:bg-primary/10'}`}>
                      <p className="text-sm font-bold">📋 احجز مكانك في الطابور</p>
                      <p className="text-xs mt-1 opacity-80">ترتيبك: {availableSlots[0].queuePosition}{activeShift.maxCapacity && ` من ${activeShift.maxCapacity}`}</p>
                      <p className="text-xs mt-0.5 opacity-70">{activeShift.startTime} — {activeShift.endTime}</p>
                    </button>
                  ) : (
                    <p className="text-center font-cairo text-xs text-muted-foreground py-4">الفترة ممتلئة</p>
                  )}
                </div>
              ) : (
                <div>
                  <p className="font-cairo text-xs font-medium text-muted-foreground mb-2">المواعيد المتاحة</p>
                  {availableSlots.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2">
                      {availableSlots.map(slot => (
                        <button key={slot.id} onClick={() => setSelectedSlot(slot.id)} className={`rounded-xl px-2 py-2.5 font-cairo text-sm font-medium transition-all ${selectedSlot === slot.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground hover:bg-primary/10'}`}>
                          {slot.startTime}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center font-cairo text-xs text-muted-foreground py-4">لا يوجد مواعيد متاحة</p>
                  )}
                </div>
              )}
            </div>
          )}

          <Button className="w-full font-cairo bg-hero-gradient text-primary-foreground hover:opacity-90 text-base" size="lg" disabled={!selectedSlot} onClick={() => setShowBookingDialog(true)}>
            احجز
          </Button>
          <p className="text-center font-cairo text-xs text-muted-foreground">الحجز مسبقاً والدفع عند الوصول للعيادة</p>
        </div>
      </div>

      <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="font-cairo text-xl">تأكيد الحجز</DialogTitle>
            <DialogDescription className="font-cairo text-sm text-muted-foreground">أكمل بياناتك لتأكيد الحجز مع {doctor.nameAr}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="rounded-xl bg-muted p-4 space-y-2">
              <div className="flex justify-between font-cairo text-sm"><span className="text-muted-foreground">الطبيب</span><span className="font-semibold text-foreground">{doctor.nameAr}</span></div>
              <div className="flex justify-between font-cairo text-sm"><span className="text-muted-foreground">التاريخ</span><span className="font-semibold text-foreground">{selectedDate}</span></div>
              <div className="flex justify-between font-cairo text-sm"><span className="text-muted-foreground">الفترة</span><span className="font-semibold text-foreground">{activeShift?.label} ({activeShift?.startTime} — {activeShift?.endTime})</span></div>
              {!isFlexibleShift && (
                <div className="flex justify-between font-cairo text-sm"><span className="text-muted-foreground">الوقت</span><span className="font-semibold text-foreground">{shiftSlots.find(s => s.id === selectedSlot)?.startTime}</span></div>
              )}
              <div className="flex justify-between font-cairo text-sm"><span className="text-muted-foreground">نوع الحجز</span><span className="font-semibold text-foreground">{bookingTypeLabels[selectedType]?.ar}</span></div>
              <div className="flex justify-between font-cairo text-sm border-t border-border pt-2"><span className="text-muted-foreground">المبلغ</span><span className="font-bold text-primary text-lg">{computedPrice.toLocaleString()} ر.ي</span></div>
            </div>
            <div>
              <label className="font-cairo text-sm font-medium text-foreground mb-1.5 block">الاسم الكامل *</label>
              <input type="text" value={patientName} onChange={(e) => setPatientName(e.target.value)} placeholder="أدخل اسمك" className="w-full rounded-xl bg-muted px-4 py-3 font-cairo text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" maxLength={100} />
            </div>
            <div>
              <label className="font-cairo text-sm font-medium text-foreground mb-1.5 block">رقم الهاتف</label>
              <input type="tel" value={patientPhone} onChange={(e) => setPatientPhone(e.target.value)} placeholder="7XX-XXX-XXX" className="w-full rounded-xl bg-muted px-4 py-3 font-cairo text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" maxLength={15} />
            </div>
            <Button className="w-full font-cairo bg-hero-gradient text-primary-foreground hover:opacity-90" size="lg" disabled={!patientName.trim()} onClick={handleConfirmBooking}>
              تأكيد الحجز ✅
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BookingSidebar;
