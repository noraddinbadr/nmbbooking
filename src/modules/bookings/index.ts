/**
 * Public API of the Bookings module.
 *
 * IMPORTANT: anything not exported here is considered private.
 * Other modules / pages MUST import from `@/modules/bookings` only.
 */

// Domain types & schemas
export type {
  Booking,
  BookingStatus,
  BookingType,
  CreateBookingInput,
  RescheduleInput,
} from './schemas/booking.schema';

// State machine helpers (pure)
export {
  STATUS_LABELS,
  STATUS_COLORS,
  canActOnBooking,
  canRunWorkflowAction,
  canTransition,
  getTimeStatus,
  isBookingPast,
  type TimeStatus,
} from './state/bookingState';

// Hooks (only UI entry point)
export {
  useBookings,
  useBooking,
  useBookingAudit,
  useCreateBooking,
  useUpdateBooking,
  useSetBookingStatus,
  useRescheduleBooking,
  useDeleteBooking,
} from './hooks/useBookings';

// Components owned by the module
export { default as BookingFormModal } from './components/BookingFormModal';
export { default as RescheduleBookingModal } from './components/RescheduleBookingModal';
export { default as BookingAuditLog } from './components/BookingAuditLog';

// Audit DTO (for consumers that render the log themselves)
export type { AuditEntry } from './api/auditLog.repo';