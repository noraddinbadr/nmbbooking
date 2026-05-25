import { z } from 'zod';

export const signInInput = z.object({
  email: z.string().email('بريد غير صالح'),
  password: z.string().min(6, 'كلمة المرور قصيرة'),
});
export type SignInInput = z.infer<typeof signInInput>;

export const signUpInput = signInInput.extend({
  fullName: z.string().min(2, 'الاسم مطلوب'),
  phone: z.string().optional().nullable(),
  gender: z.enum(['male', 'female']).optional().nullable(),
  dateOfBirth: z.string().optional().nullable(),
});
export type SignUpInput = z.infer<typeof signUpInput>;

export const resetPasswordInput = z.object({
  email: z.string().email(),
});
export type ResetPasswordInput = z.infer<typeof resetPasswordInput>;

export const updatePasswordInput = z.object({
  password: z.string().min(6),
});
export type UpdatePasswordInput = z.infer<typeof updatePasswordInput>;

/**
 * Profile DTO — kept in snake_case to match consumers across the app.
 * (Strangler migration: a full camelCase rename will follow once all callers move.)
 */
export interface Profile {
  id: string;
  full_name: string | null;
  full_name_ar: string | null;
  phone: string | null;
  gender: string | null;
  avatar_url: string | null;
  date_of_birth: string | null;
}

export function mapProfile(row: any): Profile {
  return {
    id: row.id,
    full_name: row.full_name ?? null,
    full_name_ar: row.full_name_ar ?? null,
    phone: row.phone ?? null,
    gender: row.gender ?? null,
    avatar_url: row.avatar_url ?? null,
    date_of_birth: row.date_of_birth ?? null,
  };
}