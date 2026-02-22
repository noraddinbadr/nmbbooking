import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { dashboardAppointments } from '@/data/dashboardMockData';
import { ChevronRight, ChevronLeft, Plus } from 'lucide-react';

const DAYS_AR = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
const HOURS = Array.from({ length: 12 }, (_, i) => i + 9); // 9AM to 8PM

const statusColors: Record<string, string> = {
  pending: 'bg-amber-500',
  confirmed: 'bg-emerald-500',
  in_progress: 'bg-primary',
  completed: 'bg-muted-foreground',
  cancelled: 'bg-foreground',
  no_show: 'bg-destructive',
};

const statusLabels: Record<string, string> = {
  pending: 'معلّق',
  confirmed: 'مؤكد',
  in_progress: 'جاري',
  completed: 'مكتمل',
  cancelled: 'ملغي',
  no_show: 'لم يحضر',
};

const DashboardCalendar = () => {
  const [selectedDate, setSelectedDate] = useState('2026-02-22');
  const [view, setView] = useState('daily');

  // Generate week dates
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date('2026-02-21'); // Saturday
    d.setDate(d.getDate() + i);
    return d.toISOString().split('T')[0];
  });

  const dayAppointments = dashboardAppointments.filter(a => a.slotDate === selectedDate);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-cairo text-2xl font-bold text-foreground">التقويم الذكي</h1>
          <Button className="font-cairo gap-2"><Plus className="h-4 w-4" /> إضافة موعد</Button>
        </div>

        {/* Legend */}
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
            {/* Date selector */}
            <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
              {weekDates.map((date, i) => {
                const d = new Date(date);
                const isSelected = date === selectedDate;
                return (
                  <button
                    key={date}
                    onClick={() => setSelectedDate(date)}
                    className={`flex flex-col items-center px-4 py-2 rounded-lg min-w-[70px] transition-colors font-cairo ${
                      isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-foreground'
                    }`}
                  >
                    <span className="text-xs">{DAYS_AR[i]}</span>
                    <span className="text-lg font-bold">{d.getDate()}</span>
                  </button>
                );
              })}
            </div>

            {/* Time grid */}
            <Card className="shadow-card">
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {HOURS.map(hour => {
                    const appts = dayAppointments.filter(a => parseInt(a.slotTime.split(':')[0]) === hour);
                    return (
                      <div key={hour} className="flex min-h-[60px]">
                        <div className="w-16 shrink-0 p-2 text-left font-cairo text-xs text-muted-foreground border-l border-border flex items-start justify-center pt-3">
                          {hour > 12 ? `${hour - 12} م` : `${hour} ص`}
                        </div>
                        <div className="flex-1 p-1.5 space-y-1">
                          {appts.map(appt => (
                            <div
                              key={appt.id}
                              className={`p-2 rounded-md text-primary-foreground ${statusColors[appt.status]} cursor-pointer hover:opacity-90 transition-opacity`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-cairo text-xs font-medium">{appt.patientName}</span>
                                <span className="font-cairo text-[10px]">{appt.durationMin} د</span>
                              </div>
                              <span className="font-cairo text-[10px] opacity-80">
                                {appt.bookingType === 'video' ? '📹' : '🏥'} {appt.notes || statusLabels[appt.status]}
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
                        const isToday = date === '2026-02-22';
                        return (
                          <th key={date} className={`p-2 text-center font-cairo text-xs ${isToday ? 'text-primary font-bold' : 'text-muted-foreground'}`}>
                            <div>{DAYS_AR[i]}</div>
                            <div className={`text-lg ${isToday ? 'bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center mx-auto' : ''}`}>
                              {d.getDate()}
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {HOURS.map(hour => (
                      <tr key={hour} className="border-b border-border">
                        <td className="p-2 text-center font-cairo text-xs text-muted-foreground">
                          {hour > 12 ? `${hour - 12} م` : `${hour} ص`}
                        </td>
                        {weekDates.map(date => {
                          const appts = dashboardAppointments.filter(a => a.slotDate === date && parseInt(a.slotTime.split(':')[0]) === hour);
                          return (
                            <td key={date} className="p-1 align-top">
                              {appts.map(a => (
                                <div key={a.id} className={`text-[10px] p-1 rounded ${statusColors[a.status]} text-primary-foreground font-cairo mb-0.5`}>
                                  {a.patientName.split(' ')[0]}
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
                  <Button variant="ghost" size="icon"><ChevronRight className="h-4 w-4" /></Button>
                  <CardTitle className="font-cairo text-lg">فبراير 2026</CardTitle>
                  <Button variant="ghost" size="icon"><ChevronLeft className="h-4 w-4" /></Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-1">
                  {DAYS_AR.map(d => (
                    <div key={d} className="text-center font-cairo text-xs text-muted-foreground py-2">{d}</div>
                  ))}
                  {Array.from({ length: 28 }, (_, i) => {
                    const day = i + 1;
                    const dateStr = `2026-02-${String(day).padStart(2, '0')}`;
                    const count = dashboardAppointments.filter(a => a.slotDate === dateStr).length;
                    const isToday = day === 22;
                    return (
                      <button
                        key={i}
                        onClick={() => { setSelectedDate(dateStr); setView('daily'); }}
                        className={`aspect-square rounded-lg flex flex-col items-center justify-center text-sm font-cairo transition-colors ${
                          isToday ? 'bg-primary text-primary-foreground' :
                          count > 0 ? 'bg-muted hover:bg-muted/80' : 'hover:bg-muted/50'
                        }`}
                      >
                        <span>{day}</span>
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
