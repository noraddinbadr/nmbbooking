import Navbar from '@/components/Navbar';
import HeroSearch from '@/components/HeroSearch';
import SpecialtyGrid from '@/components/SpecialtyGrid';
import FeaturedDoctors from '@/components/FeaturedDoctors';
import Footer from '@/components/Footer';

const Index = () => {
  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Navbar />
      <HeroSearch />
      <SpecialtyGrid />
      <FeaturedDoctors />

      {/* How it works */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="mb-10 text-center">
            <h2 className="font-cairo text-3xl font-bold text-foreground">كيف يعمل صحتك؟</h2>
            <p className="mt-2 font-cairo text-muted-foreground">احجز موعدك في 3 خطوات بسيطة</p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              { step: '١', title: 'ابحث عن طبيبك', desc: 'اختر التخصص والمدينة وتصفح الأطباء المتاحين', icon: '🔍' },
              { step: '٢', title: 'اختر الموعد', desc: 'حدد الوقت المناسب لك من المواعيد المتاحة', icon: '📅' },
              { step: '٣', title: 'احجز وأكّد', desc: 'أكمل الحجز واحصل على تأكيد فوري', icon: '✅' },
            ].map((item) => (
              <div key={item.step} className="text-center rounded-2xl border border-border bg-card p-8 shadow-card">
                <span className="text-4xl mb-4 block">{item.icon}</span>
                <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-cairo text-lg font-bold text-primary">
                  {item.step}
                </div>
                <h3 className="font-cairo text-lg font-bold text-foreground">{item.title}</h3>
                <p className="mt-2 font-cairo text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
