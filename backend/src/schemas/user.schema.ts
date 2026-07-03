import { z } from 'zod';

export const createUserSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(4),
  role: z.enum(['user', 'admin']).default('user'),
});

export const loginUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(4),
});

export const updateUserSchema = z
  .object({
    username: z.string().min(3).max(50).optional(),
    email: z.string().email().optional(),
    role: z.enum(['user', 'admin']).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required',
  });

export const userIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const listUsersQuerySchema = z.object({
  role: z.enum(['user', 'admin']).optional(),
  search: z.string().max(100).optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type LoginUserInput = z.infer<typeof loginUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
