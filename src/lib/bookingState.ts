export type BookingStatus =
  | 'pending' | 'confirmed' | 'rescheduled' | 'in_progress'
  | 'completed' | 'cancelled' | 'no_show';

export type TimeStatus = 'upcoming' | 'today' | 'past';

export const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: 'معلّق',
  confirmed: 'مؤكد',
  rescheduled: 'مُعاد جدولته',
  in_progress: 'قيد الجلسة',
  completed: 'مكتمل',
  cancelled: 'ملغي',
  no_show: 'لم يحضر',
};

export const STATUS_COLORS: Record<BookingStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
  rescheduled: 'bg-purple-100 text-purple-800 border-purple-200',
  in_progress: 'bg-teal-100 text-teal-800 border-teal-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
  no_show: 'bg-gray-200 text-gray-800 border-gray-300',
};

// Allowed transitions (matches DB trigger)
const TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  pending: ['confirmed', 'cancelled', 'rescheduled', 'no_show'],
  confirmed: ['in_progress', 'completed', 'cancelled', 'rescheduled', 'no_show'],
  rescheduled: ['confirmed', 'cancelled', 'in_progress', 'no_show'],
  in_progress: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
  no_show: [],
};

export function canTransition(from: BookingStatus, to: BookingStatus, isAdmin: boolean): boolean {
  if (isAdmin) return true;
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function getTimeStatus(date: string, startTime: string | null): TimeStatus {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  if (date > todayStr) return 'upcoming';
  if (date < todayStr) return 'past';
  // Same day — compare time
  if (startTime) {
    const [h, m] = startTime.split(':').map(Number);
    const bookingTime = new Date();
    bookingTime.setHours(h || 23, m || 59, 0, 0);
    if (bookingTime < now) return 'past';
  }
  return 'today';
}

export function isBookingPast(date: string, startTime: string | null): boolean {
  return getTimeStatus(date, startTime) === 'past';
}

/** Decide if any operational action is allowed (start/confirm/cancel/reschedule). */
export function canActOnBooking(
  date: string,
  startTime: string | null,
  status: BookingStatus,
  isAdmin: boolean
): { allowed: boolean; reason?: string } {
  if (status === 'completed') return { allowed: false, reason: 'الحجز مكتمل بالفعل.' };
  if (status === 'cancelled') return { allowed: false, reason: 'الحجز ملغي.' };
  if (isBookingPast(date, startTime) && !isAdmin) {
    return { allowed: false, reason: 'هذا الحجز في الماضي ولا يمكن تعديله. يلزم صلاحية المسؤول.' };
  }
  return { allowed: true };
}
