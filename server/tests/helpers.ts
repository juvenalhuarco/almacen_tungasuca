import 'reflect-metadata';
import request from 'supertest';
import { Express } from 'express';
import { createApp } from '../src/app';
import { AppDataSource, initializeDatabase } from '../src/config/data-source';
import { ADMIN_USER } from '../src/database/seeds/users.seed';

export interface TestContext {
  app: Express;
  adminToken: string;
}

export async function setupTestContext(): Promise<TestContext> {
  await initializeDatabase();
  const app = createApp();
  const response = await request(app)
    .post('/api/auth/login')
    .send({ username: ADMIN_USER.username, password: ADMIN_USER.password });
  if (response.status !== 200) {
    throw new Error(
      `No se pudo iniciar sesión con el administrador del seed (${response.status}). Ejecute "npm run seed" antes de las pruebas.`,
    );
  }
  return { app, adminToken: response.body.accessToken as string };
}

export async function teardownTestContext(): Promise<void> {
  if (AppDataSource.isInitialized) await AppDataSource.destroy();
}

export function uniqueSuffix(): string {
  return `${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`.toUpperCase();
}

export async function createTestMaterial(
  context: TestContext,
  overrides: Partial<{ initialStock: number; minimumStock: number; name: string }> = {},
): Promise<{ id: number; code: string }> {
  const [categories, units] = await Promise.all([
    request(context.app)
      .get('/api/categories?all=true')
      .set('Authorization', `Bearer ${context.adminToken}`),
    request(context.app)
      .get('/api/units?all=true')
      .set('Authorization', `Bearer ${context.adminToken}`),
  ]);
  const response = await request(context.app)
    .post('/api/materials')
    .set('Authorization', `Bearer ${context.adminToken}`)
    .send({
      code: `TST-${uniqueSuffix()}`,
      name: overrides.name ?? `Material de prueba ${uniqueSuffix()}`,
      categoryId: categories.body.data[0].id,
      unitId: units.body.data[0].id,
      minimumStock: overrides.minimumStock ?? 10,
      initialStock: overrides.initialStock ?? 100,
      referencePrice: 5,
    });
  if (response.status !== 201) {
    throw new Error(`No se pudo crear el material de prueba: ${JSON.stringify(response.body)}`);
  }
  return { id: response.body.id, code: response.body.code };
}
