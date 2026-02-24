import { useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { mockRegistrations, statusLabels } from '@/data/eventsMockData';
import { Search, CheckCircle, UserCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const KioskCheckin = () => {
  const [search, setSearch] = useState('');
  const [found, setFound] = useState<typeof mockRegistrations[0] | null>(null);
  const [checkedIn, setCheckedIn] = useState(false);
  const { toast } = useToast();

  const handleSearch = () => {
    const result = mockRegistrations.find(
      r => r.caseCode.toLowerCase() === search.toLowerCase() ||
           r.patientInfo?.phone === search
    );
    setFound(result || null);
    setCheckedIn(false);
    if (!result) {
      toast({ title: 'لم يتم العثور على تسجيل', variant: 'destructive' });
    }
  };

  const handleCheckin = () => {
    if (!found) return;
    // TODO: supabase update
    setCheckedIn(true);
    toast({ title: 'تم تسجيل الحضور بنجاح' });
  };

  return (
    <DashboardLayout>
      <div className="max-w-lg mx-auto space-y-6 py-8" dir="rtl">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <UserCheck className="h-8 w-8 text-primary" />
          </div>
          <h1 className="font-cairo font-bold text-2xl text-foreground">تسجيل الحضور</h1>
          <p className="font-cairo text-sm text-muted-foreground">ابحث بكود الحالة أو رقم الهاتف</p>
        </div>

        <div className="flex gap-2">
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="C-a1b2c3d4 أو 777123456"
            className="font-cairo text-lg text-center"
            autoFocus
          />
          <Button onClick={handleSearch} className="font-cairo gap-1">
            <Search className="h-4 w-4" /> بحث
          </Button>
        </div>

        {found && (
          <Card className="animate-fade-in">
            <CardContent className="p-6 space-y-4 text-center">
              <Badge className="text-sm font-cairo" variant={found.status === 'confirmed' ? 'default' : 'secondary'}>
                {statusLabels[found.status]}
              </Badge>
              <div className="space-y-2">
                <p className="font-cairo font-bold text-lg text-foreground">{found.patientInfo?.name}</p>
                <p className="font-cairo text-sm text-muted-foreground">كود: {found.caseCode}</p>
                <p className="font-cairo text-sm text-muted-foreground">هاتف: {found.patientInfo?.phone}</p>
              </div>

              {checkedIn ? (
                <div className="py-4">
                  <CheckCircle className="h-16 w-16 text-primary mx-auto mb-2" />
                  <p className="font-cairo font-bold text-primary text-lg">تم تسجيل الحضور ✓</p>
                </div>
              ) : found.status === 'confirmed' ? (
                <Button onClick={handleCheckin} className="w-full font-cairo text-lg py-6" size="lg">
                  <CheckCircle className="h-5 w-5 ml-2" /> تأكيد الحضور
                </Button>
              ) : (
                <p className="font-cairo text-destructive text-sm">
                  لا يمكن تسجيل الحضور — الحالة: {statusLabels[found.status]}
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default KioskCheckin;
