import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Loader2, AlertCircle } from 'lucide-react';

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

  useEffect(() => {
    if (booking && open) {
      setDate(booking.booking_date || '');
      setStartTime(booking.start_time || '');
      setEndTime(booking.end_time || '');
      setReason('');
    }
  }, [booking, open]);

  if (!booking) return null;

  const submit = async () => {
    if (!date || !startTime) {
      toast({ title: 'بيانات ناقصة', description: 'التاريخ ووقت البداية مطلوبان', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const { data, error } = await supabase.rpc('reschedule_booking', {
      _booking_id: booking.id,
      _new_date: date,
      _new_start_time: startTime,
      _new_end_time: endTime || null,
      _reason: reason || null,
    });
    setSaving(false);

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

          <div className="flex gap-2 pt-2">
            <Button onClick={submit} disabled={saving} className="font-cairo flex-1">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'تأكيد إعادة الجدولة'}
            </Button>
            <Button variant="outline" onClick={onClose} className="font-cairo">إلغاء</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RescheduleBookingModal;
