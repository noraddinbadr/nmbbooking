import { Phone, Mail, MapPin, Heart } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="border-t border-border bg-card py-12">
      <div className="container mx-auto px-4" dir="rtl">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-hero-gradient text-lg font-bold text-primary-foreground">
                ص
              </div>
              <span className="font-cairo text-xl font-bold text-foreground">صحتك</span>
            </div>
            <p className="font-cairo text-sm text-muted-foreground leading-relaxed">
              منصة حجز المواعيد الطبية الأولى في اليمن. نربط المرضى بأفضل الأطباء بسهولة وأمان.
            </p>
          </div>
          <div>
            <h3 className="font-cairo text-sm font-bold text-foreground mb-4">روابط سريعة</h3>
            <ul className="space-y-2 font-cairo text-sm text-muted-foreground">
              <li><a href="/doctors" className="hover:text-primary transition-colors">الأطباء</a></li>
              <li><a href="/doctors" className="hover:text-primary transition-colors">التخصصات</a></li>
              <li><a href="/my-bookings" className="hover:text-primary transition-colors">حجوزاتي</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-cairo text-sm font-bold text-foreground mb-4">خدماتنا</h3>
            <ul className="space-y-2 font-cairo text-sm text-muted-foreground">
              <li>حجز عيادات</li>
              <li>استشارات فيديو</li>
              <li>زيارات منزلية</li>
              <li>تحاليل طبية</li>
            </ul>
          </div>
          <div>
            <h3 className="font-cairo text-sm font-bold text-foreground mb-4">تواصل معنا</h3>
            <ul className="space-y-3 font-cairo text-sm text-muted-foreground">
              <li className="flex items-center gap-2"><Phone className="h-4 w-4" /> 777-000-000</li>
              <li className="flex items-center gap-2"><Mail className="h-4 w-4" /> info@sehatak.ye</li>
              <li className="flex items-center gap-2"><MapPin className="h-4 w-4" /> صنعاء، اليمن</li>
            </ul>
          </div>
        </div>
        <div className="mt-10 border-t border-border pt-6 text-center">
          <p className="font-cairo text-sm text-muted-foreground flex items-center justify-center gap-1">
            صنع بـ <Heart className="h-4 w-4 text-destructive fill-destructive" /> لصحة اليمن
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
