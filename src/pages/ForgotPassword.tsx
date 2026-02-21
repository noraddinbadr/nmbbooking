import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast({ title: 'خطأ', description: 'يرجى إدخال البريد الالكتروني', variant: 'destructive' });
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setSent(true);
      toast({ title: '✅ تم الإرسال', description: 'تحقق من بريدك الالكتروني لاستعادة كلمة المرور' });
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
            <h1 className="font-cairo text-xl font-bold text-primary-foreground">نسيت كلمة المرور؟</h1>
          </div>

          {/* Form Card */}
          <div className="rounded-b-2xl border border-t-0 border-border bg-card p-6 shadow-card">
            {sent ? (
              <div className="text-center space-y-4 py-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <span className="text-3xl">📧</span>
                </div>
                <p className="font-cairo text-sm text-muted-foreground">
                  تم إرسال رابط استعادة كلمة المرور إلى بريدك الالكتروني
                </p>
                <Link to="/sign-in">
                  <Button variant="outline" className="font-cairo">
                    العودة لتسجيل الدخول
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                <p className="mb-4 text-center font-cairo text-sm text-muted-foreground">
                  لا توجد مشكلة. سنساعدك في استعادتها.
                </p>
                <p className="mb-4 text-center font-cairo text-sm text-muted-foreground">
                  ادخل البريد الالكتروني لاسترجاع كلمة المرور الخاصة بك
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@domain.com"
                    className="text-left"
                    dir="ltr"
                    maxLength={255}
                  />

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-hero-gradient font-cairo text-base text-primary-foreground hover:opacity-90"
                    size="lg"
                  >
                    {loading ? 'جارٍ الإرسال...' : 'احصل على كلمة مرور جديدة'}
                  </Button>
                </form>

                <div className="mt-4 text-center">
                  <Link to="/sign-in" className="font-cairo text-sm text-primary hover:underline">
                    او العودة الى صفحة تسجيل الدخول
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ForgotPassword;
