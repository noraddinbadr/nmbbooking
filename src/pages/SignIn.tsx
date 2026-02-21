import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const SignIn = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast({ title: 'خطأ', description: 'يرجى ملء جميع الحقول', variant: 'destructive' });
      return;
    }
    setLoading(true);
    setTimeout(() => {
      toast({ title: '✅ تم تسجيل الدخول بنجاح', description: 'مرحباً بعودتك!' });
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Navbar />
      <div className="flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="rounded-t-2xl bg-hero-gradient px-6 py-4 text-center">
            <h1 className="font-cairo text-xl font-bold text-primary-foreground">دخول</h1>
          </div>

          {/* Form Card */}
          <div className="rounded-b-2xl border border-t-0 border-border bg-card p-6 shadow-card">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block font-cairo text-sm font-medium text-foreground">
                  الموبايل او البريد الالكتروني <span className="text-destructive">*</span>
                </label>
                <Input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="font-cairo"
                  maxLength={255}
                />
              </div>

              <div>
                <label className="mb-1.5 block font-cairo text-sm font-medium text-foreground">
                  كلمة المرور <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-3 pl-10 font-cairo"
                    maxLength={128}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-hero-gradient font-cairo text-base text-primary-foreground hover:opacity-90"
                size="lg"
              >
                {loading ? 'جارٍ الدخول...' : 'دخول'}
              </Button>

              <div className="flex items-center justify-between">
                <Link to="/forgot-password" className="font-cairo text-sm text-primary hover:underline">
                  نسيت كلمة المرور؟
                </Link>
                <div className="flex items-center gap-2">
                  <label className="font-cairo text-sm text-muted-foreground cursor-pointer">تذكرني</label>
                  <Checkbox checked={remember} onCheckedChange={(v) => setRemember(!!v)} />
                </div>
              </div>
            </form>

            {/* Divider */}
            <div className="my-6 flex items-center gap-3">
              <div className="flex-1 border-t border-border" />
              <span className="rounded-full bg-muted px-3 py-1 font-cairo text-xs text-muted-foreground">او</span>
              <div className="flex-1 border-t border-border" />
            </div>

            {/* Social login placeholder */}
            <Button variant="outline" className="w-full gap-2 font-cairo" disabled>
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/></svg>
              فعّل حسابك مع فيسبوك
            </Button>

            <div className="mt-6 border-t border-border pt-4 text-center">
              <p className="font-cairo text-sm text-muted-foreground">
                مستخدم جديد ؟{' '}
                <Link to="/sign-up" className="font-semibold text-primary hover:underline">
                  انضم الآن
                </Link>
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
