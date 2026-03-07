import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { Download, TrendingUp, Users, DollarSign, Star, CalendarCheck, PieChart, BarChart3, Loader2 } from 'lucide-react';

const DashboardReports = () => {
  const { data: stats, isLoading } = useDashboardStats();

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  const rating = stats?.rating || 0;
  const totalReviews = stats?.totalReviews || 0;
  const dailyRevenue = stats?.dailyRevenue || 0;
  const todayTotal = stats?.todayTotal || 0;
  const todayCompleted = stats?.todayCompleted || 0;
  const attendanceRate = todayTotal > 0 ? Math.round((todayCompleted / todayTotal) * 100) : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-cairo text-2xl font-bold text-foreground">التقارير والتحليلات</h1>
          <Button variant="outline" className="font-cairo gap-2"><Download className="h-4 w-4" /> تصدير PDF</Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Users className="h-5 w-5 text-primary" />
                <Badge className="font-cairo text-xs bg-emerald-500/10 text-emerald-600"><TrendingUp className="h-3 w-3 inline" /> ديناميكي</Badge>
              </div>
              <p className="font-cairo text-2xl font-bold text-foreground">{todayTotal}</p>
              <p className="font-cairo text-xs text-muted-foreground">مرضى اليوم</p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="h-5 w-5 text-emerald-500" />
              </div>
              <p className="font-cairo text-2xl font-bold text-foreground">{dailyRevenue.toLocaleString()}</p>
              <p className="font-cairo text-xs text-muted-foreground">ريال — إيرادات اليوم</p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Star className="h-5 w-5 text-amber-500" />
              </div>
              <p className="font-cairo text-2xl font-bold text-foreground">{rating}★</p>
              <p className="font-cairo text-xs text-muted-foreground">من {totalReviews} تقييم</p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <CalendarCheck className="h-5 w-5 text-primary" />
              </div>
              <p className="font-cairo text-2xl font-bold text-foreground">{attendanceRate}%</p>
              <p className="font-cairo text-xs text-muted-foreground">معدل الإكمال</p>
              <Progress value={attendanceRate} className="mt-2 h-2" />
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="font-cairo text-lg flex items-center gap-2"><BarChart3 className="h-5 w-5" /> ملخص المواعيد اليوم</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="rounded-xl bg-emerald-500/10 p-4">
                <p className="font-cairo text-2xl font-bold text-emerald-600">{todayCompleted}</p>
                <p className="font-cairo text-xs text-muted-foreground">مكتمل</p>
              </div>
              <div className="rounded-xl bg-amber-500/10 p-4">
                <p className="font-cairo text-2xl font-bold text-amber-600">{stats?.todayPending || 0}</p>
                <p className="font-cairo text-xs text-muted-foreground">معلّق</p>
              </div>
              <div className="rounded-xl bg-primary/10 p-4">
                <p className="font-cairo text-2xl font-bold text-primary">{stats?.waitingPatients || 0}</p>
                <p className="font-cairo text-xs text-muted-foreground">بالانتظار</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="font-cairo text-lg">مواعيد الغد — {stats?.tomorrowCount || 0} موعد</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-cairo text-sm text-muted-foreground text-center py-6">
              {(stats?.tomorrowCount || 0) > 0
                ? `لديك ${stats?.tomorrowCount} موعد غداً`
                : 'لا توجد مواعيد غداً بعد'}
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default DashboardReports;
