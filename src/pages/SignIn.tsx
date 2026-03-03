import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const SignIn = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast({ title: 'خطأ', description: 'يرجى ملء جميع الحقول', variant: 'destructive' });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: '✅ تم تسجيل الدخول بنجاح', description: 'مرحباً بعودتك!' });
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Navbar />
      <div className="flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          <div className="rounded-t-2xl bg-hero-gradient px-6 py-4 text-center">
            <h1 className="font-cairo text-xl font-bold text-primary-foreground">دخول</h1>
          </div>
          <div className="rounded-b-2xl border border-t-0 border-border bg-card p-6 shadow-card">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block font-cairo text-sm font-medium text-foreground">
                  البريد الالكتروني <span className="text-destructive">*</span>
                </label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="font-cairo" dir="ltr" maxLength={255} />
              </div>
              <div>
                <label className="mb-1.5 block font-cairo text-sm font-medium text-foreground">
                  كلمة المرور <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <Input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className="pr-3 pl-10 font-cairo" maxLength={128} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-hero-gradient font-cairo text-base text-primary-foreground hover:opacity-90" size="lg">
                {loading ? 'جارٍ الدخول...' : 'دخول'}
              </Button>
              <div className="flex items-center justify-between">
                <Link to="/forgot-password" className="font-cairo text-sm text-primary hover:underline">نسيت كلمة المرور؟</Link>
                <div className="flex items-center gap-2">
                  <label className="font-cairo text-sm text-muted-foreground cursor-pointer">تذكرني</label>
                  <Checkbox checked={remember} onCheckedChange={(v) => setRemember(!!v)} />
                </div>
              </div>
            </form>
            <div className="mt-6 border-t border-border pt-4 text-center">
              <p className="font-cairo text-sm text-muted-foreground">
                مستخدم جديد ؟{' '}
                <Link to="/sign-up" className="font-semibold text-primary hover:underline">انضم الآن</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default SignIn;
