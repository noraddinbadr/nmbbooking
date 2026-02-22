import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { dashboardPrescriptions, dashboardLabOrders } from '@/data/dashboardMockData';
import { Pill, TestTube, ScanLine, Syringe, Plus, Printer, Send, Eye } from 'lucide-react';

const labCategories = [
  { value: 'blood', label: 'دم' }, { value: 'sugar', label: 'سكر' },
  { value: 'cholesterol', label: 'كوليسترول' }, { value: 'urine', label: 'بول' },
  { value: 'hormones', label: 'هرمونات' }, { value: 'viruses', label: 'فيروسات' },
  { value: 'thyroid', label: 'غدة درقية' },
];

const labStatusConfig: Record<string, { label: string; color: string }> = {
  ordered: { label: 'تم الطلب', color: 'bg-amber-500 text-white' },
  collected: { label: 'تم الجمع', color: 'bg-primary text-primary-foreground' },
  processing: { label: 'قيد التحليل', color: 'bg-blue-500 text-white' },
  ready: { label: 'جاهزة', color: 'bg-emerald-500 text-white' },
};

const DashboardServices = () => {
  const [rxDialogOpen, setRxDialogOpen] = useState(false);
  const [medicines, setMedicines] = useState([{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }]);

  const addMedicine = () => setMedicines(prev => [...prev, { name: '', dosage: '', frequency: '', duration: '', instructions: '' }]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="font-cairo text-2xl font-bold text-foreground">الخدمات الطبية</h1>

        <Tabs defaultValue="prescriptions">
          <TabsList className="font-cairo w-full grid grid-cols-4">
            <TabsTrigger value="prescriptions" className="font-cairo gap-1"><Pill className="h-3.5 w-3.5" /> الوصفات</TabsTrigger>
            <TabsTrigger value="labs" className="font-cairo gap-1"><TestTube className="h-3.5 w-3.5" /> التحاليل</TabsTrigger>
            <TabsTrigger value="imaging" className="font-cairo gap-1"><ScanLine className="h-3.5 w-3.5" /> الأشعة</TabsTrigger>
            <TabsTrigger value="procedures" className="font-cairo gap-1"><Syringe className="h-3.5 w-3.5" /> الإجراءات</TabsTrigger>
          </TabsList>

          {/* Prescriptions */}
          <TabsContent value="prescriptions">
            <div className="flex justify-end mb-4">
              <Button className="font-cairo gap-2" onClick={() => setRxDialogOpen(true)}><Plus className="h-4 w-4" /> وصفة جديدة</Button>
            </div>
            <div className="space-y-3">
              {dashboardPrescriptions.map(rx => (
                <Card key={rx.id} className="shadow-card">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-cairo font-bold text-foreground">{rx.patientName}</p>
                        <p className="font-cairo text-xs text-muted-foreground">{rx.createdAt}</p>
                      </div>
                      <div className="flex gap-1.5">
                        <Button size="sm" variant="outline" className="font-cairo text-xs gap-1"><Printer className="h-3 w-3" /> طباعة</Button>
                        <Button size="sm" variant="outline" className="font-cairo text-xs gap-1"><Send className="h-3 w-3" /> إرسال</Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {rx.medicines.map((m, i) => (
                        <div key={i} className="p-2 rounded bg-muted/50 font-cairo text-sm">
                          <span className="font-medium text-primary">{m.name}</span> — {m.dosage} — {m.frequency} — {m.duration}
                          {m.instructions && <p className="text-xs text-muted-foreground mt-0.5">📋 {m.instructions}</p>}
                        </div>
                      ))}
                    </div>
                    {rx.pharmacySent && <Badge className="font-cairo text-xs mt-2 bg-emerald-500">✓ تم الإرسال للصيدلية</Badge>}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Lab Tests */}
          <TabsContent value="labs">
            <div className="flex justify-end mb-4">
              <Button className="font-cairo gap-2"><Plus className="h-4 w-4" /> طلب تحاليل</Button>
            </div>
            <div className="space-y-3">
              {dashboardLabOrders.map(lab => (
                <Card key={lab.id} className="shadow-card">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-cairo font-bold text-foreground">{lab.patientName}</p>
                        <p className="font-cairo text-xs text-muted-foreground">{lab.labPartner} — {lab.createdAt}</p>
                      </div>
                      <Badge className={`font-cairo ${labStatusConfig[lab.status].color}`}>{labStatusConfig[lab.status].label}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {lab.tests.map((t, i) => (
                        <Badge key={i} variant="secondary" className="font-cairo text-xs">{t.name}</Badge>
                      ))}
                    </div>
                    {lab.interpretation && (
                      <p className="font-cairo text-sm bg-emerald-500/10 p-2 rounded text-foreground">📋 {lab.interpretation}</p>
                    )}
                    {lab.status === 'ready' && (
                      <Button size="sm" variant="outline" className="font-cairo text-xs gap-1 mt-2"><Eye className="h-3 w-3" /> عرض النتائج</Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Imaging */}
          <TabsContent value="imaging">
            <div className="flex justify-end mb-4">
              <Button className="font-cairo gap-2"><Plus className="h-4 w-4" /> طلب أشعة</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {['أشعة سينية', 'أشعة مقطعية', 'رنين مغناطيسي', 'سونار', 'إيكو'].map((type, i) => (
                <Card key={i} className="shadow-card hover:shadow-card-hover transition-shadow cursor-pointer">
                  <CardContent className="p-4 text-center">
                    <ScanLine className="h-8 w-8 text-primary mx-auto mb-2" />
                    <p className="font-cairo font-bold text-foreground">{type}</p>
                    <p className="font-cairo text-xs text-muted-foreground mt-1">اضغط لإنشاء طلب جديد</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Procedures */}
          <TabsContent value="procedures">
            <div className="flex justify-end mb-4">
              <Button className="font-cairo gap-2"><Plus className="h-4 w-4" /> إجراء جديد</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { name: 'حقن', icon: '💉', price: 2000 },
                { name: 'تطعيمات', icon: '🛡️', price: 3000 },
                { name: 'تنظيف أسنان', icon: '🦷', price: 5000 },
                { name: 'حشوات', icon: '🔧', price: 8000 },
                { name: 'جراحة بسيطة', icon: '🔪', price: 15000 },
                { name: 'تضميد جروح', icon: '🩹', price: 1500 },
              ].map((proc, i) => (
                <Card key={i} className="shadow-card hover:shadow-card-hover transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{proc.icon}</span>
                        <span className="font-cairo font-medium text-foreground">{proc.name}</span>
                      </div>
                      <span className="font-cairo font-bold text-primary">{proc.price.toLocaleString()} ر.ي</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* New Prescription Dialog */}
        <Dialog open={rxDialogOpen} onOpenChange={setRxDialogOpen}>
          <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle className="font-cairo">وصفة طبية جديدة</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="font-cairo">المريض</Label>
                <Select><SelectTrigger className="font-cairo mt-1"><SelectValue placeholder="اختر المريض" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="p1" className="font-cairo">أحمد محمد علي</SelectItem>
                    <SelectItem value="p3" className="font-cairo">خالد سعيد الحمدي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {medicines.map((_, i) => (
                <Card key={i} className="bg-muted/30">
                  <CardContent className="p-3 space-y-2">
                    <p className="font-cairo text-sm font-bold">الدواء {i + 1}</p>
                    <Input placeholder="اسم الدواء" className="font-cairo" />
                    <div className="grid grid-cols-3 gap-2">
                      <Input placeholder="الجرعة" className="font-cairo" />
                      <Input placeholder="التكرار" className="font-cairo" />
                      <Input placeholder="المدة" className="font-cairo" />
                    </div>
                    <Input placeholder="تعليمات الاستخدام" className="font-cairo" />
                  </CardContent>
                </Card>
              ))}
              <Button variant="outline" onClick={addMedicine} className="font-cairo w-full gap-2"><Plus className="h-4 w-4" /> إضافة دواء آخر</Button>
            </div>
            <DialogFooter className="flex gap-2">
              <Button className="font-cairo gap-2"><Printer className="h-4 w-4" /> حفظ وطباعة</Button>
              <Button variant="outline" className="font-cairo gap-2"><Send className="h-4 w-4" /> إرسال للصيدلية</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default DashboardServices;
