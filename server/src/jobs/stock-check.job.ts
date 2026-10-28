import cron, { ScheduledTask } from 'node-cron';
import { env } from '../config/env';
import { logger } from '../common/utils/logger';
import { alertsService } from '../modules/alerts/alerts.service';

let task: ScheduledTask | null = null;

export function startStockCheckJob(): void {
  if (!cron.validate(env.stockCheckCron)) {
    logger.warn(
      `Expresión cron inválida en STOCK_CHECK_CRON (${env.stockCheckCron}); el job diario no se programó`,
    );
    return;
  }
  task = cron.schedule(
    env.stockCheckCron,
    () => {
      alertsService
        .runFullCheck('cron')
        .catch((error) => logger.error('Falló la revisión diaria de stock mínimo', error));
    },
    { timezone: 'America/Lima' },
  );
  logger.info(`Revisión diaria de stock mínimo programada (${env.stockCheckCron}, America/Lima)`);
}

export function stopStockCheckJob(): void {
  task?.stop();
  task = null;
}
