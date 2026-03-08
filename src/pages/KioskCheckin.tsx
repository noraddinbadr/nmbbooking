import { useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { statusLabels } from '@/data/constants';
import { Search, CheckCircle, UserCheck, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface RegistrationResult {
  id: string;
  case_code: string;
  status: string | null;
  patient_info: any;
}

const KioskCheckin = () => {
  const [search, setSearch] = useState('');
  const [found, setFound] = useState<RegistrationResult | null>(null);
  const [checkedIn, setCheckedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!search.trim()) return;
    setLoading(true);
    setFound(null);
    setCheckedIn(false);

    const { data } = await supabase
      .from('registrations')
      .select('id, case_code, status, patient_info')
      .or(`case_code.ilike.${search},patient_info->>phone.eq.${search}`)
      .limit(1)
      .maybeSingle();

    setLoading(false);
    if (data) {
      setFound(data as RegistrationResult);
    } else {
      toast({ title: 'لم يتم العثور على تسجيل', variant: 'destructive' });
    }
  };

  const handleCheckin = async () => {
    if (!found) return;
    const { error } = await supabase
      .from('registrations')
      .update({ status: 'checked_in', checked_in_at: new Date().toISOString() })
      .eq('id', found.id);

    if (error) {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
      return;
    }
    setCheckedIn(true);
    toast({ title: 'تم تسجيل الحضور بنجاح' });
  };

  const patientInfo = found?.patient_info as { name?: string; phone?: string } | null;

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
          <Button onClick={handleSearch} className="font-cairo gap-1" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} بحث
          </Button>
        </div>

        {found && (
          <Card className="animate-fade-in">
            <CardContent className="p-6 space-y-4 text-center">
              <Badge className="text-sm font-cairo" variant={found.status === 'confirmed' ? 'default' : 'secondary'}>
                {statusLabels[found.status || 'held']}
              </Badge>
              <div className="space-y-2">
                <p className="font-cairo font-bold text-lg text-foreground">{patientInfo?.name || 'مريض'}</p>
                <p className="font-cairo text-sm text-muted-foreground">كود: {found.case_code}</p>
                {patientInfo?.phone && <p className="font-cairo text-sm text-muted-foreground">هاتف: {patientInfo.phone}</p>}
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
                  لا يمكن تسجيل الحضور — الحالة: {statusLabels[found.status || 'held']}
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
