import { Doctor, DoctorShift, TimeSlot } from '@/data/types';

export function getShiftsForDate(doctor: Doctor, date: string): DoctorShift[] {
  const dayOfWeek = new Date(date).getDay();
  return doctor.shifts.filter(s => s.daysOfWeek.includes(dayOfWeek));
}

export function generateTimeSlots(doctor: Doctor, date: string): TimeSlot[] {
  const dateObj = new Date(date);
  const dayOfWeek = dateObj.getDay();
  const activeShifts = doctor.shifts.filter(s => s.daysOfWeek.includes(dayOfWeek));
  const slots: TimeSlot[] = [];

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
          id: `${doctor.id}-${date}-${shift.id}-${pos}`,
          doctorId: doctor.id,
          shiftId: shift.id,
          date,
          startTime,
          endTime,
          isAvailable: Math.random() > 0.3,
          bookingType: 'clinic',
          queuePosition: pos + 1,
        });
        pos++;
      }
    } else {
      const bookedCount = Math.floor(Math.random() * (shift.maxCapacity || 20));
      const cap = shift.maxCapacity || 999;
      slots.push({
        id: `${doctor.id}-${date}-${shift.id}-queue`,
        doctorId: doctor.id,
        shiftId: shift.id,
        date,
        startTime: shift.startTime,
        endTime: shift.endTime,
        isAvailable: bookedCount < cap,
        bookingType: 'clinic',
        queuePosition: bookedCount + 1,
      });
    }
  }

  return slots;
}
