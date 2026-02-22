import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Camera, Upload, Save, MapPin, Phone, Globe, Clock } from 'lucide-react';

const DAYS = [
  { key: 'sat', label: 'السبت' },
  { key: 'sun', label: 'الأحد' },
  { key: 'mon', label: 'الاثنين' },
  { key: 'tue', label: 'الثلاثاء' },
  { key: 'wed', label: 'الأربعاء' },
  { key: 'thu', label: 'الخميس' },
  { key: 'fri', label: 'الجمعة' },
];

const DashboardProfile = () => {
  const [workDays, setWorkDays] = useState(['sat', 'sun', 'mon', 'tue', 'wed']);

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center justify-between">
          <h1 className="font-cairo text-2xl font-bold text-foreground">الملف الشخصي</h1>
          <Button className="font-cairo gap-2"><Save className="h-4 w-4" /> حفظ التغييرات</Button>
        </div>

        {/* Photo */}
        <Card className="shadow-card">
          <CardHeader><CardTitle className="font-cairo">الصورة الشخصية</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="font-cairo text-3xl font-bold text-primary">أ</span>
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
              <div><Label className="font-cairo">الاسم بالعربية</Label><Input defaultValue="د. أحمد محمد العليمي" className="font-cairo mt-1" /></div>
              <div><Label className="font-cairo">الاسم بالإنجليزية</Label><Input defaultValue="Dr. Ahmed Al-Alimi" className="mt-1" dir="ltr" /></div>
              <div><Label className="font-cairo">التخصص</Label><Input defaultValue="قلب وأوعية دموية" className="font-cairo mt-1" readOnly /></div>
              <div><Label className="font-cairo">سنوات الخبرة</Label><Input type="number" defaultValue={15} className="mt-1" /></div>
            </div>
            <div>
              <Label className="font-cairo">نبذة مهنية</Label>
              <Textarea defaultValue="استشاري أمراض القلب والأوعية الدموية، حاصل على البورد العربي في أمراض القلب. خبرة 15 عاماً في تشخيص وعلاج أمراض القلب." className="font-cairo mt-1" rows={3} />
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card className="shadow-card">
          <CardHeader><CardTitle className="font-cairo">التواصل والعنوان</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /><Input defaultValue="777123456" className="font-cairo" placeholder="رقم الهاتف" /></div>
              <div className="flex items-center gap-2"><Globe className="h-4 w-4 text-muted-foreground" /><Input defaultValue="777123456" className="font-cairo" placeholder="واتساب" /></div>
              <div className="flex items-center gap-2 md:col-span-2"><MapPin className="h-4 w-4 text-muted-foreground" /><Input defaultValue="شارع الزبيري، صنعاء" className="font-cairo" placeholder="عنوان العيادة" /></div>
            </div>
          </CardContent>
        </Card>

        {/* Working Hours */}
        <Card className="shadow-card">
          <CardHeader><CardTitle className="font-cairo flex items-center gap-2"><Clock className="h-5 w-5" /> ساعات العمل</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {DAYS.map(day => {
                const isActive = workDays.includes(day.key);
                return (
                  <div key={day.key} className="flex items-center gap-4">
                    <Switch checked={isActive} onCheckedChange={checked => {
                      setWorkDays(prev => checked ? [...prev, day.key] : prev.filter(d => d !== day.key));
                    }} />
                    <span className={`font-cairo text-sm w-20 ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>{day.label}</span>
                    {isActive && (
                      <div className="flex items-center gap-2" dir="ltr">
                        <Input type="time" defaultValue="09:00" className="w-28 text-sm" />
                        <span className="text-muted-foreground">→</span>
                        <Input type="time" defaultValue="21:00" className="w-28 text-sm" />
                      </div>
                    )}
                    {!isActive && <span className="font-cairo text-xs text-muted-foreground">عطلة</span>}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Services & Pricing */}
        <Card className="shadow-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="font-cairo">الخدمات والأسعار</CardTitle>
              <Button variant="outline" size="sm" className="font-cairo">+ إضافة خدمة</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: 'كشف عيادة', duration: 30, price: 5000 },
                { name: 'استشارة فيديو', duration: 20, price: 4000 },
                { name: 'تخطيط قلب', duration: 15, price: 3000 },
                { name: 'إيكو قلب', duration: 30, price: 8000 },
              ].map((s, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 font-cairo text-sm">
                  <span className="font-medium">{s.name}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-muted-foreground">{s.duration} دقيقة</span>
                    <span className="font-bold text-primary">{s.price.toLocaleString()} ر.ي</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Languages & Insurance */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="shadow-card">
            <CardHeader><CardTitle className="font-cairo">اللغات</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {['العربية', 'English'].map(l => (
                <Badge key={l} variant="secondary" className="font-cairo">{l}</Badge>
              ))}
              <Button variant="ghost" size="sm" className="font-cairo text-xs">+ إضافة</Button>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardHeader><CardTitle className="font-cairo">شركات التأمين</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {['التأمين الوطني', 'يمن للتأمين'].map(i => (
                <Badge key={i} variant="secondary" className="font-cairo">{i}</Badge>
              ))}
              <Button variant="ghost" size="sm" className="font-cairo text-xs">+ إضافة</Button>
            </CardContent>
          </Card>
        </div>

        {/* Certificates */}
        <Card className="shadow-card">
          <CardHeader><CardTitle className="font-cairo">الشهادات والتراخيص</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2 mb-4">
              {['بورد عربي - أمراض القلب', 'ماجستير طب القلب - جامعة صنعاء'].map((c, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 font-cairo text-sm">
                  <span>{c}</span>
                  <Badge variant="secondary" className="font-cairo text-xs">موثق ✓</Badge>
                </div>
              ))}
            </div>
            <Button variant="outline" className="font-cairo gap-2"><Upload className="h-4 w-4" /> رفع شهادة جديدة</Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default DashboardProfile;
