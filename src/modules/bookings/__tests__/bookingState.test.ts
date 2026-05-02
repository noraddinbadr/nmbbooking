import { describe, it, expect } from 'vitest';
import { canTransition, canRunWorkflowAction, isBookingPast } from '../state/bookingState';

describe('booking state machine', () => {
  it('allows pending → confirmed', () => {
    expect(canTransition('pending', 'confirmed', false)).toBe(true);
  });
  it('blocks completed → anything for non-admin', () => {
    expect(canTransition('completed', 'cancelled', false)).toBe(false);
  });
  it('admin override allows any transition', () => {
    expect(canTransition('completed', 'pending', true)).toBe(true);
  });
  it('blocks workflow actions on past bookings', () => {
    const r = canRunWorkflowAction('2000-01-01', '10:00', 'pending');
    expect(r.allowed).toBe(false);
  });
  it('detects past dates', () => {
    expect(isBookingPast('2000-01-01', '10:00')).toBe(true);
  });
});