import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Loader2, AlertCircle, CalendarClock, ArrowLeft } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription,
} from '@/components/ui/alert-dialog';
import { isBookingPast } from '@/lib/bookingState';

interface Props {
  open: boolean;
  booking: any | null;
  onClose: () => void;
  onSaved: () => void;
}

const RescheduleBookingModal = ({ open, booking, onClose, onSaved }: Props) => {
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (booking && open) {
      setDate(booking.booking_date || '');
      setStartTime(booking.start_time || '');
      setEndTime(booking.end_time || '');
      setReason('');
    }
  }, [booking, open]);

  if (!booking) return null;

  const wasPast = isBookingPast(booking.booking_date, booking.start_time);

  const validateInputs = () => {
    if (!date || !startTime) {
      toast({ title: 'بيانات ناقصة', description: 'التاريخ ووقت البداية مطلوبان', variant: 'destructive' });
      return false;
    }
    // New schedule must NOT be in the past
    const newDt = new Date(`${date}T${startTime}`);
    if (newDt.getTime() < Date.now()) {
      toast({ title: 'تاريخ غير صالح', description: 'لا يمكن إعادة الجدولة إلى تاريخ/وقت في الماضي.', variant: 'destructive' });
      return false;
    }
    return true;
  };

  const handlePrimaryClick = () => {
    if (!validateInputs()) return;
    if (wasPast) {
      setConfirmOpen(true);
      return;
    }
    submit();
  };

  const submit = async () => {
    if (!validateInputs()) return;
    setSaving(true);
    const { data, error } = await supabase.rpc('reschedule_booking', {
      _booking_id: booking.id,
      _new_date: date,
      _new_start_time: startTime,
      _new_end_time: endTime || null,
      _reason: reason || null,
    });
    setSaving(false);
    setConfirmOpen(false);

    if (error) {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
      return;
    }
    const result = data as any;
    if (!result?.success) {
      const msg = result?.message || result?.error || 'فشل إعادة الجدولة';
      toast({ title: 'تعذّر إعادة الجدولة', description: msg, variant: 'destructive' });
      return;
    }
    toast({ title: '✅ تم إعادة الجدولة', description: `الموعد الجديد: ${date} ${startTime}` });
    onSaved();
    onClose();
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
            <p className="font-semibold">{booking.booking_date} • {booking.start_time || '—'}</p>
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

          {wasPast && (
            <div className="flex items-start gap-2 rounded-lg bg-destructive/5 border border-destructive/30 p-2 text-xs font-cairo text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>هذا الحجز في الماضي — سيُطلب منك تأكيد إضافي قبل النقل.</span>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button onClick={handlePrimaryClick} disabled={saving} className="font-cairo flex-1">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'تأكيد إعادة الجدولة'}
            </Button>
            <Button variant="outline" onClick={onClose} className="font-cairo">إلغاء</Button>
          </div>
        </div>
      </DialogContent>

      {/* Extra confirmation when rescheduling a past booking */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent dir="rtl" className="font-cairo">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-primary" />
              تأكيد إعادة جدولة حجز منتهٍ
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm text-foreground">
                <p className="text-muted-foreground">
                  أنت على وشك نقل حجز كان مجدولاً في الماضي. سيتم حفظ الموعد القديم في سجل التدقيق.
                </p>

                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-lg border border-border bg-muted/40 p-3">
                  <div className="text-center">
                    <p className="text-[11px] text-muted-foreground mb-1">الموعد القديم</p>
                    <p className="font-semibold text-destructive line-through" dir="ltr">
                      {booking.booking_date}
                    </p>
                    <p className="text-xs text-destructive/80" dir="ltr">{booking.start_time || '—'}</p>
                  </div>
                  <ArrowLeft className="h-4 w-4 text-muted-foreground" />
                  <div className="text-center">
                    <p className="text-[11px] text-muted-foreground mb-1">الموعد الجديد</p>
                    <p className="font-semibold text-emerald-700" dir="ltr">{date}</p>
                    <p className="text-xs text-emerald-700/80" dir="ltr">{startTime}{endTime ? ` – ${endTime}` : ''}</p>
                  </div>
                </div>

                <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-2.5 text-xs text-emerald-900">
                  <p className="font-semibold mb-1">بعد إعادة الجدولة:</p>
                  <ul className="list-disc pr-4 space-y-0.5">
                    <li>ستصبح حالة الحجز: <span className="font-semibold">مُعاد جدولته</span></li>
                    <li>الإجراء التالي المتاح: <span className="font-semibold">تأكيد الحجز</span> ثم <span className="font-semibold">بدء الجلسة</span> في الموعد الجديد</li>
                    <li>يمكن أيضاً: الإلغاء، تسجيل عدم الحضور، أو إعادة الجدولة مرة أخرى</li>
                  </ul>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>تراجع</AlertDialogCancel>
            <AlertDialogAction onClick={submit} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'نعم، أعد الجدولة'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
};

export default RescheduleBookingModal;
