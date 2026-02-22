import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { dashboardAppointments } from '@/data/dashboardMockData';
import { Check, X, Play, FileText, Search, Clock, Phone } from 'lucide-react';

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: 'معلّق', color: 'bg-amber-500 text-white' },
  confirmed: { label: 'مؤكد', color: 'bg-emerald-500 text-white' },
  in_progress: { label: 'جاري', color: 'bg-primary text-primary-foreground' },
  completed: { label: 'مكتمل', color: 'bg-muted text-muted-foreground' },
  cancelled: { label: 'ملغي', color: 'bg-destructive text-destructive-foreground' },
  no_show: { label: 'لم يحضر', color: 'bg-foreground text-background' },
};

const bookingTypeLabels: Record<string, string> = {
  clinic: '🏥 عيادة',
  home: '🏠 منزلي',
  video: '📹 فيديو',
  voice: '📞 صوتي',
};

const DashboardBookings = () => {
  const [filter, setFilter] = useState('today');
  const [search, setSearch] = useState('');

  const todayAppts = dashboardAppointments.filter(a => a.slotDate === '2026-02-22');
  const allAppts = dashboardAppointments;

  const getFiltered = () => {
    let list = filter === 'today' ? todayAppts :
      filter === 'pending' ? allAppts.filter(a => a.status === 'pending') :
      filter === 'confirmed' ? allAppts.filter(a => a.status === 'confirmed') :
      filter === 'cancelled' ? allAppts.filter(a => ['cancelled', 'no_show'].includes(a.status)) :
      allAppts;

    if (search) {
      list = list.filter(a => a.patientName.includes(search) || a.phone.includes(search));
    }
    return list.sort((a, b) => a.slotTime.localeCompare(b.slotTime));
  };

  const filtered = getFiltered();
  const nextAppt = todayAppts.find(a => a.status === 'confirmed' || a.status === 'pending');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-cairo text-2xl font-bold text-foreground">الحجوزات الواردة</h1>
          <Badge className="font-cairo">{todayAppts.length} موعد اليوم</Badge>
        </div>

        {/* Next appointment countdown */}
        {nextAppt && (
          <Card className="shadow-card border-primary/30 bg-primary/5">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-cairo text-sm font-bold text-foreground">الموعد القادم</p>
                  <p className="font-cairo text-lg font-bold text-primary">{nextAppt.patientName} — {nextAppt.slotTime}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="font-cairo gap-1"><Play className="h-3 w-3" /> بدء الجلسة</Button>
                <Button size="sm" variant="outline" className="font-cairo gap-1"><Phone className="h-3 w-3" /> اتصال</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث بالاسم أو رقم الهاتف..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pr-10 font-cairo"
            />
          </div>
          <Tabs value={filter} onValueChange={setFilter}>
            <TabsList className="font-cairo">
              <TabsTrigger value="today" className="font-cairo">اليوم</TabsTrigger>
              <TabsTrigger value="pending" className="font-cairo">معلّق</TabsTrigger>
              <TabsTrigger value="confirmed" className="font-cairo">مؤكد</TabsTrigger>
              <TabsTrigger value="cancelled" className="font-cairo">ملغي</TabsTrigger>
              <TabsTrigger value="all" className="font-cairo">الكل</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Bookings List */}
        <div className="space-y-3">
          {filtered.map(appt => (
            <Card key={appt.id} className="shadow-card hover:shadow-card-hover transition-shadow">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`w-1.5 h-16 rounded-full shrink-0 ${
                      appt.status === 'confirmed' ? 'bg-emerald-500' :
                      appt.status === 'pending' ? 'bg-amber-500' :
                      appt.status === 'completed' ? 'bg-muted-foreground' : 'bg-destructive'
                    }`} />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-cairo font-bold text-foreground">{appt.patientName}</span>
                        {appt.priority === 'emergency' && <Badge variant="destructive" className="font-cairo text-[10px]">طوارئ</Badge>}
                        {appt.priority === 'urgent' && <Badge className="font-cairo text-[10px] bg-amber-500">عاجل</Badge>}
                        {appt.classification === 'sponsored' && <Badge className="font-cairo text-[10px] bg-emerald-500">مموّل</Badge>}
                      </div>
                      <p className="font-cairo text-sm text-muted-foreground">
                        📅 {appt.slotDate} — {appt.slotTime} | مدة: {appt.durationMin} دقيقة
                      </p>
                      <p className="font-cairo text-sm text-muted-foreground">
                        {bookingTypeLabels[appt.bookingType]} | 📞 {appt.phone}
                      </p>
                      {appt.notes && (
                        <p className="font-cairo text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded">📝 {appt.notes}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <div className="text-left">
                      <p className="font-cairo text-lg font-bold text-foreground">{appt.price.toLocaleString()} ر.ي</p>
                      {appt.fundingAmount > 0 && (
                        <p className="font-cairo text-xs text-emerald-500">تمويل: {appt.fundingAmount.toLocaleString()} ر.ي</p>
                      )}
                    </div>
                    <Badge className={`font-cairo ${statusConfig[appt.status].color}`}>
                      {statusConfig[appt.status].label}
                    </Badge>
                    {(appt.status === 'pending' || appt.status === 'confirmed') && (
                      <div className="flex gap-1.5">
                        {appt.status === 'pending' && (
                          <Button size="sm" className="font-cairo text-xs gap-1 h-7">
                            <Check className="h-3 w-3" /> تأكيد
                          </Button>
                        )}
                        <Button size="sm" variant="outline" className="font-cairo text-xs gap-1 h-7">
                          <Play className="h-3 w-3" /> بدء
                        </Button>
                        <Button size="sm" variant="ghost" className="font-cairo text-xs gap-1 h-7 text-destructive">
                          <X className="h-3 w-3" /> إلغاء
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {filtered.length === 0 && (
            <div className="text-center py-12">
              <p className="font-cairo text-muted-foreground">لا توجد حجوزات</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardBookings;
