/**
 * Repository for the `booking_audit_log` table — read-only from the UI.
 */
import { supabase } from '@/shared/supabase';
import { toAppError, type AppError } from '@/shared/errors';
import { ok, err, type Result } from '@/shared/result';
import type { BookingStatus } from '../schemas/booking.schema';

export interface AuditEntry {
  id: string;
  bookingId: string;
  action: string;
  fromStatus: BookingStatus | null;
  toStatus: BookingStatus | null;
  fromDate: string | null;
  toDate: string | null;
  fromTime: string | null;
  toTime: string | null;
  reason: string | null;
  changedBy: string | null;
  actorName?: string;
  createdAt: string;
}

type Row = {
  id: string; booking_id: string; action: string;
  from_status: BookingStatus | null; to_status: BookingStatus | null;
  from_date: string | null; to_date: string | null;
  from_time: string | null; to_time: string | null;
  reason: string | null; changed_by: string | null; created_at: string;
};

export const auditRepo = {
  async forBooking(bookingId: string): Promise<Result<AuditEntry[], AppError>> {
    const { data, error } = await supabase
      .from('booking_audit_log')
      .select('*')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: false });
    if (error) return err(toAppError(error));
    const rows = (data ?? []) as Row[];
    const entries: AuditEntry[] = rows.map(r => ({
      id: r.id, bookingId: r.booking_id, action: r.action,
      fromStatus: r.from_status, toStatus: r.to_status,
      fromDate: r.from_date, toDate: r.to_date,
      fromTime: r.from_time, toTime: r.to_time,
      reason: r.reason, changedBy: r.changed_by, createdAt: r.created_at,
    }));
    // Hydrate actor names
    const ids = [...new Set(entries.map(e => e.changedBy).filter(Boolean) as string[])];
    if (ids.length) {
      const { data: profs } = await supabase
        .from('profiles')
        .select('id, full_name_ar, full_name')
        .in('id', ids);
      const map = Object.fromEntries(
        (profs ?? []).map((p) => [p.id, p.full_name_ar || p.full_name || p.id.slice(0, 6)]),
      );
      entries.forEach(e => { if (e.changedBy) e.actorName = map[e.changedBy]; });
    }
    return ok(entries);
  },
};