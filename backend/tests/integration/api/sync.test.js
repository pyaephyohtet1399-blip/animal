const crypto = require('crypto');
const request = require('supertest');
const Township = require('../../../src/models/Township');
const Townvg = require('../../../src/models/Townvg');
const Wardvillage = require('../../../src/models/Wardvillage');
const BigAnimalCategory = require('../../../src/models/BigAnimalCategory');
const SmallAnimalCategory = require('../../../src/models/SmallAnimalCategory');
const PoultryCategory = require('../../../src/models/PoultryCategory');
const BreedingCategory = require('../../../src/models/BreedingCategory');
const Survey = require('../../../src/models/Survey');
const InterviewInfo = require('../../../src/models/InterviewInfo');
const SurveySummary = require('../../../src/models/SurveySummary');
const syncService = require('../../../src/services/syncService');
const surveyService = require('../../../src/services/surveyService');
const { signFor, auth } = require('../../helpers/auth');
const { setupTestApp, teardownTestApp, clearDb, clearRedis } = require('../../helpers/testApp');

let app;
let villageToken;
let otherVillageToken;
let townshipToken;
let otherTownshipToken;
let districtToken;

const VILLAGE = {
  _id: '64f1a2b3c4d5e6f7a8b9c0d1',
  loginCode: '194657',
  role: 'village',
  districtCode: 'MMR0100',
  tspCode: 'MMR010031',
  tvgCode: 'MMR010031047',
  wvCode: '194657',
  mustChangePassword: false
};
const OTHER_VILLAGE = { ...VILLAGE, _id: '64f1a2b3c4d5e6f7a8b9c0d9', wvCode: '194660', mustChangePassword: false };
const TOWNSHIP = {
  _id: '64f1a2b3c4d5e6f7a8b9c0d2',
  loginCode: 'MMR010031',
  role: 'township',
  districtCode: 'MMR0100',
  tspCode: 'MMR010031',
  mustChangePassword: false
};
const OTHER_TOWNSHIP = { ...TOWNSHIP, _id: '64f1a2b3c4d5e6f7a8b9c0d8', tspCode: 'MMR010028', mustChangePassword: false };
const DISTRICT = {
  _id: '64f1a2b3c4d5e6f7a8b9c0d3',
  loginCode: 'MMR0100',
  role: 'district',
  districtCode: 'MMR0100',
  mustChangePassword: false
};

const INTERVIEW = {
  hName: 'ဦးအောင်မြင့်',
  hEdu: 'ဘွဲ့',
  hGender: 'အထီး',
  hPhone: '09123456789',
  hAge: 45,
  ansDate: '2026-01-15'
};
const ANIMALS = {
  bigAnimals: [{ categoryId: 1, ageLimit: 'LessThanOne', sex: 'male', count: 2 }],
  smallAnimals: [],
  poultry: [{ categoryId: 1, ageLimit: 'Old', sex: 'female', count: 10 }]
};

const uuid = () => crypto.randomUUID();

const createItem = (localRowId = 1, overrides = {}) => ({
  localRowId,
  op: 'create',
  survey: ANIMALS,
  interview: INTERVIEW,
  ...overrides
});

const push = (items, { token = villageToken, key = uuid() } = {}) =>
  request(app)
    .post('/api/v1/sync/push')
    .set(auth(token))
    .set('Idempotency-Key', key)
    .send({ items });

const pull = (query = '', token = villageToken) =>
  request(app).get(`/api/v1/sync/pull${query}`).set(auth(token));

const seedReferenceData = async () => {
  await Township.insertMany([
    { tspCode: 'MMR010028', tspName: 'မိတ္ထီလာ', districtCode: 'MMR0100' },
    { tspCode: 'MMR010031', tspName: 'ဝမ်းတွင်း', districtCode: 'MMR0100' }
  ]);
  await Townvg.insertMany([{ tvgCode: 'MMR010031047', tvgName: 'ကျောင်းကုန်း', tspCode: 'MMR010031' }]);
  await Wardvillage.insertMany([
    { wvCode: '194657', wvName: 'ကျောင်းကုန်း', tvgCode: 'MMR010031047' },
    { wvCode: '194660', wvName: 'ရွာသစ်', tvgCode: 'MMR010031047' }
  ]);
  await BigAnimalCategory.insertMany([
    { categoryId: 2, name: 'အသားစားနွား' },
    { categoryId: 1, name: 'ဒေသနွား' }
  ]);
  await SmallAnimalCategory.insertMany([{ categoryId: 3, name: 'သမတ်' }]);
  await PoultryCategory.insertMany([{ categoryId: 1, name: 'ဥစားကြက်' }]);
  await BreedingCategory.insertMany([{ categoryId: 1, name: 'ဒေသနွား' }]);
};

const pushCreate = async (options = {}) => {
  const res = await push([createItem(1)], options);
  expect(res.status).toBe(200);
  expect(res.body.data.results[0].status).toBe('created');
  return res.body.data.results[0];
};

beforeAll(async () => {
  app = await setupTestApp();
  villageToken = signFor(VILLAGE);
  otherVillageToken = signFor(OTHER_VILLAGE);
  townshipToken = signFor(TOWNSHIP);
  otherTownshipToken = signFor(OTHER_TOWNSHIP);
  districtToken = signFor(DISTRICT);
});

afterAll(async () => {
  await teardownTestApp();
});

beforeEach(async () => {
  await clearDb();
  await clearRedis(app);
  await seedReferenceData();
});

describe('POST /api/v1/sync/push — create (D-18/D-37)', () => {
  test('creates interview + survey with syncVersion 1 and token-scope codes', async () => {
    const res = await push([createItem(1)]);
    expect(res.status).toBe(200);
    expect(res.body.data.results).toEqual([
      { localRowId: 1, status: 'created', surveyId: 1, syncVersion: 1 }
    ]);

    const survey = await Survey.findOne({ surveyId: 1 }).lean();
    expect(survey.syncVersion).toBe(1);
    expect(survey.status).toBe('draft');
    expect(survey.tspCode).toBe(VILLAGE.tspCode);
    expect(survey.wvCode).toBe(VILLAGE.wvCode);
    expect(survey.villageHeadmanId.toString()).toBe(VILLAGE._id);

    const interview = await InterviewInfo.findById(survey.interviewId).lean();
    expect(interview.hName).toBe(INTERVIEW.hName);
    expect(interview.wvCode).toBe(VILLAGE.wvCode);
  });

  test('create with breedingAnimals derives hasBreeding=true (D-54)', async () => {
    const res = await push([
      createItem(1, {
        survey: {
          ...ANIMALS,
          breedingAnimals: [{ categoryId: 1, sex: 'male', count: 4 }]
        }
      })
    ]);
    expect(res.status).toBe(200);
    expect(res.body.data.results[0].status).toBe('created');
    const survey = await Survey.findOne({ surveyId: 1 }).lean();
    expect(survey.breedingAnimals).toHaveLength(1);
    expect(survey.hasBreeding).toBe(true);
  });

  test('same Idempotency-Key twice → single create, identical body (D-36)', async () => {
    const key = uuid();
    const first = await push([createItem(1)], { key });
    const second = await push([createItem(1)], { key });
    expect(second.status).toBe(200);
    expect(second.body).toEqual(first.body);
    expect(await Survey.countDocuments()).toBe(1);
    expect(await InterviewInfo.countDocuments()).toBe(1);
  });

  test('held lock → 409 request_in_progress (D-36)', async () => {
    const key = uuid();
    await app.locals.redis.set(syncService.lockKey(key), '1', 'EX', 30);
    const res = await push([createItem(1)], { key });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('request_in_progress');
    expect(await Survey.countDocuments()).toBe(0);
    await app.locals.redis.del(syncService.lockKey(key));
  });

  test('non-village create → rejected forbidden', async () => {
    const res = await push([createItem(1)], { token: townshipToken });
    expect(res.status).toBe(200);
    expect(res.body.data.results[0]).toMatchObject({
      status: 'rejected',
      error: { code: 'forbidden' }
    });
    expect(await Survey.countDocuments()).toBe(0);
  });

  test('requires authentication', async () => {
    const res = await request(app)
      .post('/api/v1/sync/push')
      .set('Idempotency-Key', uuid())
      .send({ items: [createItem(1)] });
    expect(res.status).toBe(401);
  });

  test('rejects invalid requests with 422', async () => {
    const noKey = await request(app)
      .post('/api/v1/sync/push')
      .set(auth(villageToken))
      .send({ items: [createItem(1)] });
    expect(noKey.status).toBe(422);

    const badKey = await push([createItem(1)], { key: 'not-a-uuid' });
    expect(badKey.status).toBe(422);

    const empty = await push([]);
    expect(empty.status).toBe(422);

    const tooMany = await push(
      Array.from({ length: 51 }, (_, i) => createItem(i + 1))
    );
    expect(tooMany.status).toBe(422);

    const badEnum = await push([
      createItem(1, { interview: { ...INTERVIEW, ansDate: '2026-01-15' }, survey: { ...ANIMALS, bigAnimals: [{ categoryId: 1, ageLimit: 'Nope', sex: 'male', count: 1 }] } })
    ]);
    expect(badEnum.status).toBe(422);
    expect(await Survey.countDocuments()).toBe(0);
  });
});

describe('POST /api/v1/sync/push — update + version conflict (D-19)', () => {
  test('update with newer syncVersion applies payload', async () => {
    await pushCreate();
    const res = await push([
      {
        localRowId: 2,
        op: 'update',
        surveyId: 1,
        syncVersion: 2,
        survey: { ...ANIMALS, bigAnimals: [{ categoryId: 2, ageLimit: 'Over3', sex: 'female', count: 5 }] },
        interview: { ...INTERVIEW, hName: 'ပြင်ဆင်ပြီး', hAge: 46 }
      }
    ]);
    expect(res.status).toBe(200);
    expect(res.body.data.results[0]).toMatchObject({
      status: 'updated',
      surveyId: 1,
      syncVersion: 2
    });

    const survey = await Survey.findOne({ surveyId: 1 }).lean();
    expect(survey.syncVersion).toBe(2);
    expect(survey.bigAnimals[0].count).toBe(5);
    const interview = await InterviewInfo.findOne({}).lean();
    expect(interview.hName).toBe('ပြင်ဆင်ပြီး');
  });

  test('update payload with breedingAnimals flips hasBreeding (D-54)', async () => {
    await pushCreate();
    const withBreeding = await push([
      {
        localRowId: 2,
        op: 'update',
        surveyId: 1,
        syncVersion: 2,
        survey: { ...ANIMALS, breedingAnimals: [{ categoryId: 1, sex: 'female', count: 6 }] }
      }
    ]);
    expect(withBreeding.body.data.results[0].status).toBe('updated');
    let survey = await Survey.findOne({ surveyId: 1 }).lean();
    expect(survey.hasBreeding).toBe(true);

    const withoutBreeding = await push([
      { localRowId: 3, op: 'update', surveyId: 1, syncVersion: 3, survey: ANIMALS }
    ]);
    expect(withoutBreeding.body.data.results[0].status).toBe('updated');
    survey = await Survey.findOne({ surveyId: 1 }).lean();
    expect(survey.hasBreeding).toBe(false);
    expect(survey.breedingAnimals).toEqual([]);
  });

  test('stale or equal syncVersion → version_conflict with serverVersion/serverData (D-19)', async () => {
    await pushCreate();
    await push([
      { localRowId: 2, op: 'update', surveyId: 1, syncVersion: 2, survey: ANIMALS }
    ]);

    const stale = await push([
      { localRowId: 3, op: 'update', surveyId: 1, syncVersion: 1, survey: ANIMALS }
    ]);
    const rejected = stale.body.data.results[0];
    expect(rejected.status).toBe('rejected');
    expect(rejected.error.code).toBe('version_conflict');
    expect(rejected.error.serverVersion).toBe(2);
    expect(rejected.error.serverData.surveyId).toBe(1);

    const equal = await push([
      { localRowId: 4, op: 'update', surveyId: 1, syncVersion: 2, survey: ANIMALS }
    ]);
    expect(equal.body.data.results[0].error.code).toBe('version_conflict');

    const survey = await Survey.findOne({ surveyId: 1 }).lean();
    expect(survey.syncVersion).toBe(2);
  });

  test('update after submit → rejected invalid_state (D-13)', async () => {
    const created = await pushCreate();
    const submit = await request(app)
      .post(`/api/v1/surveys/${created.surveyId}/submit`)
      .set(auth(villageToken))
      .send({});
    expect(submit.status).toBe(200);

    const res = await push([
      { localRowId: 2, op: 'update', surveyId: 1, syncVersion: 99, survey: ANIMALS }
    ]);
    expect(res.body.data.results[0]).toMatchObject({
      status: 'rejected',
      error: { code: 'invalid_state' }
    });
  });

  test('update out of scope → rejected forbidden', async () => {
    await pushCreate();
    const res = await push(
      [{ localRowId: 2, op: 'update', surveyId: 1, syncVersion: 2, survey: ANIMALS }],
      { token: otherVillageToken }
    );
    expect(res.body.data.results[0]).toMatchObject({
      status: 'rejected',
      error: { code: 'forbidden' }
    });
  });

  test('township/district cannot update via sync', async () => {
    await pushCreate();
    const townshipRes = await push(
      [{ localRowId: 2, op: 'update', surveyId: 1, syncVersion: 2, survey: ANIMALS }],
      { token: townshipToken }
    );
    expect(townshipRes.body.data.results[0].error.code).toBe('forbidden');

    const districtRes = await push(
      [{ localRowId: 3, op: 'update', surveyId: 1, syncVersion: 2, survey: ANIMALS }],
      { token: districtToken }
    );
    expect(districtRes.body.data.results[0].error.code).toBe('forbidden');
  });
});

describe('POST /api/v1/sync/push — delete', () => {
  test('village deletes own draft (soft delete)', async () => {
    await pushCreate();
    const res = await push([{ localRowId: 2, op: 'delete', surveyId: 1 }]);
    expect(res.body.data.results[0]).toMatchObject({ status: 'deleted', surveyId: 1 });

    const survey = await Survey.findOne({ surveyId: 1 }).lean();
    expect(survey.deletedAt).toBeInstanceOf(Date);
  });

  test('scope miss → rejected forbidden', async () => {
    await pushCreate();
    const res = await push([{ localRowId: 2, op: 'delete', surveyId: 1 }], { token: otherVillageToken });
    expect(res.body.data.results[0]).toMatchObject({
      status: 'rejected',
      error: { code: 'forbidden' }
    });
    expect((await Survey.findOne({ surveyId: 1 })).deletedAt).toBeNull();
  });

  test('township cannot delete via sync', async () => {
    await pushCreate();
    const res = await push([{ localRowId: 2, op: 'delete', surveyId: 1 }], { token: townshipToken });
    expect(res.body.data.results[0].error.code).toBe('forbidden');
  });

  test('submit via sync → summary +1', async () => {
    const created = await pushCreate();
    const res = await push([{ localRowId: 2, op: 'submit', surveyId: created.surveyId }], {
      token: villageToken
    });
    expect(res.body.data.results[0].status).toBe('submitted');
    expect((await SurveySummary.findOne({ wvCode: VILLAGE.wvCode })).totalSurveys).toBe(1);
  });

  test('district deletes counted survey → summary reversed (D-14/D-38)', async () => {
    const created = await pushCreate();
    await push([{ localRowId: 2, op: 'submit', surveyId: created.surveyId }], {
      token: villageToken
    });
    expect((await SurveySummary.findOne({ wvCode: VILLAGE.wvCode })).totalSurveys).toBe(1);

    const res = await push([{ localRowId: 3, op: 'delete', surveyId: created.surveyId }], { token: districtToken });
    expect(res.body.data.results[0].status).toBe('deleted');
    expect((await SurveySummary.findOne({ wvCode: VILLAGE.wvCode })).totalSurveys).toBe(0);
  });
});

describe('POST /api/v1/sync/push — batch partial success', () => {
  test('mixed results return per-item status with HTTP 200', async () => {
    const created = await pushCreate();
    const other = await push([createItem(5, { interview: { ...INTERVIEW, hName: 'အခြားအိမ်' } })], {
      token: otherVillageToken
    });
    expect(other.body.data.results[0].status).toBe('created');

    const res = await push(
      [
        createItem(10, { interview: { ...INTERVIEW, hName: 'အသစ်' } }),
        { localRowId: 11, op: 'update', surveyId: created.surveyId, syncVersion: 1, survey: ANIMALS },
        { localRowId: 12, op: 'delete', surveyId: other.body.data.results[0].surveyId }
      ],
      { token: villageToken }
    );

    expect(res.status).toBe(200);
    const results = res.body.data.results;
    expect(results).toHaveLength(3);
    expect(results.map((r) => r.localRowId)).toEqual([10, 11, 12]);
    expect(results[0].status).toBe('created');
    expect(results[1].status).toBe('rejected');
    expect(results[1].error.code).toBe('version_conflict');
    expect(results[2].status).toBe('rejected');
    expect(results[2].error.code).toBe('forbidden');
    expect(await Survey.countDocuments({ deletedAt: null })).toBe(3);
  });

  test('one failing create does not stop other items', async () => {
    const spy = jest
      .spyOn(surveyService, 'create')
      .mockRejectedValueOnce(new Error('boom'));
    const res = await push([createItem(1), createItem(2)]);
    expect(res.status).toBe(200);
    expect(res.body.data.results[0]).toMatchObject({
      status: 'rejected',
      error: { code: 'internal_error', message: 'Item processing failed' }
    });
    expect(res.body.data.results[1].status).toBe('created');
    expect(await Survey.countDocuments()).toBe(1);
    spy.mockRestore();
  });
});

describe('GET /api/v1/sync/pull (D-20)', () => {
  test('returns own surveys with meta {serverTime, nextCursor, hasMore}', async () => {
    await pushCreate();
    const res = await pull();
    expect(res.status).toBe(200);
    expect(res.body.data.surveys).toHaveLength(1);
    expect(res.body.data.surveys[0].surveyId).toBe(1);
    expect(res.body.meta.hasMore).toBe(false);
    expect(res.body.meta.nextCursor).toBeNull();
    expect(Number.isNaN(Date.parse(res.body.meta.serverTime))).toBe(false);
  });

  test('scope: other village and other township see nothing; district sees all', async () => {
    await pushCreate();
    expect((await pull('', otherVillageToken)).body.data.surveys).toHaveLength(0);
    expect((await pull('', otherTownshipToken)).body.data.surveys).toHaveLength(0);
    expect((await pull('', townshipToken)).body.data.surveys).toHaveLength(1);
    expect((await pull('', districtToken)).body.data.surveys).toHaveLength(1);
  });

  test('since filters by updatedAt', async () => {
    await pushCreate();
    const past = await pull('?since=' + new Date(Date.now() - 60000).toISOString());
    expect(past.body.data.surveys).toHaveLength(1);

    const future = await pull('?since=' + new Date(Date.now() + 60000).toISOString());
    expect(future.body.data.surveys).toHaveLength(0);
  });

  test('includes deleted tombstones (deletedAt)', async () => {
    const created = await pushCreate();
    await push([{ localRowId: 2, op: 'delete', surveyId: created.surveyId }]);
    const res = await pull();
    expect(res.body.data.surveys).toHaveLength(1);
    expect(res.body.data.surveys[0].deletedAt).not.toBeNull();
  });

  test('types filters response keys and loads reference data', async () => {
    await pushCreate();

    const all = await pull();
    expect(all.body.data).toHaveProperty('surveys');
    expect(all.body.data).toHaveProperty('locations');
    expect(all.body.data).toHaveProperty('categories');
    expect(all.body.data.locations.townships).toHaveLength(1);
    expect(all.body.data.locations.wardvillages).toHaveLength(1);
    expect(all.body.data.categories.big).toHaveLength(2);
    expect(all.body.data.categories.breeding).toHaveLength(1);
    expect(all.body.data.categories.breeding[0]).toEqual({ categoryId: 1, name: 'ဒေသနွား' });

    const districtAll = await pull('', districtToken);
    expect(districtAll.body.data.locations.townships).toHaveLength(2);
    expect(districtAll.body.data.locations.wardvillages).toHaveLength(2);

    const onlySurveys = await pull('?types=surveys');
    expect(onlySurveys.body.data).toHaveProperty('surveys');
    expect(onlySurveys.body.data).not.toHaveProperty('locations');
    expect(onlySurveys.body.data).not.toHaveProperty('categories');

    const onlyCats = await pull('?types=categories');
    expect(onlyCats.body.data).not.toHaveProperty('surveys');
    expect(onlyCats.body.data.categories.poultry).toHaveLength(1);
    expect(onlyCats.body.data.categories.breeding).toHaveLength(1);
  });

  test('cursor pagination walks all surveys without overlap', async () => {
    const villageHeadmanId = VILLAGE._id;
    const docs = Array.from({ length: 205 }, (_, i) => ({
      surveyId: i + 1,
      interviewId: '64f1a2b3c4d5e6f7a8b9c0e1',
      villageHeadmanId,
      districtCode: VILLAGE.districtCode,
      tspCode: VILLAGE.tspCode,
      tvgCode: VILLAGE.tvgCode,
      wvCode: VILLAGE.wvCode,
      syncVersion: 0
    }));
    await Survey.insertMany(docs);

    const page1 = await pull();
    expect(page1.body.data.surveys).toHaveLength(200);
    expect(page1.body.meta.hasMore).toBe(true);
    const cursor = page1.body.meta.nextCursor;
    expect(cursor).toBeTruthy();

    const page2 = await pull(`?cursor=${cursor}`);
    expect(page2.body.data.surveys).toHaveLength(5);
    expect(page2.body.meta.hasMore).toBe(false);
    expect(page2.body.meta.nextCursor).toBeNull();

    const ids = [
      ...page1.body.data.surveys.map((s) => s.surveyId),
      ...page2.body.data.surveys.map((s) => s.surveyId)
    ];
    expect(new Set(ids).size).toBe(205);
  });

  test('rejects invalid query params with 422', async () => {
    expect((await pull('?types=surveys,widgets')).status).toBe(422);
    expect((await pull('?cursor=not-an-id')).status).toBe(422);
    expect((await pull('?since=not-a-date')).status).toBe(422);
  });

  test('requires authentication', async () => {
    expect((await request(app).get('/api/v1/sync/pull')).status).toBe(401);
  });
});
