import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Stethoscope, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { cn } from '@/lib/utils';

type AccountType = 'patient' | 'doctor';

const SignUp = () => {
  const navigate = useNavigate();
  const [accountType, setAccountType] = useState<AccountType>('patient');
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    gender: '' as 'male' | 'female' | '',
    birthDate: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim() || !form.email.trim() || !form.password.trim()) {
      toast({ title: 'خطأ', description: 'يرجى ملء جميع الحقول المطلوبة', variant: 'destructive' });
      return;
    }
    if (form.password.length < 6) {
      toast({ title: 'خطأ', description: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل', variant: 'destructive' });
      return;
    }
    setLoading(true);
    const { data: signUpData, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          full_name: form.name,
          phone: form.phone,
          gender: form.gender,
          date_of_birth: form.birthDate,
          account_type: accountType,
        },
      },
    });
    
    // If doctor, add doctor role (trigger already adds patient)
    if (!error && signUpData.user && accountType === 'doctor') {
      await supabase.from('user_roles').insert({ user_id: signUpData.user.id, role: 'doctor' as const });
    }

    setLoading(false);
    if (error) {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: '✅ تم التسجيل بنجاح', description: 'تحقق من بريدك الإلكتروني لتأكيد الحساب' });
      navigate('/sign-in');
    }
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Navbar />
      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="rounded-t-2xl bg-hero-gradient px-6 py-4 text-center">
            <h1 className="font-cairo text-xl font-bold text-primary-foreground">انضم الآن</h1>
          </div>
          <div className="rounded-b-2xl border border-t-0 border-border bg-card p-6 shadow-card">
            {/* Account type selector */}
            <div className="mb-5">
              <label className="mb-2 block font-cairo text-sm font-medium text-foreground">نوع الحساب <span className="text-destructive">*</span></label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setAccountType('patient')}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all font-cairo text-sm",
                    accountType === 'patient'
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/50"
                  )}
                >
                  <User className="h-6 w-6" />
                  <span className="font-semibold">مريض</span>
                  <span className="text-[11px] text-muted-foreground">ابحث واحجز مواعيد طبية</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAccountType('doctor')}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all font-cairo text-sm",
                    accountType === 'doctor'
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/50"
                  )}
                >
                  <Stethoscope className="h-6 w-6" />
                  <span className="font-semibold">طبيب</span>
                  <span className="text-[11px] text-muted-foreground">أدر عيادتك واستقبل حجوزات</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block font-cairo text-sm font-medium text-foreground">الاسم <span className="text-destructive">*</span></label>
                <Input placeholder="الإسم بالكامل" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="font-cairo text-right" maxLength={100} />
              </div>
              <div>
                <label className="mb-1.5 block font-cairo text-sm font-medium text-foreground">رقم الموبايل <span className="text-destructive">*</span></label>
                <div className="flex items-center gap-2">
                  <Input type="tel" placeholder="رقم الموبايل" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="font-cairo text-right flex-1" maxLength={15} />
                  <span className="shrink-0 rounded-lg bg-muted px-3 py-2 font-cairo text-sm text-muted-foreground">🇾🇪 +967</span>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block font-cairo text-sm font-medium text-foreground">البريد الالكتروني <span className="text-destructive">*</span></label>
                <Input type="email" placeholder="example@domain.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="text-left" dir="ltr" maxLength={255} />
              </div>
              <div>
                <label className="mb-1.5 block font-cairo text-sm font-medium text-foreground">النوع <span className="text-destructive">*</span></label>
                <div className="flex items-center justify-center gap-8">
                  <label className="flex cursor-pointer items-center gap-2 font-cairo text-sm">
                    <input type="radio" name="gender" checked={form.gender === 'female'} onChange={() => setForm({ ...form, gender: 'female' })} className="h-4 w-4 accent-primary" />
                    انثى
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 font-cairo text-sm">
                    <input type="radio" name="gender" checked={form.gender === 'male'} onChange={() => setForm({ ...form, gender: 'male' })} className="h-4 w-4 accent-primary" />
                    ذكر
                  </label>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block font-cairo text-sm font-medium text-foreground">تاريخ الميلاد</label>
                <Input type="date" value={form.birthDate} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} className="font-cairo" />
              </div>
              <div>
                <label className="mb-1.5 block font-cairo text-sm font-medium text-foreground">كلمة المرور <span className="text-destructive">*</span></label>
                <div className="relative">
                  <Input type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="pr-3 pl-10 font-cairo" maxLength={128} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <p className="text-center font-cairo text-xs text-muted-foreground">
                بقيامك بالتسجيل، فأنت توافق على <span className="text-primary cursor-pointer hover:underline">الشروط و القوانين</span>
              </p>
              <Button type="submit" disabled={loading} className="w-full bg-hero-gradient font-cairo text-base text-primary-foreground hover:opacity-90" size="lg">
                {loading ? 'جارٍ التسجيل...' : accountType === 'doctor' ? 'سجل كطبيب' : 'اشترك الآن'}
              </Button>
            </form>
            <div className="mt-6 border-t border-border pt-4 text-center">
              <p className="font-cairo text-sm text-muted-foreground">
                مسجل بالفعل؟ <Link to="/sign-in" className="font-semibold text-primary hover:underline">دخول</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default SignUp;
