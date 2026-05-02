import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { Loader2, AlertCircle } from 'lucide-react';
import { useRescheduleBooking } from '../hooks/useBookings';
import type { Booking } from '../schemas/booking.schema';
import type { AppError } from '@/shared/errors';

interface Props {
  open: boolean;
  /** Either the camelCase domain Booking or a legacy snake_case row. */
  booking: (Partial<Booking> & { booking_date?: string; start_time?: string | null; end_time?: string | null }) | null;
  onClose: () => void;
  onSaved: () => void;
}

const RescheduleBookingModal = ({ open, booking, onClose, onSaved }: Props) => {
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [reason, setReason] = useState('');
  const reschedule = useRescheduleBooking();

  // Support both shapes during migration.
  const currentDate = booking?.bookingDate ?? booking?.booking_date ?? '';
  const currentStart = booking?.startTime ?? booking?.start_time ?? '';
  const currentEnd = booking?.endTime ?? booking?.end_time ?? '';

  useEffect(() => {
    if (booking && open) {
      setDate(currentDate);
      setStartTime(currentStart || '');
      setEndTime(currentEnd || '');
      setReason('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booking, open]);

  if (!booking || !booking.id) return null;

  const submit = async () => {
    if (!date || !startTime) {
      toast({ title: 'بيانات ناقصة', description: 'التاريخ ووقت البداية مطلوبان', variant: 'destructive' });
      return;
    }
    try {
      await reschedule.mutateAsync({
        bookingId: booking.id as string,
        newDate: date,
        newStartTime: startTime,
        newEndTime: endTime || null,
        reason: reason || null,
      });
      toast({ title: '✅ تم إعادة الجدولة', description: `الموعد الجديد: ${date} ${startTime}` });
      onSaved();
      onClose();
    } catch (e) {
      const err = e as AppError;
      toast({ title: 'تعذّر إعادة الجدولة', description: err?.message ?? 'فشل إعادة الجدولة', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="font-cairo">إعادة جدولة الحجز</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="rounded-lg border border-border bg-muted/40 p-3 text-xs font-cairo">
            <p className="text-muted-foreground">الموعد الحالي:</p>
            <p className="font-semibold">{currentDate} • {currentStart || '—'}</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label className="font-cairo text-sm">التاريخ الجديد *</Label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} dir="ltr" className="mt-1" />
            </div>
            <div>
              <Label className="font-cairo text-sm">من *</Label>
              <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} dir="ltr" className="mt-1" />
            </div>
            <div>
              <Label className="font-cairo text-sm">إلى</Label>
              <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} dir="ltr" className="mt-1" />
            </div>
          </div>
          <div>
            <Label className="font-cairo text-sm">سبب إعادة الجدولة</Label>
            <Textarea value={reason} onChange={e => setReason(e.target.value)} rows={2} className="font-cairo mt-1"
              placeholder="مثال: طارئ للطبيب / طلب المريض" />
          </div>
          <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 p-2 text-xs font-cairo text-amber-800">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>سيتم حفظ الموعد القديم في سجل التدقيق، والتحقق من تعارض الحجوزات تلقائياً.</span>
          </div>
          <div className="flex gap-2 pt-2">
            <Button onClick={submit} disabled={reschedule.isPending} className="font-cairo flex-1">
              {reschedule.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'تأكيد إعادة الجدولة'}
            </Button>
            <Button variant="outline" onClick={onClose} className="font-cairo">إلغاء</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RescheduleBookingModal;