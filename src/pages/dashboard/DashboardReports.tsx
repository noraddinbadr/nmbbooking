import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { dashboardStats, dashboardAppointments } from '@/data/dashboardMockData';
import { Download, TrendingUp, TrendingDown, Users, DollarSign, Star, CalendarCheck, PieChart, BarChart3 } from 'lucide-react';

const DashboardReports = () => {
  const stats = dashboardStats.monthlyStats;
  const tomorrowAppts = dashboardAppointments.filter(a => a.slotDate === '2026-02-23');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-cairo text-2xl font-bold text-foreground">التقارير والتحليلات</h1>
          <Button variant="outline" className="font-cairo gap-2"><Download className="h-4 w-4" /> تصدير PDF</Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Users className="h-5 w-5 text-primary" />
                <Badge className="font-cairo text-xs bg-emerald-500/10 text-emerald-600"><TrendingUp className="h-3 w-3 inline" /> +12%</Badge>
              </div>
              <p className="font-cairo text-2xl font-bold text-foreground">{stats.patientsTreated}</p>
              <p className="font-cairo text-xs text-muted-foreground">مرضى معالجون هذا الشهر</p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="h-5 w-5 text-emerald-500" />
                <Badge className="font-cairo text-xs bg-emerald-500/10 text-emerald-600"><TrendingUp className="h-3 w-3 inline" /> +8%</Badge>
              </div>
              <p className="font-cairo text-2xl font-bold text-foreground">{stats.totalRevenue.toLocaleString()}</p>
              <p className="font-cairo text-xs text-muted-foreground">ريال — إيرادات الشهر</p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Star className="h-5 w-5 text-amber-500" />
              </div>
              <p className="font-cairo text-2xl font-bold text-foreground">4.8★</p>
              <p className="font-cairo text-xs text-muted-foreground">من 127 تقييم</p>
              {/* Rating breakdown */}
              <div className="mt-2 space-y-1">
                {[
                  { stars: 5, pct: 72 },
                  { stars: 4, pct: 18 },
                  { stars: 3, pct: 6 },
                  { stars: 2, pct: 3 },
                  { stars: 1, pct: 1 },
                ].map(r => (
                  <div key={r.stars} className="flex items-center gap-2">
                    <span className="font-cairo text-[10px] w-4">{r.stars}★</span>
                    <Progress value={r.pct} className="h-1.5 flex-1" />
                    <span className="font-cairo text-[10px] text-muted-foreground w-8">{r.pct}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <CalendarCheck className="h-5 w-5 text-primary" />
              </div>
              <p className="font-cairo text-2xl font-bold text-foreground">{stats.attendanceRate}%</p>
              <p className="font-cairo text-xs text-muted-foreground">معدل الحضور</p>
              <Progress value={stats.attendanceRate} className="mt-2 h-2" />
              <p className="font-cairo text-[10px] text-muted-foreground mt-1">{100 - stats.attendanceRate}% لم يحضروا</p>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Chart + Top Services */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Revenue Trend */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="font-cairo text-lg flex items-center gap-2"><BarChart3 className="h-5 w-5" /> اتجاه الإيرادات (6 أشهر)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-3 h-40">
                {[180000, 200000, 220000, 195000, 240000, 250000].map((v, i) => {
                  const months = ['سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر', 'يناير', 'فبراير'];
                  const max = 250000;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <span className="font-cairo text-[10px] text-muted-foreground">{(v / 1000).toFixed(0)}K</span>
                      <div className="w-full rounded-t bg-primary/80 transition-all" style={{ height: `${(v / max) * 120}px` }} />
                      <span className="font-cairo text-[10px] text-muted-foreground">{months[i]}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Top Services */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="font-cairo text-lg flex items-center gap-2"><PieChart className="h-5 w-5" /> أكثر الخدمات طلباً</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {stats.topServices.map((service, i) => {
                const colors = ['bg-primary', 'bg-emerald-500', 'bg-amber-500', 'bg-blue-500'];
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-cairo text-sm text-foreground">{service.name}</span>
                      <span className="font-cairo text-sm font-bold text-foreground">{service.percentage}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-muted rounded-full">
                      <div className={`h-full rounded-full ${colors[i]} transition-all`} style={{ width: `${service.percentage}%` }} />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Tomorrow's Schedule */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="font-cairo text-lg">جدول الغد — {stats.tomorrowAppointments} موعد</CardTitle>
          </CardHeader>
          <CardContent>
            {tomorrowAppts.length > 0 ? (
              <div className="space-y-2">
                {tomorrowAppts.map(a => (
                  <div key={a.id} className="flex items-center justify-between p-2 rounded bg-muted/50 font-cairo text-sm">
                    <span>{a.patientName} — {a.slotTime}</span>
                    <Badge variant="secondary" className="font-cairo text-xs">{a.bookingType === 'video' ? '📹' : '🏥'}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="font-cairo text-sm text-muted-foreground text-center py-6">لا توجد مواعيد غداً بعد</p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default DashboardReports;
