import request from 'supertest';
import { createTestMaterial, setupTestContext, teardownTestContext, TestContext } from './helpers';

describe('Movimientos de almacén (RF5, RF6, RF7, RNF03)', () => {
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

  it('una entrada incrementa el stock y registra el kardex', async () => {
    const material = await createTestMaterial(context, { initialStock: 100 });

    const response = await request(context.app)
      .post('/api/movements')
      .set('Authorization', auth())
      .send({
        type: 'ENTRADA',
        documentNumber: 'GUIA-TEST-001',
        registrationSeconds: 45,
        lines: [{ materialId: material.id, quantity: 25, unitPrice: 5 }],
      });

    expect(response.status).toBe(201);
    expect(response.body.code).toMatch(/^ING-\d{4}-\d{4}$/);
    expect(response.body.lines[0].previousStock).toBe(100);
    expect(response.body.lines[0].resultingStock).toBe(125);

    const updated = await request(context.app)
      .get(`/api/materials/${material.id}`)
      .set('Authorization', auth());
    expect(updated.body.currentStock).toBe(125);
  });

  it('una salida descuenta el stock y exige frente de obra', async () => {
    const material = await createTestMaterial(context, { initialStock: 50 });

    const missingFront = await request(context.app)
      .post('/api/movements')
      .set('Authorization', auth())
      .send({ type: 'SALIDA', lines: [{ materialId: material.id, quantity: 10 }] });
    expect(missingFront.status).toBe(400);

    const response = await request(context.app)
      .post('/api/movements')
      .set('Authorization', auth())
      .send({
        type: 'SALIDA',
        workFrontId,
        documentNumber: 'VALE-TEST-001',
        lines: [{ materialId: material.id, quantity: 10 }],
      });

    expect(response.status).toBe(201);
    expect(response.body.code).toMatch(/^SAL-\d{4}-\d{4}$/);
    expect(response.body.lines[0].resultingStock).toBe(40);
  });

  it('rechaza una salida que dejaría stock negativo', async () => {
    const material = await createTestMaterial(context, { initialStock: 5 });

    const response = await request(context.app)
      .post('/api/movements')
      .set('Authorization', auth())
      .send({ type: 'SALIDA', workFrontId, lines: [{ materialId: material.id, quantity: 6 }] });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('BUSINESS_RULE');
    expect(response.body.message).toContain('Stock insuficiente');

    const unchanged = await request(context.app)
      .get(`/api/materials/${material.id}`)
      .set('Authorization', auth());
    expect(unchanged.body.currentStock).toBe(5);
  });

  it('un ajuste fija el stock al valor contado', async () => {
    const material = await createTestMaterial(context, { initialStock: 80 });

    const response = await request(context.app)
      .post('/api/movements')
      .set('Authorization', auth())
      .send({
        type: 'AJUSTE',
        notes: 'Conteo físico de prueba',
        lines: [{ materialId: material.id, countedStock: 72 }],
      });

    expect(response.status).toBe(201);
    expect(response.body.code).toMatch(/^AJU-\d{4}-\d{4}$/);
    expect(response.body.lines[0].quantity).toBe(8);
    expect(response.body.lines[0].resultingStock).toBe(72);
  });

  it('anular un movimiento revierte el stock y genera una reversión', async () => {
    const material = await createTestMaterial(context, { initialStock: 30 });
    const created = await request(context.app)
      .post('/api/movements')
      .set('Authorization', auth())
      .send({ type: 'ENTRADA', lines: [{ materialId: material.id, quantity: 20 }] });
    expect(created.status).toBe(201);

    const voided = await request(context.app)
      .post(`/api/movements/${created.body.id}/void`)
      .set('Authorization', auth())
      .send({ reason: 'Registro duplicado de prueba' });

    expect(voided.status).toBe(200);
    expect(voided.body.status).toBe('ANULADO');
    expect(voided.body.voidReason).toBe('Registro duplicado de prueba');

    const restored = await request(context.app)
      .get(`/api/materials/${material.id}`)
      .set('Authorization', auth());
    expect(restored.body.currentStock).toBe(30);

    const kardex = await request(context.app)
      .get(`/api/materials/${material.id}/kardex`)
      .set('Authorization', auth());
    expect(kardex.body.length).toBe(2);
    expect(kardex.body.some((entry: { isReversal: boolean }) => entry.isReversal)).toBe(true);

    const again = await request(context.app)
      .post(`/api/movements/${created.body.id}/void`)
      .set('Authorization', auth())
      .send({ reason: 'Segundo intento' });
    expect(again.status).toBe(400);
  });
});
