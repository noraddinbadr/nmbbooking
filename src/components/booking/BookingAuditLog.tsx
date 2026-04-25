import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, History } from 'lucide-react';
import { STATUS_LABELS, type BookingStatus } from '@/lib/bookingState';

interface Props { bookingId: string; }

interface LogRow {
  id: string;
  action: string;
  from_status: BookingStatus | null;
  to_status: BookingStatus | null;
  from_date: string | null;
  to_date: string | null;
  from_time: string | null;
  to_time: string | null;
  reason: string | null;
  changed_by: string | null;
  created_at: string;
  actor_name?: string;
}

const ACTION_LABELS: Record<string, string> = {
  created: 'تم الإنشاء',
  status_change: 'تغيير الحالة',
  rescheduled: 'إعادة جدولة',
  rescheduled_or_status_change: 'إعادة جدولة',
  deleted: 'تم الحذف',
};

const BookingAuditLog = ({ bookingId }: Props) => {
  const [rows, setRows] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const { data } = await (supabase as any)
        .from('booking_audit_log')
        .select('*')
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: false });
      const logs: LogRow[] = data || [];
      const ids = [...new Set(logs.map(l => l.changed_by).filter(Boolean) as string[])];
      if (ids.length) {
        const { data: profs } = await supabase.from('profiles').select('id, full_name_ar, full_name').in('id', ids);
        const map = Object.fromEntries((profs || []).map((p: any) => [p.id, p.full_name_ar || p.full_name || p.id.slice(0, 6)]));
        logs.forEach(l => { if (l.changed_by) l.actor_name = map[l.changed_by]; });
      }
      if (active) { setRows(logs); setLoading(false); }
    })();
    return () => { active = false; };
  }, [bookingId]);

  if (loading) return <div className="flex justify-center py-3"><Loader2 className="h-4 w-4 animate-spin" /></div>;
  if (!rows.length) return <p className="text-xs text-muted-foreground font-cairo text-center py-2">لا يوجد سجل</p>;

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
              <span className="text-muted-foreground text-[10px]">{new Date(r.created_at).toLocaleString('ar-EG')}</span>
            </div>
            {r.from_status && r.to_status && r.from_status !== r.to_status && (
              <p className="text-muted-foreground mt-0.5">
                {STATUS_LABELS[r.from_status]} ← {STATUS_LABELS[r.to_status]}
              </p>
            )}
            {(r.from_date !== r.to_date || r.from_time !== r.to_time) && r.from_date && r.to_date && (
              <p className="text-muted-foreground">
                {r.from_date} {r.from_time || ''} ← {r.to_date} {r.to_time || ''}
              </p>
            )}
            {r.reason && <p className="text-foreground/80 mt-0.5">السبب: {r.reason}</p>}
            {r.actor_name && <p className="text-muted-foreground text-[10px]">بواسطة: {r.actor_name}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default BookingAuditLog;
