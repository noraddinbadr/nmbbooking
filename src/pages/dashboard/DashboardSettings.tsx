import { useState, useEffect, useCallback, useMemo } from 'react';
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
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  Clock, DollarSign, Gift, Users, Plus, Trash2, Save,
  Shield, UserPlus, Loader2, AlertCircle
} from 'lucide-react';
import { StaffPermissions, defaultPermissionsByRole, staffRoleLabels, StaffRole } from '@/data/types';

// ─── Types ───
interface ShiftRow {
  id: string;
  doctor_id: string;
  label: string;
  start_time: string;
  end_time: string;
  days_of_week: number[];
  enable_slot_generation: boolean;
  consultation_duration_min: number | null;
  max_capacity: number | null;
  late_tolerance_min: number | null;
  free_cases_count: number | null;
  free_cases_frequency: string | null;
}

interface StaffRow {
  id: string;
  user_id: string;
  clinic_id: string;
  name_ar: string;
  staff_role: string;
  permissions: Record<string, boolean>;
  is_active: boolean;
}

const DAYS_MAP: Record<number, string> = {
  0: 'الأحد', 1: 'الاثنين', 2: 'الثلاثاء', 3: 'الأربعاء', 4: 'الخميس', 5: 'الجمعة', 6: 'السبت',
};

const FREQ_LABELS: Record<string, string> = {
  shift: 'لكل فترة',
  day: 'لكل يوم',
  week: 'لكل أسبوع',
  month: 'لكل شهر',
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
  const { user, hasRole } = useAuth();
  const isDoctor = hasRole('doctor');

  // ─── Doctor record ───
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [clinicId, setClinicId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // ─── Shifts state ───
  const [shifts, setShifts] = useState<ShiftRow[]>([]);
  const [deletedShiftIds, setDeletedShiftIds] = useState<string[]>([]);

  // ─── Pricing state ───
  const [basePrice, setBasePrice] = useState(0);
  const [discountType, setDiscountType] = useState<'none' | 'percentage' | 'fixed'>('none');
  const [discountValue, setDiscountValue] = useState(0);
  const [freeCasesPerShift, setFreeCasesPerShift] = useState(0);

  // ─── Staff state ───
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<StaffRole>('receptionist');

  // ─── Overlap detection ───
  const overlappingShiftIds = useMemo(() => {
    const ids = new Set<string>();
    for (let i = 0; i < shifts.length; i++) {
      for (let j = i + 1; j < shifts.length; j++) {
        const a = shifts[i], b = shifts[j];
        const daysOverlap = a.days_of_week.some(d => b.days_of_week.includes(d));
        const timeOverlap = a.start_time < b.end_time && a.end_time > b.start_time;
        if (daysOverlap && timeOverlap) {
          ids.add(a.id);
          ids.add(b.id);
        }
      }
    }
    return ids;
  }, [shifts]);

  const hasOverlap = overlappingShiftIds.size > 0;

  const [saving, setSaving] = useState(false);

  // ─── Load data ───
  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    // Get doctor record for current user
    const { data: doc } = await supabase
      .from('doctors')
      .select('id, clinic_id, base_price, discount_type, discount_value, free_cases_per_shift')
      .eq('user_id', user.id)
      .maybeSingle();

    if (doc) {
      setDoctorId(doc.id);
      setClinicId(doc.clinic_id);
      setBasePrice(doc.base_price || 0);
      setDiscountType((doc.discount_type as any) || 'none');
      setDiscountValue(doc.discount_value || 0);
      setFreeCasesPerShift(doc.free_cases_per_shift || 0);

      // Load shifts
      const { data: shiftsData } = await supabase
        .from('doctor_shifts')
        .select('*')
        .eq('doctor_id', doc.id)
        .order('created_at');

      if (shiftsData) {
        setShifts(shiftsData.map(s => ({
          ...s,
          days_of_week: s.days_of_week || [0, 1, 2, 3, 4],
          enable_slot_generation: s.enable_slot_generation || false,
          late_tolerance_min: (s as any).late_tolerance_min ?? 10,
          free_cases_count: (s as any).free_cases_count ?? 0,
          free_cases_frequency: (s as any).free_cases_frequency ?? 'shift',
        })));
      }

      // Load staff
      if (doc.clinic_id) {
        const { data: staffData } = await supabase
          .from('staff_members')
          .select('*')
          .eq('clinic_id', doc.clinic_id);
        if (staffData) {
          setStaff(staffData.map(s => ({
            ...s,
            permissions: (typeof s.permissions === 'object' && s.permissions !== null ? s.permissions : {}) as Record<string, boolean>,
          })));
        }
      }
    }

    setLoading(false);
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  // ─── Shift handlers ───
  const addShift = () => {
    if (!doctorId) return;
    const id = `new-${Date.now()}`;
    setShifts(prev => [...prev, {
      id,
      doctor_id: doctorId,
      label: 'فترة جديدة',
      start_time: '08:00',
      end_time: '12:00',
      days_of_week: [0, 1, 2, 3, 4],
      enable_slot_generation: false,
      consultation_duration_min: 20,
      max_capacity: 20,
      late_tolerance_min: 10,
      free_cases_count: 0,
      free_cases_frequency: 'shift',
    }]);
  };

  const updateShift = (id: string, patch: Partial<ShiftRow>) => {
    setShifts(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s));
  };

  const removeShift = (id: string) => {
    if (!id.startsWith('new-')) {
      setDeletedShiftIds(prev => [...prev, id]);
    }
    setShifts(prev => prev.filter(s => s.id !== id));
  };

  const toggleShiftDay = (shiftId: string, day: number) => {
    setShifts(prev => prev.map(s => {
      if (s.id !== shiftId) return s;
      const days = s.days_of_week.includes(day)
        ? s.days_of_week.filter(d => d !== day)
        : [...s.days_of_week, day].sort();
      return { ...s, days_of_week: days };
    }));
  };

  // ─── Staff handlers ───
  const addStaffMember = async () => {
    if (!newStaffName.trim() || !clinicId || !user) return;
    const perms = defaultPermissionsByRole[newStaffRole] || defaultPermissionsByRole.receptionist;
    const { data, error } = await supabase.from('staff_members').insert({
      clinic_id: clinicId,
      user_id: user.id, // placeholder
      name_ar: newStaffName,
      staff_role: newStaffRole,
      permissions: perms as any,
      is_active: true,
    }).select().single();

    if (error) {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    } else if (data) {
      setStaff(prev => [...prev, {
        ...data,
        permissions: (typeof data.permissions === 'object' && data.permissions !== null ? data.permissions : {}) as Record<string, boolean>,
      }]);
      setNewStaffName('');
      setShowAddStaff(false);
      toast({ title: '✅ تم إضافة الموظف' });
    }
  };

  const togglePermission = (staffId: string, perm: keyof StaffPermissions) => {
    setStaff(prev => prev.map(s => {
      if (s.id !== staffId) return s;
      return { ...s, permissions: { ...s.permissions, [perm]: !s.permissions[perm] } };
    }));
  };

  const removeStaffMember = async (id: string) => {
    const { error } = await supabase.from('staff_members').delete().eq('id', id);
    if (!error) {
      setStaff(prev => prev.filter(s => s.id !== id));
      toast({ title: '✅ تم حذف الموظف' });
    }
  };

  // ─── Computed price ───
  const computedPrice = discountType === 'percentage'
    ? basePrice * (1 - discountValue / 100)
    : discountType === 'fixed'
      ? Math.max(0, basePrice - discountValue)
      : basePrice;

  // ─── SAVE ALL ───
  const handleSave = async () => {
    if (!doctorId) return;
    if (hasOverlap) {
      toast({ title: '⚠️ يوجد تعارض في الفترات', description: 'عدّل الفترات المتعارضة (المحددة بالأحمر) قبل الحفظ', variant: 'destructive' });
      return;
    }
    setSaving(true);

    try {
      // 1. Update doctor pricing
      await supabase.from('doctors').update({
        base_price: basePrice,
        discount_type: discountType,
        discount_value: discountValue,
        free_cases_per_shift: freeCasesPerShift,
      }).eq('id', doctorId);

      // 2. Delete removed shifts
      for (const sid of deletedShiftIds) {
        await supabase.from('doctor_shifts').delete().eq('id', sid);
      }
      setDeletedShiftIds([]);

      // 3. Upsert shifts
      for (const shift of shifts) {
        const payload = {
          doctor_id: doctorId,
          label: shift.label,
          start_time: shift.start_time,
          end_time: shift.end_time,
          days_of_week: shift.days_of_week,
          enable_slot_generation: shift.enable_slot_generation,
          consultation_duration_min: shift.consultation_duration_min,
          max_capacity: shift.max_capacity,
          late_tolerance_min: shift.late_tolerance_min,
          free_cases_count: shift.free_cases_count,
          free_cases_frequency: shift.free_cases_frequency,
        };

        if (shift.id.startsWith('new-')) {
          const { data, error: shiftErr } = await supabase.from('doctor_shifts').insert(payload).select('id').single();
          if (shiftErr) {
            if (shiftErr.message.includes('تعارض') || shiftErr.code === '23505') {
              toast({ title: '⚠️ تعارض في الفترات', description: `الفترة "${shift.label}" تتعارض مع فترة أخرى في نفس الأيام والأوقات`, variant: 'destructive' });
            } else {
              toast({ title: 'خطأ', description: shiftErr.message, variant: 'destructive' });
            }
            setSaving(false);
            return;
          }
          if (data) {
            setShifts(prev => prev.map(s => s.id === shift.id ? { ...s, id: data.id } : s));
          }
        } else {
          const { error: shiftErr } = await supabase.from('doctor_shifts').update(payload).eq('id', shift.id);
          if (shiftErr) {
            if (shiftErr.message.includes('تعارض') || shiftErr.code === '23505') {
              toast({ title: '⚠️ تعارض في الفترات', description: `الفترة "${shift.label}" تتعارض مع فترة أخرى في نفس الأيام والأوقات`, variant: 'destructive' });
            } else {
              toast({ title: 'خطأ', description: shiftErr.message, variant: 'destructive' });
            }
            setSaving(false);
            return;
          }
        }
      }

      // 4. Update staff permissions
      for (const member of staff) {
        await supabase.from('staff_members').update({
          permissions: member.permissions as any,
          is_active: member.is_active,
        }).eq('id', member.id);
      }

      toast({ title: '✅ تم حفظ الإعدادات بنجاح' });
    } catch (err: any) {
      toast({ title: 'خطأ', description: err.message, variant: 'destructive' });
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!doctorId && isDoctor) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <AlertCircle className="h-12 w-12 text-muted-foreground" />
          <p className="font-cairo text-lg text-muted-foreground">لم يتم العثور على سجل الطبيب</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl">
        <div className="flex items-center justify-between">
          <h1 className="font-cairo text-2xl font-bold text-foreground">الإعدادات</h1>
          <Button className="font-cairo gap-2" onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4" /> {saving ? 'جارٍ الحفظ...' : 'حفظ الإعدادات'}
          </Button>
        </div>

        <Tabs defaultValue="shifts" dir="rtl">
          <TabsList className="font-cairo w-full justify-start flex-wrap h-auto gap-1 bg-muted/50 p-1">
            <TabsTrigger value="shifts" className="font-cairo gap-1.5"><Clock className="h-3.5 w-3.5" /> الفترات وساعات العمل</TabsTrigger>
            <TabsTrigger value="pricing" className="font-cairo gap-1.5"><DollarSign className="h-3.5 w-3.5" /> الأسعار</TabsTrigger>
            <TabsTrigger value="staff" className="font-cairo gap-1.5"><Users className="h-3.5 w-3.5" /> الموظفين</TabsTrigger>
          </TabsList>

          {/* ═══════ SHIFTS TAB ═══════ */}
          <TabsContent value="shifts" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <p className="font-cairo text-sm text-muted-foreground">حدد فترات العمل وإعدادات كل فترة (ساعات العمل، مدة الكشف، الحد الأقصى، التأخير المسموح، الحالات المجانية)</p>
              <Button variant="outline" size="sm" className="font-cairo gap-1.5" onClick={addShift}>
                <Plus className="h-3.5 w-3.5" /> إضافة فترة
              </Button>
            </div>

            {shifts.length === 0 && (
              <Card className="shadow-card">
                <CardContent className="py-12 text-center">
                  <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="font-cairo text-muted-foreground">لا توجد فترات عمل. أضف فترة لبدء استقبال المرضى.</p>
                </CardContent>
              </Card>
            )}

            {hasOverlap && (
              <div className="flex items-center gap-2 rounded-xl border border-destructive bg-destructive/10 px-4 py-3">
                <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
                <p className="font-cairo text-sm text-destructive font-medium">يوجد تعارض بين الفترات المحددة بالأحمر — عدّل الأوقات أو الأيام قبل الحفظ</p>
              </div>
            )}

            {shifts.map(shift => {
              const isConflict = overlappingShiftIds.has(shift.id);
              return (
              <Card key={shift.id} className={`shadow-card transition-all ${isConflict ? 'border-2 border-destructive ring-2 ring-destructive/20' : ''}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Input
                        value={shift.label}
                        onChange={e => updateShift(shift.id, { label: e.target.value })}
                        className="font-cairo font-bold text-base border-none bg-transparent p-0 h-auto w-48 focus-visible:ring-0"
                      />
                      {isConflict && <Badge variant="destructive" className="font-cairo text-xs">⚠️ تعارض</Badge>}
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
                      <Input type="time" value={shift.start_time} onChange={e => updateShift(shift.id, { start_time: e.target.value })} className="w-28 text-sm" />
                    </div>
                    <span className="text-muted-foreground">→</span>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-muted-foreground w-10">To</Label>
                      <Input type="time" value={shift.end_time} onChange={e => updateShift(shift.id, { end_time: e.target.value })} className="w-28 text-sm" />
                    </div>
                  </div>

                  {/* Days */}
                  <div>
                    <Label className="font-cairo text-xs text-muted-foreground mb-2 block">أيام العمل</Label>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(DAYS_MAP).map(([dayNum, dayName]) => {
                        const d = Number(dayNum);
                        const active = shift.days_of_week.includes(d);
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
                      checked={shift.enable_slot_generation}
                      onCheckedChange={v => updateShift(shift.id, { enable_slot_generation: v })}
                    />
                  </div>

                  {shift.enable_slot_generation && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="font-cairo text-xs">مدة الكشف (دقيقة)</Label>
                        <Input
                          type="number" min={5} max={120}
                          value={shift.consultation_duration_min || 20}
                          onChange={e => updateShift(shift.id, { consultation_duration_min: Number(e.target.value) })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="font-cairo text-xs">الحد الأقصى للمرضى</Label>
                        <Input
                          type="number" min={1}
                          value={shift.max_capacity || ''}
                          onChange={e => updateShift(shift.id, { max_capacity: e.target.value ? Number(e.target.value) : null })}
                          className="mt-1" placeholder="بدون حد"
                        />
                      </div>
                    </div>
                  )}

                  {!shift.enable_slot_generation && (
                    <div>
                      <Label className="font-cairo text-xs">الحد الأقصى للمرضى (طابور مرن)</Label>
                      <Input
                        type="number" min={1}
                        value={shift.max_capacity || ''}
                        onChange={e => updateShift(shift.id, { max_capacity: e.target.value ? Number(e.target.value) : null })}
                        className="mt-1 w-40" placeholder="بدون حد"
                      />
                      <p className="font-cairo text-xs text-muted-foreground mt-1">الحجز بأسبقية الحضور بدون تحديد وقت محدد</p>
                    </div>
                  )}

                  {/* Late tolerance */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t border-border">
                    <div>
                      <Label className="font-cairo text-xs">تأخير المريض المسموح (دقيقة)</Label>
                      <Input
                        type="number" min={0} max={60}
                        value={shift.late_tolerance_min ?? 10}
                        onChange={e => updateShift(shift.id, { late_tolerance_min: Number(e.target.value) })}
                        className="mt-1"
                      />
                      <p className="font-cairo text-[10px] text-muted-foreground mt-1">اختياري — 0 يعني بدون سماح</p>
                    </div>

                    {/* Free cases per shift */}
                    <div>
                      <Label className="font-cairo text-xs">عدد الحالات المجانية</Label>
                      <Input
                        type="number" min={0}
                        value={shift.free_cases_count ?? 0}
                        onChange={e => updateShift(shift.id, { free_cases_count: Number(e.target.value) })}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label className="font-cairo text-xs">تكرار المجاني</Label>
                      <Select
                        value={shift.free_cases_frequency || 'shift'}
                        onValueChange={v => updateShift(shift.id, { free_cases_frequency: v })}
                      >
                        <SelectTrigger className="mt-1 font-cairo"><SelectValue /></SelectTrigger>
                        <SelectContent className="font-cairo">
                          <SelectItem value="shift">لكل فترة</SelectItem>
                          <SelectItem value="day">لكل يوم</SelectItem>
                          <SelectItem value="week">لكل أسبوع</SelectItem>
                          <SelectItem value="month">لكل شهر</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
              );
            })}
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
              <CardHeader><CardTitle className="font-cairo flex items-center gap-2"><Gift className="h-5 w-5 text-emerald-600" /> الحالات المجانية (عام)</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="font-cairo">عدد الحالات المجانية الافتراضي لكل فترة</Label>
                  <Input type="number" min={0} value={freeCasesPerShift} onChange={e => setFreeCasesPerShift(Number(e.target.value))} className="mt-1 w-32" />
                </div>
                <p className="font-cairo text-xs text-muted-foreground">
                  يمكنك تخصيص عدد مختلف لكل فترة من تبويب الفترات أعلاه. هذا الإعداد هو القيمة الافتراضية.
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

            {staff.length === 0 && !showAddStaff && (
              <Card className="shadow-card">
                <CardContent className="py-12 text-center">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="font-cairo text-muted-foreground">لا يوجد موظفون. أضف موظفاً لتفويض المهام.</p>
                </CardContent>
              </Card>
            )}

            {staff.map(member => (
              <Card key={member.id} className="shadow-card">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Shield className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-cairo font-bold text-foreground">{member.name_ar}</p>
                        <Badge variant="secondary" className="font-cairo text-xs">
                          {staffRoleLabels[member.staff_role as StaffRole]?.ar || member.staff_role}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={member.is_active} onCheckedChange={v => setStaff(prev => prev.map(s => s.id === member.id ? { ...s, is_active: v } : s))} />
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
                          checked={!!member.permissions[perm]}
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
