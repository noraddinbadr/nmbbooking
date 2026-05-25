import { supabase } from '@/shared/supabase';
import { toAppError, type AppError } from '@/shared/errors';
import { ok, err, type Result } from '@/shared/result';
import { mapProfile, type Profile } from '../schemas/auth.schema';
import type { Database } from '@/shared/supabase';

type AppRole = Database['public']['Enums']['app_role'];

export const profileRepo = {
  async getProfile(userId: string): Promise<Result<Profile | null, AppError>> {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, full_name_ar, phone, gender, avatar_url, date_of_birth')
      .eq('id', userId)
      .maybeSingle();
    if (error) return err(toAppError(error));
    return ok(data ? mapProfile(data) : null);
  },

  async getRoles(userId: string): Promise<Result<AppRole[], AppError>> {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);
    if (error) return err(toAppError(error));
    return ok((data ?? []).map((r: { role: AppRole }) => r.role));
  },

  async updateProfile(
    userId: string,
    patch: Partial<Pick<Profile, 'fullName' | 'fullNameAr' | 'phone' | 'gender' | 'avatarUrl' | 'dateOfBirth'>>,
  ): Promise<Result<Profile, AppError>> {
    const row: Record<string, unknown> = {};
    if (patch.fullName !== undefined) row.full_name = patch.fullName;
    if (patch.fullNameAr !== undefined) row.full_name_ar = patch.fullNameAr;
    if (patch.phone !== undefined) row.phone = patch.phone;
    if (patch.gender !== undefined) row.gender = patch.gender;
    if (patch.avatarUrl !== undefined) row.avatar_url = patch.avatarUrl;
    if (patch.dateOfBirth !== undefined) row.date_of_birth = patch.dateOfBirth;

    const { data, error } = await supabase
      .from('profiles')
      .update(row as never)
      .eq('id', userId)
      .select('id, full_name, full_name_ar, phone, gender, avatar_url, date_of_birth')
      .single();
    if (error) return err(toAppError(error));
    return ok(mapProfile(data));
  },
};