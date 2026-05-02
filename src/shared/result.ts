/**
 * Result<T, E> — explicit success/failure envelope used by service-layer functions.
 *
 * Services should NOT throw on expected business failures (validation,
 * forbidden, conflict, ...). They return `err(...)` so callers handle the
 * outcome statically. Unexpected exceptions still bubble up.
 */
export type Ok<T> = { ok: true; value: T };
export type Err<E> = { ok: false; error: E };
export type Result<T, E = AppError> = Ok<T> | Err<E>;

import type { AppError } from './errors';

export const ok = <T>(value: T): Ok<T> => ({ ok: true, value });
export const err = <E>(error: E): Err<E> => ({ ok: false, error });

export function unwrap<T, E>(r: Result<T, E>): T {
  if (r.ok) return r.value;
  throw r.error;
}