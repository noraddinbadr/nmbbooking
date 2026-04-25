import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { isBookingPast, STATUS_LABELS, type BookingStatus } from '@/lib/bookingState';

type BookingType = 'clinic' | 'hospital' | 'home' | 'video' | 'voice' | 'lab';

interface BookingFormModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  /** Existing booking row when editing; null = create */
  booking?: any | null;
}

interface OptItem { id: string; label: string; }

const BookingFormModal = ({ open, onClose, onSaved, booking }: BookingFormModalProps) => {
  const isEdit = !!booking?.id;
  const { roles } = useAuth();
  const isAdmin = roles.includes('admin') || roles.includes('clinic_admin');
  const [saving, setSaving] = useState(false);
  const [doctors, setDoctors] = useState<OptItem[]>([]);
  const [patients, setPatients] = useState<OptItem[]>([]);

  const [form, setForm] = useState({
    doctor_id: '',
    patient_id: '',
    booking_date: new Date().toISOString().split('T')[0],
    start_time: '',
    end_time: '',
    booking_type: 'clinic' as BookingType,
    status: 'pending' as BookingStatus,
    final_price: 0,
    notes: '',
  });

  useEffect(() => {
    if (!open) return;
    // Load doctors + patients
    Promise.all([
      supabase.from('doctors').select('id, name_ar').order('name_ar').limit(500),
      supabase.from('user_roles' as any).select('user_id').eq('role', 'patient').limit(500),
    ]).then(async ([dRes, rRes]) => {
      setDoctors((dRes.data || []).map((d: any) => ({ id: d.id, label: d.name_ar })));
      const ids = (rRes.data || []).map((r: any) => r.user_id);
      if (ids.length) {
        const { data } = await supabase.from('profiles').select('id, full_name_ar, full_name').in('id', ids);
        setPatients((data || []).map((p: any) => ({ id: p.id, label: p.full_name_ar || p.full_name || p.id.slice(0, 8) })));
      }
    });

    if (booking) {
      setForm({
        doctor_id: booking.doctor_id || '',
        patient_id: booking.patient_id || '',
        booking_date: booking.booking_date || new Date().toISOString().split('T')[0],
        start_time: booking.start_time || '',
        end_time: booking.end_time || '',
        booking_type: (booking.booking_type as BookingType) || 'clinic',
        status: (booking.status as BookingStatus) || 'pending',
        final_price: booking.final_price || 0,
        notes: booking.notes || '',
      });
    } else {
      setForm(f => ({ ...f, patient_id: '', doctor_id: '', notes: '', start_time: '', end_time: '', final_price: 0, status: 'pending' }));
    }
  }, [open, booking]);

  const save = async () => {
    if (!form.doctor_id || !form.patient_id || !form.booking_date) {
      toast({ title: 'بيانات ناقصة', description: 'الطبيب والمريض والتاريخ مطلوبة', variant: 'destructive' });
      return;
    }
    // Block creating past bookings for non-admins
    if (!isEdit && !isAdmin && isBookingPast(form.booking_date, form.start_time)) {
      toast({ title: 'تاريخ غير صالح', description: 'لا يمكن إنشاء حجز في الماضي.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const payload: any = {
      doctor_id: form.doctor_id,
      patient_id: form.patient_id,
      booking_date: form.booking_date,
      start_time: form.start_time || null,
      end_time: form.end_time || null,
      booking_type: form.booking_type,
      status: form.status,
      final_price: Number(form.final_price) || 0,
      notes: form.notes || null,
    };
    const { error } = isEdit
      ? await supabase.from('bookings').update(payload).eq('id', booking.id)
      : await supabase.from('bookings').insert(payload);
    setSaving(false);
    if (error) {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: isEdit ? '✅ تم التحديث' : '✅ تم إنشاء الحجز' });
    onSaved();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="font-cairo">{isEdit ? 'تعديل الحجز' : 'حجز جديد'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="font-cairo text-sm">المريض *</Label>
            <Select value={form.patient_id} onValueChange={v => setForm({ ...form, patient_id: v })}>
              <SelectTrigger className="font-cairo mt-1"><SelectValue placeholder="اختر المريض" /></SelectTrigger>
              <SelectContent className="max-h-60">
                {patients.map(p => <SelectItem key={p.id} value={p.id} className="font-cairo">{p.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="font-cairo text-sm">الطبيب *</Label>
            <Select value={form.doctor_id} onValueChange={v => setForm({ ...form, doctor_id: v })}>
              <SelectTrigger className="font-cairo mt-1"><SelectValue placeholder="اختر الطبيب" /></SelectTrigger>
              <SelectContent className="max-h-60">
                {doctors.map(d => <SelectItem key={d.id} value={d.id} className="font-cairo">{d.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label className="font-cairo text-sm">التاريخ *</Label>
              <Input type="date" value={form.booking_date} onChange={e => setForm({ ...form, booking_date: e.target.value })} dir="ltr" className="mt-1" />
            </div>
            <div>
              <Label className="font-cairo text-sm">من</Label>
              <Input type="time" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} dir="ltr" className="mt-1" />
            </div>
            <div>
              <Label className="font-cairo text-sm">إلى</Label>
              <Input type="time" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} dir="ltr" className="mt-1" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="font-cairo text-sm">النوع</Label>
              <Select value={form.booking_type} onValueChange={v => setForm({ ...form, booking_type: v as BookingType })}>
                <SelectTrigger className="font-cairo mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="clinic" className="font-cairo">عيادة</SelectItem>
                  <SelectItem value="hospital" className="font-cairo">مستشفى</SelectItem>
                  <SelectItem value="home" className="font-cairo">منزلي</SelectItem>
                  <SelectItem value="video" className="font-cairo">فيديو</SelectItem>
                  <SelectItem value="voice" className="font-cairo">صوتي</SelectItem>
                  <SelectItem value="lab" className="font-cairo">مختبر</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="font-cairo text-sm">الحالة</Label>
              <Select value={form.status} onValueChange={v => setForm({ ...form, status: v as BookingStatus })}>
                <SelectTrigger className="font-cairo mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                  {(['pending','confirmed','rescheduled','in_progress','completed','cancelled','no_show'] as BookingStatus[]).map(s => (
                    <SelectItem key={s} value={s} className="font-cairo">{STATUS_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {!isEdit && isBookingPast(form.booking_date, form.start_time) && !isAdmin && (
            <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 p-2 text-xs font-cairo text-amber-800">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>لا يمكن إنشاء حجز بتاريخ/وقت في الماضي.</span>
            </div>
          )}

          <div>
            <Label className="font-cairo text-sm">السعر النهائي (ر.ي)</Label>
            <Input type="number" value={form.final_price} onChange={e => setForm({ ...form, final_price: Number(e.target.value) })} dir="ltr" className="mt-1" />
          </div>

          <div>
            <Label className="font-cairo text-sm">ملاحظات</Label>
            <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} className="font-cairo mt-1" />
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={save} disabled={saving} className="font-cairo flex-1">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : (isEdit ? 'حفظ التعديلات' : 'إنشاء الحجز')}
            </Button>
            <Button variant="outline" onClick={onClose} className="font-cairo">إلغاء</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BookingFormModal;
