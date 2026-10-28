import 'reflect-metadata';
import path from 'path';
import { DataSource } from 'typeorm';
import { env } from './env';
import { entities } from '../database/entities';

const connection = env.db.url
  ? { url: env.db.url }
  : {
      host: env.db.host,
      port: env.db.port,
      username: env.db.user,
      password: env.db.password,
      database: env.db.name,
    };

export const AppDataSource = new DataSource({
  type: 'postgres',
  ...connection,
  ssl: env.db.ssl ? { rejectUnauthorized: false } : false,
  entities,
  migrations: [path.join(__dirname, '..', 'database', 'migrations', '*.{ts,js}')],
  synchronize: false,
  logging: env.db.logging,
});

export async function initializeDatabase(): Promise<DataSource> {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }
  return AppDataSource;
}
