import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { dashboardPatients, dashboardAppointments, dashboardPrescriptions, dashboardTreatmentFiles } from '@/data/dashboardMockData';
import { Search, UserPlus, Phone, Calendar, FileText, Send, Printer, ArrowLeftRight } from 'lucide-react';
import type { DashboardPatient } from '@/data/dashboardMockData';

const classificationConfig: Record<string, { label: string; color: string }> = {
  regular: { label: 'عادي', color: 'bg-muted text-muted-foreground' },
  emergency: { label: 'طوارئ', color: 'bg-destructive text-destructive-foreground' },
  sponsored: { label: 'مموّل', color: 'bg-emerald-500 text-white' },
};

const DashboardPatients = () => {
  const [search, setSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<DashboardPatient | null>(null);
  const [classFilter, setClassFilter] = useState('all');

  const filtered = dashboardPatients.filter(p => {
    const matchSearch = !search || p.name.includes(search) || p.phone.includes(search) || p.nationalId.includes(search);
    const matchClass = classFilter === 'all' || p.classification === classFilter;
    return matchSearch && matchClass;
  });

  const patientAppts = selectedPatient ? dashboardAppointments.filter(a => a.patientId === selectedPatient.id) : [];
  const patientRx = selectedPatient ? dashboardPrescriptions.filter(rx => rx.patientId === selectedPatient.id) : [];
  const patientFiles = selectedPatient ? dashboardTreatmentFiles.filter(f => f.patientId === selectedPatient.id) : [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-cairo text-2xl font-bold text-foreground">إدارة المرضى</h1>
          <Button className="font-cairo gap-2"><UserPlus className="h-4 w-4" /> مريض جديد</Button>
        </div>

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="بحث بالاسم أو الهاتف أو الرقم الوطني..." value={search} onChange={e => setSearch(e.target.value)} className="pr-10 font-cairo" />
          </div>
          <div className="flex gap-2">
            {['all', 'regular', 'emergency', 'sponsored'].map(c => (
              <Button
                key={c}
                variant={classFilter === c ? 'default' : 'outline'}
                size="sm"
                onClick={() => setClassFilter(c)}
                className="font-cairo text-xs"
              >
                {c === 'all' ? 'الكل' : classificationConfig[c].label}
              </Button>
            ))}
          </div>
        </div>

        {/* Patient Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(patient => (
            <Card
              key={patient.id}
              className="shadow-card hover:shadow-card-hover transition-shadow cursor-pointer"
              onClick={() => setSelectedPatient(patient)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="font-cairo font-bold text-primary text-lg">{patient.name.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="font-cairo font-bold text-foreground">{patient.name}</p>
                      <p className="font-cairo text-xs text-muted-foreground">{patient.gender === 'male' ? 'ذكر' : 'أنثى'} — {patient.age} سنة</p>
                    </div>
                  </div>
                  <Badge className={`font-cairo text-[10px] ${classificationConfig[patient.classification].color}`}>
                    {classificationConfig[patient.classification].label}
                  </Badge>
                </div>
                <div className="space-y-1 font-cairo text-xs text-muted-foreground">
                  <p>📞 {patient.phone}</p>
                  <p>🆔 {patient.nationalId}</p>
                  {patient.insuranceProvider && <p>🛡️ {patient.insuranceProvider}</p>}
                  <p>📅 آخر زيارة: {patient.lastVisit} | الزيارات: {patient.totalVisits}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Patient Detail Dialog */}
        <Dialog open={!!selectedPatient} onOpenChange={() => setSelectedPatient(null)}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" dir="rtl">
            {selectedPatient && (
              <>
                <DialogHeader>
                  <DialogTitle className="font-cairo text-xl flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="font-cairo font-bold text-primary text-xl">{selectedPatient.name.charAt(0)}</span>
                    </div>
                    {selectedPatient.name}
                    <Badge className={`font-cairo ${classificationConfig[selectedPatient.classification].color}`}>
                      {classificationConfig[selectedPatient.classification].label}
                    </Badge>
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 mt-4">
                  {/* Info */}
                  <div className="grid grid-cols-2 gap-3 font-cairo text-sm">
                    <div><span className="text-muted-foreground">الهاتف:</span> <span className="font-medium">{selectedPatient.phone}</span></div>
                    <div><span className="text-muted-foreground">العمر:</span> <span className="font-medium">{selectedPatient.age} سنة</span></div>
                    <div><span className="text-muted-foreground">الجنس:</span> <span className="font-medium">{selectedPatient.gender === 'male' ? 'ذكر' : 'أنثى'}</span></div>
                    <div><span className="text-muted-foreground">الرقم الوطني:</span> <span className="font-medium">{selectedPatient.nationalId}</span></div>
                    {selectedPatient.insuranceProvider && (
                      <div className="col-span-2"><span className="text-muted-foreground">التأمين:</span> <span className="font-medium">{selectedPatient.insuranceProvider}</span></div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" className="font-cairo gap-1"><Calendar className="h-3 w-3" /> حجز موعد</Button>
                    <Button size="sm" variant="outline" className="font-cairo gap-1"><ArrowLeftRight className="h-3 w-3" /> تحويل لأخصائي</Button>
                    <Button size="sm" variant="outline" className="font-cairo gap-1"><Printer className="h-3 w-3" /> طباعة ملف</Button>
                    <Button size="sm" variant="outline" className="font-cairo gap-1"><Send className="h-3 w-3" /> إرسال SMS</Button>
                  </div>

                  {/* Visit History */}
                  <div>
                    <h3 className="font-cairo font-bold text-foreground mb-2">سجل الزيارات ({patientAppts.length})</h3>
                    <div className="space-y-2">
                      {patientAppts.slice(0, 5).map(a => (
                        <div key={a.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50 font-cairo text-sm">
                          <div>
                            <span className="text-foreground">{a.slotDate}</span>
                            <span className="text-muted-foreground mr-2"> — {a.slotTime}</span>
                          </div>
                          <Badge variant="secondary" className="font-cairo text-xs">{a.status === 'completed' ? 'مكتمل' : a.status === 'no_show' ? 'لم يحضر' : 'قادم'}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Prescriptions */}
                  {patientRx.length > 0 && (
                    <div>
                      <h3 className="font-cairo font-bold text-foreground mb-2">الوصفات الطبية</h3>
                      {patientRx.map(rx => (
                        <div key={rx.id} className="p-3 rounded-lg bg-muted/50 font-cairo text-sm space-y-1">
                          <p className="text-xs text-muted-foreground">{rx.createdAt}</p>
                          {rx.medicines.map((m, i) => (
                            <p key={i}><span className="font-medium">{m.name}</span> — {m.dosage} — {m.frequency} — {m.duration}</p>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Treatment Notes */}
                  {patientFiles.length > 0 && (
                    <div>
                      <h3 className="font-cairo font-bold text-foreground mb-2">ملاحظات العلاج</h3>
                      {patientFiles.map(f => (
                        <div key={f.id} className="p-3 rounded-lg bg-muted/50 font-cairo text-sm space-y-1">
                          <p className="text-xs text-muted-foreground">{f.date}</p>
                          <p><span className="text-muted-foreground">الأعراض:</span> {f.symptoms}</p>
                          <p><span className="text-muted-foreground">التشخيص:</span> {f.diagnosis}</p>
                          <p><span className="text-muted-foreground">متابعة:</span> {f.followUpDate}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default DashboardPatients;
