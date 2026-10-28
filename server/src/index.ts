import 'reflect-metadata';
import { env } from './config/env';
import { initializeDatabase } from './config/data-source';
import { createApp } from './app';
import { logger } from './common/utils/logger';
import { startStockCheckJob } from './jobs/stock-check.job';

async function bootstrap(): Promise<void> {
  await initializeDatabase();
  logger.info('Conectado a PostgreSQL');

  startStockCheckJob();

  const app = createApp();
  app.listen(env.port, () => {
    logger.info(`Servidor escuchando en http://localhost:${env.port}`);
    logger.info(`Documentación de la API en http://localhost:${env.port}/api/docs`);
  });
}

bootstrap().catch((error) => {
  logger.error('No se pudo iniciar el servidor', error);
  process.exit(1);
});
