import { Loader2, History } from 'lucide-react';
import { useBookingAudit } from '../hooks/useBookings';
import { STATUS_LABELS } from '../state/bookingState';

interface Props { bookingId: string; }

const ACTION_LABELS: Record<string, string> = {
  created: 'تم الإنشاء',
  status_change: 'تغيير الحالة',
  rescheduled: 'إعادة جدولة',
  rescheduled_or_status_change: 'إعادة جدولة',
  deleted: 'تم الحذف',
};

const BookingAuditLog = ({ bookingId }: Props) => {
  const { data: rows = [], isLoading } = useBookingAudit(bookingId);

  if (isLoading) {
    return <div className="flex justify-center py-3"><Loader2 className="h-4 w-4 animate-spin" /></div>;
  }
  if (!rows.length) {
    return <p className="text-xs text-muted-foreground font-cairo text-center py-2">لا يوجد سجل</p>;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-xs font-cairo font-semibold text-muted-foreground">
        <History className="h-3 w-3" /> سجل التدقيق
      </div>
      <ul className="space-y-1.5">
        {rows.map(r => (
          <li key={r.id} className="rounded-md border border-border bg-card p-2 text-xs font-cairo">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground">{ACTION_LABELS[r.action] || r.action}</span>
              <span className="text-muted-foreground text-[10px]">{new Date(r.createdAt).toLocaleString('ar-EG')}</span>
            </div>
            {r.fromStatus && r.toStatus && r.fromStatus !== r.toStatus && (
              <p className="text-muted-foreground mt-0.5">
                {STATUS_LABELS[r.fromStatus]} ← {STATUS_LABELS[r.toStatus]}
              </p>
            )}
            {(r.fromDate !== r.toDate || r.fromTime !== r.toTime) && r.fromDate && r.toDate && (
              <p className="text-muted-foreground">
                {r.fromDate} {r.fromTime || ''} ← {r.toDate} {r.toTime || ''}
              </p>
            )}
            {r.reason && <p className="text-foreground/80 mt-0.5">السبب: {r.reason}</p>}
            {r.actorName && <p className="text-muted-foreground text-[10px]">بواسطة: {r.actorName}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default BookingAuditLog;