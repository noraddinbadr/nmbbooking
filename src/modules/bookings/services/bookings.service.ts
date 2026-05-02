/**
 * Bookings service / use-cases — pure business logic, framework-agnostic.
 *
 * - Validates inputs via Zod schemas before hitting the repository.
 * - Enforces UI-side guard rails (past-date, FSM) that mirror the SQL triggers.
 * - Returns Result<T, AppError> so callers can render errors deterministically.
 */
import { ok, err, type Result } from '@/shared/result';
import { appError, type AppError } from '@/shared/errors';
import { bookingsRepo, type ListFilters } from '../api/bookings.repo';
import { auditRepo, type AuditEntry } from '../api/auditLog.repo';
import {
  type Booking,
  type BookingStatus,
  type CreateBookingInput,
  createBookingInput,
  rescheduleInput,
  type RescheduleInput,
} from '../schemas/booking.schema';
import {
  canRunWorkflowAction,
  canTransition,
  isBookingPast,
} from '../state/bookingState';

export const bookingsService = {
  list: (filters?: ListFilters) => bookingsRepo.list(filters),
  byId: (id: string) => bookingsRepo.byId(id),
  audit: (id: string): Promise<Result<AuditEntry[], AppError>> =>
    auditRepo.forBooking(id),

  async create(
    input: CreateBookingInput,
    ctx: { isAdmin: boolean },
  ): Promise<Result<Booking, AppError>> {
    const parsed = createBookingInput.safeParse(input);
    if (!parsed.success) {
      return err(appError('invalid_input', parsed.error.issues[0]?.message ?? 'بيانات غير صالحة', parsed.error));
    }
    if (!ctx.isAdmin && isBookingPast(parsed.data.bookingDate, parsed.data.startTime ?? null)) {
      return err(appError('past_target', 'لا يمكن إنشاء حجز في الماضي.'));
    }
    return bookingsRepo.create(parsed.data);
  },

  async update(
    id: string,
    patch: Partial<CreateBookingInput>,
  ): Promise<Result<Booking, AppError>> {
    return bookingsRepo.update(id, patch);
  },

  async cancel(id: string, reason?: string): Promise<Result<true, AppError>> {
    return bookingsRepo.setStatusRpc(id, 'cancelled', reason);
  },

  async setStatus(
    booking: Pick<Booking, 'id' | 'status' | 'bookingDate' | 'startTime'>,
    next: BookingStatus,
    ctx: { isAdmin: boolean; reason?: string },
  ): Promise<Result<true, AppError>> {
    // Workflow guard rails (mirror DB trigger so we surface a clean message).
    if (['confirmed', 'in_progress', 'completed'].includes(next)) {
      const guard = canRunWorkflowAction(booking.bookingDate, booking.startTime, booking.status);
      if (!guard.allowed) return err(appError('invalid_state', guard.reason ?? 'غير مسموح'));
    }
    if (!canTransition(booking.status, next, ctx.isAdmin)) {
      return err(appError('invalid_transition', `انتقال غير مسموح من ${booking.status} إلى ${next}`));
    }
    return bookingsRepo.setStatusRpc(booking.id, next, ctx.reason);
  },

  async reschedule(input: RescheduleInput): Promise<Result<true, AppError>> {
    const parsed = rescheduleInput.safeParse(input);
    if (!parsed.success) {
      return err(appError('invalid_input', parsed.error.issues[0]?.message ?? 'بيانات غير صالحة', parsed.error));
    }
    return bookingsRepo.rescheduleRpc({
      bookingId: parsed.data.bookingId,
      newDate: parsed.data.newDate,
      newStartTime: parsed.data.newStartTime,
      newEndTime: parsed.data.newEndTime ?? null,
      reason: parsed.data.reason ?? null,
    });
  },

  async remove(id: string): Promise<Result<true, AppError>> {
    return bookingsRepo.remove(id);
  },
};