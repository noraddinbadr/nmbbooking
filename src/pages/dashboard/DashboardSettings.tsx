import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { toast } from '@/hooks/use-toast';
import {
  Clock, DollarSign, Gift, Users, Plus, Trash2, Save,
  Shield, UserPlus, Edit2
} from 'lucide-react';
import {
  DoctorShift, StaffMember, StaffRole, StaffPermissions,
  defaultPermissionsByRole, staffRoleLabels
} from '@/data/types';

// ─── Mock initial state ───
const initialShifts: DoctorShift[] = [
  {
    id: 'shift-1', label: 'الفترة الصباحية', startTime: '09:00', endTime: '13:00',
    daysOfWeek: [0, 1, 2, 3, 4], enableSlotGeneration: true, consultationDurationMin: 20, maxCapacity: 12,
  },
  {
    id: 'shift-2', label: 'الفترة المسائية', startTime: '16:00', endTime: '20:00',
    daysOfWeek: [0, 2, 4], enableSlotGeneration: true, consultationDurationMin: 20, maxCapacity: 10,
  },
];

const initialStaff: StaffMember[] = [
  {
    id: 's1', userId: 'u1', clinicId: 'c1', nameAr: 'ممرضة سارة',
    role: 'assistant', permissions: defaultPermissionsByRole.assistant, isActive: true,
  },
  {
    id: 's2', userId: 'u2', clinicId: 'c1', nameAr: 'محمد الاستقبال',
    role: 'receptionist', permissions: defaultPermissionsByRole.receptionist, isActive: true,
  },
];

const DAYS_MAP: Record<number, string> = {
  0: 'الأحد', 1: 'الاثنين', 2: 'الثلاثاء', 3: 'الأربعاء', 4: 'الخميس', 5: 'الجمعة', 6: 'السبت',
};

const PERM_LABELS: Record<keyof StaffPermissions, string> = {
  canViewPatients: 'عرض المرضى',
  canEditPatients: 'تعديل المرضى',
  canManageBookings: 'إدارة الحجوزات',
  canPrescribe: 'كتابة الوصفات',
  canOrderLabs: 'طلب التحاليل',
  canOrderImaging: 'طلب الأشعة',
  canCheckIn: 'تسجيل الحضور',
  canViewReports: 'عرض التقارير',
  canManageStaff: 'إدارة الموظفين',
  canManageSettings: 'إدارة الإعدادات',
  canManageEvents: 'إدارة الأحداث',
  canExportData: 'تصدير البيانات',
};

const DashboardSettings = () => {
  // ─── Shifts state ───
  const [shifts, setShifts] = useState<DoctorShift[]>(initialShifts);

  // ─── Pricing state ───
  const [basePrice, setBasePrice] = useState(5000);
  const [discountType, setDiscountType] = useState<'none' | 'percentage' | 'fixed'>('none');
  const [discountValue, setDiscountValue] = useState(0);
  const [freeCases, setFreeCases] = useState(2);

  // ─── Staff state ───
  const [staff, setStaff] = useState<StaffMember[]>(initialStaff);
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<StaffRole>('receptionist');

  // ─── Shift handlers ───
  const addShift = () => {
    const id = `shift-${Date.now()}`;
    setShifts(prev => [...prev, {
      id, label: 'فترة جديدة', startTime: '08:00', endTime: '12:00',
      daysOfWeek: [0, 1, 2, 3, 4], enableSlotGeneration: false, maxCapacity: 20,
    }]);
  };

  const updateShift = (id: string, patch: Partial<DoctorShift>) => {
    setShifts(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s));
  };

  const removeShift = (id: string) => {
    setShifts(prev => prev.filter(s => s.id !== id));
  };

  const toggleShiftDay = (shiftId: string, day: number) => {
    setShifts(prev => prev.map(s => {
      if (s.id !== shiftId) return s;
      const days = s.daysOfWeek.includes(day)
        ? s.daysOfWeek.filter(d => d !== day)
        : [...s.daysOfWeek, day].sort();
      return { ...s, daysOfWeek: days };
    }));
  };

  // ─── Staff handlers ───
  const addStaffMember = () => {
    if (!newStaffName.trim()) return;
    const member: StaffMember = {
      id: `s-${Date.now()}`, userId: '', clinicId: 'c1',
      nameAr: newStaffName, role: newStaffRole,
      permissions: { ...defaultPermissionsByRole[newStaffRole] }, isActive: true,
    };
    setStaff(prev => [...prev, member]);
    setNewStaffName('');
    setShowAddStaff(false);
    toast({ title: '✅ تم إضافة الموظف' });
  };

  const togglePermission = (staffId: string, perm: keyof StaffPermissions) => {
    setStaff(prev => prev.map(s => {
      if (s.id !== staffId) return s;
      return { ...s, permissions: { ...s.permissions, [perm]: !s.permissions[perm] } };
    }));
  };

  const removeStaffMember = (id: string) => {
    setStaff(prev => prev.filter(s => s.id !== id));
  };

  // ─── Computed price ───
  const computedPrice = discountType === 'percentage'
    ? basePrice * (1 - discountValue / 100)
    : discountType === 'fixed'
      ? Math.max(0, basePrice - discountValue)
      : basePrice;

  const handleSave = () => {
    toast({ title: '✅ تم حفظ الإعدادات بنجاح' });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl">
        <div className="flex items-center justify-between">
          <h1 className="font-cairo text-2xl font-bold text-foreground">الإعدادات</h1>
          <Button className="font-cairo gap-2" onClick={handleSave}>
            <Save className="h-4 w-4" /> حفظ الإعدادات
          </Button>
        </div>

        <Tabs defaultValue="shifts" dir="rtl">
          <TabsList className="font-cairo w-full justify-start flex-wrap h-auto gap-1 bg-muted/50 p-1">
            <TabsTrigger value="shifts" className="font-cairo gap-1.5"><Clock className="h-3.5 w-3.5" /> الفترات</TabsTrigger>
            <TabsTrigger value="pricing" className="font-cairo gap-1.5"><DollarSign className="h-3.5 w-3.5" /> الأسعار</TabsTrigger>
            <TabsTrigger value="staff" className="font-cairo gap-1.5"><Users className="h-3.5 w-3.5" /> الموظفين</TabsTrigger>
          </TabsList>

          {/* ═══════ SHIFTS TAB ═══════ */}
          <TabsContent value="shifts" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <p className="font-cairo text-sm text-muted-foreground">حدد فترات العمل وإعدادات كل فترة</p>
              <Button variant="outline" size="sm" className="font-cairo gap-1.5" onClick={addShift}>
                <Plus className="h-3.5 w-3.5" /> إضافة فترة
              </Button>
            </div>

            {shifts.map(shift => (
              <Card key={shift.id} className="shadow-card">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Input
                        value={shift.label}
                        onChange={e => updateShift(shift.id, { label: e.target.value })}
                        className="font-cairo font-bold text-base border-none bg-transparent p-0 h-auto w-48 focus-visible:ring-0"
                      />
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeShift(shift.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Time range */}
                  <div className="flex items-center gap-4" dir="ltr">
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-muted-foreground w-10">From</Label>
                      <Input type="time" value={shift.startTime} onChange={e => updateShift(shift.id, { startTime: e.target.value })} className="w-28 text-sm" />
                    </div>
                    <span className="text-muted-foreground">→</span>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-muted-foreground w-10">To</Label>
                      <Input type="time" value={shift.endTime} onChange={e => updateShift(shift.id, { endTime: e.target.value })} className="w-28 text-sm" />
                    </div>
                  </div>

                  {/* Days */}
                  <div>
                    <Label className="font-cairo text-xs text-muted-foreground mb-2 block">أيام العمل</Label>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(DAYS_MAP).map(([dayNum, dayName]) => {
                        const d = Number(dayNum);
                        const active = shift.daysOfWeek.includes(d);
                        return (
                          <button
                            key={d}
                            onClick={() => toggleShiftDay(shift.id, d)}
                            className={`rounded-lg px-3 py-1.5 font-cairo text-xs transition-all ${
                              active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                            }`}
                          >
                            {dayName}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Slot generation toggle */}
                  <div className="flex items-center justify-between rounded-xl bg-muted/50 p-3">
                    <div>
                      <p className="font-cairo text-sm font-medium text-foreground">توليد مواعيد تلقائية</p>
                      <p className="font-cairo text-xs text-muted-foreground">إذا مفعّل، يولّد مواعيد بناء على مدة الكشف</p>
                    </div>
                    <Switch
                      checked={shift.enableSlotGeneration}
                      onCheckedChange={v => updateShift(shift.id, { enableSlotGeneration: v })}
                    />
                  </div>

                  {shift.enableSlotGeneration && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="font-cairo text-xs">مدة الكشف (دقيقة)</Label>
                        <Input
                          type="number" min={5} max={120}
                          value={shift.consultationDurationMin || 20}
                          onChange={e => updateShift(shift.id, { consultationDurationMin: Number(e.target.value) })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="font-cairo text-xs">الحد الأقصى للمرضى</Label>
                        <Input
                          type="number" min={1}
                          value={shift.maxCapacity || ''}
                          onChange={e => updateShift(shift.id, { maxCapacity: e.target.value ? Number(e.target.value) : undefined })}
                          className="mt-1" placeholder="بدون حد"
                        />
                      </div>
                    </div>
                  )}

                  {!shift.enableSlotGeneration && (
                    <div>
                      <Label className="font-cairo text-xs">الحد الأقصى للمرضى (طابور مرن)</Label>
                      <Input
                        type="number" min={1}
                        value={shift.maxCapacity || ''}
                        onChange={e => updateShift(shift.id, { maxCapacity: e.target.value ? Number(e.target.value) : undefined })}
                        className="mt-1 w-40" placeholder="بدون حد"
                      />
                      <p className="font-cairo text-xs text-muted-foreground mt-1">الحجز بأسبقية الحضور بدون تحديد وقت محدد</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* ═══════ PRICING TAB ═══════ */}
          <TabsContent value="pricing" className="space-y-4 mt-4">
            <Card className="shadow-card">
              <CardHeader><CardTitle className="font-cairo flex items-center gap-2"><DollarSign className="h-5 w-5" /> سعر الكشف</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="font-cairo">السعر الأساسي (ر.ي)</Label>
                  <Input type="number" value={basePrice} onChange={e => setBasePrice(Number(e.target.value))} className="mt-1 w-48 font-cairo" />
                </div>

                <div>
                  <Label className="font-cairo">نوع الخصم</Label>
                  <Select value={discountType} onValueChange={(v: 'none' | 'percentage' | 'fixed') => setDiscountType(v)}>
                    <SelectTrigger className="w-48 mt-1 font-cairo"><SelectValue /></SelectTrigger>
                    <SelectContent className="font-cairo">
                      <SelectItem value="none">بدون خصم</SelectItem>
                      <SelectItem value="percentage">نسبة مئوية %</SelectItem>
                      <SelectItem value="fixed">مبلغ ثابت</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {discountType !== 'none' && (
                  <div>
                    <Label className="font-cairo">{discountType === 'percentage' ? 'نسبة الخصم (%)' : 'مبلغ الخصم (ر.ي)'}</Label>
                    <Input type="number" value={discountValue} onChange={e => setDiscountValue(Number(e.target.value))} className="mt-1 w-48" />
                  </div>
                )}

                <div className="rounded-xl bg-muted/50 p-4 flex items-center justify-between">
                  <span className="font-cairo text-sm text-muted-foreground">السعر بعد الخصم</span>
                  <span className="font-cairo text-xl font-bold text-primary">{computedPrice.toLocaleString()} ر.ي</span>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader><CardTitle className="font-cairo flex items-center gap-2"><Gift className="h-5 w-5 text-emerald-600" /> الحالات المجانية</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="font-cairo">عدد الحالات المجانية لكل فترة</Label>
                  <Input type="number" min={0} value={freeCases} onChange={e => setFreeCases(Number(e.target.value))} className="mt-1 w-32" />
                </div>
                <p className="font-cairo text-xs text-muted-foreground">
                  سيتم عرض بادج الحالات المجانية للمرضى عند الحجز. المساهمة الاجتماعية تزيد من ثقة المجتمع.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════ STAFF TAB ═══════ */}
          <TabsContent value="staff" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <p className="font-cairo text-sm text-muted-foreground">إدارة فريق العمل والصلاحيات</p>
              <Button variant="outline" size="sm" className="font-cairo gap-1.5" onClick={() => setShowAddStaff(true)}>
                <UserPlus className="h-3.5 w-3.5" /> إضافة موظف
              </Button>
            </div>

            {/* Add staff form */}
            {showAddStaff && (
              <Card className="shadow-card border-primary/30">
                <CardContent className="pt-4 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <Label className="font-cairo text-xs">اسم الموظف</Label>
                      <Input value={newStaffName} onChange={e => setNewStaffName(e.target.value)} placeholder="الاسم" className="font-cairo mt-1" />
                    </div>
                    <div>
                      <Label className="font-cairo text-xs">الدور</Label>
                      <Select value={newStaffRole} onValueChange={(v: StaffRole) => setNewStaffRole(v)}>
                        <SelectTrigger className="mt-1 font-cairo"><SelectValue /></SelectTrigger>
                        <SelectContent className="font-cairo">
                          <SelectItem value="assistant">مساعد</SelectItem>
                          <SelectItem value="receptionist">موظف استقبال</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end gap-2">
                      <Button className="font-cairo" onClick={addStaffMember}>إضافة</Button>
                      <Button variant="ghost" className="font-cairo" onClick={() => setShowAddStaff(false)}>إلغاء</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Staff list */}
            {staff.map(member => (
              <Card key={member.id} className="shadow-card">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Shield className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-cairo font-bold text-foreground">{member.nameAr}</p>
                        <Badge variant="secondary" className="font-cairo text-xs">{staffRoleLabels[member.role].ar}</Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={member.isActive} onCheckedChange={v => setStaff(prev => prev.map(s => s.id === member.id ? { ...s, isActive: v } : s))} />
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeStaffMember(member.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="font-cairo text-xs text-muted-foreground mb-2">الصلاحيات</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {(Object.keys(PERM_LABELS) as (keyof StaffPermissions)[]).map(perm => (
                      <label key={perm} className="flex items-center gap-2 rounded-lg bg-muted/30 px-2.5 py-2 cursor-pointer hover:bg-muted/60 transition-colors">
                        <Checkbox
                          checked={member.permissions[perm]}
                          onCheckedChange={() => togglePermission(member.id, perm)}
                        />
                        <span className="font-cairo text-xs text-foreground">{PERM_LABELS[perm]}</span>
                      </label>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default DashboardSettings;
