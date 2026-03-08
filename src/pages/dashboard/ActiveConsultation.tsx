import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import {
  ArrowRight, User, FileText, Pill, TestTube, ScanLine, Syringe,
  Plus, Printer, Send, Clock, Phone, Calendar, X, CheckCircle2, History, Search, Loader2
} from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  catalogMedicines, catalogLabTests, catalogImaging, catalogProcedures,
  imagingTypeLabels,
} from '@/data/serviceCatalog';

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

const ActiveConsultation = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const consultationBookingId = searchParams.get('booking') || searchParams.get('appointment');
  const { user } = useAuth();

  const [booking, setBooking] = useState<BookingRecord | null>(null);
  const [patient, setPatient] = useState<PatientProfile | null>(null);
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(consultationBookingId));
  const [saving, setSaving] = useState(false);

  // Patient history
  const [pastSessions, setPastSessions] = useState<any[]>([]);
  const [pastPrescriptions, setPastPrescriptions] = useState<any[]>([]);
  const [pastOrders, setPastOrders] = useState<any[]>([]);
  const [totalVisits, setTotalVisits] = useState(0);

  // Consultation state
  const [symptoms, setSymptoms] = useState('');
  const [examination, setExamination] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [medicines, setMedicines] = useState([{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
  const [activeTab, setActiveTab] = useState('notes');

  // Multi-select for catalog items
  const [selectedLabs, setSelectedLabs] = useState<string[]>([]);
  const [selectedImaging, setSelectedImaging] = useState<string[]>([]);
  const [selectedProcedures, setSelectedProcedures] = useState<string[]>([]);
  const [labSearch, setLabSearch] = useState('');
  const [imagingSearch, setImagingSearch] = useState('');
  const [procedureSearch, setProcedureSearch] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('');
  const [providers, setProviders] = useState<{ id: string; name_ar: string }[]>([]);

  const toggleItem = (id: string, list: string[], setter: (v: string[]) => void) => {
    setter(list.includes(id) ? list.filter(x => x !== id) : [...list, id]);
  };

  const filteredLabs = useMemo(() =>
    catalogLabTests.filter(t => t.nameAr.includes(labSearch) || t.nameEn.toLowerCase().includes(labSearch.toLowerCase())), [labSearch]);
  const filteredImaging = useMemo(() =>
    catalogImaging.filter(i => i.nameAr.includes(imagingSearch) || i.nameEn.toLowerCase().includes(imagingSearch.toLowerCase())), [imagingSearch]);
  const filteredProcedures = useMemo(() =>
    catalogProcedures.filter(p => p.nameAr.includes(procedureSearch) || p.nameEn.toLowerCase().includes(procedureSearch.toLowerCase())), [procedureSearch]);

  const addMedicine = () => setMedicines(prev => [...prev, { name: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
  const removeMedicine = (idx: number) => setMedicines(prev => prev.filter((_, i) => i !== idx));

  // Load booking, patient, doctor, history
  useEffect(() => {
    if (!consultationBookingId || !user) {
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);

      // Get doctor record
      const { data: doc } = await supabase.from('doctors').select('id').eq('user_id', user.id).maybeSingle();
      if (doc) setDoctorId(doc.id);

      // Get booking
      const { data: bk } = await supabase.from('bookings').select('*').eq('id', consultationBookingId).maybeSingle();
      if (!bk) {
        setLoading(false);
        return;
      }
      setBooking(bk as BookingRecord);

      // Get patient profile
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', bk.patient_id).maybeSingle();
      setPatient(prof as PatientProfile);

      // Get providers
      const { data: provs } = await supabase.from('providers').select('id, name_ar').eq('is_active', true);
      setProviders(provs || []);

      // Get patient history
      const [sessRes, rxRes, ordRes, visitsRes] = await Promise.all([
        supabase.from('treatment_sessions').select('*').eq('patient_id', bk.patient_id).order('session_date', { ascending: false }).limit(10),
        supabase.from('prescriptions').select('*, prescription_items(*)').eq('patient_id', bk.patient_id).order('created_at', { ascending: false }).limit(10),
        supabase.from('provider_orders').select('*, providers(name_ar)').order('created_at', { ascending: false }).limit(50),
        supabase.from('bookings').select('id', { count: 'exact' }).eq('patient_id', bk.patient_id),
      ]);

      const patientOrders = (ordRes.data || []).filter((order: any) => order?.order_details?.patient_id === bk.patient_id);

      setPastSessions(sessRes.data || []);
      setPastPrescriptions(rxRes.data || []);
      setPastOrders(patientOrders);
      setTotalVisits(visitsRes.count || 0);
      setLoading(false);
    };

    load();
  }, [consultationBookingId, user]);

  const patientName = patient?.full_name_ar || patient?.full_name || 'مريض';
  const patientAge = patient?.date_of_birth
    ? Math.floor((Date.now() - new Date(patient.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  const handleEndSession = async () => {
    if (!booking || !doctorId) return;
    setSaving(true);
    try {
      // 1. Create treatment session
      const { data: session, error: sessErr } = await supabase.from('treatment_sessions').insert({
        booking_id: booking.id,
        patient_id: booking.patient_id,
        doctor_id: doctorId,
        session_date: booking.booking_date,
        symptoms: symptoms || null,
        examination: examination || null,
        diagnosis: diagnosis || null,
        notes: notes || null,
        follow_up_date: followUpDate || null,
        status: 'completed',
      }).select('id').single();

      if (sessErr) throw sessErr;

      // 2. Create prescription if medicines exist
      const validMeds = medicines.filter(m => m.name.trim());
      if (validMeds.length > 0 && session) {
        const { data: rx, error: rxErr } = await supabase.from('prescriptions').insert({
          session_id: session.id,
          patient_id: booking.patient_id,
          doctor_id: doctorId,
        }).select('id').single();

        if (!rxErr && rx) {
          await supabase.from('prescription_items').insert(
            validMeds.map(m => ({
              prescription_id: rx.id,
              medicine_name: m.name,
              dosage: m.dosage || null,
              frequency: m.frequency || null,
              duration: m.duration || null,
              instructions: m.instructions || null,
            }))
          );
        }
      }

      // 3. Create provider orders for labs/imaging/procedures
      if (selectedProvider && (selectedLabs.length > 0 || selectedImaging.length > 0 || selectedProcedures.length > 0)) {
        const orders: any[] = [];
        if (selectedLabs.length > 0) {
          const labNames = selectedLabs.map(id => catalogLabTests.find(t => t.id === id)?.nameAr).filter(Boolean);
          orders.push({
            provider_id: selectedProvider,
            order_type: 'lab',
            notes: `تحاليل: ${labNames.join('، ')}`,
            order_details: { items: selectedLabs.map(id => catalogLabTests.find(t => t.id === id)) },
          });
        }
        if (selectedImaging.length > 0) {
          const imgNames = selectedImaging.map(id => catalogImaging.find(i => i.id === id)?.nameAr).filter(Boolean);
          orders.push({
            provider_id: selectedProvider,
            order_type: 'imaging',
            notes: `أشعة: ${imgNames.join('، ')}`,
            order_details: { items: selectedImaging.map(id => catalogImaging.find(i => i.id === id)) },
          });
        }
        if (selectedProcedures.length > 0) {
          const procNames = selectedProcedures.map(id => catalogProcedures.find(p => p.id === id)?.nameAr).filter(Boolean);
          orders.push({
            provider_id: selectedProvider,
            order_type: 'procedure',
            notes: `إجراءات: ${procNames.join('، ')}`,
            order_details: { items: selectedProcedures.map(id => catalogProcedures.find(p => p.id === id)) },
          });
        }
        if (orders.length > 0) {
          await supabase.from('provider_orders').insert(orders);
        }
      }

      // 4. Update booking status to completed
      await supabase.from('bookings').update({ status: 'completed' }).eq('id', booking.id);

      toast.success('تم حفظ الجلسة وإنهاؤها بنجاح');
      navigate('/dashboard/treatment');
    } catch (err: any) {
      toast.error('حدث خطأ: ' + (err.message || 'غير معروف'));
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

        {/* Main workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* RIGHT: Patient history */}
          <div className="lg:col-span-1 space-y-3 order-2 lg:order-1">
            <Card className="shadow-card">
              <CardHeader className="pb-2 pt-3 px-3">
                <CardTitle className="font-cairo text-sm flex items-center gap-2">
                  <History className="h-4 w-4 text-primary" /> السجل الطبي
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3 space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto">
                <div className="flex items-center justify-between font-cairo text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
                  <span>إجمالي الزيارات</span>
                  <span className="font-bold text-foreground">{totalVisits}</span>
                </div>

                {pastSessions.length > 0 && (
                  <div>
                    <p className="font-cairo text-xs font-bold text-foreground mb-1.5">الجلسات السابقة</p>
                    {pastSessions.map(s => (
                      <div key={s.id} className="p-2 rounded-lg bg-muted/40 mb-1.5 font-cairo text-xs space-y-0.5">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{s.session_date}</span>
                          {s.diagnosis && <Badge variant="secondary" className="font-cairo text-[10px] h-5">{s.diagnosis}</Badge>}
                        </div>
                        {s.symptoms && <p className="text-muted-foreground">الأعراض: {s.symptoms}</p>}
                        {s.examination && <p className="text-muted-foreground">الفحص: {s.examination}</p>}
                        {s.notes && <p className="text-muted-foreground/70">📝 {s.notes}</p>}
                      </div>
                    ))}
                  </div>
                )}

                {pastPrescriptions.length > 0 && (
                  <div>
                    <p className="font-cairo text-xs font-bold text-foreground mb-1.5">الوصفات السابقة</p>
                    {pastPrescriptions.map(rx => (
                      <div key={rx.id} className="p-2 rounded-lg bg-muted/40 mb-1.5 font-cairo text-xs">
                        <p className="text-muted-foreground mb-1">{new Date(rx.created_at).toLocaleDateString('ar')}</p>
                        {rx.prescription_items?.map((m: any) => (
                          <p key={m.id} className="text-foreground">
                            <span className="text-primary font-medium">{m.medicine_name}</span>
                            {m.dosage && ` — ${m.dosage}`}
                            {m.frequency && ` — ${m.frequency}`}
                          </p>
                        ))}
                      </div>
                    ))}
                  </div>
                )}

                {pastOrders.length > 0 && (
                  <div>
                    <p className="font-cairo text-xs font-bold text-foreground mb-1.5">الطلبات السابقة</p>
                    {pastOrders.map(order => (
                      <div key={order.id} className="p-2 rounded-lg bg-muted/40 mb-1.5 font-cairo text-xs">
                        <div className="flex justify-between mb-1">
                          <span className="text-muted-foreground">{new Date(order.created_at).toLocaleDateString('ar')}</span>
                          <Badge className={`font-cairo text-[10px] h-5 ${
                            order.status === 'results_uploaded' || order.status === 'delivered' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
                          }`}>
                            {order.status === 'pending' ? 'معلّق' : order.status === 'results_uploaded' ? 'جاهز' : order.status}
                          </Badge>
                        </div>
                        <p>{order.order_type === 'lab' ? '🧪' : order.order_type === 'imaging' ? '📷' : '💉'} {order.notes}</p>
                      </div>
                    ))}
                  </div>
                )}

                {pastSessions.length === 0 && pastPrescriptions.length === 0 && pastOrders.length === 0 && (
                  <p className="font-cairo text-xs text-muted-foreground text-center py-4">لا يوجد سجل سابق — زيارة أولى</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* CENTER + LEFT: Consultation workspace */}
          <div className="lg:col-span-2 space-y-3 order-1 lg:order-2">
            {/* Diagnosis notes */}
            <Card className="shadow-card">
              <CardHeader className="pb-2 pt-3 px-4">
                <CardTitle className="font-cairo text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" /> التشخيص والملاحظات
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label className="font-cairo text-xs">الأعراض</Label>
                    <Textarea value={symptoms} onChange={e => setSymptoms(e.target.value)} className="font-cairo mt-1 text-sm min-h-[80px]" placeholder="ما يشتكي منه المريض..." />
                  </div>
                  <div>
                    <Label className="font-cairo text-xs">الفحص السريري</Label>
                    <Textarea value={examination} onChange={e => setExamination(e.target.value)} className="font-cairo mt-1 text-sm min-h-[80px]" placeholder="نتائج الفحص..." />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label className="font-cairo text-xs">التشخيص</Label>
                    <Input value={diagnosis} onChange={e => setDiagnosis(e.target.value)} className="font-cairo mt-1 text-sm" placeholder="التشخيص النهائي" />
                  </div>
                  <div>
                    <Label className="font-cairo text-xs">ملاحظات إضافية</Label>
                    <Input value={notes} onChange={e => setNotes(e.target.value)} className="font-cairo mt-1 text-sm" placeholder="ملاحظات..." />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions: Prescription / Labs / Imaging / Procedures */}
            <Card className="shadow-card">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <div className="px-4 pt-3">
                  <TabsList className="font-cairo w-full grid grid-cols-4 h-9">
                    <TabsTrigger value="prescription" className="font-cairo text-xs gap-1"><Pill className="h-3 w-3" /> وصفة</TabsTrigger>
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

                {/* Prescription builder */}
                <TabsContent value="prescription" className="px-4 pb-4">
                  <div className="space-y-2 mt-2">
                    {medicines.map((med, i) => (
                      <div key={i} className="p-3 rounded-lg bg-muted/40 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-cairo text-xs font-bold text-foreground">الدواء {i + 1}</span>
                          {medicines.length > 1 && (
                            <button onClick={() => removeMedicine(i)} className="text-destructive hover:text-destructive/80"><X className="h-3.5 w-3.5" /></button>
                          )}
                        </div>
                        <Input placeholder="اسم الدواء" className="font-cairo text-sm" value={med.name}
                          onChange={e => { const m = [...medicines]; m[i].name = e.target.value; setMedicines(m); }} />
                        <div className="grid grid-cols-3 gap-2">
                          <Input placeholder="الجرعة" className="font-cairo text-sm" value={med.dosage}
                            onChange={e => { const m = [...medicines]; m[i].dosage = e.target.value; setMedicines(m); }} />
                          <Input placeholder="التكرار" className="font-cairo text-sm" value={med.frequency}
                            onChange={e => { const m = [...medicines]; m[i].frequency = e.target.value; setMedicines(m); }} />
                          <Input placeholder="المدة" className="font-cairo text-sm" value={med.duration}
                            onChange={e => { const m = [...medicines]; m[i].duration = e.target.value; setMedicines(m); }} />
                        </div>
                        <Input placeholder="تعليمات الاستخدام" className="font-cairo text-sm" value={med.instructions}
                          onChange={e => { const m = [...medicines]; m[i].instructions = e.target.value; setMedicines(m); }} />
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={addMedicine} className="font-cairo text-xs gap-1"><Plus className="h-3 w-3" /> دواء آخر</Button>
                      <Button size="sm" className="font-cairo text-xs gap-1"><Printer className="h-3 w-3" /> طباعة الوصفة</Button>
                      <Button size="sm" variant="secondary" className="font-cairo text-xs gap-1"><Send className="h-3 w-3" /> إرسال للصيدلية</Button>
                    </div>
                  </div>
                </TabsContent>

                {/* Lab orders */}
                <TabsContent value="labs" className="px-4 pb-4">
                  <div className="space-y-3 mt-2">
                    <div className="relative">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input placeholder="ابحث عن تحليل..." className="font-cairo text-xs pr-9 h-8" value={labSearch} onChange={e => setLabSearch(e.target.value)} />
                    </div>
                    {selectedLabs.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {selectedLabs.map(id => {
                          const test = catalogLabTests.find(t => t.id === id);
                          return test ? (
                            <Badge key={id} className="font-cairo text-[10px] gap-1 cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                              onClick={() => toggleItem(id, selectedLabs, setSelectedLabs)}>{test.nameAr} <X className="h-2.5 w-2.5" /></Badge>
                          ) : null;
                        })}
                      </div>
                    )}
                    <div className="max-h-48 overflow-y-auto space-y-1 border border-border rounded-lg p-2">
                      {filteredLabs.map(test => (
                        <label key={test.id} className={`flex items-center gap-2.5 px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${selectedLabs.includes(test.id) ? 'bg-primary/10' : 'hover:bg-muted/60'}`}>
                          <Checkbox checked={selectedLabs.includes(test.id)} onCheckedChange={() => toggleItem(test.id, selectedLabs, setSelectedLabs)} />
                          <div className="flex-1 min-w-0">
                            <p className="font-cairo text-xs font-medium text-foreground truncate">{test.nameAr}</p>
                            <p className="text-[10px] text-muted-foreground">{test.nameEn} • {test.defaultPrice.toLocaleString()} ر.ي</p>
                          </div>
                          <Badge variant="outline" className="font-cairo text-[9px] h-4 shrink-0">{test.category}</Badge>
                        </label>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                {/* Imaging */}
                <TabsContent value="imaging" className="px-4 pb-4">
                  <div className="space-y-3 mt-2">
                    <div className="relative">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input placeholder="ابحث عن أشعة..." className="font-cairo text-xs pr-9 h-8" value={imagingSearch} onChange={e => setImagingSearch(e.target.value)} />
                    </div>
                    {selectedImaging.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {selectedImaging.map(id => {
                          const img = catalogImaging.find(i => i.id === id);
                          return img ? (
                            <Badge key={id} className="font-cairo text-[10px] gap-1 cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                              onClick={() => toggleItem(id, selectedImaging, setSelectedImaging)}>{img.nameAr} <X className="h-2.5 w-2.5" /></Badge>
                          ) : null;
                        })}
                      </div>
                    )}
                    <div className="max-h-48 overflow-y-auto space-y-1 border border-border rounded-lg p-2">
                      {filteredImaging.map(img => (
                        <label key={img.id} className={`flex items-center gap-2.5 px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${selectedImaging.includes(img.id) ? 'bg-primary/10' : 'hover:bg-muted/60'}`}>
                          <Checkbox checked={selectedImaging.includes(img.id)} onCheckedChange={() => toggleItem(img.id, selectedImaging, setSelectedImaging)} />
                          <div className="flex-1 min-w-0">
                            <p className="font-cairo text-xs font-medium text-foreground truncate">{img.nameAr}</p>
                            <p className="text-[10px] text-muted-foreground">{img.nameEn} • {img.defaultPrice.toLocaleString()} ر.ي</p>
                          </div>
                          <Badge variant="outline" className="font-cairo text-[9px] h-4 shrink-0">{imagingTypeLabels[img.type] || img.type}</Badge>
                        </label>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                {/* Procedures */}
                <TabsContent value="procedures" className="px-4 pb-4">
                  <div className="space-y-3 mt-2">
                    <div className="relative">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input placeholder="ابحث عن إجراء..." className="font-cairo text-xs pr-9 h-8" value={procedureSearch} onChange={e => setProcedureSearch(e.target.value)} />
                    </div>
                    {selectedProcedures.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {selectedProcedures.map(id => {
                          const proc = catalogProcedures.find(p => p.id === id);
                          return proc ? (
                            <Badge key={id} className="font-cairo text-[10px] gap-1 cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                              onClick={() => toggleItem(id, selectedProcedures, setSelectedProcedures)}>{proc.nameAr} <X className="h-2.5 w-2.5" /></Badge>
                          ) : null;
                        })}
                      </div>
                    )}
                    <div className="max-h-48 overflow-y-auto space-y-1 border border-border rounded-lg p-2">
                      {filteredProcedures.map(proc => (
                        <label key={proc.id} className={`flex items-center gap-2.5 px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${selectedProcedures.includes(proc.id) ? 'bg-primary/10' : 'hover:bg-muted/60'}`}>
                          <Checkbox checked={selectedProcedures.includes(proc.id)} onCheckedChange={() => toggleItem(proc.id, selectedProcedures, setSelectedProcedures)} />
                          <div className="flex-1 min-w-0">
                            <p className="font-cairo text-xs font-medium text-foreground truncate">{proc.nameAr}</p>
                            <p className="text-[10px] text-muted-foreground">{proc.nameEn} • {proc.defaultPrice.toLocaleString()} ر.ي • {proc.durationMin} د</p>
                            {proc.prepInstructions && <p className="font-cairo text-[10px] text-amber-600">⚠️ {proc.prepInstructions}</p>}
                          </div>
                          <Badge variant="outline" className="font-cairo text-[9px] h-4 shrink-0">{proc.category}</Badge>
                        </label>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </Card>

            {/* Provider selection + Follow-up */}
            <Card className="shadow-card">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  {providers.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Label className="font-cairo text-xs whitespace-nowrap">مزود الخدمة</Label>
                      <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                        <SelectTrigger className="font-cairo text-sm w-48"><SelectValue placeholder="اختر المزود" /></SelectTrigger>
                        <SelectContent>
                          {providers.map(p => <SelectItem key={p.id} value={p.id} className="font-cairo">{p.name_ar}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="flex items-center gap-2 flex-1">
                    <Calendar className="h-4 w-4 text-primary shrink-0" />
                    <Label className="font-cairo text-xs whitespace-nowrap">موعد المتابعة</Label>
                    <Input type="date" className="text-sm flex-1" value={followUpDate} onChange={e => setFollowUpDate(e.target.value)} />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="font-cairo text-xs gap-1"><Printer className="h-3 w-3" /> طباعة</Button>
                    <Button onClick={handleEndSession} disabled={saving} size="sm" className="font-cairo text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white">
                      {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />} إنهاء وحفظ
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
