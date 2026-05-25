import { supabase } from '@/shared/supabase';
import { ok, err, type Result } from '@/shared/result';
import { toAppError, type AppError } from '@/shared/errors';
import { mapClinic, type Clinic } from '../schemas/clinic.schema';

export const clinicsRepo = {
  async list(): Promise<Result<Clinic[], AppError>> {
    const { data, error } = await supabase.from('clinics').select('*').order('name_ar');
    if (error) return err(toAppError(error));
    return ok((data ?? []).map(mapClinic));
  },
  async byId(id: string): Promise<Result<Clinic, AppError>> {
    const { data, error } = await supabase.from('clinics').select('*').eq('id', id).maybeSingle();
    if (error) return err(toAppError(error));
    if (!data) return err({ code: 'not_found', message: 'العيادة غير موجودة' });
    return ok(mapClinic(data));
  },
};