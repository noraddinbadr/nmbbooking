import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import {
  Calendar, Search, User, Clock, CheckCircle2,
  XCircle, Stethoscope, FileText, Loader2, RefreshCw
} from 'lucide-react';

type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

interface Booking {
  id: string;
  booking_date: string;
  start_time: string | null;
  end_time: string | null;
  status: BookingStatus;
  booking_type: string | null;
  final_price: number | null;
  notes: string | null;
  is_free_case: boolean | null;
  patient_id: string;
  doctor_id: string;
  family_member_id: string | null;
  patient_name?: string;
  doctor_name?: string;
  family_name?: string;
}

const statusConfig: Record<BookingStatus, { label: string; color: string }> = {
  pending: { label: 'معلّق', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  confirmed: { label: 'مؤكد', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  completed: { label: 'مكتمل', color: 'bg-green-100 text-green-800 border-green-200' },
  cancelled: { label: 'ملغي', color: 'bg-red-100 text-red-800 border-red-200' },
};

const bookingTypeLabels: Record<string, string> = {
  clinic: '🏥 عيادة', hospital: '🏨 مستشفى', home: '🏠 منزلي',
  video: '📹 فيديو', voice: '📞 صوتي', lab: '🧪 مختبر',
};

const DashboardBookings = () => {
  const navigate = useNavigate();
  const { roles, user } = useAuth();
  const isAdmin = roles.includes('admin') || roles.includes('clinic_admin');
  const isDoctor = roles.includes('doctor');

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState('');
  const [activeTab, setActiveTab] = useState<'today' | 'all'>('today');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const today = new Date().toISOString().split('T')[0];

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase.from('bookings').select('*').order('booking_date', { ascending: false }).order('start_time', { ascending: true });

      if (activeTab === 'today') query = query.eq('booking_date', today);
      if (dateFilter) query = query.eq('booking_date', dateFilter);
      if (statusFilter !== 'all') query = query.eq('status', statusFilter);

      const { data: bData, error } = await query;
      if (error) throw error;

      const rawBookings: Booking[] = bData || [];

      // Resolve patient names
      const patientIds = [...new Set(rawBookings.map(b => b.patient_id))];
      const doctorIds = [...new Set(rawBookings.map(b => b.doctor_id))];
      const familyIds = rawBookings.map(b => b.family_member_id).filter(Boolean) as string[];

      const [profilesRes, doctorsRes, familyRes] = await Promise.all([
        patientIds.length > 0 ? supabase.from('profiles').select('id, full_name_ar, full_name').in('id', patientIds) : Promise.resolve({ data: [] }),
        doctorIds.length > 0 ? supabase.from('doctors').select('id, name_ar').in('id', doctorIds) : Promise.resolve({ data: [] }),
        familyIds.length > 0 ? supabase.from('family_members').select('id, full_name_ar').in('id', familyIds) : Promise.resolve({ data: [] }),
      ]);

      const profileMap = Object.fromEntries((profilesRes.data || []).map((p: any) => [p.id, p.full_name_ar || p.full_name || 'مريض']));
      const doctorMap = Object.fromEntries((doctorsRes.data || []).map((d: any) => [d.id, d.name_ar]));
      const familyMap = Object.fromEntries((familyRes.data || []).map((f: any) => [f.id, f.full_name_ar]));

      const enriched = rawBookings.map(b => ({
        ...b,
        patient_name: profileMap[b.patient_id] || 'مريض',
        doctor_name: doctorMap[b.doctor_id] || 'طبيب',
        family_name: b.family_member_id ? familyMap[b.family_member_id] : undefined,
      }));

      setBookings(enriched);
    } catch (err: any) {
      toast({ title: 'خطأ في تحميل الحجوزات', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [activeTab, dateFilter, statusFilter, today]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const updateStatus = async (id: string, status: BookingStatus) => {
    setUpdatingId(id);
    const { error } = await supabase.from('bookings').update({ status }).eq('id', id);
    setUpdatingId(null);
    if (error) { toast({ title: 'خطأ', description: error.message, variant: 'destructive' }); return; }
    toast({ title: status === 'confirmed' ? '✅ تم التأكيد' : '❌ تم الإلغاء' });
    fetchBookings();
  };

  const filtered = bookings.filter(b => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      (b.patient_name || '').toLowerCase().includes(s) ||
      (b.doctor_name || '').toLowerCase().includes(s) ||
      (b.family_name || '').toLowerCase().includes(s)
    );
  });

  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    completed: bookings.filter(b => b.status === 'completed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-cairo text-xl font-bold text-foreground">إدارة الحجوزات</h1>
            <p className="font-cairo text-sm text-muted-foreground">مركز قيادة الحجوزات</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchBookings} className="font-cairo gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" /> تحديث
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: 'الكل', value: stats.total, color: 'bg-muted' },
            { label: 'معلّق', value: stats.pending, color: 'bg-yellow-50 border-yellow-200' },
            { label: 'مؤكد', value: stats.confirmed, color: 'bg-blue-50 border-blue-200' },
            { label: 'مكتمل', value: stats.completed, color: 'bg-green-50 border-green-200' },
            { label: 'ملغي', value: stats.cancelled, color: 'bg-red-50 border-red-200' },
          ].map(s => (
            <div key={s.label} className={`rounded-xl border p-3 text-center ${s.color}`}>
              <p className="font-cairo text-2xl font-bold text-foreground">{s.value}</p>
              <p className="font-cairo text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-border pb-0">
          {[{ id: 'today', label: 'اليوم' }, { id: 'all', label: 'كل الحجوزات' }].map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id as any); setDateFilter(''); }}
              className={`font-cairo text-sm px-4 py-2 border-b-2 transition-colors ${activeTab === tab.id ? 'border-primary text-primary font-semibold' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="بحث باسم المريض أو الطبيب..." value={search} onChange={e => setSearch(e.target.value)} className="font-cairo pr-9 h-9 text-sm" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] font-cairo h-9 text-sm">
              <SelectValue placeholder="الحالة" />
            </SelectTrigger>
            <SelectContent className="font-cairo">
              <SelectItem value="all">كل الحالات</SelectItem>
              <SelectItem value="pending">معلّق</SelectItem>
              <SelectItem value="confirmed">مؤكد</SelectItem>
              <SelectItem value="completed">مكتمل</SelectItem>
              <SelectItem value="cancelled">ملغي</SelectItem>
            </SelectContent>
          </Select>
          <input
            type="date"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm font-cairo"
            dir="ltr"
          />
        </div>

        {/* Bookings List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground font-cairo">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>لا توجد حجوزات</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(booking => {
              const sc = statusConfig[booking.status] || statusConfig.pending;
              const isUpdating = updatingId === booking.id;
              const displayName = booking.family_name || booking.patient_name;
              return (
                <div key={booking.id} className="rounded-xl border border-border bg-card p-4 hover:shadow-sm transition-shadow">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <User className="h-5 w-5 text-primary" />
                    </div>

                    {/* Main info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-cairo font-semibold text-foreground">{displayName}</span>
                        {booking.family_name && (
                          <Badge variant="outline" className="font-cairo text-[10px]">نيابة عن: {booking.patient_name}</Badge>
                        )}
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-cairo font-medium ${sc.color}`}>
                          {sc.label}
                        </span>
                        {booking.is_free_case && (
                          <Badge variant="outline" className="font-cairo text-[10px] border-green-300 text-green-700">مجاني</Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground font-cairo">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> {booking.booking_date}
                        </span>
                        {booking.start_time && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {booking.start_time}
                          </span>
                        )}
                        {booking.booking_type && (
                          <span>{bookingTypeLabels[booking.booking_type] || booking.booking_type}</span>
                        )}
                        {isAdmin && (
                          <span className="flex items-center gap-1">
                            <Stethoscope className="h-3 w-3" /> د. {booking.doctor_name}
                          </span>
                        )}
                        {booking.final_price ? (
                          <span className="text-primary font-semibold">{booking.final_price.toLocaleString()} ر.ي</span>
                        ) : null}
                      </div>
                      {booking.notes && (
                        <p className="font-cairo text-xs text-muted-foreground mt-1 truncate">{booking.notes}</p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 shrink-0">
                      {booking.status === 'pending' && (
                        <>
                          <Button size="sm" variant="outline" className="font-cairo h-8 text-xs border-green-300 text-green-700 hover:bg-green-50 gap-1"
                            disabled={isUpdating} onClick={() => updateStatus(booking.id, 'confirmed')}>
                            {isUpdating ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />} تأكيد
                          </Button>
                          <Button size="sm" variant="outline" className="font-cairo h-8 text-xs border-red-300 text-red-700 hover:bg-red-50 gap-1"
                            disabled={isUpdating} onClick={() => updateStatus(booking.id, 'cancelled')}>
                            {isUpdating ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3" />} إلغاء
                          </Button>
                        </>
                      )}
                      {(booking.status === 'confirmed' || booking.status === 'pending') && (isDoctor || isAdmin) && (
                        <Button size="sm" className="font-cairo h-8 text-xs gap-1 bg-primary"
                          onClick={() => navigate(`/dashboard/consultation?booking=${booking.id}`)}>
                          <Stethoscope className="h-3 w-3" /> بدء جلسة
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" className="font-cairo h-8 text-xs gap-1"
                        onClick={() => navigate(`/dashboard/patients/${booking.patient_id}`)}>
                        <FileText className="h-3 w-3" /> السجل الطبي
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <p className="font-cairo text-xs text-muted-foreground text-end">إجمالي: {filtered.length} حجز</p>
      </div>
    </DashboardLayout>
  );
};

export default DashboardBookings;
