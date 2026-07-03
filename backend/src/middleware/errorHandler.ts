import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { QueryFailedError } from 'typeorm';
import { ConflictError, ForbiddenError } from '../lib/errors';
import { logger } from '../lib/logger';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Validation failed',
      details: err.flatten().fieldErrors,
    });
    return;
  }

  if (err instanceof ConflictError) {
    res.status(409).json({ error: err.message });
    return;
  }

  if (err instanceof ForbiddenError) {
    res.status(403).json({ error: err.message });
    return;
  }

  if (err instanceof QueryFailedError) {
    const pgCode = (err as QueryFailedError & { driverError?: { code?: string } }).driverError
      ?.code;
    if (pgCode === '23505') {
      res.status(409).json({ error: 'User already exists' });
      return;
    }
  }

  logger.error('Unhandled error', { err });
  res.status(500).json({ error: 'Internal server error' });
}
