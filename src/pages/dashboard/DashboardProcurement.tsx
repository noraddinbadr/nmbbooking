import { useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Plus, Package, Clock, Users, ShoppingCart, Loader2 } from 'lucide-react';
import { useProcurementRequests } from '@/hooks/useProcurement';
import { PROCUREMENT_STATUS_LABELS, PROCUREMENT_STATUS_COLORS } from '@/data/procurementTypes';
import CreateRFQModal from '@/components/procurement/CreateRFQModal';
import RFQDetailDrawer from '@/components/procurement/RFQDetailDrawer';
import { Link } from 'react-router-dom';

export default function DashboardProcurement() {
  const [tab, setTab] = useState<'open' | 'mine'>('open');
  const { data: rfqs = [], isLoading } = useProcurementRequests(tab);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <DashboardLayout>
      <div className="space-y-4 font-cairo" dir="rtl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ShoppingCart className="h-6 w-6 text-primary" /> سوق المشتريات الطبية
            </h1>
            <p className="text-sm text-muted-foreground mt-1">طلبات شراء وعروض المزودين — مزادات عكسية لكل ما تحتاجه عيادتك</p>
          </div>
          <div className="flex gap-2">
            <Link to="/dashboard/my-catalog"><Button variant="outline" className="gap-2"><Package className="h-4 w-4" /> كتالوجي</Button></Link>
            <Button onClick={() => setCreateOpen(true)} className="gap-2"><Plus className="h-4 w-4" /> طلب شراء جديد</Button>
          </div>
        </div>

        <Tabs value={tab} onValueChange={v => setTab(v as 'open' | 'mine')}>
          <TabsList>
            <TabsTrigger value="open">المزادات المفتوحة</TabsTrigger>
            <TabsTrigger value="mine">طلباتي</TabsTrigger>
          </TabsList>

          <TabsContent value={tab} className="mt-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : rfqs.length === 0 ? (
              <Card className="p-12 text-center">
                <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="font-bold">لا توجد طلبات</p>
                <p className="text-sm text-muted-foreground mt-1">{tab === 'mine' ? 'ابدأ بإنشاء طلب الشراء الأول' : 'لا توجد مزادات مفتوحة حالياً'}</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {rfqs.map(rfq => {
                  const isClosed = new Date(rfq.closes_at) < new Date();
                  const hoursLeft = Math.max(0, Math.round((new Date(rfq.closes_at).getTime() - Date.now()) / 3600000));
                  return (
                    <Card key={rfq.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedId(rfq.id)}>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <code className="text-xs text-muted-foreground">{rfq.rfq_code}</code>
                        <Badge className={PROCUREMENT_STATUS_COLORS[rfq.status]}>{PROCUREMENT_STATUS_LABELS[rfq.status]}</Badge>
                      </div>
                      <h3 className="font-bold mb-1 line-clamp-2">{rfq.title_ar}</h3>
                      {rfq.description_ar && <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{rfq.description_ar}</p>}
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mt-3 pt-3 border-t">
                        <span className="flex items-center gap-1"><Package className="h-3 w-3" /> {rfq.items?.length || 0} صنف</span>
                        <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {rfq.bids_count || 0} عرض</span>
                        <span className="flex items-center gap-1 mr-auto">
                          <Clock className="h-3 w-3" />
                          {isClosed ? <span className="text-destructive">منتهي</span> : `${hoursLeft} ساعة`}
                        </span>
                      </div>
                      {rfq.budget_max && <p className="text-xs mt-2 text-primary font-bold">ميزانية حتى {rfq.budget_max.toLocaleString()} ر.ي</p>}
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <CreateRFQModal open={createOpen} onClose={() => setCreateOpen(false)} />
        <RFQDetailDrawer requestId={selectedId} onClose={() => setSelectedId(null)} />
      </div>
    </DashboardLayout>
  );
}