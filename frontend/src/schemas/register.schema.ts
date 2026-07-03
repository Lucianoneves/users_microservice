import { z } from 'zod';

export const registerFormSchema = z
  .object({
    username: z
      .string()
      .min(3, 'Nome de usuário deve ter pelo menos 3 caracteres')
      .max(50, 'Nome de usuário deve ter no máximo 50 caracteres')
      .regex(/^[a-zA-Z0-9_]+$/, 'Use apenas letras, números e underscore'),
    email: z.string().email('Informe um e-mail válido'),
    password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  });

export type RegisterFormInput = z.infer<typeof registerFormSchema>;

export type RegisterFormErrors = Partial<
  Record<keyof RegisterFormInput, string>
>;
