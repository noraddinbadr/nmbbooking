import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SchedulePicker from '@/components/events/SchedulePicker';
import RegisterModal from '@/components/events/RegisterModal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { serviceLabels, statusLabels } from '@/data/constants';
import type { EventSchedule, MedicalCamp, MedicalCase } from '@/data/eventsTypes';
import { MapPin, Calendar, Users, Heart, ArrowRight, Share2, Loader2 } from 'lucide-react';
import DonateModal from '@/components/events/DonateModal';
import { supabase } from '@/integrations/supabase/client';

const EventDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [camp, setCamp] = useState<MedicalCamp | null>(null);
  const [schedules, setSchedules] = useState<EventSchedule[]>([]);
  const [cases, setCases] = useState<MedicalCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSchedule, setSelectedSchedule] = useState<EventSchedule | null>(null);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [donateCase, setDonateCase] = useState<MedicalCase | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetch = async () => {
      const [campRes, schedRes, casesRes] = await Promise.all([
        supabase.from('medical_camps').select('*').eq('id', id).single(),
        supabase.from('event_schedules').select('*').eq('camp_id', id).order('schedule_date'),
        supabase.from('medical_cases').select('*').order('created_at', { ascending: false }),
      ]);

      if (campRes.data) {
        const c = campRes.data;
        setCamp({
          id: c.id, titleAr: c.title_ar, titleEn: c.title_en || '',
          descriptionAr: c.description_ar || '', descriptionEn: c.description_en || '',
          clinicId: c.clinic_id || '', organizerId: c.organizer_id,
          locationName: c.location_name || '', locationCity: c.location_city || '',
          status: c.status || 'draft', startDate: c.start_date || '', endDate: c.end_date || '',
          totalCapacity: c.total_capacity || 0, services: c.services || [],
          sponsors: (c.sponsors as any[]) || [], isFree: c.is_free ?? true,
          targetFund: c.target_fund || 0, raisedFund: c.raised_fund || 0, createdAt: c.created_at,
        });
      }

      setSchedules((schedRes.data || []).map((s: any): EventSchedule => ({
        id: s.id, campId: s.camp_id, scheduleDate: s.schedule_date,
        startTime: s.start_time, endTime: s.end_time, serviceType: s.service_type || '',
        totalSlots: s.total_slots || 0, availableSlots: s.available_slots || 0,
        locationNote: s.location_note || '',
      })));

      setCases((casesRes.data || []).map((mc: any): MedicalCase => ({
        id: mc.id, registrationId: mc.registration_id || '', caseCode: mc.case_code,
        diagnosisSummary: mc.diagnosis_summary || '', treatmentPlan: mc.treatment_plan || '',
        estimatedCost: mc.estimated_cost || 0, fundedAmount: mc.funded_amount || 0,
        status: mc.status || 'open', isAnonymous: mc.is_anonymous ?? true,
        patientAge: mc.patient_age, patientGender: mc.patient_gender || '',
        createdBy: mc.created_by, createdAt: mc.created_at,
      })));

      setLoading(false);
    };
    fetch();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background" dir="rtl">
        <Navbar />
        <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </div>
    );
  }

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
      <section className="bg-hero-gradient py-10 px-4">
        <div className="container max-w-4xl mx-auto">
          <Link to="/events" className="inline-flex items-center gap-1 text-primary-foreground/70 font-cairo text-sm mb-4 hover:text-primary-foreground transition-colors">
            <ArrowRight className="h-4 w-4" /> العودة للأحداث
          </Link>
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-primary-foreground/20 text-primary-foreground border-0">{statusLabels[camp.status]}</Badge>
                {camp.isFree && <Badge className="bg-emerald-50 text-emerald-500 border-0">مجاني</Badge>}
              </div>
              <h1 className="font-cairo font-bold text-2xl md:text-3xl text-primary-foreground mb-2">{camp.titleAr}</h1>
              <p className="font-cairo text-primary-foreground/80 text-sm max-w-xl">{camp.descriptionAr}</p>
              <div className="flex flex-wrap gap-4 mt-4 text-primary-foreground/80 text-sm font-cairo">
                <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{camp.locationName} — {camp.locationCity}</span>
                <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{camp.startDate} → {camp.endDate}</span>
                <span className="flex items-center gap-1"><Users className="h-4 w-4" />{camp.totalCapacity} مريض</span>
              </div>
            </div>
            <Button variant="secondary" size="sm" className="font-cairo gap-1 shrink-0"><Share2 className="h-4 w-4" /> مشاركة</Button>
          </div>
        </div>
      </section>

      <section className="container max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <Card><CardContent className="p-4 space-y-2">
                <p className="font-cairo text-xs text-muted-foreground">الأماكن</p>
                <Progress value={slotsPercent} className="h-2" />
                <p className="font-cairo text-sm"><span className="font-bold text-foreground">{totalSlots - availableSlots}</span><span className="text-muted-foreground"> / {totalSlots} مسجل</span></p>
              </CardContent></Card>
              {camp.targetFund > 0 && (
                <Card><CardContent className="p-4 space-y-2">
                  <p className="font-cairo text-xs text-muted-foreground">التمويل</p>
                  <Progress value={fundPercent} className="h-2" />
                  <p className="font-cairo text-sm"><span className="font-bold text-primary">{camp.raisedFund.toLocaleString()}</span><span className="text-muted-foreground"> / {camp.targetFund.toLocaleString()} ر.ي</span></p>
                </CardContent></Card>
              )}
            </div>

            <Card><CardContent className="p-4">
              <h2 className="font-cairo font-bold text-base mb-4">اختر الموعد</h2>
              <SchedulePicker schedules={schedules} selectedId={selectedSchedule?.id} onSelect={(s) => { setSelectedSchedule(s); setRegisterOpen(true); }} />
            </CardContent></Card>

            <Card><CardContent className="p-4">
              <h2 className="font-cairo font-bold text-base mb-3">الخدمات المقدمة</h2>
              <div className="flex flex-wrap gap-2">
                {camp.services.map(s => <Badge key={s} variant="outline" className="font-cairo">{serviceLabels[s] || s}</Badge>)}
              </div>
            </CardContent></Card>

            {camp.sponsors.length > 0 && (
              <Card><CardContent className="p-4">
                <h2 className="font-cairo font-bold text-base mb-3">الرعاة والشركاء</h2>
                <div className="flex flex-wrap gap-3">
                  {camp.sponsors.map((s: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 bg-secondary rounded-lg px-3 py-2">
                      <Heart className="h-4 w-4 text-accent" />
                      <span className="font-cairo text-sm font-medium text-foreground">{s.name}</span>
                      <Badge variant="secondary" className="text-[9px]">{s.tier === 'gold' ? 'ذهبي' : s.tier === 'silver' ? 'فضي' : 'برونزي'}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent></Card>
            )}
          </div>

          <div className="space-y-4">
            <h2 className="font-cairo font-bold text-base">حالات تحتاج دعمك</h2>
            {cases.length > 0 ? cases.map(c => (
              <Card key={c.id} className="overflow-hidden"><CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-muted-foreground">{c.caseCode}</span>
                  <Badge className={c.status === 'open' ? 'bg-destructive/10 text-destructive' : 'bg-amber-50 text-amber-500'} variant="secondary">{statusLabels[c.status]}</Badge>
                </div>
                <p className="font-cairo text-sm text-foreground">{c.diagnosisSummary}</p>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-cairo"><span className="text-muted-foreground">التكلفة</span><span className="text-foreground font-bold">{c.estimatedCost.toLocaleString()} ر.ي</span></div>
                  <Progress value={c.estimatedCost > 0 ? (c.fundedAmount / c.estimatedCost) * 100 : 0} className="h-1.5" />
                  <p className="text-[10px] text-muted-foreground font-cairo">تم تمويل {c.fundedAmount.toLocaleString()} ر.ي</p>
                </div>
                <Button variant="outline" size="sm" className="w-full font-cairo gap-1" onClick={() => setDonateCase(c)}>
                  <Heart className="h-3 w-3" /> تبرع الآن
                </Button>
              </CardContent></Card>
            )) : (
              <Card><CardContent className="p-4 text-center"><p className="text-muted-foreground font-cairo text-sm">لا توجد حالات حالياً</p></CardContent></Card>
            )}
          </div>
        </div>
      </section>

      {selectedSchedule && <RegisterModal open={registerOpen} onClose={() => { setRegisterOpen(false); setSelectedSchedule(null); }} camp={camp} schedule={selectedSchedule} />}
      {donateCase && <DonateModal open={!!donateCase} onClose={() => setDonateCase(null)} medicalCase={donateCase} />}
      <Footer />
    </div>
  );
};

export default EventDetail;
