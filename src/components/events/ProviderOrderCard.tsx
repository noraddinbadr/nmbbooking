import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Package } from 'lucide-react';
import type { ProviderOrder } from '@/data/eventsTypes';
import { statusLabels } from '@/data/eventsMockData';

interface ProviderOrderCardProps {
  order: ProviderOrder;
  onUpdateStatus?: (orderId: string, newStatus: string) => void;
}

const statusFlow = ['pending', 'received', 'sample_taken', 'results_uploaded', 'delivered'];

const statusColor: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-500',
  received: 'bg-primary/10 text-primary',
  sample_taken: 'bg-teal-50 text-teal-500',
  results_uploaded: 'bg-emerald-50 text-emerald-500',
  delivered: 'bg-secondary text-secondary-foreground',
};

const ProviderOrderCard = ({ order, onUpdateStatus }: ProviderOrderCardProps) => {
  const currentIdx = statusFlow.indexOf(order.status);
  const nextStatus = currentIdx < statusFlow.length - 1 ? statusFlow[currentIdx + 1] : null;

  return (
    <Card className="font-cairo" dir="rtl">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-bold text-foreground">{order.orderType === 'lab_test' ? 'تحليل مخبري' : order.orderType === 'medicine' ? 'أدوية' : 'أشعة'}</span>
          </div>
          <Badge className={statusColor[order.status] || 'bg-muted'} variant="secondary">
            {statusLabels[order.status] || order.status}
          </Badge>
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>رقم الطلب: <span className="font-mono">{order.id}</span></p>
          <p>التاريخ: {new Date(order.createdAt).toLocaleDateString('ar-YE')}</p>
          {order.notes && <p>ملاحظات: {order.notes}</p>}
        </div>

        {/* Order details */}
        <div className="bg-secondary rounded-md p-2 text-xs">
          <pre className="whitespace-pre-wrap text-foreground font-cairo">
            {JSON.stringify(order.orderDetails, null, 2)}
          </pre>
        </div>

        {/* Status flow */}
        <div className="flex items-center gap-1 flex-wrap">
          {statusFlow.map((s, i) => (
            <div key={s} className="flex items-center gap-1">
              <div className={`px-2 py-0.5 rounded text-[9px] ${i <= currentIdx ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                {statusLabels[s] || s}
              </div>
              {i < statusFlow.length - 1 && <ArrowLeft className="h-2.5 w-2.5 text-muted-foreground" />}
            </div>
          ))}
        </div>

        {nextStatus && onUpdateStatus && (
          <Button
            variant="outline"
            size="sm"
            className="w-full font-cairo text-xs"
            onClick={() => onUpdateStatus(order.id, nextStatus)}
          >
            تحديث إلى: {statusLabels[nextStatus] || nextStatus}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default ProviderOrderCard;
