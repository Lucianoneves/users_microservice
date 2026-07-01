import { z } from 'zod';

export const loginFormSchema = z.object({
  email: z.string().email('Informe um e-mail válido'),
  password: z.string().min(1, 'Informe sua senha'),
});

export type LoginFormInput = z.infer<typeof loginFormSchema>;

export type LoginFormErrors = Partial<Record<keyof LoginFormInput, string>>;
