import 'reflect-metadata';
import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import { createDashboardRouter } from './components/dashboard';
import { createUsersRouter } from './components/users';
import { AppDataSource } from './data-source';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './lib/logger';

export { createToken, verifyToken, rolesMatch } from './lib/auth';

export const app = express();

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin === 'http://localhost:5173' || origin === 'http://127.0.0.1:5173') {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

app.use(helmet());
app.use(express.json({ limit: '10kb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'users' });
});

app.use('/users', createUsersRouter());
app.use('/dashboard', createDashboardRouter());

app.use(errorHandler);

async function bootstrap(): Promise<void> {
  if (env.DATABASE_URL) {
    await AppDataSource.initialize();
    logger.info('database.connected');
  } else {
    logger.warn('database.connected', { reason: 'DATABASE_URL not set' });
  }

  app.listen(env.PORT, () => {
    logger.info('server.started', { port: env.PORT });
  });
}

if (require.main === module) {
  bootstrap().catch((err: NodeJS.ErrnoException & { code?: string }) => {
    if (err?.code === '28P01') {
      logger.error('database.auth_failed', {
        hint: 'PostgreSQL rejected the password in DATABASE_URL. Update backend/.env (not .cursor/rules/).',
      });
    } else {
      logger.error('bootstrap.failed', { err });
    }
    process.exit(1);
  });
}
