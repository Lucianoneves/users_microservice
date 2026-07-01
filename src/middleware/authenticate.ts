import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../lib/auth';

export interface AuthenticatedRequest extends Request {
  user?: { id: number; role: string };
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization ?? '';
  if (!header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const token = header.slice('Bearer '.length);
  try {
    const payload = verifyToken(token);
    (req as AuthenticatedRequest).user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    res.status(401).json({ error: 'Unauthorized' });
  }
}

export function requireRole(role: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as AuthenticatedRequest).user;
    if (!user || user.role !== role) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    next();
  };
}

export function requireSelfOrAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const user = (req as AuthenticatedRequest).user;
  const targetId = Number(req.params.id);

  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  if (user.role === 'admin' || user.id === targetId) {
    next();
    return;
  }

  res.status(403).json({ error: 'Forbidden' });
}
