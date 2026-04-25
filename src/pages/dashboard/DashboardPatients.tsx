import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Users, ChevronLeft, Loader2, UserPlus, Heart } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DynamicCrud, { type FieldConfig } from '@/components/admin/DynamicCrud';

const familyFields: FieldConfig[] = [
  { key: 'full_name_ar', label: 'الاسم بالعربي', type: 'text', required: true, showInTable: true },
  { key: 'full_name', label: 'الاسم بالإنجليزي', type: 'text', showInTable: false },
  { key: 'relationship', label: 'صلة القرابة', type: 'select', required: true, showInTable: true, options: [
    { value: 'self', label: 'أنا' },
    { value: 'spouse', label: 'الزوج/ة' },
    { value: 'child', label: 'ابن/ة' },
    { value: 'parent', label: 'والد/ة' },
    { value: 'sibling', label: 'أخ/أخت' },
    { value: 'other', label: 'أخرى' },
  ]},
  { key: 'gender', label: 'الجنس', type: 'select', showInTable: true, options: [
    { value: 'male', label: 'ذكر' },
    { value: 'female', label: 'أنثى' },
  ]},
  { key: 'date_of_birth', label: 'تاريخ الميلاد', type: 'date', showInTable: true },
  { key: 'phone', label: 'الهاتف', type: 'text', showInTable: true, dir: 'ltr' },
  { key: 'is_active', label: 'نشط', type: 'boolean', showInTable: true },
  { key: 'user_id', label: 'المستخدم', type: 'relation', required: true, showInTable: true, relationTable: 'profiles', relationLabelField: 'full_name_ar', relationValueField: 'id' },
];

interface PatientRow {
  id: string;
  full_name_ar: string | null;
  full_name: string | null;
  phone: string | null;
  gender: string | null;
  date_of_birth: string | null;
  visit_count?: number;
  last_visit?: string;
}

function calcAge(dob: string | null): string {
  if (!dob) return '—';
  const diff = Date.now() - new Date(dob).getTime();
  const age = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  return `${age} سنة`;
}

const DashboardPatients = () => {
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const isAdmin = hasRole('admin');
  const isDoctor = hasRole('doctor');
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState('all');

  // Get doctor record for current user (if doctor)
  const { data: doctorRecord } = useQuery({
    queryKey: ['my-doctor-id', user?.id],
    enabled: !!user && isDoctor,
    queryFn: async () => {
      const { data } = await supabase.from('doctors').select('id').eq('user_id', user!.id).maybeSingle();
      return data;
    },
  });

  // Fetch patients — for doctors: only patients who booked with them; for admin: all patients
  const { data: patients = [], isLoading } = useQuery({
    queryKey: ['doctor-patients', doctorRecord?.id, isAdmin],
    enabled: !!user && (isAdmin || !!doctorRecord),
    queryFn: async () => {
      if (isAdmin) {
        // Admin sees all patients
        const { data: roleData } = await supabase.from('user_roles' as any).select('user_id').eq('role', 'patient');
        const ids = (roleData || []).map((r: any) => r.user_id as string);
        if (ids.length === 0) return [];
        const { data } = await supabase.from('profiles').select('*').in('id', ids).order('created_at', { ascending: false });
        return (data || []) as PatientRow[];
      }

      // Doctor: get unique patient_ids from bookings
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select('patient_id, booking_date')
        .eq('doctor_id', doctorRecord!.id)
        .order('booking_date', { ascending: false });

      if (!bookingsData || bookingsData.length === 0) return [];

      const patientMap = new Map<string, string>();
      bookingsData.forEach(b => {
        if (!patientMap.has(b.patient_id)) {
          patientMap.set(b.patient_id, b.booking_date);
        }
      });

      const patientIds = [...patientMap.keys()];
      const { data: profiles } = await supabase.from('profiles').select('*').in('id', patientIds);

      return (profiles || []).map(p => ({
        ...p,
        last_visit: patientMap.get(p.id) || null,
      })) as PatientRow[];
    },
  });

  // Visit counts
  const patientIds = patients.map(p => p.id);
  const { data: visitCounts = {} } = useQuery({
    queryKey: ['patient-visit-counts', patientIds],
    enabled: patientIds.length > 0,
    queryFn: async () => {
      let query = supabase.from('treatment_sessions').select('patient_id').in('patient_id', patientIds);
      if (doctorRecord) {
        query = query.eq('doctor_id', doctorRecord.id);
      }
      const { data } = await query;
      const counts: Record<string, number> = {};
      (data || []).forEach((s: any) => { counts[s.patient_id] = (counts[s.patient_id] || 0) + 1; });
      return counts;
    },
  });

  const filtered = patients.filter(p => {
    const name = (p.full_name_ar || p.full_name || '').toLowerCase();
    if (search && !name.includes(search.toLowerCase()) && !(p.phone || '').includes(search)) return false;
    if (genderFilter !== 'all' && p.gender !== genderFilter) return false;
    return true;
  });

  const males = patients.filter(p => p.gender === 'male').length;
  const females = patients.filter(p => p.gender === 'female').length;

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-cairo text-xl font-bold text-foreground">
              {isDoctor && !isAdmin ? 'مرضاي' : 'إدارة المرضى'}
            </h1>
            <p className="font-cairo text-sm text-muted-foreground">
              {isDoctor && !isAdmin ? 'المرضى الذين زاروك سابقاً' : 'قائمة المرضى المسجلين وسجلاتهم الطبية'}
            </p>
          </div>
        </div>

        <Tabs defaultValue="patients" className="w-full">
          <TabsList className="font-cairo">
            <TabsTrigger value="patients" className="font-cairo gap-1.5"><Users className="h-3.5 w-3.5" /> المرضى</TabsTrigger>
            {isAdmin && <TabsTrigger value="family" className="font-cairo gap-1.5"><Heart className="h-3.5 w-3.5" /> أفراد العائلة</TabsTrigger>}
          </TabsList>

          <TabsContent value="patients" className="mt-4 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <p className="font-cairo text-2xl font-bold text-primary">{patients.length}</p>
            <p className="font-cairo text-xs text-muted-foreground">إجمالي المرضى</p>
          </div>
          <div className="rounded-xl border border-border bg-blue-50 p-4 text-center">
            <p className="font-cairo text-2xl font-bold text-blue-700">{males}</p>
            <p className="font-cairo text-xs text-blue-600">ذكور</p>
          </div>
          <div className="rounded-xl border border-border bg-pink-50 p-4 text-center">
            <p className="font-cairo text-2xl font-bold text-pink-700">{females}</p>
            <p className="font-cairo text-xs text-pink-600">إناث</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="بحث بالاسم أو الهاتف..." value={search} onChange={e => setSearch(e.target.value)} className="font-cairo pr-9 h-9 text-sm" />
          </div>
          <Select value={genderFilter} onValueChange={setGenderFilter}>
            <SelectTrigger className="w-[130px] font-cairo h-9 text-sm">
              <SelectValue placeholder="الجنس" />
            </SelectTrigger>
            <SelectContent className="font-cairo">
              <SelectItem value="all">الكل</SelectItem>
              <SelectItem value="male">ذكر</SelectItem>
              <SelectItem value="female">أنثى</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground font-cairo">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>{isDoctor ? 'لم يزرك أي مريض بعد' : 'لا يوجد مرضى'}</p>
          </div>
        ) : (
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="font-cairo text-right text-xs font-semibold text-muted-foreground px-4 py-3">#</th>
                  <th className="font-cairo text-right text-xs font-semibold text-muted-foreground px-4 py-3">الاسم</th>
                  <th className="font-cairo text-right text-xs font-semibold text-muted-foreground px-4 py-3 hidden sm:table-cell">الهاتف</th>
                  <th className="font-cairo text-right text-xs font-semibold text-muted-foreground px-4 py-3 hidden md:table-cell">الجنس</th>
                  <th className="font-cairo text-right text-xs font-semibold text-muted-foreground px-4 py-3 hidden md:table-cell">العمر</th>
                  <th className="font-cairo text-right text-xs font-semibold text-muted-foreground px-4 py-3">الزيارات</th>
                  {isDoctor && <th className="font-cairo text-right text-xs font-semibold text-muted-foreground px-4 py-3 hidden lg:table-cell">آخر زيارة</th>}
                  <th className="px-4 py-3 w-8" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((p, idx) => (
                  <tr
                    key={p.id}
                    className="hover:bg-muted/30 cursor-pointer transition-colors"
                    onClick={() => navigate(`/dashboard/patients/${p.id}`)}
                  >
                    <td className="font-cairo text-xs text-muted-foreground px-4 py-3">{idx + 1}</td>
                    <td className="font-cairo text-sm font-medium text-foreground px-4 py-3">
                      {p.full_name_ar || p.full_name || 'غير محدد'}
                    </td>
                    <td className="font-cairo text-sm text-muted-foreground px-4 py-3 hidden sm:table-cell" dir="ltr">
                      {p.phone || '—'}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {p.gender ? (
                        <Badge variant="outline" className={`font-cairo text-[10px] ${p.gender === 'male' ? 'border-blue-300 text-blue-700' : 'border-pink-300 text-pink-700'}`}>
                          {p.gender === 'male' ? 'ذكر' : 'أنثى'}
                        </Badge>
                      ) : '—'}
                    </td>
                    <td className="font-cairo text-sm text-muted-foreground px-4 py-3 hidden md:table-cell">
                      {calcAge(p.date_of_birth)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className="font-cairo text-xs">
                        {visitCounts[p.id] || 0}
                      </Badge>
                    </td>
                    {isDoctor && (
                      <td className="font-cairo text-xs text-muted-foreground px-4 py-3 hidden lg:table-cell">
                        {(p as any).last_visit || '—'}
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="font-cairo text-xs text-muted-foreground text-end">إجمالي: {filtered.length} مريض</p>
          </TabsContent>

          {isAdmin && (
            <TabsContent value="family" className="mt-4">
              <DynamicCrud tableName="family_members" title="فرد عائلة" fields={familyFields} nameField="full_name_ar" />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default DashboardPatients;
