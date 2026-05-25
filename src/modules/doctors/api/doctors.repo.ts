import { supabase } from '@/shared/supabase';
import { ok, err, type Result } from '@/shared/result';
import { toAppError, type AppError } from '@/shared/errors';
import { mapDoctor, type Doctor } from '../schemas/doctor.schema';

const SELECT = '*, clinics(*), doctor_shifts(*)';

export const doctorsRepo = {
  async list(): Promise<Result<Doctor[], AppError>> {
    const { data, error } = await supabase.from('doctors').select(SELECT);
    if (error) return err(toAppError(error));
    return ok((data ?? []).map(mapDoctor));
  },
  async byId(id: string): Promise<Result<Doctor, AppError>> {
    const { data, error } = await supabase.from('doctors').select(SELECT).eq('id', id).maybeSingle();
    if (error) return err(toAppError(error));
    if (!data) return err({ code: 'not_found', message: 'الطبيب غير موجود' });
    return ok(mapDoctor(data));
  },
  async featured(limit = 6): Promise<Result<Doctor[], AppError>> {
    const { data, error } = await supabase
      .from('doctors').select(SELECT)
      .eq('is_sponsored', true).limit(limit);
    if (error) return err(toAppError(error));
    return ok((data ?? []).map(mapDoctor));
  },
};