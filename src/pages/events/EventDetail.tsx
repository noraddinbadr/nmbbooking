import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SchedulePicker from '@/components/events/SchedulePicker';
import RegisterModal from '@/components/events/RegisterModal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { mockCamps, mockSchedules, mockCases, mockRegistrations, serviceLabels, statusLabels } from '@/data/eventsMockData';
import type { EventSchedule } from '@/data/eventsTypes';
import { MapPin, Calendar, Users, Heart, ArrowRight, Share2 } from 'lucide-react';
import DonateModal from '@/components/events/DonateModal';

const EventDetail = () => {
  const { id } = useParams<{ id: string }>();
  const camp = mockCamps.find(c => c.id === id);
  const schedules = mockSchedules.filter(s => s.campId === id);
  const cases = mockCases.filter(c => mockRegistrations.some(r => r.campId === id && r.id === c.registrationId));

  const [selectedSchedule, setSelectedSchedule] = useState<EventSchedule | null>(null);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [donateCase, setDonateCase] = useState<typeof cases[0] | null>(null);

  if (!camp) {
    return (
      <div className="min-h-screen bg-background" dir="rtl">
        <Navbar />
        <div className="container py-20 text-center">
          <p className="font-cairo text-muted-foreground text-lg">الحدث غير موجود</p>
          <Link to="/events" className="text-primary font-cairo text-sm mt-4 inline-block">← العودة للأحداث</Link>
        </div>
      </div>
    );
  }

  const fundPercent = camp.targetFund > 0 ? Math.round((camp.raisedFund / camp.targetFund) * 100) : 0;
  const totalSlots = schedules.reduce((acc, s) => acc + s.totalSlots, 0);
  const availableSlots = schedules.reduce((acc, s) => acc + s.availableSlots, 0);
  const slotsPercent = totalSlots > 0 ? Math.round(((totalSlots - availableSlots) / totalSlots) * 100) : 0;

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Navbar />

      {/* Header */}
      <section className="bg-hero-gradient py-10 px-4">
        <div className="container max-w-4xl mx-auto">
          <Link to="/events" className="inline-flex items-center gap-1 text-primary-foreground/70 font-cairo text-sm mb-4 hover:text-primary-foreground transition-colors">
            <ArrowRight className="h-4 w-4" /> العودة للأحداث
          </Link>
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-primary-foreground/20 text-primary-foreground border-0">
                  {statusLabels[camp.status]}
                </Badge>
                {camp.isFree && (
                  <Badge className="bg-emerald-50 text-emerald-500 border-0">مجاني</Badge>
                )}
              </div>
              <h1 className="font-cairo font-bold text-2xl md:text-3xl text-primary-foreground mb-2">
                {camp.titleAr}
              </h1>
              <p className="font-cairo text-primary-foreground/80 text-sm max-w-xl">
                {camp.descriptionAr}
              </p>
              <div className="flex flex-wrap gap-4 mt-4 text-primary-foreground/80 text-sm font-cairo">
                <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{camp.locationName} — {camp.locationCity}</span>
                <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{camp.startDate} → {camp.endDate}</span>
                <span className="flex items-center gap-1"><Users className="h-4 w-4" />{camp.totalCapacity} مريض</span>
              </div>
            </div>
            <Button variant="secondary" size="sm" className="font-cairo gap-1 shrink-0">
              <Share2 className="h-4 w-4" /> مشاركة
            </Button>
          </div>
        </div>
      </section>

      <section className="container max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4 space-y-2">
                  <p className="font-cairo text-xs text-muted-foreground">الأماكن</p>
                  <Progress value={slotsPercent} className="h-2" />
                  <p className="font-cairo text-sm">
                    <span className="font-bold text-foreground">{totalSlots - availableSlots}</span>
                    <span className="text-muted-foreground"> / {totalSlots} مسجل</span>
                  </p>
                </CardContent>
              </Card>
              {camp.targetFund > 0 && (
                <Card>
                  <CardContent className="p-4 space-y-2">
                    <p className="font-cairo text-xs text-muted-foreground">التمويل</p>
                    <Progress value={fundPercent} className="h-2" />
                    <p className="font-cairo text-sm">
                      <span className="font-bold text-primary">{camp.raisedFund.toLocaleString()}</span>
                      <span className="text-muted-foreground"> / {camp.targetFund.toLocaleString()} ر.ي</span>
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Schedule picker */}
            <Card>
              <CardContent className="p-4">
                <h2 className="font-cairo font-bold text-base mb-4">اختر الموعد</h2>
                <SchedulePicker
                  schedules={schedules}
                  selectedId={selectedSchedule?.id}
                  onSelect={(s) => {
                    setSelectedSchedule(s);
                    setRegisterOpen(true);
                  }}
                />
              </CardContent>
            </Card>

            {/* Services */}
            <Card>
              <CardContent className="p-4">
                <h2 className="font-cairo font-bold text-base mb-3">الخدمات المقدمة</h2>
                <div className="flex flex-wrap gap-2">
                  {camp.services.map(s => (
                    <Badge key={s} variant="outline" className="font-cairo">
                      {serviceLabels[s] || s}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Sponsors */}
            {camp.sponsors.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <h2 className="font-cairo font-bold text-base mb-3">الرعاة والشركاء</h2>
                  <div className="flex flex-wrap gap-3">
                    {camp.sponsors.map((s, i) => (
                      <div key={i} className="flex items-center gap-2 bg-secondary rounded-lg px-3 py-2">
                        <Heart className="h-4 w-4 text-accent" />
                        <span className="font-cairo text-sm font-medium text-foreground">{s.name}</span>
                        <Badge variant="secondary" className="text-[9px]">
                          {s.tier === 'gold' ? 'ذهبي' : s.tier === 'silver' ? 'فضي' : 'برونزي'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar: Cases needing sponsorship */}
          <div className="space-y-4">
            <h2 className="font-cairo font-bold text-base">حالات تحتاج دعمك</h2>
            {cases.length > 0 ? cases.map(c => (
              <Card key={c.id} className="overflow-hidden">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-muted-foreground">{c.caseCode}</span>
                    <Badge className={c.status === 'open' ? 'bg-destructive/10 text-destructive' : 'bg-amber-50 text-amber-500'} variant="secondary">
                      {statusLabels[c.status]}
                    </Badge>
                  </div>
                  <p className="font-cairo text-sm text-foreground">{c.diagnosisSummary}</p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-cairo">
                      <span className="text-muted-foreground">التكلفة</span>
                      <span className="text-foreground font-bold">{c.estimatedCost.toLocaleString()} ر.ي</span>
                    </div>
                    <Progress value={c.estimatedCost > 0 ? (c.fundedAmount / c.estimatedCost) * 100 : 0} className="h-1.5" />
                    <p className="text-[10px] text-muted-foreground font-cairo">
                      تم تمويل {c.fundedAmount.toLocaleString()} ر.ي
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full font-cairo gap-1"
                    onClick={() => setDonateCase(c)}
                  >
                    <Heart className="h-3 w-3" /> تبرع الآن
                  </Button>
                </CardContent>
              </Card>
            )) : (
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-muted-foreground font-cairo text-sm">لا توجد حالات حالياً</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </section>

      {/* Modals */}
      {selectedSchedule && (
        <RegisterModal
          open={registerOpen}
          onClose={() => { setRegisterOpen(false); setSelectedSchedule(null); }}
          camp={camp}
          schedule={selectedSchedule}
        />
      )}
      {donateCase && (
        <DonateModal
          open={!!donateCase}
          onClose={() => setDonateCase(null)}
          medicalCase={donateCase}
        />
      )}

      <Footer />
    </div>
  );
};

export default EventDetail;
