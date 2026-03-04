import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Constants } from '@/integrations/supabase/types';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

interface UserFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  defaultRole?: AppRole;
}

const roleLabels: Record<AppRole, string> = {
  admin: 'مدير النظام',
  doctor: 'طبيب',
  clinic_admin: 'مدير عيادة',
  staff: 'موظف',
  patient: 'مريض',
  donor: 'متبرع',
  provider: 'مزود خدمة',
};

const UserFormModal = ({ open, onOpenChange, onSuccess, defaultRole }: UserFormModalProps) => {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('');
  const [role, setRole] = useState<AppRole>(defaultRole || 'patient');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!fullName.trim()) {
      toast({ title: 'خطأ', description: 'يرجى إدخال الاسم', variant: 'destructive' });
      return;
    }
    setSaving(true);

    // We create the user via edge function (admin-only operation)
    const { data, error } = await supabase.functions.invoke('seed-users', {
      body: {
        action: 'create_single',
        full_name: fullName,
        phone,
        gender,
        role,
      },
    });

    if (error) {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    } else if (data?.error) {
      toast({ title: 'خطأ', description: data.error, variant: 'destructive' });
    } else {
      toast({ title: 'تم', description: `تم إضافة المستخدم بنجاح` });
      setFullName('');
      setPhone('');
      setGender('');
      onOpenChange(false);
      onSuccess();
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="font-cairo max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="font-cairo">إضافة مستخدم جديد</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="font-cairo text-sm">الاسم الكامل *</Label>
            <Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="أدخل الاسم" className="font-cairo mt-1" />
          </div>
          <div>
            <Label className="font-cairo text-sm">رقم الهاتف</Label>
            <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="05xxxxxxxx" className="font-cairo mt-1" dir="ltr" />
          </div>
          <div>
            <Label className="font-cairo text-sm">الجنس</Label>
            <Select value={gender} onValueChange={setGender}>
              <SelectTrigger className="font-cairo mt-1"><SelectValue placeholder="اختر" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="male" className="font-cairo">ذكر</SelectItem>
                <SelectItem value="female" className="font-cairo">أنثى</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="font-cairo text-sm">الدور</Label>
            <Select value={role} onValueChange={v => setRole(v as AppRole)}>
              <SelectTrigger className="font-cairo mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Constants.public.Enums.app_role.map(r => (
                  <SelectItem key={r} value={r} className="font-cairo">{roleLabels[r]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 pt-2">
            <Button onClick={handleSave} disabled={saving} className="font-cairo flex-1">
              {saving ? 'جارٍ الحفظ...' : 'حفظ'}
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)} className="font-cairo">إلغاء</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserFormModal;
