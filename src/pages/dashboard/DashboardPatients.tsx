import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Users, ChevronLeft, Loader2 } from 'lucide-react';

interface PatientRow {
  id: string;
  full_name_ar: string | null;
  full_name: string | null;
  phone: string | null;
  gender: string | null;
  date_of_birth: string | null;
  visit_count?: number;
}

function calcAge(dob: string | null): string {
  if (!dob) return '—';
  const diff = Date.now() - new Date(dob).getTime();
  const age = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  return `${age} سنة`;
}

const DashboardPatients = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState('all');

  // Fetch patient user_ids
  const { data: patientIds = [], isLoading: loadingIds } = useQuery({
    queryKey: ['patient-ids'],
    queryFn: async () => {
      const { data } = await supabase.from('user_roles' as any).select('user_id').eq('role', 'patient');
      return (data || []).map((r: any) => r.user_id as string);
    },
  });

  // Fetch profiles for patients
  const { data: patients = [], isLoading: loadingProfiles } = useQuery({
    queryKey: ['patient-profiles', patientIds],
    enabled: patientIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('*').in('id', patientIds).order('created_at', { ascending: false });
      return (data || []) as PatientRow[];
    },
  });

  // Visit counts
  const { data: visitCounts = {} } = useQuery({
    queryKey: ['patient-visit-counts', patientIds],
    enabled: patientIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase.from('treatment_sessions').select('patient_id').in('patient_id', patientIds);
      const counts: Record<string, number> = {};
      (data || []).forEach((s: any) => { counts[s.patient_id] = (counts[s.patient_id] || 0) + 1; });
      return counts;
    },
  });

  const loading = loadingIds || loadingProfiles;

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
        <div>
          <h1 className="font-cairo text-xl font-bold text-foreground">إدارة المرضى</h1>
          <p className="font-cairo text-sm text-muted-foreground">قائمة المرضى المسجلين وسجلاتهم الطبية</p>
        </div>

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
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground font-cairo">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>لا يوجد مرضى</p>
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
      </div>
    </DashboardLayout>
  );
};

export default DashboardPatients;
