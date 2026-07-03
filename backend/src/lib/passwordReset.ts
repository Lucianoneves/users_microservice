import crypto from 'crypto';
import { env } from '../config/env';

export function hashResetToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function generateResetToken(): { token: string; tokenHash: string } {
  const token = crypto.randomBytes(32).toString('hex');
  return { token, tokenHash: hashResetToken(token) };
}

export function getResetTokenExpiry(): Date {
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + env.PASSWORD_RESET_EXPIRES_MINUTES);
  return expiresAt;
}

export function buildResetLink(token: string): string {
  const base = env.FRONTEND_URL.replace(/\/$/, '');
  return `${base}/redefinir-senha?token=${encodeURIComponent(token)}`;
}
