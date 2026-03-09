import { useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building, UserCog, Stethoscope, Loader2, ToggleRight } from 'lucide-react';
import DynamicCrud, { type FieldConfig } from '@/components/admin/DynamicCrud';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';

const clinicFields: FieldConfig[] = [
  { key: 'name_ar', label: 'الاسم بالعربي', type: 'text', required: true, showInTable: true },
  { key: 'name_en', label: 'الاسم بالإنجليزي', type: 'text', showInTable: true },
  { key: 'city', label: 'المدينة', type: 'text', showInTable: true },
  { key: 'address', label: 'العنوان', type: 'text', showInTable: false },
  { key: 'phone', label: 'الهاتف', type: 'text', showInTable: true, dir: 'ltr' },
  { key: 'owner_id', label: 'المالك', type: 'relation', required: true, showInTable: true, relationTable: 'profiles', relationLabelField: 'full_name_ar', relationValueField: 'id' },
];

const doctorFields: FieldConfig[] = [
  { key: 'name_ar', label: 'الاسم بالعربي', type: 'text', required: true, showInTable: true },
  { key: 'name_en', label: 'الاسم بالإنجليزي', type: 'text', showInTable: false },
  { key: 'specialty_ar', label: 'التخصص', type: 'text', showInTable: true },
  { key: 'city_ar', label: 'المدينة', type: 'text', showInTable: true },
  { key: 'gender', label: 'الجنس', type: 'select', showInTable: true, options: [
    { value: 'male', label: 'ذكر' },
    { value: 'female', label: 'أنثى' },
  ]},
  { key: 'base_price', label: 'السعر الأساسي', type: 'number', showInTable: true, dir: 'ltr' },
  { key: 'years_experience', label: 'سنوات الخبرة', type: 'number', showInTable: false },
  { key: 'is_verified', label: 'موثق', type: 'boolean', showInTable: true },
  { key: 'available_today', label: 'متاح اليوم', type: 'boolean', showInTable: true },
  { key: 'about_ar', label: 'نبذة بالعربي', type: 'text', showInTable: false },
  { key: 'clinic_id', label: 'العيادة', type: 'relation', required: true, showInTable: true, relationTable: 'clinics', relationLabelField: 'name_ar', relationValueField: 'id' },
  { key: 'user_id', label: 'المستخدم', type: 'relation', required: true, showInTable: false, relationTable: 'profiles', relationLabelField: 'full_name_ar', relationValueField: 'id' },
];

const staffFields: FieldConfig[] = [
  { key: 'name_ar', label: 'الاسم بالعربي', type: 'text', required: true, showInTable: true },
  { key: 'staff_role', label: 'الدور', type: 'select', required: true, showInTable: true, options: [
    { value: 'doctor', label: 'طبيب' },
    { value: 'assistant', label: 'مساعد' },
    { value: 'receptionist', label: 'موظف استقبال' },
  ]},
  { key: 'is_active', label: 'نشط', type: 'boolean', showInTable: true },
  { key: 'clinic_id', label: 'العيادة', type: 'relation', required: true, showInTable: true, relationTable: 'clinics', relationLabelField: 'name_ar', relationValueField: 'id' },
  { key: 'user_id', label: 'المستخدم', type: 'relation', required: true, showInTable: false, relationTable: 'profiles', relationLabelField: 'full_name_ar', relationValueField: 'id' },
];

// Quick doctors availability panel
const DoctorsAvailabilityPanel = () => {
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split('T')[0];

  const { data: doctors = [], isLoading } = useQuery({
    queryKey: ['doctors-availability-panel'],
    queryFn: async () => {
      const { data } = await supabase
        .from('doctors')
        .select('id, name_ar, specialty_ar, available_today, clinics(name_ar)')
        .order('name_ar');
      return data || [];
    },
  });

  const { data: todayBookingCounts = {} } = useQuery({
    queryKey: ['doctor-booking-counts-today'],
    queryFn: async () => {
      const { data } = await supabase
        .from('bookings')
        .select('doctor_id')
        .eq('booking_date', today)
        .neq('status', 'cancelled');
      const counts: Record<string, number> = {};
      (data || []).forEach((b: any) => { counts[b.doctor_id] = (counts[b.doctor_id] || 0) + 1; });
      return counts;
    },
  });

  const toggleAvailability = async (doctorId: string, current: boolean) => {
    const { error } = await supabase.from('doctors').update({ available_today: !current }).eq('id', doctorId);
    if (error) { toast({ title: 'خطأ', description: error.message, variant: 'destructive' }); return; }
    queryClient.invalidateQueries({ queryKey: ['doctors-availability-panel'] });
    toast({ title: !current ? '✅ الطبيب متاح الآن' : '⏸ تم إيقاف التوفر' });
  };

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-2 mt-3">
      <div className="flex items-center gap-2 mb-3">
        <ToggleRight className="h-4 w-4 text-primary" />
        <p className="font-cairo text-sm font-medium text-foreground">توفر الأطباء اليوم</p>
      </div>
      {doctors.map((d: any) => (
        <div key={d.id} className="rounded-xl border border-border bg-card px-4 py-3 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="font-cairo text-sm font-semibold text-foreground">{d.name_ar}</p>
            <div className="flex gap-3 mt-0.5">
              {d.specialty_ar && <p className="font-cairo text-xs text-muted-foreground">{d.specialty_ar}</p>}
              {d.clinics?.name_ar && <p className="font-cairo text-xs text-muted-foreground">· {d.clinics.name_ar}</p>}
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Badge variant="outline" className={`font-cairo text-[11px] ${todayBookingCounts[d.id] ? 'border-blue-300 text-blue-700' : 'border-muted text-muted-foreground'}`}>
              {todayBookingCounts[d.id] || 0} حجز اليوم
            </Badge>
            <div className="flex items-center gap-1.5">
              <span className={`font-cairo text-xs ${d.available_today ? 'text-green-600' : 'text-muted-foreground'}`}>
                {d.available_today ? 'متاح' : 'غير متاح'}
              </span>
              <Switch
                checked={!!d.available_today}
                onCheckedChange={() => toggleAvailability(d.id, !!d.available_today)}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const DashboardClinics = () => {
  const { data: stats } = useQuery({
    queryKey: ['clinics-stats'],
    queryFn: async () => {
      const [clinicsRes, doctorsRes, staffRes] = await Promise.all([
        supabase.from('clinics').select('id', { count: 'exact', head: true }),
        supabase.from('doctors').select('id', { count: 'exact', head: true }),
        supabase.from('staff_members').select('id', { count: 'exact', head: true }).eq('is_active', true),
      ]);
      return {
        clinics: clinicsRes.count || 0,
        doctors: doctorsRes.count || 0,
        staff: staffRes.count || 0,
      };
    },
  });

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div>
          <h1 className="font-cairo text-xl font-bold text-foreground">إدارة العيادات</h1>
          <p className="font-cairo text-sm text-muted-foreground">إدارة العيادات والأطباء والموظفين</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'العيادات', value: stats?.clinics ?? '—', icon: Building, color: 'text-primary' },
            { label: 'الأطباء', value: stats?.doctors ?? '—', icon: Stethoscope, color: 'text-blue-600' },
            { label: 'الموظفون النشطون', value: stats?.staff ?? '—', icon: UserCog, color: 'text-green-600' },
          ].map(s => (
            <div key={s.label} className="rounded-xl border border-border bg-card p-4 text-center">
              <s.icon className={`h-5 w-5 mx-auto mb-1.5 ${s.color}`} />
              <p className="font-cairo text-2xl font-bold text-foreground">{s.value}</p>
              <p className="font-cairo text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        <Tabs defaultValue="availability" className="w-full">
          <TabsList className="font-cairo">
            <TabsTrigger value="availability" className="font-cairo gap-1.5"><ToggleRight className="h-3.5 w-3.5" /> التوفر اليوم</TabsTrigger>
            <TabsTrigger value="clinics" className="font-cairo gap-1.5"><Building className="h-3.5 w-3.5" /> العيادات</TabsTrigger>
            <TabsTrigger value="doctors" className="font-cairo gap-1.5"><Stethoscope className="h-3.5 w-3.5" /> الأطباء</TabsTrigger>
            <TabsTrigger value="staff" className="font-cairo gap-1.5"><UserCog className="h-3.5 w-3.5" /> الموظفون</TabsTrigger>
          </TabsList>
          <TabsContent value="availability"><DoctorsAvailabilityPanel /></TabsContent>
          <TabsContent value="clinics"><DynamicCrud tableName="clinics" title="عيادة" fields={clinicFields} nameField="name_ar" /></TabsContent>
          <TabsContent value="doctors"><DynamicCrud tableName="doctors" title="طبيب" fields={doctorFields} nameField="name_ar" /></TabsContent>
          <TabsContent value="staff"><DynamicCrud tableName="staff_members" title="موظف" fields={staffFields} nameField="name_ar" /></TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default DashboardClinics;
