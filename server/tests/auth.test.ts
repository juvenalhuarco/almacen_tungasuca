import request from 'supertest';
import { ADMIN_USER } from '../src/database/seeds/users.seed';
import { setupTestContext, teardownTestContext, TestContext } from './helpers';

describe('Autenticación (RF1, RF12)', () => {
  let context: TestContext;

  beforeAll(async () => {
    context = await setupTestContext();
  });

  afterAll(teardownTestContext);

  it('inicia sesión con credenciales válidas y devuelve el token y el usuario', async () => {
    const response = await request(context.app)
      .post('/api/auth/login')
      .send({ username: ADMIN_USER.username, password: ADMIN_USER.password });

    expect(response.status).toBe(200);
    expect(response.body.accessToken).toEqual(expect.any(String));
    expect(response.body.user.username).toBe(ADMIN_USER.username);
    expect(response.body.user.role).toBe('ADMINISTRADOR');
    expect(String(response.headers['set-cookie'])).toContain('refresh_token=');
  });

  it('rechaza credenciales inválidas con 401', async () => {
    const response = await request(context.app)
      .post('/api/auth/login')
      .send({ username: ADMIN_USER.username, password: 'contraseña-incorrecta' });

    expect(response.status).toBe(401);
    expect(response.body.code).toBe('UNAUTHORIZED');
  });

  it('valida los campos obligatorios con 422', async () => {
    const response = await request(context.app).post('/api/auth/login').send({});

    expect(response.status).toBe(422);
    expect(response.body.details).toHaveProperty('username');
    expect(response.body.details).toHaveProperty('password');
  });

  it('devuelve el usuario autenticado en /auth/me', async () => {
    const response = await request(context.app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${context.adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.username).toBe(ADMIN_USER.username);
  });

  it('bloquea rutas protegidas sin token', async () => {
    const response = await request(context.app).get('/api/users');
    expect(response.status).toBe(401);
  });

  it('cierra sesión y elimina la cookie de refresco', async () => {
    const response = await request(context.app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${context.adminToken}`);

    expect(response.status).toBe(204);
    expect(String(response.headers['set-cookie'])).toContain('refresh_token=;');
  });
});
