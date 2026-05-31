import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { History } from 'lucide-react';

interface Props {
  totalVisits: number;
  pastSessions: any[];
  pastPrescriptions: any[];
  pastOrders: any[];
}

export function PatientHistoryPanel({ totalVisits, pastSessions, pastPrescriptions, pastOrders }: Props) {
  return (
    <Card className="shadow-card">
      <CardHeader className="pb-2 pt-3 px-3">
        <CardTitle className="font-cairo text-sm flex items-center gap-2">
          <History className="h-4 w-4 text-primary" /> السجل الطبي
        </CardTitle>
      </CardHeader>
      <CardContent className="px-3 pb-3 space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto">
        <div className="flex items-center justify-between font-cairo text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
          <span>إجمالي الزيارات</span>
          <span className="font-bold text-foreground">{totalVisits}</span>
        </div>

        {pastSessions.length > 0 && (
          <div>
            <p className="font-cairo text-xs font-bold text-foreground mb-1.5">الجلسات السابقة</p>
            {pastSessions.map((s) => (
              <div key={s.id} className="p-2 rounded-lg bg-muted/40 mb-1.5 font-cairo text-xs space-y-0.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{s.session_date}</span>
                  {s.diagnosis && <Badge variant="secondary" className="font-cairo text-[10px] h-5">{s.diagnosis}</Badge>}
                </div>
                {s.symptoms && <p className="text-muted-foreground">الأعراض: {s.symptoms}</p>}
                {s.examination && <p className="text-muted-foreground">الفحص: {s.examination}</p>}
                {s.notes && <p className="text-muted-foreground/70">📝 {s.notes}</p>}
              </div>
            ))}
          </div>
        )}

        {pastPrescriptions.length > 0 && (
          <div>
            <p className="font-cairo text-xs font-bold text-foreground mb-1.5">الوصفات السابقة</p>
            {pastPrescriptions.map((rx) => (
              <div key={rx.id} className="p-2 rounded-lg bg-muted/40 mb-1.5 font-cairo text-xs">
                <p className="text-muted-foreground mb-1">{new Date(rx.created_at).toLocaleDateString('ar')}</p>
                {rx.prescription_items?.map((m: any) => (
                  <p key={m.id} className="text-foreground">
                    <span className="text-primary font-medium">{m.medicine_name}</span>
                    {m.dosage && ` — ${m.dosage}`}
                    {m.frequency && ` — ${m.frequency}`}
                  </p>
                ))}
              </div>
            ))}
          </div>
        )}

        {pastOrders.length > 0 && (
          <div>
            <p className="font-cairo text-xs font-bold text-foreground mb-1.5">الطلبات السابقة</p>
            {pastOrders.map((order) => (
              <div key={order.id} className="p-2 rounded-lg bg-muted/40 mb-1.5 font-cairo text-xs">
                <div className="flex justify-between mb-1">
                  <span className="text-muted-foreground">{new Date(order.created_at).toLocaleDateString('ar')}</span>
                  <Badge
                    className={`font-cairo text-[10px] h-5 ${
                      order.status === 'results_uploaded' || order.status === 'delivered'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-amber-500 text-white'
                    }`}
                  >
                    {order.status === 'pending' ? 'معلّق' : order.status === 'results_uploaded' ? 'جاهز' : order.status}
                  </Badge>
                </div>
                <p>{order.order_type === 'lab' ? '🧪' : order.order_type === 'imaging' ? '📷' : '💉'} {order.notes}</p>
              </div>
            ))}
          </div>
        )}

        {pastSessions.length === 0 && pastPrescriptions.length === 0 && pastOrders.length === 0 && (
          <p className="font-cairo text-xs text-muted-foreground text-center py-4">لا يوجد سجل سابق — زيارة أولى</p>
        )}
      </CardContent>
    </Card>
  );
}