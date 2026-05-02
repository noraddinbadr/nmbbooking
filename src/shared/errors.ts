/**
 * Shared kernel — error model.
 *
 * Maps Supabase / Postgrest errors and DB RPC error strings into a stable
 * application-level error code that the UI can map to user-facing messages.
 */

export type AppErrorCode =
  | 'unauthenticated'
  | 'forbidden'
  | 'not_found'
  | 'invalid_input'
  | 'conflict'
  | 'invalid_state'
  | 'past_booking'
  | 'past_target'
  | 'invalid_transition'
  | 'network'
  | 'unknown';

export interface AppError {
  code: AppErrorCode;
  message: string;
  /** Original error (PostgrestError, ZodError, ...). Never logged to UI. */
  cause?: unknown;
}

export const appError = (
  code: AppErrorCode,
  message: string,
  cause?: unknown,
): AppError => ({ code, message, cause });

/**
 * Convert a thrown / returned Supabase error into a typed AppError.
 */
export function toAppError(e: unknown): AppError {
  if (!e) return appError('unknown', 'حدث خطأ غير متوقع');
  const anyErr = e as { code?: string; message?: string };
  const msg = anyErr?.message ?? 'حدث خطأ غير متوقع';

  // Custom error tokens raised by our SQL triggers / RPCs.
  if (msg.startsWith('BOOKING_PAST_WORKFLOW')) return appError('invalid_state', msg);
  if (msg.startsWith('BOOKING_PAST')) return appError('past_booking', msg);
  if (msg.startsWith('INVALID_TRANSITION')) return appError('invalid_transition', msg);

  switch (anyErr?.code) {
    case '23505': return appError('conflict', msg, e);
    case '23514': return appError('invalid_state', msg, e);
    case '42501': return appError('forbidden', msg, e);
    case 'PGRST116': return appError('not_found', msg, e);
    default: return appError('unknown', msg, e);
  }
}

/**
 * Map a Result-style RPC payload into an AppError.
 * Our SQL RPCs return jsonb { success: bool, error: string, message?: string }.
 */
export function fromRpcPayload(p: unknown): AppError | null {
  const obj = p as { success?: boolean; error?: string; message?: string } | null;
  if (!obj || obj.success) return null;
  const code = (obj.error ?? 'unknown') as AppErrorCode;
  return appError(code, obj.message ?? obj.error ?? 'فشلت العملية');
}