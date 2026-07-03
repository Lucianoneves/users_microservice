import { Router, Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { AppDataSource } from '../../data-source';
import { PasswordResetTokenEntity } from '../../entities/PasswordResetTokenEntity';
import { UserEntity } from '../../entities/UserEntity';
import {
  authenticate,
  requireRole,
  requireSelfOrAdmin,
  AuthenticatedRequest,
} from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import {
  createUserSchema,
  loginUserSchema,
  updateUserSchema,
  userIdParamSchema,
  listUsersQuerySchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  reactivateUserSchema,
  type UpdateUserInput,
} from '../../schemas/user.schema';
import { UsersService } from './users.service';

const registrationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
});

export function createUsersRouter(service?: UsersService): Router {
  const router = Router();

  const getService = (): UsersService => { // função para obter o serviço de usuários
    if (service) return service;
    if (!AppDataSource.isInitialized) {
      throw new Error('Database not initialized');
    }
    return new UsersService(
      AppDataSource.getRepository(UserEntity),
      AppDataSource.getRepository(PasswordResetTokenEntity),
    );
  };

  router.post(
    '/forgot-password',
    passwordResetLimiter,
    validate(forgotPasswordSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        await getService().requestPasswordReset(req.body.email);
        res.json({
          message:
            'Se o e-mail estiver cadastrado, você receberá instruções para redefinir sua senha.',
        });
      } catch (err) {
        next(err);
      }
    },
  );

  router.post(
    '/reset-password',
    passwordResetLimiter,
    validate(resetPasswordSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const success = await getService().resetPassword(req.body.token, req.body.password);
        if (!success) {
          res.status(400).json({ error: 'Invalid or expired reset token' });
          return;
        }
        res.json({ message: 'Password updated successfully' });
      } catch (err) {
        next(err);
      }
    },
  );

  router.post(
    '/reactivate',
    registrationLimiter,
    validate(reactivateUserSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await getService().reactivate(req.body.email, req.body.password);
        if (!result) {
          res.status(401).json({ error: 'Invalid credentials or account is not deactivated' });
          return;
        }
        res.json(result);
      } catch (err) {
        next(err);
      }
    },
  );

  router.post( // rota para fazer login
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

  router.post( // rota para criar um novo usuário
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

  router.get( // rota para listar todos os usuários
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
    '/deleted',
    authenticate,
    requireRole('admin'),
    async (_req: Request, res: Response, next: NextFunction) => {
      try {
        const users = await getService().listDeleted();
        res.json(users);
      } catch (err) {
        next(err);
      }
    },
  );

  router.get( // rota para buscar um usuário por ID
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
        const authUser = (req as AuthenticatedRequest).user!;
        const body = { ...req.body } as UpdateUserInput;
        if (authUser.role !== 'admin') {
          delete body.role;
        }
        const updated = await getService().update(Number(req.params.id), body);
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

  router.post(
    '/:id/restore',
    authenticate,
    validate(userIdParamSchema, 'params'),
    requireRole('admin'),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const restored = await getService().restore(Number(req.params.id));
        if (!restored) {
          res.status(404).json({ error: 'Not found or account is not deactivated' });
          return;
        }
        res.json({ restored: true });
      } catch (err) {
        next(err);
      }
    },
  );

  router.delete(
    '/:id',
    authenticate,
    validate(userIdParamSchema, 'params'),
    requireSelfOrAdmin,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const deleted = await getService().softDelete(Number(req.params.id));
        if (!deleted) {
          res.status(404).json({ error: 'Not found' });
          return;
        }
        res.json({ deleted: true });
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}
