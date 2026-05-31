import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Calendar, Loader2, RefreshCw, Plus } from 'lucide-react';
import {
  BookingFormModal, RescheduleBookingModal,
  BookingsStatsBar, BookingsFilters, BookingCard,
  STATUS_LABELS, getTimeStatus, canActOnBooking, canRunWorkflowAction,
  type BookingStatus, type BookingRow,
} from '@/modules/bookings';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const DashboardBookings = () => {
  const navigate = useNavigate();
  const { roles } = useAuth();
  const isAdmin = roles.includes('admin') || roles.includes('clinic_admin');
  const isStaff = roles.includes('staff');
  const isDoctor = roles.includes('doctor');
  const canManage = isAdmin || isDoctor || isStaff;

  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState('');
  const [activeTab, setActiveTab] = useState<'today' | 'upcoming' | 'past' | 'all'>('today');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<BookingRow | null>(null);
  const [rescheduleBooking, setRescheduleBooking] = useState<BookingRow | null>(null);
  const [deletingBooking, setDeletingBooking] = useState<BookingRow | null>(null);
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

      const raw = (bData || []) as unknown as BookingRow[];
      const patientIds = [...new Set(raw.map(b => b.patient_id))];
      const doctorIds = [...new Set(raw.map(b => b.doctor_id))];
      const familyIds = raw.map(b => b.family_member_id).filter((id): id is string => !!id);

      const [profilesRes, doctorsRes, familyRes] = await Promise.all([
        patientIds.length > 0 ? supabase.from('profiles').select('id, full_name_ar, full_name').in('id', patientIds) : Promise.resolve({ data: [] as any[] }),
        doctorIds.length > 0 ? supabase.from('doctors').select('id, name_ar').in('id', doctorIds) : Promise.resolve({ data: [] as any[] }),
        familyIds.length > 0 ? supabase.from('family_members').select('id, full_name_ar').in('id', familyIds) : Promise.resolve({ data: [] as any[] }),
      ]);

      const profileMap = Object.fromEntries((profilesRes.data || []).map((p: any) => [p.id, p.full_name_ar || p.full_name || 'مريض']));
      const doctorMap = Object.fromEntries((doctorsRes.data || []).map((d: any) => [d.id, d.name_ar]));
      const familyMap = Object.fromEntries((familyRes.data || []).map((f: any) => [f.id, f.full_name_ar]));

      setBookings(raw.map(b => ({
        ...b,
        patient_name: profileMap[b.patient_id] || 'مريض',
        doctor_name: doctorMap[b.doctor_id] || 'طبيب',
        family_name: b.family_member_id ? familyMap[b.family_member_id] : undefined,
      })));
    } catch (err: any) {
      toast({ title: 'خطأ في تحميل الحجوزات', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [activeTab, dateFilter, statusFilter, today]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const changeStatus = async (booking: BookingRow, status: BookingStatus, reason?: string) => {
    const isWorkflowProgress = status === 'confirmed' || status === 'in_progress' || status === 'completed';
    const gate = isWorkflowProgress
      ? canRunWorkflowAction(booking.booking_date, booking.start_time, booking.status)
      : canActOnBooking(booking.booking_date, booking.start_time, booking.status, isAdmin);
    if (!gate.allowed) {
      toast({ title: 'إجراء محظور', description: gate.reason, variant: 'destructive' });
      return;
    }
    setUpdatingId(booking.id);
    const { data, error } = await (supabase as any).rpc('set_booking_status', {
      _booking_id: booking.id, _new_status: status, _reason: reason || null,
    });
    setUpdatingId(null);
    if (error) { toast({ title: 'خطأ', description: error.message, variant: 'destructive' }); return; }
    if (!data?.success) {
      const msg = String(data?.error || 'فشل التحديث');
      const friendly = msg.includes('BOOKING_PAST') ? 'لا يمكن تعديل حجز منتهٍ.'
        : msg.includes('INVALID_TRANSITION') ? 'انتقال غير مسموح بين الحالات.' : msg;
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
      setDeletingBooking(null); return;
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

        <BookingsStatsBar stats={stats} />

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

        <BookingsFilters
          search={search} onSearchChange={setSearch}
          statusFilter={statusFilter} onStatusChange={setStatusFilter}
          timeFilter={timeFilter} onTimeChange={setTimeFilter}
          dateFilter={dateFilter} onDateChange={setDateFilter}
        />

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground font-cairo">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>لا توجد حجوزات</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(booking => (
              <BookingCard
                key={booking.id}
                booking={booking}
                isAdmin={isAdmin}
                isStaff={isStaff}
                canManage={canManage}
                updating={updatingId === booking.id}
                auditOpen={auditOpenId === booking.id}
                onToggleAudit={() => setAuditOpenId(auditOpenId === booking.id ? null : booking.id)}
                onChangeStatus={(s) => changeStatus(booking, s)}
                onStartConsultation={() => navigate(`/dashboard/consultation?booking=${booking.id}`)}
                onOpenPatient={() => navigate(`/dashboard/patients/${booking.patient_id}`)}
                onReschedule={() => setRescheduleBooking(booking)}
                onEdit={() => { setEditingBooking(booking); setFormOpen(true); }}
                onDelete={() => setDeletingBooking(booking)}
              />
            ))}
          </div>
        )}
        <p className="font-cairo text-xs text-muted-foreground text-end">إجمالي: {filtered.length} حجز</p>

        <BookingFormModal
          open={formOpen}
          booking={editingBooking as any}
          onClose={() => { setFormOpen(false); setEditingBooking(null); }}
          onSaved={fetchBookings}
        />

        <RescheduleBookingModal
          open={!!rescheduleBooking}
          booking={rescheduleBooking as any}
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
