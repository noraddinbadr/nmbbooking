import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Camera, Upload, Save } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';


const DashboardProfile = () => {
  const { profile, hasRole, user } = useAuth();
  const isDoctor = hasRole('doctor');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: '',
    full_name_ar: '',
    phone: '',
    gender: '',
    date_of_birth: '',
  });

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || '',
        full_name_ar: profile.full_name_ar || '',
        phone: profile.phone || '',
        gender: profile.gender || '',
        date_of_birth: profile.date_of_birth || '',
      });
    }
  }, [profile]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update({
      full_name: form.full_name,
      full_name_ar: form.full_name_ar,
      phone: form.phone,
      gender: form.gender,
      date_of_birth: form.date_of_birth || null,
    }).eq('id', user.id);
    setSaving(false);
    if (error) {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: '✅ تم الحفظ', description: 'تم تحديث بياناتك بنجاح' });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center justify-between">
          <h1 className="font-cairo text-2xl font-bold text-foreground">الملف الشخصي</h1>
          <Button className="font-cairo gap-2" onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4" /> {saving ? 'جارٍ الحفظ...' : 'حفظ التغييرات'}
          </Button>
        </div>

        {/* Photo */}
        <Card className="shadow-card">
          <CardHeader><CardTitle className="font-cairo">الصورة الشخصية</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="font-cairo text-3xl font-bold text-primary">
                    {(form.full_name || form.full_name_ar || 'م').charAt(0)}
                  </span>
                </div>
                <button className="absolute bottom-0 left-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                  <Camera className="h-4 w-4" />
                </button>
              </div>
              <div>
                <Button variant="outline" className="font-cairo gap-2"><Upload className="h-4 w-4" /> رفع صورة</Button>
                <p className="font-cairo text-xs text-muted-foreground mt-2">JPG أو PNG، حد أقصى 5 ميجابايت</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Basic Info — shared for all roles */}
        <Card className="shadow-card">
          <CardHeader><CardTitle className="font-cairo">المعلومات الأساسية</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="font-cairo">الاسم بالعربية</Label>
                <Input value={form.full_name_ar} onChange={e => setForm(p => ({ ...p, full_name_ar: e.target.value }))} className="font-cairo mt-1" />
              </div>
              <div>
                <Label className="font-cairo">الاسم بالإنجليزية</Label>
                <Input value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} className="mt-1" dir="ltr" />
              </div>
              <div>
                <Label className="font-cairo">رقم الهاتف</Label>
                <Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className="font-cairo mt-1" />
              </div>
              <div>
                <Label className="font-cairo">النوع</Label>
                <div className="flex items-center gap-6 mt-2">
                  <label className="flex items-center gap-2 font-cairo text-sm cursor-pointer">
                    <input type="radio" name="gender" checked={form.gender === 'male'} onChange={() => setForm(p => ({ ...p, gender: 'male' }))} className="accent-primary" />
                    ذكر
                  </label>
                  <label className="flex items-center gap-2 font-cairo text-sm cursor-pointer">
                    <input type="radio" name="gender" checked={form.gender === 'female'} onChange={() => setForm(p => ({ ...p, gender: 'female' }))} className="accent-primary" />
                    أنثى
                  </label>
                </div>
              </div>
              <div>
                <Label className="font-cairo">تاريخ الميلاد</Label>
                <Input type="date" value={form.date_of_birth} onChange={e => setForm(p => ({ ...p, date_of_birth: e.target.value }))} className="font-cairo mt-1" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Doctor-only sections */}
        {isDoctor && <DoctorProfileSections />}
      </div>
    </DashboardLayout>
  );
};

/** Doctor-specific profile sections — only rendered for doctors */
const DoctorProfileSections = () => {
  return (
    <>
      {/* Languages */}
      <Card className="shadow-card">
        <CardHeader><CardTitle className="font-cairo">اللغات</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {['العربية', 'English'].map(l => (
            <Badge key={l} variant="secondary" className="font-cairo">{l}</Badge>
          ))}
          <Button variant="ghost" size="sm" className="font-cairo text-xs">+ إضافة</Button>
        </CardContent>
      </Card>

      <Card className="shadow-card bg-muted/30">
        <CardContent className="py-6 text-center">
          <p className="font-cairo text-sm text-muted-foreground">
            لإعداد فترات العمل وساعات الدوام والأسعار والحالات المجانية، انتقل إلى{' '}
            <a href="/dashboard/settings" className="text-primary font-bold hover:underline">صفحة الإعدادات</a>
          </p>
        </CardContent>
      </Card>
    </>
  );
};

export default DashboardProfile;
