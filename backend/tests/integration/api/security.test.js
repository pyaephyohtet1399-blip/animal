const http = require('http');
const zlib = require('zlib');
const request = require('supertest');
const Wardvillage = require('../../../src/models/Wardvillage');
const { signFor, auth } = require('../../helpers/auth');
const { setupTestApp, teardownTestApp, clearDb, clearRedis } = require('../../helpers/testApp');

let app;
let villageToken;
let townshipToken;
let districtToken;

const VILLAGE = {
  _id: '64f1a2b3c4d5e6f7a8b9c0f1',
  loginCode: '194657',
  role: 'village',
  districtCode: 'MMR0100',
  tspCode: 'MMR010031',
  tvgCode: 'MMR010031047',
  wvCode: '194657'
};
const TOWNSHIP = {
  _id: '64f1a2b3c4d5e6f7a8b9c0f2',
  loginCode: 'MMR010031',
  role: 'township',
  districtCode: 'MMR0100',
  tspCode: 'MMR010031'
};
const DISTRICT = {
  _id: '64f1a2b3c4d5e6f7a8b9c0f3',
  loginCode: 'MMR0100',
  role: 'district',
  districtCode: 'MMR0100'
};

beforeAll(async () => {
  app = await setupTestApp();
  villageToken = signFor(VILLAGE);
  townshipToken = signFor(TOWNSHIP);
  districtToken = signFor(DISTRICT);
});

beforeEach(async () => {
  await clearDb();
  await clearRedis(app);
});

afterEach(() => {
  process.env.RATE_LIMIT_ANON_MAX = '10000';
});

afterAll(async () => {
  await teardownTestApp();
});

describe('rate limiting (D-30)', () => {
  test('anon login exhausted -> 429 rate_limit_exceeded with headers', async () => {
    process.env.RATE_LIMIT_ANON_MAX = '3';
    const attempts = [];
    for (let i = 0; i < 4; i += 1) {
      attempts.push(
        await request(app)
          .post('/api/v1/auth/login')
          .send({ loginCode: '194657', password: 'wrong-password' })
      );
    }
    expect(attempts[0].status).toBe(401);
    const last = attempts[3];
    expect(last.status).toBe(429);
    expect(last.body.error.code).toBe('rate_limit_exceeded');
    expect(last.headers['x-ratelimit-limit']).toBe('3');
    expect(last.headers['x-ratelimit-remaining']).toBe('0');
    expect(last.headers['x-ratelimit-reset']).toBeDefined();
    expect(last.headers['retry-after']).toBe('60');
  });

  test('role headers follow the role table (GET = read limit, POST = write limit)', async () => {
    const v = await request(app).get('/api/v1/locations/townships').set(auth(villageToken));
    expect(v.status).toBe(200);
    expect(v.headers['x-ratelimit-limit']).toBe('1000');
    const t = await request(app).get('/api/v1/locations/townships').set(auth(townshipToken));
    expect(t.headers['x-ratelimit-limit']).toBe('2000');
    const d = await request(app).get('/api/v1/locations/townships').set(auth(districtToken));
    expect(d.headers['x-ratelimit-limit']).toBe('5000');

    const vw = await request(app).post('/api/v1/reports/district').set(auth(villageToken));
    expect(vw.headers['x-ratelimit-limit']).toBe('100');
    const tw = await request(app).post('/api/v1/reports/district').set(auth(townshipToken));
    expect(tw.headers['x-ratelimit-limit']).toBe('200');
    const dw = await request(app).post('/api/v1/reports/district').set(auth(districtToken));
    expect(dw.headers['x-ratelimit-limit']).toBe('500');
  });

  test('reads do not consume the write budget', async () => {
    for (let i = 0; i < 50; i += 1) {
      const read = await request(app).get('/api/v1/locations/townships').set(auth(villageToken));
      expect(read.status).toBe(200);
    }
    const write = await request(app).post('/api/v1/reports/district').set(auth(villageToken));
    expect(write.status).not.toBe(429);
    expect(write.headers['x-ratelimit-remaining']).toBe('99');
  });

  test('village role -> 429 after exhausting 100 write requests', async () => {
    let last;
    for (let i = 0; i <= 100; i += 1) {
      last = await request(app).post('/api/v1/reports/district').set(auth(villageToken));
    }
    expect(last.status).toBe(429);
    expect(last.body.error.code).toBe('rate_limit_exceeded');
    expect(last.headers['x-ratelimit-remaining']).toBe('0');
    expect(last.headers['retry-after']).toBeDefined();
  }, 60000);
});

describe('transport & headers hardening', () => {
  test('helmet headers, no x-powered-by, trust proxy', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.headers['strict-transport-security']).toContain('max-age=31536000');
    expect(res.headers['content-security-policy']).toBeDefined();
    expect(res.headers['x-frame-options']).toBeDefined();
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-powered-by']).toBeUndefined();
    expect(app.get('trust proxy')).toBe(1);
  });

  test('gzip compression on large responses', async () => {
    const docs = Array.from({ length: 60 }, (_, i) => ({
      wvCode: `199${String(i).padStart(3, '0')}`,
      wvName: `Ward Village No ${i} - အချက်အလက်စုစုပေါင်း`,
      tvgCode: 'MMR010031047'
    }));
    await Wardvillage.insertMany(docs);
    const server = app.listen(0);
    try {
      const { port } = server.address();
      const response = await new Promise((resolve, reject) => {
        http
          .get(
            {
              host: '127.0.0.1',
              port,
              path: '/api/v1/locations/wardvillages',
              headers: {
                'Accept-Encoding': 'gzip',
                Authorization: `Bearer ${districtToken}`
              }
            },
            (res) => {
              const chunks = [];
              res.on('data', (chunk) => chunks.push(chunk));
              res.on('end', () => resolve({ headers: res.headers, body: Buffer.concat(chunks) }));
            }
          )
          .on('error', reject);
      });
      expect(response.headers['content-encoding']).toBe('gzip');
      expect(response.headers.vary).toContain('Accept-Encoding');
      const parsed = JSON.parse(zlib.gunzipSync(response.body).toString());
      expect(Array.isArray(parsed.data)).toBe(true);
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  }, 30000);

  test('CORS preflight allows Idempotency-Key for allowed origin', async () => {
    const res = await request(app)
      .options('/api/v1/sync/push')
      .set('Origin', 'http://localhost:3000')
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'content-type,authorization,idempotency-key');
    expect(res.status).toBe(204);
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:3000');
    expect(String(res.headers['access-control-allow-headers']).toLowerCase()).toContain(
      'idempotency-key'
    );
    expect(res.headers['access-control-allow-methods']).toContain('POST');
  });

  test('CORS rejects disallowed origin -> 403', async () => {
    const res = await request(app)
      .options('/api/v1/sync/push')
      .set('Origin', 'https://evil.example.com')
      .set('Access-Control-Request-Method', 'POST');
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('forbidden');
  });
});

describe('input hardening', () => {
  test('body over 1mb -> 413 payload_too_large', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ loginCode: '194657', password: 'x', padding: 'a'.repeat(1100000) });
    expect(res.status).toBe(413);
    expect(res.body.error.code).toBe('payload_too_large');
  });

  test('malformed JSON -> 400 validation_error', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"loginCode":');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('validation_error');
  });

  test('NoSQL operator object -> 422 validation_error', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ loginCode: { $ne: null }, password: { $ne: null } });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('validation_error');
  });

  test('village gets 403 on district-only report endpoint', async () => {
    const res = await request(app).get('/api/v1/reports/district').set(auth(villageToken));
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('forbidden');
  });
});
