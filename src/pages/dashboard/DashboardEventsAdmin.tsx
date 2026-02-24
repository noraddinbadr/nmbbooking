import { useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mockCamps, mockRegistrations, statusLabels } from '@/data/eventsMockData';
import AdminEventForm from '@/components/events/AdminEventForm';
import RegistrationsTable from '@/components/events/RegistrationsTable';
import { Plus, Calendar, Users, Heart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const DashboardEvents = () => {
  const [showForm, setShowForm] = useState(false);
  const [selectedCampId, setSelectedCampId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleCreateCamp = (data: Record<string, unknown>) => {
    toast({ title: 'تم حفظ الحدث بنجاح', description: data.titleAr as string });
    setShowForm(false);
  };

  const handleCheckin = (regId: string) => {
    toast({ title: 'تم تسجيل الحضور', description: `التسجيل: ${regId}` });
  };

  const campRegistrations = selectedCampId
    ? mockRegistrations.filter(r => r.campId === selectedCampId)
    : mockRegistrations;

  return (
    <DashboardLayout>
      <div className="space-y-6" dir="rtl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-cairo font-bold text-xl text-foreground">إدارة الأحداث الطبية</h1>
            <p className="font-cairo text-sm text-muted-foreground">إنشاء وإدارة المخيمات الطبية والأحداث</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)} className="font-cairo gap-1">
            <Plus className="h-4 w-4" />
            {showForm ? 'إلغاء' : 'حدث جديد'}
          </Button>
        </div>

        {showForm ? (
          <AdminEventForm onSubmit={handleCreateCamp} />
        ) : (
          <Tabs defaultValue="events" className="space-y-4">
            <TabsList className="font-cairo">
              <TabsTrigger value="events" className="font-cairo">الأحداث</TabsTrigger>
              <TabsTrigger value="registrations" className="font-cairo">التسجيلات</TabsTrigger>
            </TabsList>

            <TabsContent value="events">
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4 text-center">
                    <Calendar className="h-5 w-5 text-primary mx-auto mb-1" />
                    <p className="font-cairo font-bold text-lg text-foreground">{mockCamps.length}</p>
                    <p className="font-cairo text-xs text-muted-foreground">إجمالي الأحداث</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <Users className="h-5 w-5 text-primary mx-auto mb-1" />
                    <p className="font-cairo font-bold text-lg text-foreground">{mockRegistrations.length}</p>
                    <p className="font-cairo text-xs text-muted-foreground">التسجيلات</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <Heart className="h-5 w-5 text-accent mx-auto mb-1" />
                    <p className="font-cairo font-bold text-lg text-foreground">
                      {mockCamps.reduce((a, c) => a + c.raisedFund, 0).toLocaleString()}
                    </p>
                    <p className="font-cairo text-xs text-muted-foreground">إجمالي التمويل (ر.ي)</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <Calendar className="h-5 w-5 text-emerald-500 mx-auto mb-1" />
                    <p className="font-cairo font-bold text-lg text-foreground">
                      {mockCamps.filter(c => c.status === 'published' || c.status === 'active').length}
                    </p>
                    <p className="font-cairo text-xs text-muted-foreground">أحداث نشطة</p>
                  </CardContent>
                </Card>
              </div>

              {/* Camp list */}
              <div className="space-y-3">
                {mockCamps.map(camp => (
                  <Card key={camp.id} className="cursor-pointer hover:shadow-card-hover transition-shadow" onClick={() => setSelectedCampId(camp.id)}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="space-y-1">
                        <h3 className="font-cairo font-bold text-sm text-foreground">{camp.titleAr}</h3>
                        <p className="font-cairo text-xs text-muted-foreground">
                          {camp.locationCity} — {camp.startDate} → {camp.endDate}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="font-cairo text-xs">
                          {statusLabels[camp.status]}
                        </Badge>
                        <Badge variant="outline" className="font-cairo text-xs">
                          {camp.totalCapacity} مريض
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="registrations">
              <RegistrationsTable registrations={campRegistrations} onCheckin={handleCheckin} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DashboardEvents;
