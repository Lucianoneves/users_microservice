import { DataSource } from 'typeorm';
import { env } from './config/env';
import { UserEntity } from './entities/UserEntity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: env.DATABASE_URL,
  entities: [UserEntity],
  synchronize: env.NODE_ENV !== 'production',
});
