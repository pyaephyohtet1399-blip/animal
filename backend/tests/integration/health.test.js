const request = require('supertest');
const createApp = require('../../src/app');

const app = createApp();

describe('health endpoints', () => {
  test('GET /health returns 200 with process info', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body).toHaveProperty('uptime');
    expect(res.body).toHaveProperty('memory');
    expect(res.headers['x-request-id']).toBeDefined();
  });

  test('GET /api/v1 returns service info', async () => {
    const res = await request(app).get('/api/v1');
    expect(res.status).toBe(200);
    expect(res.body.data.service).toBe('livestock-survey-api');
  });

  test('unknown route returns 404 error envelope', async () => {
    const res = await request(app).get('/api/v1/nope');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('not_found');
  });

  test('GET /health/ready returns 503 when db/redis not connected', async () => {
    const res = await request(app).get('/health/ready');
    expect(res.status).toBe(503);
    expect(res.body.status).toBe('error');
    expect(res.body.database).toBe('disconnected');
    expect(res.body.redis).toBe('disconnected');
  });
});
