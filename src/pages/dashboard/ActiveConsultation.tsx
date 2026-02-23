import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ArrowRight, User, FileText, Pill, TestTube, ScanLine, Syringe,
  Plus, Printer, Send, Clock, Phone, Calendar, X, CheckCircle2, History
} from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { dashboardPatients, dashboardAppointments, dashboardPrescriptions, dashboardLabOrders, dashboardTreatmentFiles } from '@/data/dashboardMockData';

const ActiveConsultation = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const appointmentId = searchParams.get('appointment') || 'a1';

  const appointment = dashboardAppointments.find(a => a.id === appointmentId);
  const patient = appointment ? dashboardPatients.find(p => p.id === appointment.patientId) : null;

  const patientFiles = patient ? dashboardTreatmentFiles.filter(f => f.patientId === patient.id) : [];
  const patientRx = patient ? dashboardPrescriptions.filter(rx => rx.patientId === patient.id) : [];
  const patientLabs = patient ? dashboardLabOrders.filter(l => l.patientId === patient.id) : [];

  // Consultation state
  const [symptoms, setSymptoms] = useState('');
  const [examination, setExamination] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [medicines, setMedicines] = useState([{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
  const [activeTab, setActiveTab] = useState('notes');

  const addMedicine = () => setMedicines(prev => [...prev, { name: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
  const removeMedicine = (idx: number) => setMedicines(prev => prev.filter((_, i) => i !== idx));

  const handleEndSession = () => {
    // In production: save treatment file, print prescription, send to pharmacy, complete appointment
    navigate('/dashboard/bookings');
  };

  if (!appointment || !patient) {
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
        {/* Top bar: patient info + timer + end session */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-primary/5 border border-primary/20 rounded-xl p-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-hero-gradient flex items-center justify-center">
              <User className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-cairo font-bold text-foreground">{patient.name}</h2>
                {patient.classification === 'emergency' && <Badge variant="destructive" className="font-cairo text-[10px]">طوارئ</Badge>}
                {patient.classification === 'sponsored' && <Badge className="font-cairo text-[10px] bg-emerald-500">مموّل</Badge>}
              </div>
              <p className="font-cairo text-xs text-muted-foreground">
                {patient.gender === 'male' ? 'ذكر' : 'أنثى'} • {patient.age} سنة • 📞 {patient.phone}
                {patient.insuranceProvider && ` • 🏥 ${patient.insuranceProvider}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border border-border">
              <Clock className="h-3.5 w-3.5 text-primary" />
              <span className="font-cairo text-sm font-medium text-foreground">{appointment.slotTime}</span>
              <span className="font-cairo text-xs text-muted-foreground">• {appointment.durationMin} د</span>
            </div>
            <Button onClick={handleEndSession} className="font-cairo gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
              <CheckCircle2 className="h-4 w-4" /> إنهاء الجلسة
            </Button>
          </div>
        </div>

        {/* Main workspace: 2 columns on desktop */}
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
                {/* Visit count */}
                <div className="flex items-center justify-between font-cairo text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
                  <span>إجمالي الزيارات</span>
                  <span className="font-bold text-foreground">{patient.totalVisits}</span>
                </div>

                {/* Previous sessions */}
                {patientFiles.length > 0 && (
                  <div>
                    <p className="font-cairo text-xs font-bold text-foreground mb-1.5">الجلسات السابقة</p>
                    {patientFiles.map(f => (
                      <div key={f.id} className="p-2 rounded-lg bg-muted/40 mb-1.5 font-cairo text-xs space-y-0.5">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{f.date}</span>
                          <Badge variant="secondary" className="font-cairo text-[10px] h-5">{f.diagnosis}</Badge>
                        </div>
                        <p className="text-muted-foreground">الأعراض: {f.symptoms}</p>
                        <p className="text-muted-foreground">الفحص: {f.examination}</p>
                        {f.notes && <p className="text-muted-foreground/70">📝 {f.notes}</p>}
                      </div>
                    ))}
                  </div>
                )}

                {/* Previous prescriptions */}
                {patientRx.length > 0 && (
                  <div>
                    <p className="font-cairo text-xs font-bold text-foreground mb-1.5">الوصفات السابقة</p>
                    {patientRx.map(rx => (
                      <div key={rx.id} className="p-2 rounded-lg bg-muted/40 mb-1.5 font-cairo text-xs">
                        <p className="text-muted-foreground mb-1">{rx.createdAt}</p>
                        {rx.medicines.map((m, i) => (
                          <p key={i} className="text-foreground">
                            <span className="text-primary font-medium">{m.name}</span> — {m.dosage} — {m.frequency}
                          </p>
                        ))}
                      </div>
                    ))}
                  </div>
                )}

                {/* Lab results */}
                {patientLabs.length > 0 && (
                  <div>
                    <p className="font-cairo text-xs font-bold text-foreground mb-1.5">التحاليل</p>
                    {patientLabs.map(lab => (
                      <div key={lab.id} className="p-2 rounded-lg bg-muted/40 mb-1.5 font-cairo text-xs">
                        <div className="flex justify-between mb-1">
                          <span className="text-muted-foreground">{lab.createdAt}</span>
                          <Badge className={`font-cairo text-[10px] h-5 ${lab.status === 'ready' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'}`}>
                            {lab.status === 'ready' ? 'جاهزة' : 'قيد التحليل'}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {lab.tests.map((t, i) => <Badge key={i} variant="secondary" className="font-cairo text-[10px] h-5">{t.name}</Badge>)}
                        </div>
                        {lab.interpretation && <p className="text-emerald-600 mt-1">📋 {lab.interpretation}</p>}
                      </div>
                    ))}
                  </div>
                )}

                {patientFiles.length === 0 && patientRx.length === 0 && patientLabs.length === 0 && (
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
                    <TabsTrigger value="labs" className="font-cairo text-xs gap-1"><TestTube className="h-3 w-3" /> تحاليل</TabsTrigger>
                    <TabsTrigger value="imaging" className="font-cairo text-xs gap-1"><ScanLine className="h-3 w-3" /> أشعة</TabsTrigger>
                    <TabsTrigger value="procedures" className="font-cairo text-xs gap-1"><Syringe className="h-3 w-3" /> إجراءات</TabsTrigger>
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
                            <button onClick={() => removeMedicine(i)} className="text-destructive hover:text-destructive/80">
                              <X className="h-3.5 w-3.5" />
                            </button>
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
                      <Button variant="outline" size="sm" onClick={addMedicine} className="font-cairo text-xs gap-1">
                        <Plus className="h-3 w-3" /> دواء آخر
                      </Button>
                      <Button size="sm" className="font-cairo text-xs gap-1">
                        <Printer className="h-3 w-3" /> طباعة الوصفة
                      </Button>
                      <Button size="sm" variant="secondary" className="font-cairo text-xs gap-1">
                        <Send className="h-3 w-3" /> إرسال للصيدلية
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                {/* Lab orders */}
                <TabsContent value="labs" className="px-4 pb-4">
                  <div className="space-y-3 mt-2">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {[
                        { label: 'صورة دم كاملة', cat: 'blood' },
                        { label: 'سكر صائم', cat: 'sugar' },
                        { label: 'كوليسترول', cat: 'cholesterol' },
                        { label: 'وظائف كبد', cat: 'blood' },
                        { label: 'وظائف كلى', cat: 'blood' },
                        { label: 'هرمونات الغدة', cat: 'hormones' },
                        { label: 'تحليل بول', cat: 'urine' },
                        { label: 'فيروسات', cat: 'viruses' },
                        { label: 'غدة درقية', cat: 'thyroid' },
                      ].map((test, i) => (
                        <Button key={i} variant="outline" size="sm" className="font-cairo text-xs justify-start gap-1.5 h-9">
                          <TestTube className="h-3 w-3 text-primary" /> {test.label}
                        </Button>
                      ))}
                    </div>
                    <div>
                      <Label className="font-cairo text-xs">المختبر</Label>
                      <Select>
                        <SelectTrigger className="font-cairo text-sm mt-1"><SelectValue placeholder="اختر المختبر" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="lab1" className="font-cairo">مختبر الأمل</SelectItem>
                          <SelectItem value="lab2" className="font-cairo">مختبر الصحة</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button className="font-cairo text-xs gap-1"><Send className="h-3 w-3" /> إرسال الطلب</Button>
                  </div>
                </TabsContent>

                {/* Imaging */}
                <TabsContent value="imaging" className="px-4 pb-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                    {['أشعة سينية', 'أشعة مقطعية', 'رنين مغناطيسي', 'سونار', 'إيكو'].map((type, i) => (
                      <Button key={i} variant="outline" className="font-cairo text-xs h-16 flex-col gap-1">
                        <ScanLine className="h-5 w-5 text-primary" />
                        {type}
                      </Button>
                    ))}
                  </div>
                </TabsContent>

                {/* Procedures */}
                <TabsContent value="procedures" className="px-4 pb-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                    {[
                      { name: 'حقن', icon: '💉', price: 2000 },
                      { name: 'تطعيمات', icon: '🛡️', price: 3000 },
                      { name: 'تنظيف أسنان', icon: '🦷', price: 5000 },
                      { name: 'جراحة بسيطة', icon: '🔪', price: 15000 },
                      { name: 'تضميد جروح', icon: '🩹', price: 1500 },
                    ].map((proc, i) => (
                      <Button key={i} variant="outline" className="font-cairo text-xs h-14 flex-col gap-0.5">
                        <span className="text-lg">{proc.icon}</span>
                        <span>{proc.name} — {proc.price.toLocaleString()} ر.ي</span>
                      </Button>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </Card>

            {/* Follow-up */}
            <Card className="shadow-card">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <div className="flex items-center gap-2 flex-1">
                    <Calendar className="h-4 w-4 text-primary shrink-0" />
                    <Label className="font-cairo text-xs whitespace-nowrap">موعد المتابعة</Label>
                    <Input type="date" className="text-sm flex-1" />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="font-cairo text-xs gap-1">
                      <Printer className="h-3 w-3" /> طباعة الملف
                    </Button>
                    <Button onClick={handleEndSession} size="sm" className="font-cairo text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white">
                      <CheckCircle2 className="h-3 w-3" /> إنهاء وحفظ
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
