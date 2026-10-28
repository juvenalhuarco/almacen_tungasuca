import 'reflect-metadata';
import { AppDataSource, initializeDatabase } from '../../config/data-source';
import { logger } from '../../common/utils/logger';
import { alertNotifier } from '../../modules/alerts/alerts.notifier';
import { seedRoles } from './roles.seed';
import { seedUsers } from './users.seed';
import { seedCategories } from './categories.seed';
import { seedUnits } from './units.seed';
import { seedSuppliers } from './suppliers.seed';
import { seedWorkFronts } from './work-fronts.seed';
import { seedMaterials } from './materials.seed';
import { seedDemoMovements } from './movements.seed';

const withDemoData = process.argv.includes('--demo');

async function run(): Promise<void> {
  await initializeDatabase();
  const manager = AppDataSource.manager;

  await seedRoles(manager);
  await seedUsers(manager);
  await seedCategories(manager);
  await seedUnits(manager);
  await seedSuppliers(manager);
  await seedWorkFronts(manager);
  await seedMaterials(manager);
  logger.info('Datos iniciales cargados correctamente');

  if (withDemoData) {
    await seedDemoMovements(manager);
    await alertNotifier.waitForPending();
    logger.info('Movimientos de demostración cargados correctamente');
  }
}

run()
  .then(() => AppDataSource.destroy())
  .catch(async (error) => {
    logger.error('Error al cargar los datos', error);
    if (AppDataSource.isInitialized) await AppDataSource.destroy();
    process.exit(1);
  });
