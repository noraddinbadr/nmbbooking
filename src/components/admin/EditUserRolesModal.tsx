import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Constants } from '@/integrations/supabase/types';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

const roleLabels: Record<AppRole, string> = {
  admin: 'مدير النظام',
  doctor: 'طبيب',
  clinic_admin: 'مدير عيادة',
  staff: 'موظف',
  patient: 'مريض',
  donor: 'متبرع',
  provider: 'مزود خدمة',
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  user: {
    id: string;
    full_name: string | null;
    phone: string | null;
    gender: string | null;
    roles: AppRole[];
  } | null;
}

const EditUserRolesModal = ({ open, onOpenChange, onSuccess, user }: Props) => {
  const [selectedRoles, setSelectedRoles] = useState<AppRole[]>(user?.roles || []);
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [gender, setGender] = useState(user?.gender || '');
  const [saving, setSaving] = useState(false);

  // Sync state when user changes
  if (user && selectedRoles.length === 0 && user.roles.length > 0) {
    setSelectedRoles([...user.roles]);
  }

  const toggleRole = (role: AppRole) => {
    setSelectedRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    // Update profile
    await supabase.from('profiles').update({
      full_name: fullName || null,
      phone: phone || null,
      gender: gender || null,
    }).eq('id', user.id);

    // Sync roles: delete removed, insert added
    const toRemove = user.roles.filter(r => !selectedRoles.includes(r));
    const toAdd = selectedRoles.filter(r => !user.roles.includes(r));

    for (const role of toRemove) {
      await supabase.from('user_roles').delete().eq('user_id', user.id).eq('role', role);
    }
    for (const role of toAdd) {
      await supabase.from('user_roles').insert({ user_id: user.id, role });
    }

    toast({ title: 'تم', description: 'تم تحديث بيانات المستخدم' });
    setSaving(false);
    onOpenChange(false);
    onSuccess();
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => {
      if (!v) {
        setSelectedRoles([]);
      }
      onOpenChange(v);
    }}>
      <DialogContent className="font-cairo max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="font-cairo">تعديل المستخدم</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="font-cairo text-sm">الاسم</Label>
            <Input value={fullName} onChange={e => setFullName(e.target.value)} className="font-cairo mt-1" />
          </div>
          <div>
            <Label className="font-cairo text-sm">الهاتف</Label>
            <Input value={phone} onChange={e => setPhone(e.target.value)} className="font-cairo mt-1" dir="ltr" />
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
            <Label className="font-cairo text-sm mb-2 block">الأدوار</Label>
            <div className="grid grid-cols-2 gap-2">
              {Constants.public.Enums.app_role.map(role => (
                <label key={role} className="flex items-center gap-2 p-2 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors">
                  <Checkbox
                    checked={selectedRoles.includes(role)}
                    onCheckedChange={() => toggleRole(role)}
                  />
                  <span className="font-cairo text-sm">{roleLabels[role]}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button onClick={handleSave} disabled={saving} className="font-cairo flex-1">
              {saving ? 'جارٍ الحفظ...' : 'حفظ التعديلات'}
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)} className="font-cairo">إلغاء</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditUserRolesModal;
