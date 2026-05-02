/**
 * @deprecated import from `@/modules/bookings` instead.
 * This file is a re-export shim during the strangler migration and will be
 * removed once all call-sites have been updated.
 */
export {
  STATUS_LABELS,
  STATUS_COLORS,
  canActOnBooking,
  canRunWorkflowAction,
  canTransition,
  getTimeStatus,
  isBookingPast,
  type BookingStatus,
  type TimeStatus,
} from '@/modules/bookings';
