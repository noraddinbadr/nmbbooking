import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { dashboardTreatmentFiles, dashboardPatients, dashboardPrescriptions, dashboardLabOrders } from '@/data/dashboardMockData';
import { FileText, Plus, Printer, Share2, Download, Search, Calendar } from 'lucide-react';

const DashboardTreatment = () => {
  const [search, setSearch] = useState('');
  const [newFileOpen, setNewFileOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  const filtered = dashboardTreatmentFiles.filter(f => !search || f.patientName.includes(search) || f.diagnosis.includes(search));

  const selectedPatient = selectedPatientId ? dashboardPatients.find(p => p.id === selectedPatientId) : null;
  const patientFiles = selectedPatientId ? dashboardTreatmentFiles.filter(f => f.patientId === selectedPatientId) : [];
  const patientRx = selectedPatientId ? dashboardPrescriptions.filter(rx => rx.patientId === selectedPatientId) : [];
  const patientLabs = selectedPatientId ? dashboardLabOrders.filter(l => l.patientId === selectedPatientId) : [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-cairo text-2xl font-bold text-foreground">ملفات العلاج</h1>
          <Button className="font-cairo gap-2" onClick={() => setNewFileOpen(true)}><Plus className="h-4 w-4" /> ملف جديد</Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="بحث بالاسم أو التشخيص..." value={search} onChange={e => setSearch(e.target.value)} className="pr-10 font-cairo" />
        </div>

        {/* Treatment Files List */}
        <div className="space-y-4">
          {filtered.map(file => (
            <Card key={file.id} className="shadow-card hover:shadow-card-hover transition-shadow cursor-pointer" onClick={() => setSelectedPatientId(file.patientId)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-cairo font-bold text-foreground">{file.patientName}</p>
                      <p className="font-cairo text-xs text-muted-foreground">{file.date}</p>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0"><Printer className="h-3.5 w-3.5" /></Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0"><Share2 className="h-3.5 w-3.5" /></Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0"><Download className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-cairo text-sm">
                  <div className="p-2 rounded bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-1">الأعراض</p>
                    <p className="text-foreground">{file.symptoms}</p>
                  </div>
                  <div className="p-2 rounded bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-1">التشخيص</p>
                    <p className="text-foreground font-medium">{file.diagnosis}</p>
                  </div>
                  <div className="p-2 rounded bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-1">المتابعة</p>
                    <p className="text-foreground flex items-center gap-1"><Calendar className="h-3 w-3" /> {file.followUpDate}</p>
                  </div>
                </div>
                {file.notes && <p className="font-cairo text-xs text-muted-foreground mt-2 bg-muted/30 p-2 rounded">📝 {file.notes}</p>}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Patient Full Record Dialog */}
        <Dialog open={!!selectedPatientId} onOpenChange={() => setSelectedPatientId(null)}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" dir="rtl">
            {selectedPatient && (
              <>
                <DialogHeader>
                  <DialogTitle className="font-cairo text-xl">الملف الطبي — {selectedPatient.name}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {/* Session Notes */}
                  <div>
                    <h3 className="font-cairo font-bold text-foreground mb-2">ملاحظات الجلسات</h3>
                    {patientFiles.map(f => (
                      <div key={f.id} className="p-3 rounded-lg bg-muted/50 mb-2 font-cairo text-sm space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{f.date}</span>
                          <Badge variant="secondary" className="font-cairo text-xs">{f.diagnosis}</Badge>
                        </div>
                        <p><span className="text-muted-foreground">الفحص:</span> {f.examination}</p>
                        <p><span className="text-muted-foreground">الأعراض:</span> {f.symptoms}</p>
                        {f.notes && <p className="text-xs text-muted-foreground">📝 {f.notes}</p>}
                      </div>
                    ))}
                  </div>

                  {/* Prescription Timeline */}
                  {patientRx.length > 0 && (
                    <div>
                      <h3 className="font-cairo font-bold text-foreground mb-2">سجل الوصفات</h3>
                      {patientRx.map(rx => (
                        <div key={rx.id} className="p-3 rounded-lg bg-muted/50 mb-2 font-cairo text-sm">
                          <p className="text-xs text-muted-foreground mb-1">{rx.createdAt}</p>
                          {rx.medicines.map((m, i) => (
                            <p key={i}><span className="font-medium text-primary">{m.name}</span> — {m.dosage} — {m.frequency}</p>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Lab Results */}
                  {patientLabs.length > 0 && (
                    <div>
                      <h3 className="font-cairo font-bold text-foreground mb-2">نتائج التحاليل</h3>
                      {patientLabs.map(lab => (
                        <div key={lab.id} className="p-3 rounded-lg bg-muted/50 mb-2 font-cairo text-sm">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-muted-foreground">{lab.createdAt} — {lab.labPartner}</span>
                            <Badge className={`font-cairo text-xs ${lab.status === 'ready' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'}`}>
                              {lab.status === 'ready' ? 'جاهزة' : 'قيد التحليل'}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-1">{lab.tests.map((t, i) => <Badge key={i} variant="secondary" className="font-cairo text-xs">{t.name}</Badge>)}</div>
                          {lab.interpretation && <p className="mt-1 text-emerald-600">📋 {lab.interpretation}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* New Treatment File Dialog */}
        <Dialog open={newFileOpen} onOpenChange={setNewFileOpen}>
          <DialogContent className="max-w-lg" dir="rtl">
            <DialogHeader>
              <DialogTitle className="font-cairo">ملف علاج جديد</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label className="font-cairo">المريض</Label>
                <Select><SelectTrigger className="font-cairo mt-1"><SelectValue placeholder="اختر المريض" /></SelectTrigger>
                  <SelectContent>{dashboardPatients.map(p => <SelectItem key={p.id} value={p.id} className="font-cairo">{p.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className="font-cairo">الأعراض</Label><Textarea className="font-cairo mt-1" placeholder="اكتب الأعراض..." /></div>
              <div><Label className="font-cairo">الفحص السريري</Label><Textarea className="font-cairo mt-1" placeholder="نتائج الفحص..." /></div>
              <div><Label className="font-cairo">التشخيص</Label><Input className="font-cairo mt-1" placeholder="التشخيص" /></div>
              <div><Label className="font-cairo">تاريخ المتابعة</Label><Input type="date" className="mt-1" /></div>
              <div><Label className="font-cairo">ملاحظات</Label><Textarea className="font-cairo mt-1" placeholder="ملاحظات إضافية..." /></div>
            </div>
            <DialogFooter>
              <Button className="font-cairo">حفظ الملف</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default DashboardTreatment;
