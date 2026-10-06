const request = require('supertest');
const Township = require('../../../src/models/Township');
const Townvg = require('../../../src/models/Townvg');
const Wardvillage = require('../../../src/models/Wardvillage');
const BigAnimalCategory = require('../../../src/models/BigAnimalCategory');
const PoultryCategory = require('../../../src/models/PoultryCategory');
const BreedingCategory = require('../../../src/models/BreedingCategory');
const AuditLog = require('../../../src/models/AuditLog');
const { signFor } = require('../../helpers/auth');
const { setupTestApp, teardownTestApp, clearDb } = require('../../helpers/testApp');

let app;
let villageToken;
let townshipToken;
let districtToken;

const seedReferenceData = async () => {
  await Township.insertMany([
    { tspCode: 'MMR010028', tspName: 'မိတ္ထီလာ', districtCode: 'MMR0100' },
    { tspCode: 'MMR010031', tspName: 'ဝမ်းတွင်း', districtCode: 'MMR0100' }
  ]);
  await Townvg.insertMany([
    { tvgCode: 'MMR010031047', tvgName: 'ကျောင်းကုန်း', tspCode: 'MMR010031' },
    { tvgCode: 'MMR010028001', tvgName: 'မြို့သစ်', tspCode: 'MMR010028' }
  ]);
  await Wardvillage.insertMany([
    { wvCode: '194657', wvName: 'ကျောင်းကုန်း', tvgCode: 'MMR010031047' },
    { wvCode: '194660', wvName: 'ရွာသစ်', tvgCode: 'MMR010031047' },
    { wvCode: '194661', wvName: 'မြို့သစ်ရွာ', tvgCode: 'MMR010028001' }
  ]);
  await BigAnimalCategory.insertMany([
    { categoryId: 2, name: 'အသားစားနွား' },
    { categoryId: 1, name: 'ဒေသနွား' }
  ]);
  await PoultryCategory.insertMany([
    { categoryId: 11, name: 'အခြား' },
    { categoryId: 1, name: 'ဥစားကြက်' }
  ]);
  await BreedingCategory.insertMany([
    { categoryId: 6, name: 'သိုး' },
    { categoryId: 1, name: 'ဒေသနွား' }
  ]);
};

beforeAll(async () => {
  app = await setupTestApp();
  villageToken = signFor({
    _id: '64f1a2b3c4d5e6f7a8b9c0d1',
    loginCode: '194657',
    role: 'village',
    districtCode: 'MMR0100',
    tspCode: 'MMR010031',
    tvgCode: 'MMR010031047',
    wvCode: '194657'
  });
  townshipToken = signFor({
    _id: '64f1a2b3c4d5e6f7a8b9c0d2',
    loginCode: 'MMR010031',
    role: 'township',
    districtCode: 'MMR0100',
    tspCode: 'MMR010031'
  });
  districtToken = signFor({
    _id: '64f1a2b3c4d5e6f7a8b9c0d3',
    loginCode: 'MMR0100',
    role: 'district',
    districtCode: 'MMR0100'
  });
});

afterAll(async () => {
  await teardownTestApp();
});

beforeEach(async () => {
  await clearDb();
  await seedReferenceData();
});

const get = (path, token) =>
  request(app)
    .get(path)
    .set('Authorization', `Bearer ${token}`);

describe('GET /api/v1/locations endpoints', () => {
  test('requires authentication', async () => {
    const res = await request(app).get('/api/v1/locations/townships');
    expect(res.status).toBe(401);
  });

  test('village sees only its own township', async () => {
    const res = await get('/api/v1/locations/townships', villageToken);
    expect(res.status).toBe(200);
    expect(res.body.data.map((t) => t.tspCode)).toEqual(['MMR010031']);
    expect(res.body.data[0].tspName).toBe('ဝမ်းတွင်း');
    expect(res.body.data[0].districtCode).toBe('MMR0100');
    expect(res.body.data[0]).not.toHaveProperty('_id');
    expect(res.headers['cache-control']).toBe('public, max-age=3600');
    expect(res.headers['x-ratelimit-limit']).toBe('100');
  });

  test('township sees only its own township', async () => {
    const res = await get('/api/v1/locations/townships', townshipToken);
    expect(res.status).toBe(200);
    expect(res.body.data.map((t) => t.tspCode)).toEqual(['MMR010031']);
  });

  test('district sees all townships in its district', async () => {
    const res = await get('/api/v1/locations/townships', districtToken);
    expect(res.status).toBe(200);
    expect(res.body.data.map((t) => t.tspCode)).toEqual(['MMR010028', 'MMR010031']);
  });

  test('village sees only its own townvg regardless of tspCode param', async () => {
    const own = await get('/api/v1/locations/townvgs', villageToken);
    expect(own.status).toBe(200);
    expect(own.body.data.map((t) => t.tvgCode)).toEqual(['MMR010031047']);
    expect(own.headers['cache-control']).toBe('public, max-age=3600');

    const other = await get('/api/v1/locations/townvgs?tspCode=MMR010028', villageToken);
    expect(other.status).toBe(200);
    expect(other.body.data.map((t) => t.tvgCode)).toEqual(['MMR010031047']);
  });

  test('township sees all townvgs in its own township only', async () => {
    const res = await get('/api/v1/locations/townvgs', townshipToken);
    expect(res.status).toBe(200);
    expect(res.body.data.map((t) => t.tvgCode)).toEqual(['MMR010031047']);

    const cross = await get('/api/v1/locations/townvgs?tspCode=MMR010028', townshipToken);
    expect(cross.body.data.map((t) => t.tvgCode)).toEqual(['MMR010031047']);
  });

  test('district can filter townvgs by tspCode', async () => {
    const filtered = await get('/api/v1/locations/townvgs?tspCode=MMR010031', districtToken);
    expect(filtered.status).toBe(200);
    expect(filtered.body.data.map((t) => t.tvgCode)).toEqual(['MMR010031047']);

    const all = await get('/api/v1/locations/townvgs', districtToken);
    expect(all.body.data).toHaveLength(2);
    expect(all.headers['cache-control']).toBe('public, max-age=3600');
  });

  test('village sees only its own wardvillage regardless of tvgCode param', async () => {
    const own = await get('/api/v1/locations/wardvillages', villageToken);
    expect(own.status).toBe(200);
    expect(own.body.data.map((w) => w.wvCode)).toEqual(['194657']);

    const other = await get('/api/v1/locations/wardvillages?tvgCode=MMR010028001', villageToken);
    expect(other.body.data.map((w) => w.wvCode)).toEqual(['194657']);
  });

  test('township sees wardvillages in its own township only', async () => {
    const res = await get('/api/v1/locations/wardvillages', townshipToken);
    expect(res.status).toBe(200);
    expect(res.body.data.map((w) => w.wvCode)).toEqual(['194657', '194660']);

    const cross = await get('/api/v1/locations/wardvillages?tvgCode=MMR010028001', townshipToken);
    expect(cross.body.data.map((w) => w.wvCode)).toEqual(['194657', '194660']);
  });

  test('district can filter wardvillages by tvgCode', async () => {
    const filtered = await get('/api/v1/locations/wardvillages?tvgCode=MMR010031047', districtToken);
    expect(filtered.status).toBe(200);
    expect(filtered.body.data.map((w) => w.wvCode)).toEqual(['194657', '194660']);

    const all = await get('/api/v1/locations/wardvillages', districtToken);
    expect(all.body.data).toHaveLength(3);
  });

  test('rejects empty location filter with 422', async () => {
    const res = await get('/api/v1/locations/townvgs?tspCode=', villageToken);
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('validation_error');
  });

  test('serves from cache after database is emptied', async () => {
    const first = await get('/api/v1/locations/townships', villageToken);
    expect(first.body.data).toHaveLength(1);

    await clearDb();
    const cached = await get('/api/v1/locations/townships', villageToken);
    expect(cached.status).toBe(200);
    expect(cached.body.data).toHaveLength(1);

    await app.locals.redis.del('locations:townships:tsp:MMR010031');
    const fresh = await get('/api/v1/locations/townships', villageToken);
    expect(fresh.status).toBe(200);
    expect(fresh.body.data).toHaveLength(0);
  });

  test('GET requests are not audited', async () => {
    await get('/api/v1/locations/townships', villageToken);
    await get('/api/v1/locations/wardvillages', villageToken);
    expect(await AuditLog.countDocuments()).toBe(0);
  });
});

describe('GET /api/v1/categories/:type', () => {
  test('returns categories sorted by categoryId with cache header', async () => {
    const big = await get('/api/v1/categories/big', villageToken);
    expect(big.status).toBe(200);
    expect(big.body.data).toEqual([
      { categoryId: 1, name: 'ဒေသနွား' },
      { categoryId: 2, name: 'အသားစားနွား' }
    ]);
    expect(big.headers['cache-control']).toBe('public, max-age=3600');

    const poultry = await get('/api/v1/categories/poultry', villageToken);
    expect(poultry.status).toBe(200);
    expect(poultry.body.data).toHaveLength(2);
    expect(poultry.body.data[0].categoryId).toBe(1);
  });

  test('whitelists type param (D-24)', async () => {
    const res = await get('/api/v1/categories/huge', villageToken);
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('validation_error');
  });

  test('serves breeding categories (D-54)', async () => {
    const res = await get('/api/v1/categories/breeding', villageToken);
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([
      { categoryId: 1, name: 'ဒေသနွား' },
      { categoryId: 6, name: 'သိုး' }
    ]);
    expect(res.headers['cache-control']).toBe('public, max-age=3600');
  });

  test('requires authentication', async () => {
    const res = await request(app).get('/api/v1/categories/big');
    expect(res.status).toBe(401);
  });

  test('serves from cache after database is emptied', async () => {
    const first = await get('/api/v1/categories/big', villageToken);
    expect(first.body.data).toHaveLength(2);

    await clearDb();
    const cached = await get('/api/v1/categories/big', villageToken);
    expect(cached.body.data).toHaveLength(2);

    await app.locals.redis.del('categories:big');
    const fresh = await get('/api/v1/categories/big', villageToken);
    expect(fresh.body.data).toHaveLength(0);
  });
});

describe('GET /api/v1/categories/:type/:categoryId', () => {
  beforeEach(async () => {
    await app.locals.redis.del(
      'categories:big',
      'categories:small',
      'categories:poultry',
      'categories:breeding'
    );
  });

  test('returns a single category with cache header', async () => {
    const res = await get('/api/v1/categories/big/1', villageToken);
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ categoryId: 1, name: 'ဒေသနွား' });
    expect(res.headers['cache-control']).toBe('public, max-age=3600');

    const breeding = await get('/api/v1/categories/breeding/6', villageToken);
    expect(breeding.status).toBe(200);
    expect(breeding.body.data).toEqual({ categoryId: 6, name: 'သိုး' });
  });

  test('returns 404 when categoryId does not exist in type', async () => {
    const res = await get('/api/v1/categories/big/99', villageToken);
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('not_found');
  });

  test('returns 422 for non-numeric categoryId', async () => {
    const res = await get('/api/v1/categories/big/abc', villageToken);
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('validation_error');
  });

  test('returns 422 for invalid type with id', async () => {
    const res = await get('/api/v1/categories/huge/1', villageToken);
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('validation_error');
  });

  test('requires authentication', async () => {
    const res = await request(app).get('/api/v1/categories/big/1');
    expect(res.status).toBe(401);
  });

  test('serves from list cache after database is emptied', async () => {
    await get('/api/v1/categories/big/1', villageToken);
    await clearDb();
    const cached = await get('/api/v1/categories/big/2', villageToken);
    expect(cached.status).toBe(200);
    expect(cached.body.data).toEqual({ categoryId: 2, name: 'အသားစားနွား' });
  });
});
