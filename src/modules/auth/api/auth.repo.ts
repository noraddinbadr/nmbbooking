/**
 * Auth repository — the only file allowed to talk to supabase.auth in this module.
 */
import { supabase } from '@/shared/supabase';
import { toAppError, type AppError } from '@/shared/errors';
import { ok, err, type Result } from '@/shared/result';
import type { SignInInput, SignUpInput } from '../schemas/auth.schema';

export const authRepo = {
  async signIn(input: SignInInput): Promise<Result<true, AppError>> {
    const { error } = await supabase.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    });
    if (error) return err(toAppError(error));
    return ok(true);
  },

  async signUp(input: SignUpInput): Promise<Result<true, AppError>> {
    const { error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          full_name: input.fullName,
          phone: input.phone ?? null,
          gender: input.gender ?? null,
          date_of_birth: input.dateOfBirth ?? null,
        },
      },
    });
    if (error) return err(toAppError(error));
    return ok(true);
  },

  async sendPasswordReset(email: string): Promise<Result<true, AppError>> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) return err(toAppError(error));
    return ok(true);
  },

  async updatePassword(password: string): Promise<Result<true, AppError>> {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return err(toAppError(error));
    return ok(true);
  },

  async signOut(): Promise<Result<true, AppError>> {
    const { error } = await supabase.auth.signOut();
    if (error) return err(toAppError(error));
    return ok(true);
  },

  getSession: () => supabase.auth.getSession(),
  onAuthStateChange: (cb: Parameters<typeof supabase.auth.onAuthStateChange>[0]) =>
    supabase.auth.onAuthStateChange(cb),
};