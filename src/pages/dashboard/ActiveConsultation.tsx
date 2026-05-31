import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { User, Pill, TestTube, ScanLine, Syringe, Printer, Clock, Calendar, CheckCircle2, Loader2 } from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { MedicalFileUpload } from '@/components/medical/MedicalFileUpload';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { catalogLabTests, catalogImaging, catalogProcedures, imagingTypeLabels } from '@/data/serviceCatalog';
import {
  consultationsService,
  providerOrdersRepo,
  PatientHistoryPanel,
  ConsultationNotesCard,
  PrescriptionBuilder,
  CatalogPicker,
  type EndSessionInput,
} from '@/modules/consultations';
import type { MedicineLine } from '@/modules/consultations/components/PrescriptionBuilder';
import type { CatalogItem } from '@/modules/consultations/components/CatalogPicker';

interface PatientProfile {
  id: string;
  full_name_ar: string | null;
  full_name: string | null;
  phone: string | null;
  gender: string | null;
  date_of_birth: string | null;
}

interface BookingRecord {
  id: string;
  patient_id: string;
  doctor_id: string;
  booking_date: string;
  start_time: string | null;
  end_time: string | null;
  booking_type: string | null;
  status: string | null;
  notes: string | null;
  final_price: number | null;
  funding_amount: number | null;
  is_free_case: boolean | null;
}

const toCatalog = (arr: any[], extra?: (x: any) => Partial<CatalogItem>): CatalogItem[] =>
  arr.map((x) => ({
    id: x.id,
    nameAr: x.nameAr,
    nameEn: x.nameEn,
    defaultPrice: x.defaultPrice,
    category: x.category,
    tag: x.category,
    ...(extra ? extra(x) : {}),
  }));

const labItems = toCatalog(catalogLabTests);
const imagingItems = toCatalog(catalogImaging, (x) => ({ tag: imagingTypeLabels[x.type] || x.type }));
const procedureItems = toCatalog(catalogProcedures, (x) => ({
  hint: x.prepInstructions,
}));

const ActiveConsultation = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const consultationBookingId = searchParams.get('booking') || searchParams.get('appointment');
  const { user } = useAuth();

  const [booking, setBooking] = useState<BookingRecord | null>(null);
  const [patient, setPatient] = useState<PatientProfile | null>(null);
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(consultationBookingId));
  const [saving, setSaving] = useState(false);
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);

  const [pastSessions, setPastSessions] = useState<any[]>([]);
  const [pastPrescriptions, setPastPrescriptions] = useState<any[]>([]);
  const [pastOrders, setPastOrders] = useState<any[]>([]);
  const [totalVisits, setTotalVisits] = useState(0);

  const [notesState, setNotesState] = useState({ symptoms: '', examination: '', diagnosis: '', notes: '' });
  const [followUpDate, setFollowUpDate] = useState('');
  const [medicines, setMedicines] = useState<MedicineLine[]>([
    { name: '', dosage: '', frequency: '', duration: '', instructions: '' },
  ]);
  const [activeTab, setActiveTab] = useState('prescription');

  const [selectedLabs, setSelectedLabs] = useState<string[]>([]);
  const [selectedImaging, setSelectedImaging] = useState<string[]>([]);
  const [selectedProcedures, setSelectedProcedures] = useState<string[]>([]);
  const [selectedProvider, setSelectedProvider] = useState('');
  const [providers, setProviders] = useState<{ id: string; name_ar: string }[]>([]);

  useEffect(() => {
    if (!consultationBookingId || !user) {
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      try {
        const { data: doc } = await supabase.from('doctors').select('id').eq('user_id', user.id).maybeSingle();
        if (!doc) { setLoading(false); return; }
        setDoctorId(doc.id);

        const { data: bk } = await supabase.from('bookings').select('*').eq('id', consultationBookingId).maybeSingle();
        if (!bk) { setLoading(false); return; }
        setBooking(bk as BookingRecord);

        const { sessionId: sid, existing } = await consultationsService.openForBooking({
          bookingId: bk.id,
          patientId: bk.patient_id,
          doctorId: doc.id,
          sessionDate: bk.booking_date,
        });
        setSessionId(sid);
        if (existing) {
          setNotesState({
            symptoms: existing.symptoms || '',
            examination: existing.examination || '',
            diagnosis: existing.diagnosis || '',
            notes: existing.notes || '',
          });
          setFollowUpDate(existing.follow_up_date || '');
        }

        if (bk.status === 'pending') {
          await supabase.from('bookings').update({ status: 'confirmed' }).eq('id', bk.id);
        }

        const [profRes, provs, history] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', bk.patient_id).maybeSingle(),
          providerOrdersRepo.listActiveProviders(),
          consultationsService.loadHistory(bk.patient_id),
        ]);
        setPatient(profRes.data as PatientProfile);
        setProviders(provs);
        setPastSessions(history.pastSessions);
        setPastPrescriptions(history.pastPrescriptions);
        setPastOrders(history.pastOrders);
        setTotalVisits(history.totalVisits);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [consultationBookingId, user]);

  // Auto-save WIP every 30s
  useEffect(() => {
    if (!sessionId) return;
    const interval = setInterval(async () => {
      if (!notesState.symptoms && !notesState.examination && !notesState.diagnosis && !notesState.notes) return;
      try {
        await consultationsService.autoSave(sessionId, {
          symptoms: notesState.symptoms || null,
          examination: notesState.examination || null,
          diagnosis: notesState.diagnosis || null,
          notes: notesState.notes || null,
          followUpDate: followUpDate || null,
        });
        setLastAutoSave(new Date());
      } catch { /* ignore */ }
    }, 30000);
    return () => clearInterval(interval);
  }, [sessionId, notesState, followUpDate]);

  const patientName = patient?.full_name_ar || patient?.full_name || 'مريض';
  const patientAge = patient?.date_of_birth
    ? Math.floor((Date.now() - new Date(patient.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  const handleEndSession = async () => {
    if (!booking || !doctorId || !sessionId) return;
    setSaving(true);
    try {
      const payload: EndSessionInput = {
        sessionId,
        bookingId: booking.id,
        patientId: booking.patient_id,
        doctorId,
        symptoms: notesState.symptoms || null,
        examination: notesState.examination || null,
        diagnosis: notesState.diagnosis || null,
        notes: notesState.notes || null,
        followUpDate: followUpDate || null,
        medicines: medicines.map((m) => ({
          medicineName: m.name,
          dosage: m.dosage,
          frequency: m.frequency,
          duration: m.duration,
          instructions: m.instructions,
        })),
        providerId: selectedProvider || null,
        labs: selectedLabs.map((id) => catalogLabTests.find((t) => t.id === id)).filter(Boolean),
        imaging: selectedImaging.map((id) => catalogImaging.find((i) => i.id === id)).filter(Boolean),
        procedures: selectedProcedures.map((id) => catalogProcedures.find((p) => p.id === id)).filter(Boolean),
      };
      await consultationsService.endSession(payload);
      toast.success('تم حفظ الجلسة وإنهاؤها بنجاح');
      navigate('/dashboard/treatment');
    } catch (err: any) {
      toast.error('حدث خطأ: ' + (err?.message || 'غير معروف'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!booking || !patient) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="font-cairo text-muted-foreground">لم يتم العثور على الموعد</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4">
        {/* Top bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-primary/5 border border-primary/20 rounded-xl p-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-hero-gradient flex items-center justify-center">
              <User className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-cairo font-bold text-foreground">{patientName}</h2>
                {booking.is_free_case && <Badge className="font-cairo text-[10px] bg-emerald-500">مموّل</Badge>}
              </div>
              <p className="font-cairo text-xs text-muted-foreground">
                {patient.gender === 'male' ? 'ذكر' : patient.gender === 'female' ? 'أنثى' : ''}
                {patientAge && ` • ${patientAge} سنة`}
                {patient.phone && ` • 📞 ${patient.phone}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {lastAutoSave && (
              <span className="font-cairo text-[10px] text-muted-foreground">
                حفظ تلقائي: {lastAutoSave.toLocaleTimeString('ar')}
              </span>
            )}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border border-border">
              <Clock className="h-3.5 w-3.5 text-primary" />
              <span className="font-cairo text-sm font-medium text-foreground">{booking.start_time || '--:--'}</span>
            </div>
            <Button onClick={handleEndSession} disabled={saving} className="font-cairo gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              إنهاء الجلسة
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* RIGHT: history */}
          <div className="lg:col-span-1 space-y-3 order-2 lg:order-1">
            <PatientHistoryPanel
              totalVisits={totalVisits}
              pastSessions={pastSessions}
              pastPrescriptions={pastPrescriptions}
              pastOrders={pastOrders}
            />
            {booking && doctorId && (
              <MedicalFileUpload
                patientId={booking.patient_id}
                doctorId={doctorId}
                sessionId={sessionId || undefined}
                bookingId={booking.id}
              />
            )}
          </div>

          {/* CENTER/LEFT: workspace */}
          <div className="lg:col-span-2 space-y-3 order-1 lg:order-2">
            <ConsultationNotesCard
              symptoms={notesState.symptoms}
              examination={notesState.examination}
              diagnosis={notesState.diagnosis}
              notes={notesState.notes}
              onChange={(patch) => setNotesState((s) => ({ ...s, ...patch }))}
            />

            <Card className="shadow-card">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <div className="px-4 pt-3">
                  <TabsList className="font-cairo w-full grid grid-cols-4 h-9">
                    <TabsTrigger value="prescription" className="font-cairo text-xs gap-1">
                      <Pill className="h-3 w-3" /> وصفة
                    </TabsTrigger>
                    <TabsTrigger value="labs" className="font-cairo text-xs gap-1">
                      <TestTube className="h-3 w-3" /> تحاليل
                      {selectedLabs.length > 0 && <Badge className="font-cairo text-[9px] h-4 w-4 p-0 flex items-center justify-center mr-1">{selectedLabs.length}</Badge>}
                    </TabsTrigger>
                    <TabsTrigger value="imaging" className="font-cairo text-xs gap-1">
                      <ScanLine className="h-3 w-3" /> أشعة
                      {selectedImaging.length > 0 && <Badge className="font-cairo text-[9px] h-4 w-4 p-0 flex items-center justify-center mr-1">{selectedImaging.length}</Badge>}
                    </TabsTrigger>
                    <TabsTrigger value="procedures" className="font-cairo text-xs gap-1">
                      <Syringe className="h-3 w-3" /> إجراءات
                      {selectedProcedures.length > 0 && <Badge className="font-cairo text-[9px] h-4 w-4 p-0 flex items-center justify-center mr-1">{selectedProcedures.length}</Badge>}
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="prescription" className="px-4 pb-4">
                  <PrescriptionBuilder medicines={medicines} onChange={setMedicines} />
                </TabsContent>

                <TabsContent value="labs" className="px-4 pb-4">
                  <CatalogPicker items={labItems} selected={selectedLabs} onChange={setSelectedLabs} placeholder="ابحث عن تحليل..." />
                </TabsContent>

                <TabsContent value="imaging" className="px-4 pb-4">
                  <CatalogPicker items={imagingItems} selected={selectedImaging} onChange={setSelectedImaging} placeholder="ابحث عن أشعة..." />
                </TabsContent>

                <TabsContent value="procedures" className="px-4 pb-4">
                  <CatalogPicker items={procedureItems} selected={selectedProcedures} onChange={setSelectedProcedures} placeholder="ابحث عن إجراء..." />
                </TabsContent>
              </Tabs>
            </Card>

            <Card className="shadow-card">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  {providers.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Label className="font-cairo text-xs whitespace-nowrap">مزود الخدمة</Label>
                      <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                        <SelectTrigger className="font-cairo text-sm w-48"><SelectValue placeholder="اختر المزود" /></SelectTrigger>
                        <SelectContent>
                          {providers.map((p) => <SelectItem key={p.id} value={p.id} className="font-cairo">{p.name_ar}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="flex items-center gap-2 flex-1">
                    <Calendar className="h-4 w-4 text-primary shrink-0" />
                    <Label className="font-cairo text-xs whitespace-nowrap">موعد المتابعة</Label>
                    <Input type="date" className="text-sm flex-1" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="font-cairo text-xs gap-1"><Printer className="h-3 w-3" /> طباعة</Button>
                    <Button onClick={handleEndSession} disabled={saving} className="font-cairo gap-2 bg-emerald-600 hover:bg-emerald-700 text-white" size="sm">
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                      إنهاء وحفظ
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ActiveConsultation;
