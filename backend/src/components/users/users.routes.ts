import { Router, Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { AppDataSource } from '../../data-source';
import { UserEntity } from '../../entities/UserEntity';
import {
  authenticate,
  requireRole,
  requireSelfOrAdmin,
} from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import {
  createUserSchema,
  loginUserSchema,
  updateUserSchema,
  userIdParamSchema,
  listUsersQuerySchema,
} from '../../schemas/user.schema';
import { UsersService } from './users.service';

const registrationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

export function createUsersRouter(service?: UsersService): Router {
  const router = Router();

  const getService = (): UsersService => {
    if (service) return service;
    if (!AppDataSource.isInitialized) {
      throw new Error('Database not initialized');
    }
    return new UsersService(AppDataSource.getRepository(UserEntity));
  };

  router.post(
    '/login',
    validate(loginUserSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await getService().login(req.body.email, req.body.password);
        if (!result) {
          res.status(401).json({ error: 'Invalid credentials' });
          return;
        }
        res.json(result);
      } catch (err) {
        next(err);
      }
    },
  );

  router.post(
    '/',
    registrationLimiter,
    validate(createUserSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await getService().create(req.body);
        res.status(201).json(result);
      } catch (err) {
        next(err);
      }
    },
  );

  router.get(
    '/',
    authenticate,
    requireRole('admin'),
    validate(listUsersQuerySchema, 'query'),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const users = await getService().list(req.query as { role?: string; search?: string });
        res.json(users);
      } catch (err) {
        next(err);
      }
    },
  );

  router.get(
    '/:id',
    authenticate,
    validate(userIdParamSchema, 'params'),
    requireSelfOrAdmin,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const user = await getService().findById(Number(req.params.id));
        if (!user) {
          res.status(404).json({ error: 'Not found' });
          return;
        }
        res.json(user);
      } catch (err) {
        next(err);
      }
    },
  );

  router.put(
    '/:id',
    authenticate,
    validate(userIdParamSchema, 'params'),
    validate(updateUserSchema),
    requireSelfOrAdmin,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const updated = await getService().update(Number(req.params.id), req.body);
        if (!updated) {
          res.status(404).json({ error: 'Not found' });
          return;
        }
        res.json({ updated: true });
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}
