import { CalendarPlus, UserPlus, BarChart3, Stethoscope, Clock, DollarSign, Star, Users, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useNotifications } from '@/hooks/useNotifications';
import { useNavigate } from 'react-router-dom';

const DashboardHome = () => {
  const navigate = useNavigate();
  const { data: stats, isLoading } = useDashboardStats();
  const { notifications } = useNotifications();

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  const todayDate = new Date().toLocaleDateString('ar-YE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const todayTotal = stats?.todayTotal || 0;
  const todayCompleted = stats?.todayCompleted || 0;
  const progressPct = todayTotal > 0 ? Math.round((todayCompleted / todayTotal) * 100) : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-cairo text-2xl font-bold text-foreground">لوحة التحكم</h1>
          <p className="font-cairo text-sm text-muted-foreground">{todayDate}</p>
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
          <Card className="shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <Badge variant="secondary" className="font-cairo text-xs">{stats?.todayPending || 0} معلّق</Badge>
              </div>
              <p className="font-cairo text-2xl font-bold text-foreground">{todayCompleted}/{todayTotal}</p>
              <p className="font-cairo text-xs text-muted-foreground mt-1">مواعيد اليوم</p>
              <Progress value={progressPct} className="mt-2 h-1.5" />
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-emerald-500" />
                </div>
              </div>
              <p className="font-cairo text-2xl font-bold text-foreground">{(stats?.dailyRevenue || 0).toLocaleString()}</p>
              <p className="font-cairo text-xs text-muted-foreground mt-1">ريال — إيرادات اليوم</p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Star className="h-5 w-5 text-amber-500" />
                </div>
              </div>
              <p className="font-cairo text-2xl font-bold text-foreground">{stats?.rating || 0}★</p>
              <p className="font-cairo text-xs text-muted-foreground mt-1">من {stats?.totalReviews || 0} تقييم</p>
              <div className="flex gap-0.5 mt-2">
                {[5, 4, 3, 2, 1].map(s => (
                  <Star key={s} className={`h-3.5 w-3.5 ${s <= Math.round(stats?.rating || 0) ? 'fill-amber-500 text-amber-500' : 'text-muted'}`} />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-destructive" />
                </div>
              </div>
              <p className="font-cairo text-2xl font-bold text-foreground">{stats?.waitingPatients || 0}</p>
              <p className="font-cairo text-xs text-muted-foreground mt-1">مرضى بالانتظار</p>
              <Button variant="link" className="font-cairo text-xs p-0 h-auto mt-2" onClick={() => navigate('/dashboard/bookings')}>
                عرض قائمة الانتظار ←
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Today's Schedule + Notifications */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2 shadow-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="font-cairo text-lg">مواعيد اليوم</CardTitle>
                <Button variant="link" className="font-cairo text-xs" onClick={() => navigate('/dashboard/bookings')}>عرض الكل</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {(stats?.todayAppointments || []).length === 0 ? (
                <p className="font-cairo text-sm text-muted-foreground text-center py-6">لا توجد مواعيد اليوم</p>
              ) : (
                stats!.todayAppointments.slice(0, 6).map(appt => (
                  <div key={appt.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-8 rounded-full ${
                        appt.status === 'confirmed' ? 'bg-emerald-500' :
                        appt.status === 'pending' ? 'bg-amber-500' :
                        appt.status === 'completed' ? 'bg-muted-foreground' : 'bg-destructive'
                      }`} />
                      <div>
                        <p className="font-cairo text-sm font-medium text-foreground">{appt.patientName}</p>
                        <p className="font-cairo text-xs text-muted-foreground">
                          {appt.slotTime} • {appt.bookingType === 'video' ? '📹 فيديو' : appt.bookingType === 'home' ? '🏠 منزلي' : '🏥 عيادة'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {(appt.status === 'confirmed' || appt.status === 'pending') && (
                        <Button size="sm" variant="outline" className="font-cairo text-xs gap-1 h-7" onClick={() => navigate(`/dashboard/consultation?booking=${appt.id}`)}>
                          ▶ بدء
                        </Button>
                      )}
                      <span className="font-cairo text-sm font-medium text-foreground">{appt.price.toLocaleString()} ر.ي</span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Notifications from DB */}
          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="font-cairo text-lg">الإشعارات</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {notifications.length === 0 ? (
                <p className="font-cairo text-sm text-muted-foreground text-center py-6">لا توجد إشعارات</p>
              ) : (
                notifications.slice(0, 5).map(n => (
                  <div key={n.id} className={`p-3 rounded-lg text-sm font-cairo ${n.is_read ? 'bg-muted/30' : 'bg-primary/5 border border-primary/20'}`}>
                    <p className="font-medium text-foreground">{n.title_ar}</p>
                    {n.body_ar && <p className="text-xs text-muted-foreground mt-1">{n.body_ar}</p>}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardHome;
