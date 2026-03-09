import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import {
  ChevronRight, ChevronLeft, Calendar as CalIcon, Clock, User, MapPin,
  Loader2, CalendarDays, CalendarRange, LayoutGrid, Plus, Search, X, Play, FileUser, XCircle, Wallet
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isToday, isSameDay } from 'date-fns';
import { ar } from 'date-fns/locale';
import { bookingTypeLabels } from '@/data/constants';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

// Yemen week starts Saturday
const DAYS_AR = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
function yemenDayIndex(jsDay: number): number {
  return jsDay === 6 ? 0 : jsDay + 1;
}

const WORK_HOURS = Array.from({ length: 14 }, (_, i) => i + 8); // 8:00 to 21:00

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string; barBg: string }> = {
  pending: { label: 'معلّق', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-400', barBg: 'bg-amber-500' },
  confirmed: { label: 'مؤكد', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', barBg: 'bg-emerald-500' },
  completed: { label: 'مكتمل', bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400', barBg: 'bg-slate-400' },
  cancelled: { label: 'ملغي', bg: 'bg-red-50', text: 'text-red-600', dot: 'bg-red-400', barBg: 'bg-red-400' },
};

interface CalBooking {
  id: string;
  booking_date: string;
  start_time: string | null;
  end_time: string | null;
  status: string | null;
  booking_type: string | null;
  patient_name: string;
  patient_id: string;
  notes: string | null;
  final_price: number | null;
  shift_id: string | null;
}

interface ShiftInfo {
  id: string;
  label: string;
  start_time: string;
  end_time: string;
  days_of_week: number[];
}

interface PatientOption {
  id: string;
  name: string;
  phone: string | null;
}

const DashboardCalendar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [bookings, setBookings] = useState<CalBooking[]>([]);
  const [shifts, setShifts] = useState<ShiftInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [detailBooking, setDetailBooking] = useState<CalBooking | null>(null);

  // Add appointment dialog state
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addForm, setAddForm] = useState({
    patientId: '',
    patientName: '',
    date: new Date(),
    time: '09:00',
    shiftId: '',
    bookingType: 'clinic',
    price: 5000,
    notes: '',
  });
  const [patientSearch, setPatientSearch] = useState('');
  const [patientOptions, setPatientOptions] = useState<PatientOption[]>([]);
  const [searchingPatients, setSearchingPatients] = useState(false);
  const [savingBooking, setSavingBooking] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // Load doctor id
  useEffect(() => {
    if (!user) return;
    supabase.from('doctors').select('id, base_price').eq('user_id', user.id).maybeSingle()
      .then(({ data }) => {
        if (data) {
          setDoctorId(data.id);
          setAddForm(prev => ({ ...prev, price: data.base_price || 5000 }));
        }
      });
  }, [user]);

  // Load shifts
  useEffect(() => {
    if (!doctorId) return;
    supabase.from('doctor_shifts').select('id, label, start_time, end_time, days_of_week').eq('doctor_id', doctorId)
      .then(({ data }) => setShifts((data as ShiftInfo[]) || []));
  }, [doctorId]);

  // Load bookings for visible month range
  const fetchBookings = useCallback(async () => {
    if (!doctorId) { setLoading(false); return; }
    setLoading(true);
    const monthStart = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
    const monthEnd = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

    const { data: bks } = await supabase
      .from('bookings')
      .select('id, booking_date, start_time, end_time, status, booking_type, patient_id, notes, final_price, shift_id')
      .eq('doctor_id', doctorId)
      .gte('booking_date', monthStart)
      .lte('booking_date', monthEnd)
      .order('start_time');

    if (bks && bks.length > 0) {
      const patientIds = [...new Set(bks.map(b => b.patient_id))];
      const { data: profiles } = await supabase.from('profiles').select('id, full_name_ar, full_name').in('id', patientIds);
      const nameMap = new Map(profiles?.map(p => [p.id, p.full_name_ar || p.full_name || 'مريض']) || []);
      setBookings(bks.map(b => ({ ...b, patient_name: nameMap.get(b.patient_id) || 'مريض' })));
    } else {
      setBookings([]);
    }
    setLoading(false);
  }, [doctorId, currentMonth]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  // Sync currentMonth when selectedDate changes
  useEffect(() => {
    if (selectedDate.getMonth() !== currentMonth.getMonth() || selectedDate.getFullYear() !== currentMonth.getFullYear()) {
      setCurrentMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
    }
  }, [selectedDate]);

  // Search patients for add dialog
  useEffect(() => {
    if (!patientSearch || patientSearch.length < 2) { setPatientOptions([]); return; }
    const timer = setTimeout(async () => {
      setSearchingPatients(true);
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name_ar, full_name, phone')
        .or(`full_name_ar.ilike.%${patientSearch}%,full_name.ilike.%${patientSearch}%,phone.ilike.%${patientSearch}%`)
        .limit(10);
      setPatientOptions((data || []).map(p => ({ id: p.id, name: p.full_name_ar || p.full_name || 'مريض', phone: p.phone })));
      setSearchingPatients(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [patientSearch]);

  // Week dates (Saturday start)
  const weekDates = useMemo(() => {
    const d = new Date(selectedDate);
    const jsDay = d.getDay();
    const satOffset = jsDay === 6 ? 0 : -(jsDay + 1);
    const sat = new Date(d);
    sat.setDate(sat.getDate() + satOffset);
    return Array.from({ length: 7 }, (_, i) => {
      const dd = new Date(sat);
      dd.setDate(dd.getDate() + i);
      return dd;
    });
  }, [selectedDate]);

  // Month grid
  const monthDays = useMemo(() => eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) }), [currentMonth]);

  const bookingsForDate = useCallback((date: Date) =>
    bookings.filter(b => b.booking_date === format(date, 'yyyy-MM-dd')), [bookings]);

  // Get shifts active on a given day
  const shiftsForDate = useCallback((date: Date) => {
    const yDay = yemenDayIndex(date.getDay());
    return shifts.filter(s => s.days_of_week?.includes(yDay));
  }, [shifts]);

  const parseHour = (t: string | null) => t ? parseInt(t.split(':')[0]) : -1;

  // Navigation
  const goToday = () => { setSelectedDate(new Date()); setCurrentMonth(new Date()); };
  const prevWeek = () => { const d = new Date(selectedDate); d.setDate(d.getDate() - 7); setSelectedDate(d); };
  const nextWeek = () => { const d = new Date(selectedDate); d.setDate(d.getDate() + 7); setSelectedDate(d); };
  const prevDay = () => { const d = new Date(selectedDate); d.setDate(d.getDate() - 1); setSelectedDate(d); };
  const nextDay = () => { const d = new Date(selectedDate); d.setDate(d.getDate() + 1); setSelectedDate(d); };

  // Is hour within any shift for given date?
  const isShiftHour = (date: Date, hour: number) => {
    const dayShifts = shiftsForDate(date);
    return dayShifts.some(s => {
      const sH = parseInt(s.start_time.split(':')[0]);
      const eH = parseInt(s.end_time.split(':')[0]);
      return hour >= sH && hour < eH;
    });
  };

  // Get shift for specific hour on a date
  const getShiftForHour = (date: Date, hour: number) => {
    const yDay = yemenDayIndex(date.getDay());
    return shifts.find(s => {
      if (!s.days_of_week?.includes(yDay)) return false;
      const sH = parseInt(s.start_time.split(':')[0]);
      const eH = parseInt(s.end_time.split(':')[0]);
      return hour >= sH && hour < eH;
    });
  };

  // Stats for today
  const todayBookings = bookingsForDate(selectedDate);
  const todayStats = {
    total: todayBookings.length,
    confirmed: todayBookings.filter(b => b.status === 'confirmed').length,
    pending: todayBookings.filter(b => b.status === 'pending').length,
    completed: todayBookings.filter(b => b.status === 'completed').length,
    revenue: todayBookings.filter(b => b.status !== 'cancelled').reduce((sum, b) => sum + (b.final_price || 0), 0),
  };

  // Open add dialog with pre-filled time
  const openAddDialog = (date?: Date, hour?: number) => {
    const targetDate = date || selectedDate;
    const targetTime = hour !== undefined ? `${hour.toString().padStart(2, '0')}:00` : '09:00';
    const dayShift = hour !== undefined ? getShiftForHour(targetDate, hour) : shiftsForDate(targetDate)[0];

    setAddForm({
      patientId: '',
      patientName: '',
      date: targetDate,
      time: targetTime,
      shiftId: dayShift?.id || '',
      bookingType: 'clinic',
      price: 5000,
      notes: '',
    });
    setPatientSearch('');
    setPatientOptions([]);
    setShowAddDialog(true);
  };

  // Save new booking
  const handleSaveBooking = async () => {
    if (!addForm.patientId) { toast.error('اختر المريض'); return; }
    if (!doctorId) return;

    setSavingBooking(true);
    const { error } = await supabase.from('bookings').insert({
      patient_id: addForm.patientId,
      doctor_id: doctorId,
      booking_date: format(addForm.date, 'yyyy-MM-dd'),
      start_time: addForm.time,
      shift_id: addForm.shiftId || null,
      booking_type: addForm.bookingType,
      final_price: addForm.price,
      notes: addForm.notes || null,
      status: 'confirmed',
    });

    setSavingBooking(false);
    if (error) {
      toast.error('حدث خطأ: ' + error.message);
    } else {
      toast.success('تم إضافة الموعد بنجاح');
      setShowAddDialog(false);
      fetchBookings();
    }
  };

  // Cancel booking
  const handleCancelBooking = async (id: string) => {
    setCancellingId(id);
    const { error } = await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', id);
    setCancellingId(null);
    if (error) {
      toast.error('حدث خطأ');
    } else {
      toast.success('تم إلغاء الموعد');
      setDetailBooking(null);
      fetchBookings();
    }
  };

  // Booking bar (full-width style like Google Calendar)
  const BookingBar = ({ bk, showTime = true }: { bk: CalBooking; showTime?: boolean }) => {
    const st = STATUS_CONFIG[bk.status || 'pending'];
    const typeInfo = bookingTypeLabels[bk.booking_type || 'clinic'];
    return (
      <button
        onClick={() => setDetailBooking(bk)}
        className={`w-full text-right rounded-md px-3 py-2 transition-all hover:opacity-90 hover:shadow-md ${st.barBg} text-white`}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="font-cairo text-sm font-semibold truncate">{bk.patient_name}</span>
          <span className="font-cairo text-[10px] opacity-80">{typeInfo?.icon}</span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          {showTime && bk.start_time && (
            <span className="font-cairo text-xs opacity-80">{bk.start_time}</span>
          )}
          <span className="font-cairo text-[10px] opacity-70">{st.label}</span>
        </div>
      </button>
    );
  };

  // Compact booking chip for weekly view
  const BookingChip = ({ bk }: { bk: CalBooking }) => {
    const st = STATUS_CONFIG[bk.status || 'pending'];
    return (
      <button
        onClick={() => setDetailBooking(bk)}
        className={`w-full text-right rounded px-1.5 py-0.5 transition-all hover:opacity-80 ${st.barBg} text-white`}
      >
        <span className="font-cairo text-[10px] font-medium truncate block">{bk.patient_name.split(' ')[0]}</span>
      </button>
    );
  };

  // Shift indicator bar
  const ShiftBar = ({ shift }: { shift: ShiftInfo }) => (
    <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-primary/10 border border-primary/20">
      <Clock className="h-3 w-3 text-primary" />
      <span className="font-cairo text-[10px] text-primary font-medium">{shift.label}: {shift.start_time} - {shift.end_time}</span>
    </div>
  );

  if (loading && !bookings.length) {
    return <DashboardLayout><div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="font-cairo text-xl font-bold text-foreground flex items-center gap-2">
              <CalIcon className="h-6 w-6 text-primary" /> التقويم الذكي
            </h1>
            <p className="font-cairo text-sm text-muted-foreground">
              {format(selectedDate, 'EEEE d MMMM yyyy', { locale: ar })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button className="font-cairo gap-1.5" onClick={() => openAddDialog()}>
              <Plus className="h-4 w-4" /> إضافة موعد
            </Button>
            <Button variant="outline" size="sm" className="font-cairo" onClick={goToday}>اليوم</Button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3">
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <div key={key} className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded ${cfg.barBg}`} />
              <span className="font-cairo text-xs text-muted-foreground">{cfg.label}</span>
            </div>
          ))}
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {[
            { label: 'إجمالي', value: todayStats.total, color: 'text-foreground', icon: CalIcon },
            { label: 'مؤكد', value: todayStats.confirmed, color: 'text-emerald-600', icon: null },
            { label: 'معلّق', value: todayStats.pending, color: 'text-amber-600', icon: null },
            { label: 'مكتمل', value: todayStats.completed, color: 'text-slate-500', icon: null },
            { label: 'الإيراد', value: `${todayStats.revenue.toLocaleString()}`, color: 'text-primary', icon: Wallet },
          ].map(s => (
            <div key={s.label} className="rounded-lg bg-card border border-border p-2 text-center">
              <p className={`font-cairo text-lg font-bold ${s.color}`}>{s.value}</p>
              <p className="font-cairo text-[10px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* View tabs */}
        <Tabs value={view} onValueChange={(v) => setView(v as any)}>
          <TabsList className="font-cairo">
            <TabsTrigger value="daily" className="font-cairo gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" /> يومي
            </TabsTrigger>
            <TabsTrigger value="weekly" className="font-cairo gap-1.5">
              <CalendarRange className="h-3.5 w-3.5" /> أسبوعي
            </TabsTrigger>
            <TabsTrigger value="monthly" className="font-cairo gap-1.5">
              <LayoutGrid className="h-3.5 w-3.5" /> شهري
            </TabsTrigger>
          </TabsList>

          {/* ====== DAILY VIEW ====== */}
          <TabsContent value="daily" className="mt-4 space-y-3">
            {/* Day navigation */}
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="icon" onClick={nextDay}><ChevronRight className="h-4 w-4" /></Button>
              <span className="font-cairo font-semibold text-foreground">{format(selectedDate, 'EEEE d MMMM', { locale: ar })}</span>
              <Button variant="ghost" size="icon" onClick={prevDay}><ChevronLeft className="h-4 w-4" /></Button>
            </div>

            {/* Quick week strip */}
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {weekDates.map((date, i) => {
                const sel = isSameDay(date, selectedDate);
                const today = isToday(date);
                const count = bookingsForDate(date).length;
                return (
                  <button
                    key={i}
                    onClick={() => setSelectedDate(date)}
                    className={`flex flex-col items-center min-w-[56px] px-2 py-1.5 rounded-lg transition-colors font-cairo ${
                      sel ? 'bg-primary text-primary-foreground' :
                      today ? 'bg-primary/10 text-primary' :
                      'bg-muted/50 hover:bg-muted text-foreground'
                    }`}
                  >
                    <span className="text-[10px]">{DAYS_AR[i]}</span>
                    <span className="text-sm font-bold">{date.getDate()}</span>
                    {count > 0 && <span className={`text-[9px] ${sel ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>{count}</span>}
                  </button>
                );
              })}
            </div>

            {/* Shifts for this day */}
            {shiftsForDate(selectedDate).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {shiftsForDate(selectedDate).map(s => <ShiftBar key={s.id} shift={s} />)}
              </div>
            )}

            {/* Time grid */}
            <Card>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {WORK_HOURS.map(hour => {
                    const hourBookings = todayBookings.filter(a => parseHour(a.start_time) === hour);
                    const inShift = isShiftHour(selectedDate, hour);
                    return (
                      <div key={hour} className={`flex min-h-[60px] ${inShift ? 'bg-primary/[0.03]' : ''}`}>
                        <div className="w-14 shrink-0 flex items-start justify-center pt-2 text-muted-foreground font-cairo text-xs border-l border-border">
                          {hour > 12 ? `${hour - 12} م` : hour === 12 ? '12 م' : `${hour} ص`}
                        </div>
                        <div
                          className={`flex-1 p-1.5 space-y-1.5 ${inShift && hourBookings.length === 0 ? 'cursor-pointer hover:bg-primary/[0.05]' : ''}`}
                          onClick={() => inShift && hourBookings.length === 0 && openAddDialog(selectedDate, hour)}
                        >
                          {hourBookings.length > 0 ? hourBookings.map(bk => (
                            <BookingBar key={bk.id} bk={bk} />
                          )) : inShift ? (
                            <div className="h-full flex items-center justify-center">
                              <span className="font-cairo text-xs text-muted-foreground/40">متاح — اضغط للإضافة</span>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ====== WEEKLY VIEW ====== */}
          <TabsContent value="weekly" className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="icon" onClick={nextWeek}><ChevronRight className="h-4 w-4" /></Button>
              <span className="font-cairo font-semibold text-foreground">
                {format(weekDates[0], 'd MMM', { locale: ar })} — {format(weekDates[6], 'd MMM yyyy', { locale: ar })}
              </span>
              <Button variant="ghost" size="icon" onClick={prevWeek}><ChevronLeft className="h-4 w-4" /></Button>
            </div>

            <Card className="overflow-x-auto">
              <CardContent className="p-0">
                <table className="w-full min-w-[750px]">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="w-14 p-2" />
                      {weekDates.map((date, i) => {
                        const today = isToday(date);
                        const count = bookingsForDate(date).length;
                        return (
                          <th
                            key={i}
                            className="p-2 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => { setSelectedDate(date); setView('daily'); }}
                          >
                            <div className="font-cairo text-[10px] text-muted-foreground">{DAYS_AR[i]}</div>
                            <div className={`text-sm font-cairo font-bold mx-auto ${today ? 'bg-primary text-primary-foreground rounded-full w-7 h-7 flex items-center justify-center' : 'text-foreground'}`}>
                              {date.getDate()}
                            </div>
                            {count > 0 && (
                              <Badge variant="secondary" className="font-cairo text-[9px] px-1 py-0 mt-0.5">{count}</Badge>
                            )}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {WORK_HOURS.map(hour => (
                      <tr key={hour} className="border-b border-border/50">
                        <td className="p-1 text-center font-cairo text-[10px] text-muted-foreground align-top pt-2">
                          {hour > 12 ? `${hour - 12} م` : hour === 12 ? '12 م' : `${hour} ص`}
                        </td>
                        {weekDates.map((date, i) => {
                          const hourBookings = bookingsForDate(date).filter(b => parseHour(b.start_time) === hour);
                          const inShift = isShiftHour(date, hour);
                          return (
                            <td
                              key={i}
                              className={`p-0.5 align-top ${inShift ? 'bg-primary/[0.03]' : ''} ${inShift && hourBookings.length === 0 ? 'cursor-pointer hover:bg-primary/[0.08]' : ''}`}
                              onClick={() => inShift && hourBookings.length === 0 && openAddDialog(date, hour)}
                            >
                              {hourBookings.map(bk => (
                                <BookingChip key={bk.id} bk={bk} />
                              ))}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ====== MONTHLY VIEW ====== */}
          <TabsContent value="monthly" className="mt-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <CardTitle className="font-cairo text-base">
                    {format(currentMonth, 'MMMM yyyy', { locale: ar })}
                  </CardTitle>
                  <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(prev => subMonths(prev, 1))}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {/* Day headers */}
                <div className="grid grid-cols-7 mb-1">
                  {DAYS_AR.map(d => (
                    <div key={d} className="text-center font-cairo text-[10px] text-muted-foreground py-1">{d}</div>
                  ))}
                </div>

                {/* Day cells */}
                <div className="grid grid-cols-7 gap-0.5">
                  {/* Empty cells before first day */}
                  {Array.from({ length: yemenDayIndex(monthDays[0].getDay()) }, (_, i) => (
                    <div key={`e-${i}`} className="aspect-square" />
                  ))}
                  {monthDays.map(day => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const dayBks = bookingsForDate(day);
                    const today = isToday(day);
                    const sel = isSameDay(day, selectedDate);
                    const hasShifts = shiftsForDate(day).length > 0;
                    return (
                      <button
                        key={dateStr}
                        onClick={() => { setSelectedDate(day); setView('daily'); }}
                        className={`aspect-square rounded-lg flex flex-col items-center justify-center transition-all relative ${
                          sel ? 'ring-2 ring-primary bg-primary/5' :
                          today ? 'bg-primary text-primary-foreground' :
                          dayBks.length > 0 ? 'bg-muted/70 hover:bg-muted' :
                          'hover:bg-muted/40'
                        }`}
                      >
                        <span className={`font-cairo text-sm ${today && !sel ? 'font-bold' : ''}`}>{day.getDate()}</span>
                        {dayBks.length > 0 && (
                          <div className="flex items-center gap-0.5 mt-0.5">
                            {dayBks.length <= 3 ? dayBks.map(bk => (
                              <div key={bk.id} className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[bk.status || 'pending'].dot}`} />
                            )) : (
                              <span className={`font-cairo text-[9px] ${today && !sel ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>{dayBks.length}</span>
                            )}
                          </div>
                        )}
                        {/* Shift indicator */}
                        {hasShifts && !today && (
                          <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-[2px] rounded-full bg-primary/30" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* ====== Booking Detail Dialog ====== */}
      <Dialog open={!!detailBooking} onOpenChange={() => setDetailBooking(null)}>
        <DialogContent className="max-w-sm font-cairo" dir="rtl">
          <DialogHeader>
            <DialogTitle className="font-cairo text-base">تفاصيل الموعد</DialogTitle>
          </DialogHeader>
          {detailBooking && (() => {
            const st = STATUS_CONFIG[detailBooking.status || 'pending'];
            const shift = shifts.find(s => s.id === detailBooking.shift_id);
            const typeInfo = bookingTypeLabels[detailBooking.booking_type || 'clinic'];
            return (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-cairo font-bold text-foreground text-lg">{detailBooking.patient_name}</p>
                    <Badge className={`${st.barBg} text-white border-0 font-cairo text-[10px]`}>{st.label}</Badge>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CalIcon className="h-4 w-4" />
                    <span>{detailBooking.booking_date}</span>
                  </div>
                  {detailBooking.start_time && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{detailBooking.start_time}{detailBooking.end_time ? ` — ${detailBooking.end_time}` : ''}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{typeInfo?.icon} {typeInfo?.ar || 'عيادة'}</span>
                  </div>
                  {shift && (
                    <div className="flex items-center gap-2 text-primary">
                      <Clock className="h-4 w-4" />
                      <span>{shift.label} ({shift.start_time} - {shift.end_time})</span>
                    </div>
                  )}
                  {detailBooking.final_price ? (
                    <div className="flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-primary" />
                      <span className="font-cairo font-bold text-primary">{detailBooking.final_price.toLocaleString()} ر.ي</span>
                    </div>
                  ) : null}
                  {detailBooking.notes && (
                    <p className="rounded-lg bg-muted p-2 text-xs text-muted-foreground">{detailBooking.notes}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  {(detailBooking.status === 'confirmed' || detailBooking.status === 'pending') && (
                    <Button
                      className="font-cairo gap-1.5"
                      onClick={() => {
                        setDetailBooking(null);
                        navigate(`/dashboard/consultation?booking=${detailBooking.id}`);
                      }}
                    >
                      <Play className="h-4 w-4" /> بدء الجلسة
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    className="font-cairo gap-1.5"
                    onClick={() => {
                      setDetailBooking(null);
                      navigate(`/dashboard/patients/${detailBooking.patient_id}`);
                    }}
                  >
                    <FileUser className="h-4 w-4" /> ملف المريض
                  </Button>
                  {(detailBooking.status === 'confirmed' || detailBooking.status === 'pending') && (
                    <Button
                      variant="destructive"
                      className="font-cairo gap-1.5 col-span-2"
                      disabled={cancellingId === detailBooking.id}
                      onClick={() => handleCancelBooking(detailBooking.id)}
                    >
                      {cancellingId === detailBooking.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                      إلغاء الموعد
                    </Button>
                  )}
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* ====== Add Appointment Dialog ====== */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md font-cairo" dir="rtl">
          <DialogHeader>
            <DialogTitle className="font-cairo text-lg flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" /> إضافة موعد جديد
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Patient Search */}
            <div className="space-y-2">
              <Label className="font-cairo">المريض *</Label>
              {addForm.patientId ? (
                <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2 bg-muted/30">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    <span className="font-cairo text-sm font-medium">{addForm.patientName}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setAddForm(prev => ({ ...prev, patientId: '', patientName: '' }))}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="ابحث بالاسم أو رقم الهاتف..."
                    className="font-cairo pr-9"
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                  />
                  {searchingPatients && (
                    <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>
              )}
              {patientOptions.length > 0 && !addForm.patientId && (
                <div className="border border-border rounded-lg max-h-40 overflow-y-auto">
                  {patientOptions.map(p => (
                    <button
                      key={p.id}
                      className="w-full text-right px-3 py-2 hover:bg-muted transition-colors font-cairo text-sm flex items-center justify-between"
                      onClick={() => {
                        setAddForm(prev => ({ ...prev, patientId: p.id, patientName: p.name }));
                        setPatientOptions([]);
                        setPatientSearch('');
                      }}
                    >
                      <span>{p.name}</span>
                      {p.phone && <span className="text-xs text-muted-foreground">{p.phone}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label className="font-cairo">التاريخ</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start font-cairo">
                    <CalIcon className="h-4 w-4 ml-2" />
                    {format(addForm.date, 'EEEE d MMMM yyyy', { locale: ar })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={addForm.date}
                    onSelect={(d) => d && setAddForm(prev => ({ ...prev, date: d }))}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Time & Shift */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="font-cairo">الوقت</Label>
                <Select value={addForm.time} onValueChange={(v) => setAddForm(prev => ({ ...prev, time: v }))}>
                  <SelectTrigger className="font-cairo">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WORK_HOURS.map(h => (
                      <SelectItem key={h} value={`${h.toString().padStart(2, '0')}:00`} className="font-cairo">
                        {h > 12 ? `${h - 12}:00 م` : h === 12 ? '12:00 م' : `${h}:00 ص`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="font-cairo">الفترة</Label>
                <Select value={addForm.shiftId} onValueChange={(v) => setAddForm(prev => ({ ...prev, shiftId: v }))}>
                  <SelectTrigger className="font-cairo">
                    <SelectValue placeholder="اختر الفترة" />
                  </SelectTrigger>
                  <SelectContent>
                    {shifts.map(s => (
                      <SelectItem key={s.id} value={s.id} className="font-cairo">{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Type & Price */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="font-cairo">نوع الموعد</Label>
                <Select value={addForm.bookingType} onValueChange={(v) => setAddForm(prev => ({ ...prev, bookingType: v }))}>
                  <SelectTrigger className="font-cairo">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(bookingTypeLabels).map(([key, val]) => (
                      <SelectItem key={key} value={key} className="font-cairo">{val.icon} {val.ar}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="font-cairo">السعر (ر.ي)</Label>
                <Input
                  type="number"
                  className="font-cairo"
                  value={addForm.price}
                  onChange={(e) => setAddForm(prev => ({ ...prev, price: Number(e.target.value) }))}
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label className="font-cairo">ملاحظات</Label>
              <Input
                className="font-cairo"
                placeholder="ملاحظات اختيارية..."
                value={addForm.notes}
                onChange={(e) => setAddForm(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className="font-cairo" onClick={() => setShowAddDialog(false)}>إلغاء</Button>
            <Button className="font-cairo gap-1.5" onClick={handleSaveBooking} disabled={savingBooking || !addForm.patientId}>
              {savingBooking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              حفظ الموعد
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default DashboardCalendar;
