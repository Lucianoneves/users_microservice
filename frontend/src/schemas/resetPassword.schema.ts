import { z } from 'zod';

export const resetPasswordFormSchema = z
  .object({
    password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  });

export type ResetPasswordFormInput = z.infer<typeof resetPasswordFormSchema>;
export type ResetPasswordFormErrors = Partial<Record<keyof ResetPasswordFormInput, string>>;
