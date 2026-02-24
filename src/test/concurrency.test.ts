/**
 * Concurrency Test — Simulate N parallel hold requests for the last slot.
 * This is pseudocode for testing the atomic booking pattern.
 * In production, run against actual Supabase RPC.
 */
import { describe, it, expect } from 'vitest';

describe('Concurrent Hold Requests', () => {
  it('should allow only 1 successful hold when 1 slot remains', async () => {
    const N = 10;
    // Simulate N parallel requests to hold_event_slot
    // Each calls: supabase.rpc('hold_event_slot', { camp_id, schedule_id, booked_by })
    const results = await Promise.allSettled(
      Array.from({ length: N }, (_, i) =>
        mockHoldRequest(`user-${i}`)
      )
    );

    const successes = results.filter(r => r.status === 'fulfilled');
    const failures = results.filter(r => r.status === 'rejected');

    // Only 1 should succeed (atomic UPDATE WHERE available > 0)
    expect(successes.length).toBe(1);
    expect(failures.length).toBe(N - 1);
  });
});

/**
 * Mock implementation simulating the atomic SQL pattern.
 * Replace with actual Supabase call in integration tests.
 */
let availableSlots = 1; // simulate last slot

async function mockHoldRequest(userId: string): Promise<string> {
  // Simulate network latency
  await new Promise(r => setTimeout(r, Math.random() * 50));

  // Atomic check-and-decrement (simulates UPDATE ... WHERE available > 0)
  if (availableSlots > 0) {
    availableSlots--;
    return `hold-${userId}`;
  }
  throw new Error('no_slots');
}
