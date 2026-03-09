import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Camera, Upload, Save, Plus, X, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface DoctorData {
  id: string;
  name_ar: string;
  name_en: string | null;
  specialty: string | null;
  specialty_ar: string | null;
  about_ar: string | null;
  about_en: string | null;
  languages: string[];
  education: string[];
  years_experience: number | null;
}

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
    // Update profile
    const { error } = await supabase.from('profiles').update({
      full_name: form.full_name,
      full_name_ar: form.full_name_ar,
      phone: form.phone,
      gender: form.gender,
      date_of_birth: form.date_of_birth || null,
    }).eq('id', user.id);

    // Sync name to doctors table if doctor
    if (!error) {
      await supabase.from('doctors').update({
        name_ar: form.full_name_ar || form.full_name || '',
        name_en: form.full_name || null,
      }).eq('user_id', user.id);
    }

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

        {/* Basic Info */}
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

/** Doctor-specific profile sections */
const DoctorProfileSections = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [doctor, setDoctor] = useState<DoctorData | null>(null);
  const [newLang, setNewLang] = useState('');
  const [newEdu, setNewEdu] = useState('');

  const loadDoctor = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('doctors')
      .select('id, name_ar, name_en, specialty, specialty_ar, about_ar, about_en, languages, education, years_experience')
      .eq('user_id', user.id)
      .maybeSingle();
    if (data) {
      setDoctor({
        ...data,
        languages: data.languages || [],
        education: data.education || [],
      });
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { loadDoctor(); }, [loadDoctor]);

  const handleSaveDoctor = async () => {
    if (!doctor) return;
    setSaving(true);
    const { error } = await supabase.from('doctors').update({
      name_ar: doctor.name_ar,
      name_en: doctor.name_en,
      specialty: doctor.specialty,
      specialty_ar: doctor.specialty_ar,
      about_ar: doctor.about_ar,
      about_en: doctor.about_en,
      languages: doctor.languages,
      education: doctor.education,
      years_experience: doctor.years_experience,
    }).eq('id', doctor.id);
    setSaving(false);
    if (error) {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: '✅ تم الحفظ', description: 'تم تحديث البيانات المهنية' });
    }
  };

  const addLanguage = () => {
    if (!newLang.trim() || !doctor) return;
    setDoctor({ ...doctor, languages: [...doctor.languages, newLang.trim()] });
    setNewLang('');
  };

  const removeLanguage = (idx: number) => {
    if (!doctor) return;
    setDoctor({ ...doctor, languages: doctor.languages.filter((_, i) => i !== idx) });
  };

  const addEducation = () => {
    if (!newEdu.trim() || !doctor) return;
    setDoctor({ ...doctor, education: [...doctor.education, newEdu.trim()] });
    setNewEdu('');
  };

  const removeEducation = (idx: number) => {
    if (!doctor) return;
    setDoctor({ ...doctor, education: doctor.education.filter((_, i) => i !== idx) });
  };

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  if (!doctor) {
    return (
      <Card className="shadow-card bg-muted/30">
        <CardContent className="py-6 text-center">
          <p className="font-cairo text-sm text-muted-foreground">لم يتم العثور على سجل الطبيب</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Professional Info */}
      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-cairo">المعلومات المهنية</CardTitle>
            <Button size="sm" className="font-cairo gap-2" onClick={handleSaveDoctor} disabled={saving}>
              <Save className="h-3.5 w-3.5" /> {saving ? 'جارٍ الحفظ...' : 'حفظ المهني'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="font-cairo">التخصص بالعربية</Label>
              <Input value={doctor.specialty_ar || ''} onChange={e => setDoctor({ ...doctor, specialty_ar: e.target.value })} className="font-cairo mt-1" />
            </div>
            <div>
              <Label className="font-cairo">التخصص بالإنجليزية</Label>
              <Input value={doctor.specialty || ''} onChange={e => setDoctor({ ...doctor, specialty: e.target.value })} className="mt-1" dir="ltr" />
            </div>
            <div>
              <Label className="font-cairo">سنوات الخبرة</Label>
              <Input type="number" value={doctor.years_experience || ''} onChange={e => setDoctor({ ...doctor, years_experience: parseInt(e.target.value) || null })} className="font-cairo mt-1" dir="ltr" />
            </div>
          </div>

          <div>
            <Label className="font-cairo">نبذة بالعربية</Label>
            <Textarea value={doctor.about_ar || ''} onChange={e => setDoctor({ ...doctor, about_ar: e.target.value })} className="font-cairo mt-1" rows={3} />
          </div>
          <div>
            <Label className="font-cairo">نبذة بالإنجليزية</Label>
            <Textarea value={doctor.about_en || ''} onChange={e => setDoctor({ ...doctor, about_en: e.target.value })} className="mt-1" dir="ltr" rows={3} />
          </div>
        </CardContent>
      </Card>

      {/* Languages */}
      <Card className="shadow-card">
        <CardHeader><CardTitle className="font-cairo">اللغات</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {doctor.languages.map((l, i) => (
              <Badge key={i} variant="secondary" className="font-cairo gap-1.5 pr-1">
                {l}
                <button onClick={() => removeLanguage(i)} className="ml-1 hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="أضف لغة..."
              value={newLang}
              onChange={e => setNewLang(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addLanguage())}
              className="font-cairo flex-1"
            />
            <Button variant="outline" size="sm" className="font-cairo gap-1" onClick={addLanguage}>
              <Plus className="h-3.5 w-3.5" /> إضافة
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Education */}
      <Card className="shadow-card">
        <CardHeader><CardTitle className="font-cairo">المؤهلات والشهادات</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            {doctor.education.map((e, i) => (
              <div key={i} className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
                <span className="font-cairo text-sm text-foreground flex-1">{e}</span>
                <button onClick={() => removeEducation(i)} className="text-muted-foreground hover:text-destructive">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="أضف مؤهل أو شهادة..."
              value={newEdu}
              onChange={e => setNewEdu(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addEducation())}
              className="font-cairo flex-1"
            />
            <Button variant="outline" size="sm" className="font-cairo gap-1" onClick={addEducation}>
              <Plus className="h-3.5 w-3.5" /> إضافة
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Link to settings */}
      <Card className="shadow-card bg-muted/30">
        <CardContent className="py-6 text-center">
          <p className="font-cairo text-sm text-muted-foreground">
            لإعداد فترات العمل والأسعار والحالات المجانية والموظفين، انتقل إلى{' '}
            <a href="/dashboard/settings" className="text-primary font-bold hover:underline">صفحة الإعدادات</a>
          </p>
        </CardContent>
      </Card>
    </>
  );
};

export default DashboardProfile;
