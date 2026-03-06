/**
 * Pure slot generation — no randomness, no DB calls.
 * Availability is determined by comparing generated slots against existing bookings.
 */

export interface ShiftInfo {
  id: string;
  label: string;
  startTime: string;
  endTime: string;
  daysOfWeek: number[];
  enableSlotGeneration: boolean;
  consultationDurationMin?: number;
  maxCapacity?: number;
}

export interface GeneratedSlot {
  id: string;
  shiftId: string;
  date: string;
  startTime: string;
  endTime: string;
  bookingType: string;
  queuePosition: number;
  isFlexible: boolean;
}

/** Filter shifts active on a given date */
export function getShiftsForDate(shifts: ShiftInfo[], date: string): ShiftInfo[] {
  const dayOfWeek = new Date(date).getDay();
  return shifts.filter(s => s.daysOfWeek.includes(dayOfWeek));
}

/** Generate all possible slots for a date from shifts (no availability check) */
export function generateSlotsForDate(
  doctorId: string,
  shifts: ShiftInfo[],
  date: string,
): GeneratedSlot[] {
  const dayOfWeek = new Date(date).getDay();
  const activeShifts = shifts.filter(s => s.daysOfWeek.includes(dayOfWeek));
  const slots: GeneratedSlot[] = [];

  for (const shift of activeShifts) {
    if (shift.enableSlotGeneration && shift.consultationDurationMin) {
      const [startH, startM] = shift.startTime.split(':').map(Number);
      const [endH, endM] = shift.endTime.split(':').map(Number);
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;
      const dur = shift.consultationDurationMin;
      let pos = 0;

      for (let m = startMinutes; m + dur <= endMinutes; m += dur) {
        if (shift.maxCapacity && pos >= shift.maxCapacity) break;
        const sH = Math.floor(m / 60);
        const sM = m % 60;
        const eH = Math.floor((m + dur) / 60);
        const eM = (m + dur) % 60;
        const startTime = `${String(sH).padStart(2, '0')}:${String(sM).padStart(2, '0')}`;
        const endTime = `${String(eH).padStart(2, '0')}:${String(eM).padStart(2, '0')}`;

        slots.push({
          id: `${doctorId}-${date}-${shift.id}-${pos}`,
          shiftId: shift.id,
          date,
          startTime,
          endTime,
          bookingType: 'clinic',
          queuePosition: pos + 1,
          isFlexible: false,
        });
        pos++;
      }
    } else {
      // Flexible queue mode — single "slot" representing the whole shift
      slots.push({
        id: `${doctorId}-${date}-${shift.id}-queue`,
        shiftId: shift.id,
        date,
        startTime: shift.startTime,
        endTime: shift.endTime,
        bookingType: 'clinic',
        queuePosition: 0, // will be computed from existing bookings
        isFlexible: true,
      });
    }
  }

  return slots;
}

/** Given existing bookings for a date, mark slots as available or taken */
export function markAvailability(
  slots: GeneratedSlot[],
  shifts: ShiftInfo[],
  existingBookings: { shift_id: string | null; start_time: string | null; status: string | null }[],
): (GeneratedSlot & { isAvailable: boolean })[] {
  const activeBookings = existingBookings.filter(b => b.status !== 'cancelled');

  return slots.map(slot => {
    const shift = shifts.find(s => s.id === slot.shiftId);

    if (slot.isFlexible) {
      // Count bookings for this shift
      const shiftBookings = activeBookings.filter(b => b.shift_id === slot.shiftId);
      const cap = shift?.maxCapacity || 999;
      return {
        ...slot,
        queuePosition: shiftBookings.length + 1,
        isAvailable: shiftBookings.length < cap,
      };
    } else {
      // Fixed slot — check if time is already booked
      const taken = activeBookings.some(
        b => b.shift_id === slot.shiftId && b.start_time === slot.startTime
      );
      return { ...slot, isAvailable: !taken };
    }
  });
}
