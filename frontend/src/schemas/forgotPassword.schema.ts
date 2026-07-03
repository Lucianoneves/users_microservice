import { z } from 'zod';

export const forgotPasswordFormSchema = z.object({
  email: z.string().email('Informe um e-mail válido'),
});

export type ForgotPasswordFormInput = z.infer<typeof forgotPasswordFormSchema>;
export type ForgotPasswordFormErrors = Partial<Record<keyof ForgotPasswordFormInput, string>>;
