import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { ChevronRight, ChevronLeft, Plus, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, startOfWeek, addDays, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns';
import { ar } from 'date-fns/locale';

const DAYS_AR = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
const HOURS = Array.from({ length: 12 }, (_, i) => i + 8); // 8AM to 7PM

const statusColors: Record<string, string> = {
  pending: 'bg-amber-500',
  confirmed: 'bg-emerald-500',
  completed: 'bg-muted-foreground',
  cancelled: 'bg-foreground',
};

const statusLabels: Record<string, string> = {
  pending: 'معلّق',
  confirmed: 'مؤكد',
  completed: 'مكتمل',
  cancelled: 'ملغي',
};

interface CalendarBooking {
  id: string;
  booking_date: string;
  start_time: string | null;
  status: string | null;
  booking_type: string | null;
  patient_name: string;
}

const DashboardCalendar = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [view, setView] = useState('daily');
  const [bookings, setBookings] = useState<CalendarBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [doctorId, setDoctorId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase.from('doctors').select('id').eq('user_id', user.id).maybeSingle();
      if (data) setDoctorId(data.id);
    };
    fetch();
  }, [user]);

  // Fetch bookings for the visible range
  useEffect(() => {
    if (!doctorId) { setLoading(false); return; }
    const fetch = async () => {
      setLoading(true);
      const monthStart = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
      const monthEnd = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

      const { data: bks } = await supabase
        .from('bookings')
        .select('id, booking_date, start_time, status, booking_type, patient_id')
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
    };
    fetch();
  }, [doctorId, currentMonth]);

  // Week dates starting Saturday
  const weekStart = useMemo(() => {
    const d = new Date(selectedDate);
    const day = d.getDay(); // 0=Sun
    const satOffset = day === 6 ? 0 : -(day + 1); // go back to Saturday
    const sat = new Date(d);
    sat.setDate(sat.getDate() + satOffset);
    return sat;
  }, [selectedDate]);

  const weekDates = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return format(d, 'yyyy-MM-dd');
  }), [weekStart]);

  const dayAppointments = bookings.filter(a => a.booking_date === selectedDate);

  // Month days
  const monthDays = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const monthLabel = format(currentMonth, 'MMMM yyyy', { locale: ar });

  if (loading) {
    return <DashboardLayout><div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-cairo text-2xl font-bold text-foreground">التقويم الذكي</h1>
          <Button className="font-cairo gap-2"><Plus className="h-4 w-4" /> إضافة موعد</Button>
        </div>

        <div className="flex flex-wrap gap-3">
          {Object.entries(statusLabels).map(([key, label]) => (
            <div key={key} className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded-full ${statusColors[key]}`} />
              <span className="font-cairo text-xs text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>

        <Tabs value={view} onValueChange={setView}>
          <TabsList className="font-cairo">
            <TabsTrigger value="monthly" className="font-cairo">شهري</TabsTrigger>
            <TabsTrigger value="weekly" className="font-cairo">أسبوعي</TabsTrigger>
            <TabsTrigger value="daily" className="font-cairo">يومي</TabsTrigger>
          </TabsList>

          {/* Daily View */}
          <TabsContent value="daily">
            <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
              {weekDates.map((date, i) => {
                const d = new Date(date);
                const isSelected = date === selectedDate;
                return (
                  <button key={date} onClick={() => setSelectedDate(date)} className={`flex flex-col items-center px-4 py-2 rounded-lg min-w-[70px] transition-colors font-cairo ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-foreground'}`}>
                    <span className="text-xs">{DAYS_AR[i]}</span>
                    <span className="text-lg font-bold">{d.getDate()}</span>
                  </button>
                );
              })}
            </div>

            <Card className="shadow-card">
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {HOURS.map(hour => {
                    const appts = dayAppointments.filter(a => a.start_time && parseInt(a.start_time.split(':')[0]) === hour);
                    return (
                      <div key={hour} className="flex min-h-[60px]">
                        <div className="w-16 shrink-0 p-2 text-left font-cairo text-xs text-muted-foreground border-l border-border flex items-start justify-center pt-3">
                          {hour > 12 ? `${hour - 12} م` : `${hour} ص`}
                        </div>
                        <div className="flex-1 p-1.5 space-y-1">
                          {appts.map(appt => (
                            <div key={appt.id} className={`p-2 rounded-md text-primary-foreground ${statusColors[appt.status || 'pending']} cursor-pointer hover:opacity-90 transition-opacity`}>
                              <div className="flex items-center justify-between">
                                <span className="font-cairo text-xs font-medium">{appt.patient_name}</span>
                              </div>
                              <span className="font-cairo text-[10px] opacity-80">
                                {appt.booking_type === 'video' ? '📹' : '🏥'} {statusLabels[appt.status || 'pending']}
                              </span>
                            </div>
                          ))}
                          {appts.length === 0 && (
                            <div className="h-full flex items-center justify-center">
                              <span className="font-cairo text-xs text-muted-foreground/50">متاح</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Weekly View */}
          <TabsContent value="weekly">
            <Card className="shadow-card overflow-x-auto">
              <CardContent className="p-0">
                <table className="w-full min-w-[700px]">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="w-16 p-2 font-cairo text-xs text-muted-foreground"></th>
                      {weekDates.map((date, i) => {
                        const d = new Date(date);
                        const isToday = date === format(new Date(), 'yyyy-MM-dd');
                        return (
                          <th key={date} className={`p-2 text-center font-cairo text-xs ${isToday ? 'text-primary font-bold' : 'text-muted-foreground'}`}>
                            <div>{DAYS_AR[i]}</div>
                            <div className={`text-lg ${isToday ? 'bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center mx-auto' : ''}`}>{d.getDate()}</div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {HOURS.map(hour => (
                      <tr key={hour} className="border-b border-border">
                        <td className="p-2 text-center font-cairo text-xs text-muted-foreground">{hour > 12 ? `${hour - 12} م` : `${hour} ص`}</td>
                        {weekDates.map(date => {
                          const appts = bookings.filter(a => a.booking_date === date && a.start_time && parseInt(a.start_time.split(':')[0]) === hour);
                          return (
                            <td key={date} className="p-1 align-top">
                              {appts.map(a => (
                                <div key={a.id} className={`text-[10px] p-1 rounded ${statusColors[a.status || 'pending']} text-primary-foreground font-cairo mb-0.5`}>
                                  {a.patient_name.split(' ')[0]}
                                </div>
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

          {/* Monthly View */}
          <TabsContent value="monthly">
            <Card className="shadow-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(prev => { const d = new Date(prev); d.setMonth(d.getMonth() - 1); return d; })}><ChevronRight className="h-4 w-4" /></Button>
                  <CardTitle className="font-cairo text-lg">{monthLabel}</CardTitle>
                  <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(prev => { const d = new Date(prev); d.setMonth(d.getMonth() + 1); return d; })}><ChevronLeft className="h-4 w-4" /></Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-1">
                  {DAYS_AR.map(d => (
                    <div key={d} className="text-center font-cairo text-xs text-muted-foreground py-2">{d}</div>
                  ))}
                  {/* Offset for first day */}
                  {Array.from({ length: (getDay(monthDays[0]) + 1) % 7 }, (_, i) => (
                    <div key={`empty-${i}`} />
                  ))}
                  {monthDays.map(day => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const count = bookings.filter(a => a.booking_date === dateStr).length;
                    const isToday = dateStr === format(new Date(), 'yyyy-MM-dd');
                    return (
                      <button
                        key={dateStr}
                        onClick={() => { setSelectedDate(dateStr); setView('daily'); }}
                        className={`aspect-square rounded-lg flex flex-col items-center justify-center text-sm font-cairo transition-colors ${
                          isToday ? 'bg-primary text-primary-foreground' :
                          count > 0 ? 'bg-muted hover:bg-muted/80' : 'hover:bg-muted/50'
                        }`}
                      >
                        <span>{day.getDate()}</span>
                        {count > 0 && <span className="text-[10px]">{count} موعد</span>}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default DashboardCalendar;
