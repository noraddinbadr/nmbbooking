import { CalendarPlus, UserPlus, BarChart3, Stethoscope, Clock, DollarSign, Star, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { dashboardStats, dashboardAppointments, notifications } from '@/data/dashboardMockData';
import { useNavigate } from 'react-router-dom';

const DashboardHome = () => {
  const navigate = useNavigate();
  const stats = dashboardStats;
  const todayAppts = dashboardAppointments.filter(a => a.slotDate === '2026-02-22');
  const pendingCount = todayAppts.filter(a => a.status === 'pending').length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page title */}
        <div className="flex items-center justify-between">
          <h1 className="font-cairo text-2xl font-bold text-foreground">لوحة التحكم</h1>
          <p className="font-cairo text-sm text-muted-foreground">الأحد، 22 فبراير 2026</p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => navigate('/dashboard/calendar')} className="font-cairo gap-2">
            <CalendarPlus className="h-4 w-4" /> موعد جديد
          </Button>
          <Button variant="outline" onClick={() => navigate('/dashboard/patients')} className="font-cairo gap-2">
            <UserPlus className="h-4 w-4" /> مريض جديد
          </Button>
          <Button variant="outline" onClick={() => navigate('/dashboard/reports')} className="font-cairo gap-2">
            <BarChart3 className="h-4 w-4" /> التقارير
          </Button>
          <Button variant="outline" onClick={() => navigate('/dashboard/services')} className="font-cairo gap-2">
            <Stethoscope className="h-4 w-4" /> خدماتي
          </Button>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Today's appointments */}
          <Card className="shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <Badge variant="secondary" className="font-cairo text-xs">{pendingCount} معلّق</Badge>
              </div>
              <p className="font-cairo text-2xl font-bold text-foreground">{stats.todayAppointments.completed}/{stats.todayAppointments.total}</p>
              <p className="font-cairo text-xs text-muted-foreground mt-1">مواعيد اليوم</p>
              <Progress value={(stats.todayAppointments.completed / stats.todayAppointments.total) * 100} className="mt-2 h-1.5" />
              <p className="font-cairo text-xs text-muted-foreground mt-1">متبقي {stats.todayAppointments.remainingTime}</p>
            </CardContent>
          </Card>

          {/* Revenue */}
          <Card className="shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-emerald-500" />
                </div>
              </div>
              <p className="font-cairo text-2xl font-bold text-foreground">{stats.dailyRevenue.toLocaleString()}</p>
              <p className="font-cairo text-xs text-muted-foreground mt-1">ريال — إيرادات اليوم</p>
              <div className="flex items-end gap-1 mt-2 h-8">
                {stats.weeklyRevenue.map((v, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-sm bg-primary/20"
                    style={{ height: `${(v / Math.max(...stats.weeklyRevenue)) * 100}%` }}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Reviews */}
          <Card className="shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Star className="h-5 w-5 text-amber-500" />
                </div>
                <Badge variant="secondary" className="font-cairo text-xs">+{stats.newReviews.thisWeek} هذا الأسبوع</Badge>
              </div>
              <p className="font-cairo text-2xl font-bold text-foreground">{stats.newReviews.average}★</p>
              <p className="font-cairo text-xs text-muted-foreground mt-1">من {stats.newReviews.total} تقييم</p>
              <div className="flex gap-0.5 mt-2">
                {[5, 4, 3, 2, 1].map(s => (
                  <Star key={s} className={`h-3.5 w-3.5 ${s <= Math.round(stats.newReviews.average) ? 'fill-amber-500 text-amber-500' : 'text-muted'}`} />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Waiting */}
          <Card className="shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-destructive" />
                </div>
              </div>
              <p className="font-cairo text-2xl font-bold text-foreground">{stats.waitingPatients}</p>
              <p className="font-cairo text-xs text-muted-foreground mt-1">مرضى بالانتظار</p>
              <Button variant="link" className="font-cairo text-xs p-0 h-auto mt-2" onClick={() => navigate('/dashboard/bookings')}>
                عرض قائمة الانتظار ←
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Today's Schedule + Notifications */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Today schedule */}
          <Card className="lg:col-span-2 shadow-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="font-cairo text-lg">مواعيد اليوم</CardTitle>
                <Button variant="link" className="font-cairo text-xs" onClick={() => navigate('/dashboard/bookings')}>عرض الكل</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {todayAppts.slice(0, 5).map(appt => (
                <div key={appt.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-8 rounded-full ${
                      appt.status === 'confirmed' ? 'bg-emerald-500' :
                      appt.status === 'pending' ? 'bg-amber-500' :
                      appt.status === 'completed' ? 'bg-muted-foreground' : 'bg-destructive'
                    }`} />
                    <div>
                      <p className="font-cairo text-sm font-medium text-foreground">{appt.patientName}</p>
                      <p className="font-cairo text-xs text-muted-foreground">{appt.slotTime} — {appt.durationMin} دقيقة • {appt.bookingType === 'video' ? '📹 فيديو' : '🏥 عيادة'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {appt.priority === 'emergency' && <Badge variant="destructive" className="font-cairo text-[10px]">طوارئ</Badge>}
                    {appt.classification === 'sponsored' && <Badge className="font-cairo text-[10px] bg-emerald-500">مموّل</Badge>}
                    <span className="font-cairo text-sm font-medium text-foreground">{appt.price.toLocaleString()} ر.ي</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="font-cairo text-lg">الإشعارات</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {notifications.map(n => (
                <div key={n.id} className={`p-3 rounded-lg text-sm font-cairo ${n.isRead ? 'bg-muted/30' : 'bg-primary/5 border border-primary/20'}`}>
                  <p className="font-medium text-foreground">{n.titleAr}</p>
                  <p className="text-xs text-muted-foreground mt-1">{n.bodyAr}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardHome;
