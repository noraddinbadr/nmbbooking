import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type TimelineEventType =
  | 'booking'
  | 'session'
  | 'prescription'
  | 'lab_order'
  | 'imaging_order'
  | 'file'
  | 'donation';

export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  date: string; // ISO
  title: string;
  subtitle?: string;
  status?: string | null;
  doctorName?: string | null;
  data: any;
}

interface UsePatientTimelineOptions {
  patientId: string | undefined;
  enabled?: boolean;
}

interface UsePatientTimelineResult {
  events: TimelineEvent[];
  loading: boolean;
  refetch: () => Promise<void>;
  counts: Record<TimelineEventType | 'all', number>;
}

const safeDate = (d: any): string => {
  if (!d) return new Date(0).toISOString();
  try { return new Date(d).toISOString(); } catch { return new Date(0).toISOString(); }
};

export function usePatientTimeline({ patientId, enabled = true }: UsePatientTimelineOptions): UsePatientTimelineResult {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    if (!patientId) { setLoading(false); return; }
    setLoading(true);
    const [bookingsRes, sessionsRes, rxRes, ordersRes, filesRes] = await Promise.all([
      supabase.from('bookings').select('id, booking_date, start_time, status, booking_type, final_price, doctor_id, notes, created_at, doctors(name_ar)').eq('patient_id', patientId),
      supabase.from('treatment_sessions').select('id, session_date, status, symptoms, diagnosis, examination, notes, follow_up_date, booking_id, doctor_id, created_at, doctors(name_ar)').eq('patient_id', patientId),
      supabase.from('prescriptions').select('id, created_at, notes, pharmacy_sent, doctor_id, session_id, prescription_items(*), doctors(name_ar)').eq('patient_id', patientId),
      supabase.from('provider_orders').select('id, order_type, status, results_url, notes, created_at, order_details, providers(name_ar)').order('created_at', { ascending: false }),
      supabase.from('medical_files').select('id, file_name, file_path, file_type, mime_type, category, description, created_at, doctor_id, session_id, booking_id').eq('patient_id', patientId),
    ]);

    const bookings: TimelineEvent[] = (bookingsRes.data || []).map((b: any) => ({
      id: `booking-${b.id}`,
      type: 'booking',
      date: safeDate(`${b.booking_date}T${b.start_time || '00:00'}:00`),
      title: 'حجز موعد',
      subtitle: `${b.booking_date}${b.start_time ? ' • ' + b.start_time : ''}`,
      status: b.status,
      doctorName: b.doctors?.name_ar,
      data: b,
    }));

    const sessions: TimelineEvent[] = (sessionsRes.data || []).map((s: any) => ({
      id: `session-${s.id}`,
      type: 'session',
      date: safeDate(s.session_date || s.created_at),
      title: 'جلسة علاج',
      subtitle: s.diagnosis || s.symptoms || 'استشارة',
      status: s.status,
      doctorName: s.doctors?.name_ar,
      data: s,
    }));

    const prescriptions: TimelineEvent[] = (rxRes.data || []).map((rx: any) => ({
      id: `rx-${rx.id}`,
      type: 'prescription',
      date: safeDate(rx.created_at),
      title: 'وصفة طبية',
      subtitle: `${rx.prescription_items?.length || 0} دواء`,
      status: rx.pharmacy_sent ? 'sent' : 'pending',
      doctorName: rx.doctors?.name_ar,
      data: rx,
    }));

    const orders: TimelineEvent[] = (ordersRes.data || [])
      .filter((o: any) => o?.order_details?.patient_id === patientId)
      .map((o: any) => ({
        id: `order-${o.id}`,
        type: o.order_type === 'imaging' ? 'imaging_order' : 'lab_order',
        date: safeDate(o.created_at),
        title: o.order_type === 'imaging' ? 'طلب أشعة' : o.order_type === 'lab' ? 'طلب تحاليل' : 'طلب طبي',
        subtitle: o.providers?.name_ar || '—',
        status: o.status,
        data: o,
      }));

    const files: TimelineEvent[] = (filesRes.data || []).map((f: any) => ({
      id: `file-${f.id}`,
      type: 'file',
      date: safeDate(f.created_at),
      title: 'ملف طبي',
      subtitle: f.file_name,
      status: f.category,
      data: f,
    }));

    const all = [...bookings, ...sessions, ...prescriptions, ...orders, ...files]
      .sort((a, b) => b.date.localeCompare(a.date));
    setEvents(all);
    setLoading(false);
  };

  useEffect(() => {
    if (!enabled) return;
    fetchAll();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId, enabled]);

  // Realtime subscriptions
  useEffect(() => {
    if (!patientId || !enabled) return;
    const channel = supabase
      .channel(`patient-timeline-${patientId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings', filter: `patient_id=eq.${patientId}` }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'treatment_sessions', filter: `patient_id=eq.${patientId}` }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'prescriptions', filter: `patient_id=eq.${patientId}` }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'medical_files', filter: `patient_id=eq.${patientId}` }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'provider_orders' }, () => fetchAll())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId, enabled]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: events.length };
    events.forEach(e => { c[e.type] = (c[e.type] || 0) + 1; });
    return c as Record<TimelineEventType | 'all', number>;
  }, [events]);

  return { events, loading, refetch: fetchAll, counts };
}
