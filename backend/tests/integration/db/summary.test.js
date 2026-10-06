const request = require('supertest');
const Survey = require('../../../src/models/Survey');
const SurveySummary = require('../../../src/models/SurveySummary');
const summaryService = require('../../../src/services/summaryService');
const { signFor, auth } = require('../../helpers/auth');
const { setupTestApp, teardownTestApp, clearDb, clearRedis } = require('../../helpers/testApp');

let app;
let villageToken;
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

const VALID_BODY = {
  hName: 'ဦးအောင်',
  hEdu: 'ဘွဲ့',
  hGender: 'အထီး',
  hPhone: '0912345678',
  hAge: 45,
  ansDate: '2026-01-15',
  bigAnimals: [
    { categoryId: 1, ageLimit: 'LessThanOne', sex: 'male', count: 2 },
    { categoryId: 2, ageLimit: 'Over3', sex: 'female', count: 7 }
  ],
  smallAnimals: [{ categoryId: 3, ageLimit: 'Between2and6months', sex: 'male', count: 4 }],
  poultry: [
    { categoryId: 1, ageLimit: 'Old', sex: 'female', count: 10 },
    { categoryId: 1, ageLimit: 'Young', sex: 'male', count: 5 }
  ]
};

const createSurvey = async (body = VALID_BODY) => {
  const res = await request(app).post('/api/v1/surveys').set(auth(villageToken)).send(body);
  expect(res.status).toBe(201);
  return res.body.data.surveyId;
};

const submit = async (surveyId) => {
  const res = await request(app)
    .post(`/api/v1/surveys/${surveyId}/submit`)
    .set(auth(villageToken))
    .send({});
  expect(res.status).toBe(200);
};

const strip = (docs) =>
  docs.map(({ lastUpdated, createdAt, updatedAt, _id, __v, ...rest }) => rest);

beforeAll(async () => {
  app = await setupTestApp();
  villageToken = signFor(VILLAGE);
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
  await clearRedis(app);
});

describe('summaryService.recomputeAll vs live delta (§8.6)', () => {
  test('rebuild output matches delta accumulated through submit', async () => {
    const id1 = await createSurvey();
    await submit(id1);

    const id2 = await createSurvey({
      ...VALID_BODY,
      bigAnimals: [{ categoryId: 2, ageLimit: 'Between1and3', sex: 'ca_male', count: 3 }],
      smallAnimals: [],
      poultry: []
    });
    await submit(id2);

    const id3 = await createSurvey({
      ...VALID_BODY,
      hName: 'ဒုတိယအိမ်',
      bigAnimals: [{ categoryId: 1, ageLimit: 'LessThanOne', sex: 'male', count: 9 }],
      smallAnimals: [],
      poultry: []
    });
    await submit(id3);

    await createSurvey({
      ...VALID_BODY,
      hName: 'တတိယအိမ်',
      bigAnimals: [{ categoryId: 1, ageLimit: 'LessThanOne', sex: 'female', count: 1 }]
    });

    const deltaDocs = strip(await SurveySummary.find({}).lean());

    await summaryService.recomputeAll();
    const rebuildDocs = strip(await SurveySummary.find({}).lean());

    expect(rebuildDocs).toEqual(deltaDocs);

    const summary = await SurveySummary.findOne({ wvCode: VILLAGE.wvCode }).lean();
    expect(summary.totalSurveys).toBe(3);
    expect(summary.totalBigAnimals).toBe(21);
    expect(summary.totalSmallAnimals).toBe(4);
    expect(summary.totalPoultry).toBe(15);
    expect(summary.bigBreakdown['1:LessThanOne:male']).toBe(11);
    expect(summary.bigBreakdown['2:Over3:female']).toBe(7);
    expect(summary.bigBreakdown['2:Between1and3:ca_male']).toBe(3);
  });

  test('rebuild ignores drafts and deleted surveys', async () => {
    const counted = await createSurvey();
    await submit(counted);

    await createSurvey({ ...VALID_BODY, hName: 'draft only' });

    const counted2 = await createSurvey({ ...VALID_BODY, hName: 'deleted after submit' });
    await submit(counted2);
    const del = await request(app)
      .delete(`/api/v1/surveys/${counted2}`)
      .set(auth(districtToken));
    expect(del.status).toBe(200);

    await summaryService.recomputeAll();
    const summary = await SurveySummary.findOne({ wvCode: VILLAGE.wvCode }).lean();
    expect(summary.totalSurveys).toBe(1);
    expect(summary.totalBigAnimals).toBe(9);
  });

  test('rebuild on empty dataset yields no documents', async () => {
    expect(await summaryService.recomputeAll()).toBe(0);
    expect(await SurveySummary.countDocuments()).toBe(0);
  });

  test('delta and rebuild agree after submit', async () => {
    const id = await createSurvey();
    await submit(id);

    const deltaDocs = strip(await SurveySummary.find({}).lean());
    await summaryService.recomputeAll();
    expect(strip(await SurveySummary.find({}).lean())).toEqual(deltaDocs);

    expect(await Survey.countDocuments({})).toBe(1);
  });
});

describe('summary delta on submit and delete (D-38 v3)', () => {
  test('submit +1, delete −1', async () => {
    const surveyId = await createAndSubmit();
    const key = { tspCode: VILLAGE.tspCode, wvCode: VILLAGE.wvCode };

    let summary = await SurveySummary.findOne(key).lean();
    expect(summary.totalSurveys).toBe(1);
    expect(summary.totalBigAnimals).toBe(9);
    expect(summary.totalPoultry).toBe(15);
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

const createAndSubmit = async () => {
  const surveyId = await createSurvey();
  await submit(surveyId);
  return surveyId;
};
