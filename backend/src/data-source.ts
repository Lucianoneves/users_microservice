import 'dotenv/config';
import 'reflect-metadata';
import path from 'path';
import { DataSource } from 'typeorm';
import { env } from './config/env';
import { PasswordResetTokenEntity } from './entities/PasswordResetTokenEntity';
import { UserEntity } from './entities/UserEntity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: env.DATABASE_URL,
  entities: [UserEntity, PasswordResetTokenEntity],
  migrations: [path.join(__dirname, 'migrations', '*.{ts,js}')],
  synchronize: env.NODE_ENV !== 'production',
});
