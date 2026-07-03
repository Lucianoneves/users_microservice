import { z } from 'zod';

export const adminUpdateUserSchema = z.object({
  username: z.string().min(3, 'Mínimo 3 caracteres').max(50, 'Máximo 50 caracteres'),
  email: z.string().email('Informe um e-mail válido'),
});

export type AdminUpdateUserInput = z.infer<typeof adminUpdateUserSchema>;

export type AdminUpdateUserErrors = Partial<Record<keyof AdminUpdateUserInput, string>>;
