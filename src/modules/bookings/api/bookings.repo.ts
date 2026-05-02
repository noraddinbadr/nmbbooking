/**
 * Bookings repository — the ONLY file in this module allowed to import the
 * Supabase client. Returns plain DTOs / domain objects; never leaks
 * PostgrestError to callers.
 */
import { supabase } from '@/shared/supabase';
import { toAppError, type AppError } from '@/shared/errors';
import { ok, err, type Result } from '@/shared/result';
import {
  type Booking,
  type BookingRow,
  type BookingStatus,
  type CreateBookingInput,
  mapBookingRow,
  toBookingRow,
} from '../schemas/booking.schema';

const BOOKING_COLUMNS =
  'id, doctor_id, patient_id, shift_id, family_member_id, booking_date, start_time, end_time, status, booking_type, final_price, funding_amount, is_free_case, queue_position, notes, created_at, updated_at';

export interface ListFilters {
  patientId?: string;
  doctorId?: string;
  status?: BookingStatus | BookingStatus[];
  fromDate?: string;
  toDate?: string;
  limit?: number;
}

export const bookingsRepo = {
  async list(filters: ListFilters = {}): Promise<Result<Booking[], AppError>> {
    let q = supabase.from('bookings').select(BOOKING_COLUMNS);
    if (filters.patientId) q = q.eq('patient_id', filters.patientId);
    if (filters.doctorId) q = q.eq('doctor_id', filters.doctorId);
    if (filters.status) {
      q = Array.isArray(filters.status)
        ? q.in('status', filters.status)
        : q.eq('status', filters.status);
    }
    if (filters.fromDate) q = q.gte('booking_date', filters.fromDate);
    if (filters.toDate) q = q.lte('booking_date', filters.toDate);
    q = q.order('booking_date', { ascending: false });
    if (filters.limit) q = q.limit(filters.limit);

    const { data, error } = await q;
    if (error) return err(toAppError(error));
    return ok(((data ?? []) as unknown as BookingRow[]).map(mapBookingRow));
  },

  async byId(id: string): Promise<Result<Booking, AppError>> {
    const { data, error } = await supabase
      .from('bookings')
      .select(BOOKING_COLUMNS)
      .eq('id', id)
      .maybeSingle();
    if (error) return err(toAppError(error));
    if (!data) return err({ code: 'not_found', message: 'الحجز غير موجود' });
    return ok(mapBookingRow(data as unknown as BookingRow));
  },

  async create(input: CreateBookingInput): Promise<Result<Booking, AppError>> {
    const { data, error } = await supabase
      .from('bookings')
      .insert(toBookingRow(input))
      .select(BOOKING_COLUMNS)
      .single();
    if (error) return err(toAppError(error));
    return ok(mapBookingRow(data as unknown as BookingRow));
  },

  async update(
    id: string,
    patch: Partial<CreateBookingInput>,
  ): Promise<Result<Booking, AppError>> {
    const { data, error } = await supabase
      .from('bookings')
      .update(toBookingRow(patch))
      .eq('id', id)
      .select(BOOKING_COLUMNS)
      .single();
    if (error) return err(toAppError(error));
    return ok(mapBookingRow(data as unknown as BookingRow));
  },

  async remove(id: string): Promise<Result<true, AppError>> {
    const { error } = await supabase.from('bookings').delete().eq('id', id);
    if (error) return err(toAppError(error));
    return ok(true);
  },

  /** Calls the SQL `set_booking_status` RPC which honours the transition trigger. */
  async setStatusRpc(
    id: string,
    newStatus: BookingStatus,
    reason?: string,
  ): Promise<Result<true, AppError>> {
    const { data, error } = await supabase.rpc('set_booking_status', {
      _booking_id: id,
      _new_status: newStatus,
      _reason: reason ?? null,
    });
    if (error) return err(toAppError(error));
    const payload = data as { success: boolean; error?: string } | null;
    if (!payload?.success) {
      return err(toAppError({ message: payload?.error ?? 'set_booking_status failed' }));
    }
    return ok(true);
  },

  /** Calls the SQL `reschedule_booking` RPC. */
  async rescheduleRpc(args: {
    bookingId: string;
    newDate: string;
    newStartTime: string;
    newEndTime?: string | null;
    reason?: string | null;
  }): Promise<Result<true, AppError>> {
    const { data, error } = await supabase.rpc('reschedule_booking', {
      _booking_id: args.bookingId,
      _new_date: args.newDate,
      _new_start_time: args.newStartTime,
      _new_end_time: args.newEndTime ?? null,
      _reason: args.reason ?? null,
    });
    if (error) return err(toAppError(error));
    const payload = data as { success: boolean; error?: string; message?: string } | null;
    if (!payload?.success) {
      return err({
        code: (payload?.error as never) ?? 'unknown',
        message: payload?.message ?? payload?.error ?? 'فشل إعادة الجدولة',
      });
    }
    return ok(true);
  },
};