import request from 'supertest';
import { createTestMaterial, setupTestContext, teardownTestContext, TestContext } from './helpers';

describe('Alertas automáticas por stock mínimo (RF8, RF9)', () => {
  let context: TestContext;
  let workFrontId: number;
  const auth = () => `Bearer ${context.adminToken}`;

  beforeAll(async () => {
    context = await setupTestContext();
    const fronts = await request(context.app)
      .get('/api/work-fronts?all=true')
      .set('Authorization', auth());
    workFrontId = fronts.body.data[0].id;
  });

  afterAll(teardownTestContext);

  const findAlert = async (materialId: number, status: string) => {
    const response = await request(context.app)
      .get('/api/alerts')
      .query({ status, limit: 100 })
      .set('Authorization', auth());
    return response.body.data.find(
      (alert: { material: { id: number } }) => alert.material.id === materialId,
    );
  };

  it('genera una alerta pendiente cuando una salida deja el stock en el mínimo o por debajo', async () => {
    const material = await createTestMaterial(context, { initialStock: 20, minimumStock: 10 });

    const response = await request(context.app)
      .post('/api/movements')
      .set('Authorization', auth())
      .send({ type: 'SALIDA', workFrontId, lines: [{ materialId: material.id, quantity: 12 }] });
    expect(response.status).toBe(201);

    const alert = await findAlert(material.id, 'PENDIENTE');
    expect(alert).toBeDefined();
    expect(alert.type).toBe('STOCK_MINIMO');
    expect(alert.stockAtGeneration).toBe(8);
  });

  it('no duplica la alerta mientras siga abierta y la marca como agotado si el stock llega a cero', async () => {
    const material = await createTestMaterial(context, { initialStock: 10, minimumStock: 10 });
    await request(context.app)
      .post('/api/movements')
      .set('Authorization', auth())
      .send({ type: 'SALIDA', workFrontId, lines: [{ materialId: material.id, quantity: 4 }] });
    await request(context.app)
      .post('/api/movements')
      .set('Authorization', auth())
      .send({ type: 'SALIDA', workFrontId, lines: [{ materialId: material.id, quantity: 6 }] });

    const response = await request(context.app)
      .get('/api/alerts')
      .query({ limit: 100 })
      .set('Authorization', auth());
    const alerts = response.body.data.filter(
      (alert: { material: { id: number } }) => alert.material.id === material.id,
    );

    expect(alerts.length).toBe(1);
    expect(alerts[0].type).toBe('AGOTADO');
  });

  it('se puede marcar como atendida y se resuelve sola al reponer stock', async () => {
    const material = await createTestMaterial(context, { initialStock: 15, minimumStock: 10 });
    await request(context.app)
      .post('/api/movements')
      .set('Authorization', auth())
      .send({ type: 'SALIDA', workFrontId, lines: [{ materialId: material.id, quantity: 7 }] });

    const pending = await findAlert(material.id, 'PENDIENTE');
    expect(pending).toBeDefined();

    const attended = await request(context.app)
      .patch(`/api/alerts/${pending.id}/attend`)
      .set('Authorization', auth());
    expect(attended.status).toBe(200);
    expect(attended.body.status).toBe('ATENDIDA');

    await request(context.app)
      .post('/api/movements')
      .set('Authorization', auth())
      .send({ type: 'ENTRADA', lines: [{ materialId: material.id, quantity: 50 }] });

    const resolved = await findAlert(material.id, 'RESUELTA');
    expect(resolved).toBeDefined();
    expect(resolved.id).toBe(pending.id);
  });

  it('configurar un stock mínimo mayor al stock actual genera la alerta de inmediato', async () => {
    const material = await createTestMaterial(context, { initialStock: 30, minimumStock: 5 });

    const response = await request(context.app)
      .patch(`/api/materials/${material.id}/minimum-stock`)
      .set('Authorization', auth())
      .send({ minimumStock: 40 });
    expect(response.status).toBe(200);
    expect(response.body.stockStatus).toBe('CRITICO');

    const alert = await findAlert(material.id, 'PENDIENTE');
    expect(alert).toBeDefined();
  });

  it('la revisión completa devuelve conteos y queda en bitácora', async () => {
    const response = await request(context.app)
      .post('/api/alerts/check')
      .set('Authorization', auth());
    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        evaluated: expect.any(Number),
        created: expect.any(Number),
        resolved: expect.any(Number),
      }),
    );
  });
});
