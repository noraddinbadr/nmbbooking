import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, FileText, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const PatientDashboard = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-cairo text-2xl font-bold text-foreground">
            مرحباً {profile?.full_name || 'بك'} 👋
          </h1>
          <p className="text-sm text-muted-foreground font-cairo">إدارة حجوزاتك ومواعيدك الطبية</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/my-bookings')}>
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <div className="rounded-lg bg-primary/10 p-2">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="font-cairo text-base">حجوزاتي</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground font-cairo">عرض وإدارة مواعيدك القادمة</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/doctors')}>
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <div className="rounded-lg bg-primary/10 p-2">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="font-cairo text-base">حجز موعد جديد</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground font-cairo">ابحث عن طبيب واحجز موعدك</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/dashboard/profile')}>
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <div className="rounded-lg bg-primary/10 p-2">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="font-cairo text-base">ملفي الشخصي</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground font-cairo">تحديث بياناتك الشخصية</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PatientDashboard;
