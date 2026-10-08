const crypto = require('crypto');
const zlib = require('zlib');
const request = require('supertest');
const Survey = require('../../../src/models/Survey');
const InterviewInfo = require('../../../src/models/InterviewInfo');
const SurveySummary = require('../../../src/models/SurveySummary');
const UploadReceipt = require('../../../src/models/UploadReceipt');
const { signFor, auth } = require('../../helpers/auth');
const { setupTestApp, teardownTestApp, clearDb, clearRedis } = require('../../helpers/testApp');

let app;
let villageToken;
let townshipToken;

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

const ANIMALS = {
  bigAnimals: [{ categoryId: 1, ageLimit: 'LessThanOne', sex: 'male', count: 2 }],
  smallAnimals: [],
  poultry: [{ categoryId: 1, ageLimit: 'Old', sex: 'female', count: 10 }],
  breedingAnimals: []
};

const interview = (overrides = {}) => ({
  hName: 'ဦးအောင်မြင့်',
  hNo: '12',
  hEdu: 'ဘွဲ့',
  hGender: 'အထီး',
  hPhone: '09123456789',
  hAge: 45,
  ansDate: '2026-01-15',
  ...overrides
});

const animalTotal = (survey) =>
  [...survey.bigAnimals, ...survey.smallAnimals, ...survey.poultry, ...survey.breedingAnimals]
    .reduce((sum, item) => sum + item.count, 0);

const envelope = (households, overrides = {}) => ({
  format: 'animal-census/village-upload',
  version: 1,
  wvCode: VILLAGE.wvCode,
  generatedAt: new Date().toISOString(),
  counts: {
    households: households.length,
    animals: households.reduce(
      (total, row) => (row.action === 'delete' ? total : total + animalTotal(row.survey)),
      0
    )
  },
  households,
  ...overrides
});

const createRow = (localRowId, overrides = {}) => ({
  localRowId,
  action: 'create',
  interview: interview(),
  survey: ANIMALS,
  ...overrides
});

const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');

const postUpload = (body, { token = villageToken, gzip = false, hash } = {}) => {
  const json = JSON.stringify(body);
  let req = request(app)
    .post('/api/v1/upload/village')
    .set(auth(token))
    .set('Content-Type', gzip ? 'application/octet-stream' : 'application/json');
  if (gzip) {
    req = req.set('Content-Encoding', 'gzip').send(zlib.gzipSync(Buffer.from(json)));
  } else {
    req = req.send(json);
  }
  if (hash !== false) req = req.set('X-Content-Hash', hash || sha256(json));
  return req;
};

beforeAll(async () => {
  app = await setupTestApp();
  villageToken = signFor(VILLAGE);
  townshipToken = signFor(TOWNSHIP);
});

afterAll(async () => {
  await teardownTestApp();
});

beforeEach(async () => {
  await clearDb();
  await clearRedis(app);
});

describe('POST /api/v1/upload/village', () => {
  test('accepts a valid upload atomically and counts summary', async () => {
    const body = envelope([createRow('r-1'), createRow('r-2', { interview: interview({ hName: 'ဒေါ်လေး' }) })]);
    const res = await postUpload(body);

    expect(res.status).toBe(200);
    expect(res.body.data.created).toBe(2);
    expect(res.body.data.updated).toBe(0);
    expect(res.body.data.deleted).toBe(0);
    expect(res.body.data.accepted).toBe(2);
    expect(res.body.data.counts).toEqual({ households: 2, animals: 24 });
    expect(res.body.data.rows).toHaveLength(2);
    expect(res.body.data.rows[0]).toMatchObject({ localRowId: 'r-1', action: 'create', syncVersion: 1 });
    expect(res.body.meta.replayed).toBe(false);

    expect(await Survey.countDocuments({})).toBe(2);
    const surveys = await Survey.find({}).lean();
    expect(surveys.every((doc) => doc.status === 'submitted')).toBe(true);

    const interviews = await InterviewInfo.find({}).lean();
    expect(interviews.map((doc) => doc.hNo).sort()).toEqual(['12', '12']);

    const summary = await SurveySummary.findOne({ wvCode: VILLAGE.wvCode }).lean();
    expect(summary.totalSurveys).toBe(2);
    expect(summary.totalBigAnimals).toBe(4);
    expect(summary.totalPoultry).toBe(20);

    expect(await UploadReceipt.countDocuments({})).toBe(1);
  });

  test('replays an identical upload by content hash without duplicating rows', async () => {
    const body = envelope([createRow('r-1')]);
    const first = await postUpload(body);
    expect(first.status).toBe(200);

    const second = await postUpload(body);
    expect(second.status).toBe(200);
    expect(second.body.meta.replayed).toBe(true);
    expect(second.body.data.contentHash).toBe(first.body.data.contentHash);
    expect(await Survey.countDocuments({})).toBe(1);
    expect(await UploadReceipt.countDocuments({})).toBe(1);
  });

  test('rejects when content hash does not match the body', async () => {
    const body = envelope([createRow('r-1')]);
    const res = await postUpload(body, { hash: 'a'.repeat(64) });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('content_hash_mismatch');
    expect(await Survey.countDocuments({})).toBe(0);
  });

  test('rejects declared counts that do not match rows (no partial write)', async () => {
    const body = envelope([createRow('r-1')]);
    body.counts.animals = 999;
    const res = await postUpload(body);
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('count_mismatch');
    expect(res.body.error.details[0].field).toBe('counts.animals');
    expect(await Survey.countDocuments({})).toBe(0);
    expect(await UploadReceipt.countDocuments({})).toBe(0);
  });

  test('reports every invalid row with its localRowId', async () => {
    const body = envelope([
      createRow('good'),
      createRow('bad-age', { interview: interview({ hAge: 999 }) }),
      createRow('bad-sex', { survey: { ...ANIMALS, bigAnimals: [{ categoryId: 1, ageLimit: 'LessThanOne', sex: 'alien', count: 1 }] } })
    ]);
    const res = await postUpload(body);
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('validation_error');
    const flagged = res.body.error.details.map((item) => item.localRowId);
    expect(flagged).toEqual(expect.arrayContaining(['bad-age', 'bad-sex']));
    expect(await Survey.countDocuments({})).toBe(0);
  });

  test('rejects upload for a different wvCode', async () => {
    const body = envelope([createRow('r-1')], { wvCode: OTHER_VILLAGE.wvCode });
    const res = await postUpload(body);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('forbidden');
  });

  test('township role cannot upload', async () => {
    const res = await postUpload(envelope([createRow('r-1')]), { token: townshipToken });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('forbidden');
  });

  test('gzip encoded body is accepted and hashed over decoded JSON', async () => {
    const res = await postUpload(envelope([createRow('r-1')]), { gzip: true });
    expect(res.status).toBe(200);
    expect(res.body.data.created).toBe(1);
    const receipt = await UploadReceipt.findOne({}).lean();
    expect(receipt.compressed).toBe(true);
    expect(receipt.fileSize).toBeGreaterThan(0);
  });

  test('updates and deletes existing rows with optimistic versions', async () => {
    const first = await postUpload(envelope([createRow('r-1'), createRow('r-2')]));
    const [rowOne, rowTwo] = first.body.data.rows;

    const second = await postUpload(
      envelope([
        {
          localRowId: 'r-1',
          action: 'update',
          surveyId: rowOne.surveyId,
          syncVersion: rowOne.syncVersion,
          interview: interview({ hName: 'ပြင်ဆင်ပြီး' }),
          survey: { ...ANIMALS, poultry: [{ categoryId: 1, ageLimit: 'Old', sex: 'female', count: 5 }] }
        },
        { localRowId: 'r-2', action: 'delete', surveyId: rowTwo.surveyId, syncVersion: rowTwo.syncVersion }
      ])
    );

    expect(second.status).toBe(200);
    expect(second.body.data.updated).toBe(1);
    expect(second.body.data.deleted).toBe(1);
    expect(second.body.data.rows.map((row) => row.syncVersion)).toEqual([2, 2]);

    const kept = await Survey.findOne({ surveyId: rowOne.surveyId }).lean();
    expect(kept.poultry[0].count).toBe(5);
    expect(kept.status).toBe('submitted');
    const removed = await Survey.findOne({ surveyId: rowTwo.surveyId }).lean();
    expect(removed.deletedAt).toBeInstanceOf(Date);

    const interviewDoc = await InterviewInfo.findOne({ hName: 'ပြင်ဆင်ပြီး' }).lean();
    expect(interviewDoc).toBeTruthy();

    const summary = await SurveySummary.findOne({ wvCode: VILLAGE.wvCode }).lean();
    expect(summary.totalSurveys).toBe(1);
    expect(summary.totalPoultry).toBe(5);
  });

  test('stale syncVersion is rejected with conflicts and no writes', async () => {
    const first = await postUpload(envelope([createRow('r-1')]));
    const [row] = first.body.data.rows;

    const stale = await postUpload(
      envelope([
        {
          localRowId: 'r-1',
          action: 'update',
          surveyId: row.surveyId,
          syncVersion: row.syncVersion + 5,
          interview: interview({ hName: 'နောက်ဆုံး' }),
          survey: ANIMALS
        }
      ])
    );

    expect(stale.status).toBe(409);
    expect(stale.body.error.code).toBe('version_conflict');
    expect(stale.body.error.details[0]).toMatchObject({
      localRowId: 'r-1',
      serverVersion: 1
    });

    const survey = await Survey.findOne({ surveyId: row.surveyId }).lean();
    expect(survey.syncVersion).toBe(1);
    const interviewDoc = await InterviewInfo.findOne({ hName: 'နောက်ဆုံး' }).lean();
    expect(interviewDoc).toBeNull();
  });

  test('duplicate localRowId in one payload is rejected', async () => {
    const res = await postUpload(envelope([createRow('dup'), createRow('dup')]));
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('validation_error');
    expect(await Survey.countDocuments({})).toBe(0);
  });
});

describe('GET /api/v1/upload/village/:contentHash', () => {
  test('returns receipt status after a successful upload', async () => {
    const body = envelope([createRow('r-1')]);
    const posted = await postUpload(body);
    expect(posted.status).toBe(200);

    const res = await request(app)
      .get(`/api/v1/upload/village/${posted.body.data.contentHash}`)
      .set(auth(villageToken));
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ status: 'accepted', accepted: 1 });
    expect(res.body.data.counts).toEqual({ households: 1, animals: 12 });
  });

  test('unknown hash → 404', async () => {
    const res = await request(app)
      .get(`/api/v1/upload/village/${'b'.repeat(64)}`)
      .set(auth(villageToken));
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('not_found');
  });
});
