import { useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import ProviderOrderCard from '@/components/events/ProviderOrderCard';
import { mockProviders, mockProviderOrders } from '@/data/eventsMockData';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Package } from 'lucide-react';

const DashboardProviders = () => {
  const { toast } = useToast();
  const [orders, setOrders] = useState(mockProviderOrders);

  const handleUpdateStatus = (orderId: string, newStatus: string) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus as typeof o.status } : o));
    toast({ title: 'تم تحديث حالة الطلب' });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6" dir="rtl">
        <div>
          <h1 className="font-cairo font-bold text-xl text-foreground">بوابة مزودي الخدمات</h1>
          <p className="font-cairo text-sm text-muted-foreground">إدارة المختبرات والصيدليات ومراكز الأشعة</p>
        </div>

        {/* Providers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mockProviders.map(p => (
            <Card key={p.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-cairo font-bold text-sm text-foreground">{p.nameAr}</h3>
                    <p className="font-cairo text-xs text-muted-foreground">{p.type === 'lab' ? 'مختبر' : p.type === 'pharmacy' ? 'صيدلية' : 'أشعة'}</p>
                  </div>
                </div>
                <Badge variant={p.isActive ? 'default' : 'secondary'} className="font-cairo text-xs">
                  {p.isActive ? 'نشط' : 'غير نشط'}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Orders */}
        <div>
          <h2 className="font-cairo font-bold text-base mb-4">الطلبات الواردة</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {orders.map(order => (
              <ProviderOrderCard
                key={order.id}
                order={order}
                onUpdateStatus={handleUpdateStatus}
              />
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardProviders;
