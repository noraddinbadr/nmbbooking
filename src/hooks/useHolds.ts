import { useState, useCallback, useEffect, useRef } from 'react';
import type { HoldResult, PatientInfo } from '@/data/eventsTypes';

// ============================================================
// Hold Management Hook
// Client-side logic for the hold pattern.
// TODO: Replace mock implementations with Supabase RPC calls
// when Cloud is enabled.
// ============================================================

interface CreateHoldParams {
  campId: string;
  scheduleId: string;
  bookedBy: string;
  patientInfo?: PatientInfo;
  patientProfileId?: string;
}

/**
 * Hook for managing event registration holds.
 * Implements a 5-minute TTL hold pattern with countdown.
 */
export function useHolds() {
  const [hold, setHold] = useState<HoldResult | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  // Countdown timer
  useEffect(() => {
    if (!hold) {
      setSecondsRemaining(0);
      return;
    }

    const expires = new Date(hold.holdExpiresAt).getTime();

    const tick = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((expires - now) / 1000));
      setSecondsRemaining(remaining);
      if (remaining <= 0) {
        clearInterval(timerRef.current);
        setHold(null);
        setError('انتهت مهلة الحجز المؤقت');
      }
    };

    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => clearInterval(timerRef.current);
  }, [hold]);

  /**
   * Create a hold reservation (5-minute TTL).
   * TODO: Replace with supabase.rpc('hold_event_slot', params)
   */
  const createHold = useCallback(async (params: CreateHoldParams): Promise<HoldResult> => {
    setLoading(true);
    setError(null);

    try {
      // --- MOCK IMPLEMENTATION ---
      // In production, this calls: supabase.rpc('hold_event_slot', { ... })
      await new Promise(resolve => setTimeout(resolve, 500)); // simulate network

      const result: HoldResult = {
        registrationId: `reg-${Date.now()}`,
        holdToken: `tok-${Math.random().toString(36).slice(2, 10)}`,
        holdExpiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      };

      setHold(result);
      return result;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'فشل إنشاء الحجز';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Confirm a held registration.
   * TODO: Replace with supabase.rpc('confirm_hold', { ... })
   */
  const confirmHold = useCallback(async (registrationId: string, holdToken: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 400));

      if (!hold || hold.holdToken !== holdToken) {
        throw new Error('رمز الحجز غير صالح أو منتهي الصلاحية');
      }

      clearInterval(timerRef.current);
      setHold(null);
      setSecondsRemaining(0);
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'فشل تأكيد الحجز';
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [hold]);

  /**
   * Release a hold manually.
   */
  const releaseHold = useCallback(async (registrationId: string, reason?: string): Promise<void> => {
    // TODO: supabase.from('registrations').update({ status: 'cancelled' })
    // and increment available_slots
    clearInterval(timerRef.current);
    setHold(null);
    setSecondsRemaining(0);
    console.log(`Hold released: ${registrationId}, reason: ${reason}`);
  }, []);

  return {
    hold,
    secondsRemaining,
    loading,
    error,
    createHold,
    confirmHold,
    releaseHold,
  };
}

// ============================================================
// Background Job: Reclaim Expired Holds (pseudo-code)
// This would run as a Supabase cron job or edge function.
// ============================================================
/*
 * -- Cron: every minute
 * SELECT public.reclaim_expired_holds();
 *
 * -- Or as edge function:
 * import { createClient } from '@supabase/supabase-js';
 *
 * Deno.serve(async () => {
 *   const supabase = createClient(url, serviceKey);
 *   const { data, error } = await supabase.rpc('reclaim_expired_holds');
 *   return new Response(JSON.stringify({ reclaimed: data }));
 * });
 */
