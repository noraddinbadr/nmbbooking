import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Loader2, Send } from 'lucide-react';
import { useAuctionRequests } from '@/hooks/useAuctionRequests';
import { useAuctionSettings } from '@/hooks/useAuctionSettings';
import { useAuth } from '@/contexts/AuthContext';
import { PRIORITY_LABELS } from '@/data/auctionTypes';
import type { AuctionInitiatorType, AuctionRequestStatus } from '@/data/auctionTypes';

interface Props {
  onSuccess: () => void;
}

const AuctionRequestForm = ({ onSuccess }: Props) => {
  const { user, roles } = useAuth();
  const { settings } = useAuctionSettings();
  const { createRequest } = useAuctionRequests();
  const isDoctor = roles.includes('doctor');
  const isAdmin = roles.includes('admin');

  const [form, setForm] = useState({
    title_ar: '',
    description_ar: '',
    diagnosis_code: '',
    diagnosis_summary: '',
    treatment_plan: '',
    medical_priority: 3,
    estimated_cost: 0,
    anonymization_level: 2,
    poverty_score: null as number | null,
    specialty: '',
    city: '',
    patient_id: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const initiatorType: AuctionInitiatorType = isDoctor ? 'doctor' : isAdmin ? 'admin' : 'patient';
    
    // Determine initial status based on settings
    let initialStatus: AuctionRequestStatus = 'draft';
    if (initiatorType === 'doctor') {
      if (settings?.require_patient_otp_consent) {
        initialStatus = 'pending_patient_consent';
      } else if (!settings?.auto_publish_after_verify) {
        initialStatus = 'pending_admin';
      } else {
        initialStatus = 'published';
      }
    } else if (initiatorType === 'patient') {
      if (settings?.require_doctor_signature) {
        initialStatus = 'pending_doctor';
      } else if (!settings?.auto_publish_after_verify) {
        initialStatus = 'pending_admin';
      }
    } else {
      initialStatus = 'pending_admin';
    }

    const expiresAt = settings?.bid_duration_hours
      ? new Date(Date.now() + settings.bid_duration_hours * 3600000).toISOString()
      : null;

    await createRequest.mutateAsync({
      ...form,
      patient_id: form.patient_id || user.id,
      initiator_id: user.id,
      initiator_type: initiatorType,
      status: initialStatus,
      expires_at: expiresAt,
    } as any);

    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 font-cairo">
      <div className="space-y-2">
        <Label>عنوان الطلب *</Label>
        <Input
          value={form.title_ar}
          onChange={e => setForm(f => ({ ...f, title_ar: e.target.value }))}
          placeholder="مثال: عملية قلب مفتوح لطفل"
          required
        />
      </div>

      <div className="space-y-2">
        <Label>وصف الحالة</Label>
        <Textarea
          value={form.description_ar}
          onChange={e => setForm(f => ({ ...f, description_ar: e.target.value }))}
          placeholder="وصف تفصيلي للحالة الطبية..."
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>كود التشخيص (ICD-10)</Label>
          <Input
            value={form.diagnosis_code}
            onChange={e => setForm(f => ({ ...f, diagnosis_code: e.target.value }))}
            placeholder="مثل I21.0"
          />
        </div>
        <div className="space-y-2">
          <Label>التخصص المطلوب</Label>
          <Input
            value={form.specialty}
            onChange={e => setForm(f => ({ ...f, specialty: e.target.value }))}
            placeholder="جراحة القلب"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>ملخص التشخيص</Label>
        <Textarea
          value={form.diagnosis_summary}
          onChange={e => setForm(f => ({ ...f, diagnosis_summary: e.target.value }))}
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label>خطة العلاج</Label>
        <Textarea
          value={form.treatment_plan}
          onChange={e => setForm(f => ({ ...f, treatment_plan: e.target.value }))}
          rows={2}
        />
      </div>

      <Separator />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>التكلفة المقدرة (ر.ي)</Label>
          <Input
            type="number"
            value={form.estimated_cost}
            onChange={e => setForm(f => ({ ...f, estimated_cost: parseFloat(e.target.value) || 0 }))}
          />
        </div>
        <div className="space-y-2">
          <Label>المدينة</Label>
          <Input
            value={form.city}
            onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
            placeholder="صنعاء"
          />
        </div>
      </div>

      <div className="space-y-3">
        <Label>درجة الاستعجال: {PRIORITY_LABELS[form.medical_priority]}</Label>
        <Slider
          value={[form.medical_priority]}
          onValueChange={([v]) => setForm(f => ({ ...f, medical_priority: v }))}
          min={1}
          max={5}
          step={1}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>عادي</span><span>طارئ</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>مستوى إخفاء الهوية</Label>
          <Select
            value={String(form.anonymization_level)}
            onValueChange={v => setForm(f => ({ ...f, anonymization_level: parseInt(v) }))}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="0">بدون إخفاء</SelectItem>
              <SelectItem value="1">إخفاء جزئي</SelectItem>
              <SelectItem value="2">إخفاء عالي</SelectItem>
              <SelectItem value="3">مجهول بالكامل</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>درجة الفقر (اختياري)</Label>
          <Input
            type="number"
            min={0}
            max={100}
            value={form.poverty_score ?? ''}
            onChange={e => setForm(f => ({ ...f, poverty_score: e.target.value ? parseInt(e.target.value) : null }))}
            placeholder="0-100"
          />
        </div>
      </div>

      {(isDoctor || isAdmin) && (
        <div className="space-y-2">
          <Label>معرف المريض (UUID)</Label>
          <Input
            value={form.patient_id}
            onChange={e => setForm(f => ({ ...f, patient_id: e.target.value }))}
            placeholder="اتركه فارغاً لاستخدام المستخدم الحالي"
          />
        </div>
      )}

      <Button type="submit" className="w-full gap-2" disabled={createRequest.isPending}>
        {createRequest.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        إرسال الطلب
      </Button>
    </form>
  );
};

export default AuctionRequestForm;
