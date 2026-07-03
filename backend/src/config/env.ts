import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  JWT_SECRET: z.string().min(16).default('test-jwt-secret-for-dev-only'),
  JWT_EXPIRES_IN: z.string().default('1h'),
  DATABASE_URL: z.string().url().optional(),
  REDIS_URL: z.string().url().optional(),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
  PASSWORD_RESET_EXPIRES_MINUTES: z.coerce.number().int().positive().default(60),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    throw new Error(`Invalid environment: ${result.error.message}`);
  }
  return result.data;
}

export const env = loadEnv();
