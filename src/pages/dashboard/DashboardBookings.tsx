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
  XCircle, Stethoscope, FileText, Loader2, RefreshCw, Plus, Edit, Trash2, CheckCheck,
  CalendarClock, Lock, History, UserX, PlayCircle, ChevronDown
} from 'lucide-react';
import BookingFormModal from '@/components/booking/BookingFormModal';
import RescheduleBookingModal from '@/components/booking/RescheduleBookingModal';
import BookingAuditLog from '@/components/booking/BookingAuditLog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';
import {
  STATUS_LABELS, STATUS_COLORS, getTimeStatus, isBookingPast, canActOnBooking,
  type BookingStatus
} from '@/lib/bookingState';

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
  rescheduled_from?: any;
  patient_name?: string;
  doctor_name?: string;
  family_name?: string;
}

const bookingTypeLabels: Record<string, string> = {
  clinic: '🏥 عيادة', hospital: '🏨 مستشفى', home: '🏠 منزلي',
  video: '📹 فيديو', voice: '📞 صوتي', lab: '🧪 مختبر',
};

const TIME_LABELS = { upcoming: 'قادم', today: 'اليوم', past: 'منتهٍ' } as const;
const TIME_COLORS = {
  upcoming: 'bg-sky-50 text-sky-700 border-sky-200',
  today: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  past: 'bg-slate-100 text-slate-600 border-slate-200',
} as const;

const DashboardBookings = () => {
  const navigate = useNavigate();
  const { roles } = useAuth();
  const isAdmin = roles.includes('admin') || roles.includes('clinic_admin');
  const isStaff = roles.includes('staff');
  const isDoctor = roles.includes('doctor');
  const canManage = isAdmin || isDoctor || isStaff;

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState('');
  const [activeTab, setActiveTab] = useState<'today' | 'upcoming' | 'past' | 'all'>('today');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [rescheduleBooking, setRescheduleBooking] = useState<Booking | null>(null);
  const [deletingBooking, setDeletingBooking] = useState<Booking | null>(null);
  const [auditOpenId, setAuditOpenId] = useState<string | null>(null);

  const today = new Date().toISOString().split('T')[0];

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase.from('bookings').select('*')
        .order('booking_date', { ascending: false })
        .order('start_time', { ascending: true });

      if (activeTab === 'today') query = query.eq('booking_date', today);
      else if (activeTab === 'upcoming') query = query.gt('booking_date', today);
      else if (activeTab === 'past') query = query.lt('booking_date', today);

      if (dateFilter) query = query.eq('booking_date', dateFilter);
      if (statusFilter !== 'all') query = query.eq('status', statusFilter as BookingStatus);

      const { data: bData, error } = await query;
      if (error) throw error;

      const rawBookings = (bData || []) as unknown as Booking[];

      const patientIds = [...new Set(rawBookings.map(b => b.patient_id))];
      const doctorIds = [...new Set(rawBookings.map(b => b.doctor_id))];
      const familyIds = rawBookings.map(b => b.family_member_id).filter((id): id is string => !!id);

      const [profilesRes, doctorsRes, familyRes] = await Promise.all([
        patientIds.length > 0 ? supabase.from('profiles').select('id, full_name_ar, full_name').in('id', patientIds) : Promise.resolve({ data: [] as any[] }),
        doctorIds.length > 0 ? supabase.from('doctors').select('id, name_ar').in('id', doctorIds) : Promise.resolve({ data: [] as any[] }),
        familyIds.length > 0 ? supabase.from('family_members').select('id, full_name_ar').in('id', familyIds) : Promise.resolve({ data: [] as any[] }),
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

  const changeStatus = async (booking: Booking, status: BookingStatus, reason?: string) => {
    const gate = canActOnBooking(booking.booking_date, booking.start_time, booking.status, isAdmin);
    if (!gate.allowed) {
      toast({ title: 'إجراء محظور', description: gate.reason, variant: 'destructive' });
      return;
    }
    setUpdatingId(booking.id);
    const { data, error } = await (supabase as any).rpc('set_booking_status', {
      _booking_id: booking.id,
      _new_status: status,
      _reason: reason || null,
    });
    setUpdatingId(null);
    if (error) {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
      return;
    }
    if (!data?.success) {
      const msg = String(data?.error || 'فشل التحديث');
      const friendly = msg.includes('BOOKING_PAST') ? 'لا يمكن تعديل حجز منتهٍ.'
        : msg.includes('INVALID_TRANSITION') ? 'انتقال غير مسموح بين الحالات.'
        : msg;
      toast({ title: 'تعذّر التحديث', description: friendly, variant: 'destructive' });
      return;
    }
    toast({ title: '✅ تم تحديث الحالة', description: STATUS_LABELS[status] });
    fetchBookings();
  };

  const handleDelete = async () => {
    if (!deletingBooking) return;
    const gate = canActOnBooking(deletingBooking.booking_date, deletingBooking.start_time, deletingBooking.status, isAdmin);
    if (!gate.allowed && !isAdmin) {
      toast({ title: 'محظور', description: gate.reason, variant: 'destructive' });
      setDeletingBooking(null);
      return;
    }
    const { error } = await supabase.from('bookings').delete().eq('id', deletingBooking.id);
    if (error) {
      const msg = error.message.includes('BOOKING_PAST') ? 'لا يمكن حذف حجز منتهٍ.' : error.message;
      toast({ title: 'خطأ', description: msg, variant: 'destructive' });
      return;
    }
    toast({ title: '🗑️ تم حذف الحجز' });
    setDeletingBooking(null);
    fetchBookings();
  };

  const filtered = bookings.filter(b => {
    if (timeFilter !== 'all' && getTimeStatus(b.booking_date, b.start_time) !== timeFilter) return false;
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
    in_progress: bookings.filter(b => b.status === 'in_progress').length,
    completed: bookings.filter(b => b.status === 'completed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled' || b.status === 'no_show').length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-cairo text-xl font-bold text-foreground">إدارة الحجوزات</h1>
            <p className="font-cairo text-sm text-muted-foreground">مع نظام الحالات والتدقيق وإعادة الجدولة</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchBookings} className="font-cairo gap-1.5">
              <RefreshCw className="h-3.5 w-3.5" /> تحديث
            </Button>
            {canManage && (
              <Button size="sm" onClick={() => { setEditingBooking(null); setFormOpen(true); }} className="font-cairo gap-1.5">
                <Plus className="h-3.5 w-3.5" /> حجز جديد
              </Button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
          {[
            { label: 'الكل', value: stats.total, color: 'bg-muted' },
            { label: 'معلّق', value: stats.pending, color: 'bg-yellow-50 border-yellow-200' },
            { label: 'مؤكد', value: stats.confirmed, color: 'bg-blue-50 border-blue-200' },
            { label: 'قيد الجلسة', value: stats.in_progress, color: 'bg-teal-50 border-teal-200' },
            { label: 'مكتمل', value: stats.completed, color: 'bg-green-50 border-green-200' },
            { label: 'ملغي/لم يحضر', value: stats.cancelled, color: 'bg-red-50 border-red-200' },
          ].map(s => (
            <div key={s.label} className={`rounded-xl border p-3 text-center ${s.color}`}>
              <p className="font-cairo text-2xl font-bold text-foreground">{s.value}</p>
              <p className="font-cairo text-[11px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs by time */}
        <div className="flex gap-2 border-b border-border pb-0 overflow-x-auto">
          {([
            { id: 'today', label: 'اليوم' },
            { id: 'upcoming', label: 'قادم' },
            { id: 'past', label: 'منتهٍ' },
            { id: 'all', label: 'الكل' },
          ] as const).map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setDateFilter(''); }}
              className={`font-cairo text-sm px-4 py-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id ? 'border-primary text-primary font-semibold' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
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
            <SelectTrigger className="w-[150px] font-cairo h-9 text-sm">
              <SelectValue placeholder="الحالة" />
            </SelectTrigger>
            <SelectContent className="font-cairo">
              <SelectItem value="all">كل الحالات</SelectItem>
              {(Object.keys(STATUS_LABELS) as BookingStatus[]).map(k => (
                <SelectItem key={k} value={k}>{STATUS_LABELS[k]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger className="w-[130px] font-cairo h-9 text-sm">
              <SelectValue placeholder="الوقت" />
            </SelectTrigger>
            <SelectContent className="font-cairo">
              <SelectItem value="all">كل الأوقات</SelectItem>
              <SelectItem value="upcoming">قادم</SelectItem>
              <SelectItem value="today">اليوم</SelectItem>
              <SelectItem value="past">منتهٍ</SelectItem>
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

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground font-cairo">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>لا توجد حجوزات</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(booking => {
              const statusLabel = STATUS_LABELS[booking.status] || booking.status;
              const statusColor = STATUS_COLORS[booking.status] || 'bg-muted';
              const timeStatus = getTimeStatus(booking.booking_date, booking.start_time);
              const past = isBookingPast(booking.booking_date, booking.start_time);
              const gate = canActOnBooking(booking.booking_date, booking.start_time, booking.status, isAdmin);
              const isUpdating = updatingId === booking.id;
              const displayName = booking.family_name || booking.patient_name;
              const hasReschedule = Array.isArray(booking.rescheduled_from) && booking.rescheduled_from.length > 0;

              return (
                <div key={booking.id} className={`rounded-xl border p-4 transition-shadow ${past ? 'border-dashed border-slate-300 bg-slate-50/50' : 'border-border bg-card hover:shadow-sm'}`}>
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <User className="h-5 w-5 text-primary" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-cairo font-semibold text-foreground">{displayName}</span>
                        {booking.family_name && (
                          <Badge variant="outline" className="font-cairo text-[10px]">نيابة عن: {booking.patient_name}</Badge>
                        )}
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-cairo font-medium ${statusColor}`}>
                          {statusLabel}
                        </span>
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-cairo ${TIME_COLORS[timeStatus]}`}>
                          {TIME_LABELS[timeStatus]}
                        </span>
                        {hasReschedule && (
                          <Badge variant="outline" className="font-cairo text-[10px] border-purple-300 text-purple-700">
                            <CalendarClock className="h-3 w-3 ml-0.5" /> أُعيد جدولته
                          </Badge>
                        )}
                        {booking.is_free_case && (
                          <Badge variant="outline" className="font-cairo text-[10px] border-green-300 text-green-700">مجاني</Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground font-cairo">
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {booking.booking_date}</span>
                        {booking.start_time && (<span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {booking.start_time}</span>)}
                        {booking.booking_type && (<span>{bookingTypeLabels[booking.booking_type] || booking.booking_type}</span>)}
                        {(isAdmin || isStaff) && (<span className="flex items-center gap-1"><Stethoscope className="h-3 w-3" /> د. {booking.doctor_name}</span>)}
                        {booking.final_price ? (<span className="text-primary font-semibold">{booking.final_price.toLocaleString()} ر.ي</span>) : null}
                      </div>
                      {booking.notes && (<p className="font-cairo text-xs text-muted-foreground mt-1 truncate">{booking.notes}</p>)}

                      {!gate.allowed && (
                        <div className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-slate-100 border border-slate-200 px-2 py-1 text-[11px] font-cairo text-slate-700">
                          <Lock className="h-3 w-3" /> {gate.reason}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 shrink-0">
                      {gate.allowed && booking.status === 'pending' && (
                        <>
                          <Button size="sm" variant="outline" className="font-cairo h-8 text-xs border-green-300 text-green-700 hover:bg-green-50 gap-1"
                            disabled={isUpdating} onClick={() => changeStatus(booking, 'confirmed')}>
                            {isUpdating ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />} تأكيد
                          </Button>
                          <Button size="sm" variant="outline" className="font-cairo h-8 text-xs border-red-300 text-red-700 hover:bg-red-50 gap-1"
                            disabled={isUpdating} onClick={() => changeStatus(booking, 'cancelled')}>
                            <XCircle className="h-3 w-3" /> إلغاء
                          </Button>
                        </>
                      )}

                      {gate.allowed && (booking.status === 'confirmed' || booking.status === 'rescheduled') && (
                        <>
                          {canManage && (
                            <Button size="sm" className="font-cairo h-8 text-xs gap-1 bg-primary"
                              onClick={() => navigate(`/dashboard/consultation?booking=${booking.id}`)}>
                              <PlayCircle className="h-3 w-3" /> بدء جلسة
                            </Button>
                          )}
                          <Button size="sm" variant="outline" className="font-cairo h-8 text-xs gap-1"
                            disabled={isUpdating} onClick={() => changeStatus(booking, 'no_show')}>
                            <UserX className="h-3 w-3" /> لم يحضر
                          </Button>
                          <Button size="sm" variant="outline" className="font-cairo h-8 text-xs border-red-300 text-red-700 hover:bg-red-50 gap-1"
                            disabled={isUpdating} onClick={() => changeStatus(booking, 'cancelled')}>
                            <XCircle className="h-3 w-3" /> إلغاء
                          </Button>
                        </>
                      )}

                      {gate.allowed && booking.status === 'in_progress' && (
                        <Button size="sm" variant="outline" className="font-cairo h-8 text-xs border-green-300 text-green-700 hover:bg-green-50 gap-1"
                          disabled={isUpdating} onClick={() => changeStatus(booking, 'completed')}>
                          <CheckCheck className="h-3 w-3" /> إكمال
                        </Button>
                      )}

                      {gate.allowed && canManage && booking.status !== 'completed' && booking.status !== 'cancelled' && (
                        <Button size="sm" variant="outline" className="font-cairo h-8 text-xs border-purple-300 text-purple-700 hover:bg-purple-50 gap-1"
                          onClick={() => setRescheduleBooking(booking)}>
                          <CalendarClock className="h-3 w-3" /> إعادة جدولة
                        </Button>
                      )}

                      <Button size="sm" variant="ghost" className="font-cairo h-8 text-xs gap-1"
                        onClick={() => navigate(`/dashboard/patients/${booking.patient_id}`)}>
                        <FileText className="h-3 w-3" /> السجل
                      </Button>

                      <Button size="sm" variant="ghost" className="font-cairo h-8 text-xs gap-1"
                        onClick={() => setAuditOpenId(auditOpenId === booking.id ? null : booking.id)}>
                        <History className="h-3 w-3" /> السجل الزمني
                        <ChevronDown className={`h-3 w-3 transition-transform ${auditOpenId === booking.id ? 'rotate-180' : ''}`} />
                      </Button>

                      {canManage && gate.allowed && (
                        <Button size="sm" variant="ghost" className="font-cairo h-8 text-xs gap-1"
                          onClick={() => { setEditingBooking(booking); setFormOpen(true); }}>
                          <Edit className="h-3 w-3" /> تعديل
                        </Button>
                      )}
                      {isAdmin && (
                        <Button size="sm" variant="ghost" className="font-cairo h-8 text-xs gap-1 text-destructive hover:text-destructive"
                          onClick={() => setDeletingBooking(booking)}>
                          <Trash2 className="h-3 w-3" /> حذف
                        </Button>
                      )}
                    </div>
                  </div>

                  {auditOpenId === booking.id && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <BookingAuditLog bookingId={booking.id} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        <p className="font-cairo text-xs text-muted-foreground text-end">إجمالي: {filtered.length} حجز</p>

        <BookingFormModal
          open={formOpen}
          booking={editingBooking}
          onClose={() => { setFormOpen(false); setEditingBooking(null); }}
          onSaved={fetchBookings}
        />

        <RescheduleBookingModal
          open={!!rescheduleBooking}
          booking={rescheduleBooking}
          onClose={() => setRescheduleBooking(null)}
          onSaved={fetchBookings}
        />

        <AlertDialog open={!!deletingBooking} onOpenChange={(o) => !o && setDeletingBooking(null)}>
          <AlertDialogContent dir="rtl" className="font-cairo">
            <AlertDialogHeader>
              <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
              <AlertDialogDescription>
                سيتم حذف الحجز نهائياً. لا يمكن التراجع عن هذه العملية.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">حذف</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
};

export default DashboardBookings;
