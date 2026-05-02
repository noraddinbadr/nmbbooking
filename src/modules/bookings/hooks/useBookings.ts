/**
 * React Query hooks for bookings — the only UI entry point into this module.
 *
 * Components NEVER call the service or repo directly; they consume these hooks
 * so cache invalidation, loading states, and key-naming stay consistent.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { qk } from '@/shared/queryKeys';
import { bookingsService } from '../services/bookings.service';
import { unwrap } from '@/shared/result';
import type { ListFilters } from '../api/bookings.repo';
import type { CreateBookingInput, BookingStatus, Booking } from '../schemas/booking.schema';

export function useBookings(filters: ListFilters = {}) {
  return useQuery({
    queryKey: qk.bookings.list(filters),
    queryFn: async () => unwrap(await bookingsService.list(filters)),
  });
}

export function useBooking(id: string | undefined) {
  return useQuery({
    queryKey: id ? qk.bookings.detail(id) : qk.bookings.detail('none'),
    queryFn: async () => unwrap(await bookingsService.byId(id as string)),
    enabled: !!id,
  });
}

export function useBookingAudit(id: string | undefined) {
  return useQuery({
    queryKey: id ? qk.bookings.audit(id) : qk.bookings.audit('none'),
    queryFn: async () => unwrap(await bookingsService.audit(id as string)),
    enabled: !!id,
  });
}

function useInvalidate() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: qk.bookings.all });
}

export function useCreateBooking(opts: { isAdmin: boolean }) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (input: CreateBookingInput) => {
      const r = await bookingsService.create(input, opts);
      if (!r.ok) throw r.error;
      return r.value;
    },
    onSuccess: invalidate,
  });
}

export function useUpdateBooking() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (vars: { id: string; patch: Partial<CreateBookingInput> }) => {
      const r = await bookingsService.update(vars.id, vars.patch);
      if (!r.ok) throw r.error;
      return r.value;
    },
    onSuccess: invalidate,
  });
}

export function useSetBookingStatus(ctx: { isAdmin: boolean }) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (vars: {
      booking: Pick<Booking, 'id' | 'status' | 'bookingDate' | 'startTime'>;
      next: BookingStatus;
      reason?: string;
    }) => {
      const r = await bookingsService.setStatus(vars.booking, vars.next, {
        isAdmin: ctx.isAdmin,
        reason: vars.reason,
      });
      if (!r.ok) throw r.error;
    },
    onSuccess: invalidate,
  });
}

export function useRescheduleBooking() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (vars: {
      bookingId: string;
      newDate: string;
      newStartTime: string;
      newEndTime?: string | null;
      reason?: string | null;
    }) => {
      const r = await bookingsService.reschedule(vars);
      if (!r.ok) throw r.error;
    },
    onSuccess: invalidate,
  });
}

export function useDeleteBooking() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (id: string) => {
      const r = await bookingsService.remove(id);
      if (!r.ok) throw r.error;
    },
    onSuccess: invalidate,
  });
}