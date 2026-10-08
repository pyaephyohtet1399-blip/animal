const request = require('supertest');
const Survey = require('../../../src/models/Survey');
const InterviewInfo = require('../../../src/models/InterviewInfo');
const SurveySummary = require('../../../src/models/SurveySummary');
const AuditLog = require('../../../src/models/AuditLog');
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
  wvCode: '194657'
};
const OTHER_VILLAGE = { ...VILLAGE, _id: '64f1a2b3c4d5e6f7a8b9c0d9', wvCode: '194660' };
const TOWNSHIP = {
  _id: '64f1a2b3c4d5e6f7a8b9c0d2',
  loginCode: 'MMR010031',
  role: 'township',
  districtCode: 'MMR0100',
  tspCode: 'MMR010031'
};
const OTHER_TOWNSHIP = { ...TOWNSHIP, _id: '64f1a2b3c4d5e6f7a8b9c0d8', tspCode: 'MMR010028' };
const DISTRICT = {
  _id: '64f1a2b3c4d5e6f7a8b9c0d3',
  loginCode: 'MMR0100',
  role: 'district',
  districtCode: 'MMR0100'
};

const VALID_BODY = {
  hName: 'ဦးအောင်',
  hEdu: 'ဘွဲ့',
  hGender: 'အထီး',
  hPhone: '0912345678',
  hAge: 45,
  ansDate: '2026-01-15',
  bigAnimals: [{ categoryId: 1, ageLimit: 'LessThanOne', sex: 'male', count: 2 }],
  smallAnimals: [],
  poultry: [{ categoryId: 1, ageLimit: 'Old', sex: 'female', count: 10 }]
};

const createSurvey = async (token = villageToken, body = VALID_BODY) =>
  request(app).post('/api/v1/surveys').set(auth(token)).send(body);

const createAndSubmit = async () => {
  const created = await createSurvey();
  expect(created.status).toBe(201);
  await request(app)
    .post(`/api/v1/surveys/${created.body.data.surveyId}/submit`)
    .set(auth(villageToken))
    .send({});
  return created.body.data.surveyId;
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
});

describe('POST /api/v1/surveys (D-37 transaction create)', () => {
  test('creates interview + survey, returns 201 with surveyId/status/createdAt', async () => {
    const res = await createSurvey();
    expect(res.status).toBe(201);
    expect(res.body.data.surveyId).toBe(1);
    expect(res.body.data.status).toBe('draft');
    expect(res.body.data.createdAt).toBeTruthy();

    const survey = await Survey.findOne({ surveyId: 1 }).lean();
    expect(survey.villageHeadmanId.toString()).toBe(VILLAGE._id);
    expect(survey.tspCode).toBe(VILLAGE.tspCode);
    expect(survey.syncVersion).toBe(0);

    const interview = await InterviewInfo.findById(survey.interviewId).lean();
    expect(interview.interviewId).toBe(1);
    expect(interview.hName).toBe('ဦးအောင်');
    expect(interview.wvCode).toBe(VILLAGE.wvCode);
  });

  test('allocates unique sequential IDs across creates', async () => {
    const first = await createSurvey();
    const second = await createSurvey();
    expect(first.body.data.surveyId).toBe(1);
    expect(second.body.data.surveyId).toBe(2);
    const ids = (await Survey.find({}).lean()).map((s) => s.surveyId);
    expect(new Set(ids).size).toBe(2);
  });

  test('rejects invalid body with 422', async () => {
    const res = await createSurvey(villageToken, { ...VALID_BODY, hAge: 200 });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('validation_error');
    expect(await Survey.countDocuments()).toBe(0);
    expect(await InterviewInfo.countDocuments()).toBe(0);
  });

  test('rejects invalid poultry sex enum with 422', async () => {
    const res = await createSurvey(villageToken, {
      ...VALID_BODY,
      poultry: [{ categoryId: 1, ageLimit: 'Old', sex: 'ca_male', count: 1 }]
    });
    expect(res.status).toBe(422);
  });

  test('coerces ansDate string to Date (validate write-back)', async () => {
    const res = await createSurvey();
    expect(res.status).toBe(201);
    const interview = await InterviewInfo.findOne({}).lean();
    expect(interview.ansDate).toBeInstanceOf(Date);
    expect(interview.ansDate.toISOString()).toContain('2026-01-15');
  });

  test('township/district cannot create (403)', async () => {
    expect((await createSurvey(townshipToken)).status).toBe(403);
    expect((await createSurvey(districtToken)).status).toBe(403);
    expect(await Survey.countDocuments()).toBe(0);
  });

  test('requires authentication', async () => {
    const res = await request(app).post('/api/v1/surveys').send(VALID_BODY);
    expect(res.status).toBe(401);
  });
});

describe('GET /api/v1/surveys (list, §9.2)', () => {
  test('returns scoped list with meta and populated hName', async () => {
    await createSurvey();
    await createSurvey(otherVillageToken);

    const res = await request(app).get('/api/v1/surveys').set(auth(villageToken));
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].interviewId.hName).toBe('ဦးအောင်');
    expect(res.body.meta).toEqual({ total: 1, page: 1, per_page: 20, total_pages: 1 });
  });

  test('township scope covers own tsp only', async () => {
    await createSurvey();
    const res = await request(app).get('/api/v1/surveys').set(auth(townshipToken));
    expect(res.body.meta.total).toBe(1);

    const other = await request(app).get('/api/v1/surveys').set(auth(otherTownshipToken));
    expect(other.body.meta.total).toBe(0);
  });

  test('district sees all', async () => {
    await createSurvey();
    await createSurvey(otherVillageToken);
    const res = await request(app).get('/api/v1/surveys').set(auth(districtToken));
    expect(res.body.meta.total).toBe(2);
  });

  test('filters by status and paginates', async () => {
    await createAndSubmit();
    await createSurvey();

    const submitted = await request(app)
      .get('/api/v1/surveys?status=submitted')
      .set(auth(villageToken));
    expect(submitted.body.meta.total).toBe(1);

    const paged = await request(app)
      .get('/api/v1/surveys?page=1&per_page=1')
      .set(auth(villageToken));
    expect(paged.body.data).toHaveLength(1);
    expect(paged.body.meta).toEqual({ total: 2, page: 1, per_page: 1, total_pages: 2 });
  });

  test('search by hName (escapeRegex) matches via interview join', async () => {
    await createSurvey();
    const hit = await request(app)
      .get('/api/v1/surveys?search=ဦးအောင်')
      .set(auth(villageToken));
    expect(hit.body.meta.total).toBe(1);

    const miss = await request(app)
      .get('/api/v1/surveys?search=' + encodeURIComponent('.*'))
      .set(auth(villageToken));
    expect(miss.body.meta.total).toBe(0);
  });

  test('search by numeric surveyId', async () => {
    await createSurvey();
    const res = await request(app).get('/api/v1/surveys?search=1').set(auth(villageToken));
    expect(res.body.meta.total).toBe(1);
  });

  test('rejects invalid query with 422 (D-17 whitelist)', async () => {
    expect(
      (await request(app).get('/api/v1/surveys?per_page=500').set(auth(villageToken))).status
    ).toBe(422);
    expect(
      (await request(app).get('/api/v1/surveys?sort=__proto__').set(auth(villageToken))).status
    ).toBe(422);
    expect(
      (await request(app).get('/api/v1/surveys?status=hacked').set(auth(villageToken))).status
    ).toBe(422);
  });

  test('count cache is served then invalidated on write', async () => {
    await createSurvey();
    const before = await request(app).get('/api/v1/surveys').set(auth(villageToken));
    expect(before.body.meta.total).toBe(1);

    const keys = await app.locals.redis.keys('count:*');
    expect(keys.length).toBeGreaterThan(0);

    await createSurvey();
    const after = await request(app).get('/api/v1/surveys').set(auth(villageToken));
    expect(after.body.meta.total).toBe(2);
  });
});

describe('breeding section (D-54)', () => {
  const BREEDING_BODY = {
    ...VALID_BODY,
    breedingAnimals: [
      { categoryId: 1, sex: 'male', count: 3 },
      { categoryId: 4, sex: 'female', count: 2 }
    ]
  };

  test('create stores breedingAnimals and derives hasBreeding=true', async () => {
    const res = await createSurvey(villageToken, BREEDING_BODY);
    expect(res.status).toBe(201);
    const survey = await Survey.findOne({ surveyId: 1 }).lean();
    expect(survey.breedingAnimals).toHaveLength(2);
    expect(survey.hasBreeding).toBe(true);
  });

  test('create without breeding defaults to [] and hasBreeding=false', async () => {
    const res = await createSurvey();
    expect(res.status).toBe(201);
    const survey = await Survey.findOne({ surveyId: 1 }).lean();
    expect(survey.breedingAnimals).toEqual([]);
    expect(survey.hasBreeding).toBe(false);
  });

  test('list filter ?hasBreeding=true selects breeding farms only', async () => {
    await createSurvey(villageToken, BREEDING_BODY);
    await createSurvey();

    const withBreeding = await request(app)
      .get('/api/v1/surveys?hasBreeding=true')
      .set(auth(villageToken));
    expect(withBreeding.status).toBe(200);
    expect(withBreeding.body.meta.total).toBe(1);
    expect(withBreeding.body.data[0].surveyId).toBe(1);

    const withoutBreeding = await request(app)
      .get('/api/v1/surveys?hasBreeding=false')
      .set(auth(villageToken));
    expect(withoutBreeding.body.meta.total).toBe(1);
    expect(withoutBreeding.body.data[0].surveyId).toBe(2);

    const invalid = await request(app)
      .get('/api/v1/surveys?hasBreeding=yes')
      .set(auth(villageToken));
    expect(invalid.status).toBe(422);
  });

  test('update toggles hasBreeding', async () => {
    const created = await createSurvey();
    const surveyId = created.body.data.surveyId;

    const addBreeding = await request(app)
      .put(`/api/v1/surveys/${surveyId}`)
      .set(auth(villageToken))
      .send(BREEDING_BODY);
    expect(addBreeding.status).toBe(200);
    let survey = await Survey.findOne({ surveyId }).lean();
    expect(survey.hasBreeding).toBe(true);

    const removeBreeding = await request(app)
      .put(`/api/v1/surveys/${surveyId}`)
      .set(auth(villageToken))
      .send(VALID_BODY);
    expect(removeBreeding.status).toBe(200);
    survey = await Survey.findOne({ surveyId }).lean();
    expect(survey.hasBreeding).toBe(false);
    expect(survey.breedingAnimals).toEqual([]);
  });

  test('rejects invalid breeding sex enum with 422', async () => {
    const res = await createSurvey(villageToken, {
      ...VALID_BODY,
      breedingAnimals: [{ categoryId: 1, sex: 'ca_male', count: 1 }]
    });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('validation_error');
  });
});

describe('GET /api/v1/surveys/:surveyId (§9.3 single-query scope)', () => {
  test('returns own survey', async () => {
    const created = await createSurvey();
    const res = await request(app)
      .get(`/api/v1/surveys/${created.body.data.surveyId}`)
      .set(auth(villageToken));
    expect(res.status).toBe(200);
    expect(res.body.data.surveyId).toBe(1);
  });

  test('scope miss returns 404 (no existence leak)', async () => {
    const created = await createSurvey();
    const res = await request(app)
      .get(`/api/v1/surveys/${created.body.data.surveyId}`)
      .set(auth(otherVillageToken));
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('not_found');
  });

  test('non-numeric surveyId → 422', async () => {
    const res = await request(app).get('/api/v1/surveys/abc').set(auth(villageToken));
    expect(res.status).toBe(422);
  });

  test('deleted survey → 404', async () => {
    const created = await createSurvey();
    await request(app)
      .delete(`/api/v1/surveys/${created.body.data.surveyId}`)
      .set(auth(villageToken));
    const res = await request(app)
      .get(`/api/v1/surveys/${created.body.data.surveyId}`)
      .set(auth(villageToken));
    expect(res.status).toBe(404);
  });
});

describe('PUT /api/v1/surveys/:surveyId (D-13 edit rules)', () => {
  test('village can edit own draft and syncVersion increments', async () => {
    const created = await createSurvey();
    const res = await request(app)
      .put(`/api/v1/surveys/${created.body.data.surveyId}`)
      .set(auth(villageToken))
      .send({ ...VALID_BODY, hName: 'ပြင်ဆင်ပြီး', hAge: 46 });
    expect(res.status).toBe(200);
    expect(res.body.data.syncVersion).toBe(1);
    expect(res.body.data.status).toBe('draft');

    const interview = await InterviewInfo.findOne({}).lean();
    expect(interview.hName).toBe('ပြင်ဆင်ပြီး');
  });

  test('village edits own submitted survey (D-60: no draft lock)', async () => {
    const surveyId = await createAndSubmit();
    const res = await request(app)
      .put(`/api/v1/surveys/${surveyId}`)
      .set(auth(villageToken))
      .send({ ...VALID_BODY, hName: 'ပြင်ဆင်ပြီး', hAge: 46 });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('submitted');
    expect(res.body.data.syncVersion).toBe(2);

    const interview = await InterviewInfo.findOne({}).lean();
    expect(interview.hName).toBe('ပြင်ဆင်ပြီး');
  });

  test('township can edit own township survey (any status)', async () => {
    const surveyId = await createAndSubmit();
    const res = await request(app)
      .put(`/api/v1/surveys/${surveyId}`)
      .set(auth(townshipToken))
      .send(VALID_BODY);
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('submitted');
  });

  test('district can edit any survey', async () => {
    const surveyId = await createAndSubmit();
    const res = await request(app)
      .put(`/api/v1/surveys/${surveyId}`)
      .set(auth(districtToken))
      .send(VALID_BODY);
    expect(res.status).toBe(200);
  });

  test('township cannot edit other township survey (404 scope)', async () => {
    const created = await createSurvey();
    const res = await request(app)
      .put(`/api/v1/surveys/${created.body.data.surveyId}`)
      .set(auth(otherTownshipToken))
      .send(VALID_BODY);
    expect(res.status).toBe(404);
  });
});

describe('summary delta (D-38 v3)', () => {
  test('submit +1, delete −1', async () => {
    const surveyId = await createAndSubmit();
    const key = { tspCode: VILLAGE.tspCode, wvCode: VILLAGE.wvCode };

    let summary = await SurveySummary.findOne(key).lean();
    expect(summary.totalSurveys).toBe(1);
    expect(summary.totalBigAnimals).toBe(2);
    expect(summary.totalPoultry).toBe(10);
    expect(summary.bigBreakdown['1:LessThanOne:male']).toBe(2);

    const del = await request(app)
      .delete(`/api/v1/surveys/${surveyId}`)
      .set(auth(districtToken));
    expect(del.status).toBe(200);

    summary = await SurveySummary.findOne(key).lean();
    expect(summary.totalSurveys).toBe(0);
    expect(summary.totalBigAnimals).toBe(0);
    expect(summary.bigBreakdown['1:LessThanOne:male']).toBe(0);
  });

  test('draft does not create summary', async () => {
    await createSurvey();
    expect(await SurveySummary.countDocuments()).toBe(0);
  });
});

describe('DELETE /api/v1/surveys/:surveyId (D-14)', () => {
  test('village deletes own draft (soft)', async () => {
    const created = await createSurvey();
    const res = await request(app)
      .delete(`/api/v1/surveys/${created.body.data.surveyId}`)
      .set(auth(villageToken));
    expect(res.status).toBe(200);

    const survey = await Survey.findOne({ surveyId: 1 }).lean();
    expect(survey.deletedAt).toBeInstanceOf(Date);

    const list = await request(app).get('/api/v1/surveys').set(auth(villageToken));
    expect(list.body.meta.total).toBe(0);

    const audit = await AuditLog.findOne({ action: 'delete' });
    expect(audit).toBeTruthy();
    expect(audit.path).toContain(`/api/v1/surveys/${created.body.data.surveyId}`);
  });

  test('village deletes own submitted survey (soft, D-60)', async () => {
    const surveyId = await createAndSubmit();
    const res = await request(app)
      .delete(`/api/v1/surveys/${surveyId}`)
      .set(auth(villageToken));
    expect(res.status).toBe(200);

    const survey = await Survey.findOne({ surveyId }).lean();
    expect(survey.deletedAt).toBeInstanceOf(Date);

    const summary = await SurveySummary.findOne({ wvCode: VILLAGE.wvCode }).lean();
    expect(summary.totalSurveys).toBe(0);
  });

  test('district deletes any survey; counted status reverses summary', async () => {
    const surveyId = await createAndSubmit();
    expect(await SurveySummary.findOne({ wvCode: VILLAGE.wvCode }).lean()).toBeTruthy();

    const res = await request(app)
      .delete(`/api/v1/surveys/${surveyId}`)
      .set(auth(districtToken));
    expect(res.status).toBe(200);

    const summary = await SurveySummary.findOne({ wvCode: VILLAGE.wvCode }).lean();
    expect(summary.totalSurveys).toBe(0);
  });

  test('village cannot delete another village\'s survey (404)', async () => {
    const created = await createSurvey();
    const res = await request(app)
      .delete(`/api/v1/surveys/${created.body.data.surveyId}`)
      .set(auth(otherVillageToken));
    expect(res.status).toBe(404);
  });

  test('township cannot delete (403)', async () => {
    const created = await createSurvey();
    const res = await request(app)
      .delete(`/api/v1/surveys/${created.body.data.surveyId}`)
      .set(auth(townshipToken));
    expect(res.status).toBe(403);
  });
});
