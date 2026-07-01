import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';

export interface JwtPayload {
  sub: number;
  role: string;
}

export function createToken(userId: number, role: string): string {
  const options: SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
    algorithm: 'HS256',
  };
  return jwt.sign({ sub: userId, role }, env.JWT_SECRET, options);
}

export function verifyToken(token: string): JwtPayload {
  const payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] });
  if (typeof payload === 'string' || payload.sub === undefined || !payload.role) {
    throw new Error('Invalid token payload');
  }
  return { sub: Number(payload.sub), role: String(payload.role) };
}

export function rolesMatch(userRole: string, requiredRole: string): boolean {
  return userRole === requiredRole;
}
