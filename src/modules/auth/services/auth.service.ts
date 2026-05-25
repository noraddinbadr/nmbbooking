import { ok, err, type Result } from '@/shared/result';
import { appError, type AppError } from '@/shared/errors';
import { authRepo } from '../api/auth.repo';
import {
  signInInput, signUpInput, resetPasswordInput, updatePasswordInput,
  type SignInInput, type SignUpInput,
} from '../schemas/auth.schema';

export const authService = {
  async signIn(input: SignInInput): Promise<Result<true, AppError>> {
    const p = signInInput.safeParse(input);
    if (!p.success) return err(appError('invalid_input', p.error.issues[0]?.message ?? 'بيانات غير صالحة'));
    return authRepo.signIn(p.data);
  },
  async signUp(input: SignUpInput): Promise<Result<true, AppError>> {
    const p = signUpInput.safeParse(input);
    if (!p.success) return err(appError('invalid_input', p.error.issues[0]?.message ?? 'بيانات غير صالحة'));
    return authRepo.signUp(p.data);
  },
  async sendPasswordReset(email: string): Promise<Result<true, AppError>> {
    const p = resetPasswordInput.safeParse({ email });
    if (!p.success) return err(appError('invalid_input', 'بريد غير صالح'));
    return authRepo.sendPasswordReset(p.data.email);
  },
  async updatePassword(password: string): Promise<Result<true, AppError>> {
    const p = updatePasswordInput.safeParse({ password });
    if (!p.success) return err(appError('invalid_input', 'كلمة المرور قصيرة'));
    return authRepo.updatePassword(p.data.password);
  },
  signOut: () => authRepo.signOut(),
};