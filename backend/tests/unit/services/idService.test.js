const RedisMock = require('ioredis-mock');
const idService = require('../../../src/services/idService');
const Survey = require('../../../src/models/Survey');
const InterviewInfo = require('../../../src/models/InterviewInfo');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongod;
let redis;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  redis = new RedisMock();
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
});

beforeEach(async () => {
  await redis.flushall();
  await Survey.deleteMany({});
  await InterviewInfo.deleteMany({});
});

describe('generateSurveyId / generateInterviewId', () => {
  test('increments from zero and never repeats', async () => {
    expect(await idService.generateSurveyId(redis)).toBe(1);
    expect(await idService.generateSurveyId(redis)).toBe(2);
    expect(await idService.generateInterviewId(redis)).toBe(1);
    expect(await idService.generateInterviewId(redis)).toBe(2);
  });
});

describe('initIdCounters (D-35 SETNX)', () => {
  test('does nothing on empty database', async () => {
    await idService.initIdCounters(redis);
    expect(await redis.get(idService.SURVEY_KEY)).toBeNull();
  });

  test('seeds counter from existing DB max', async () => {
    await Survey.insertMany([
      { surveyId: 7, interviewId: new mongoose.Types.ObjectId(), districtCode: 'MMR0100', tspCode: 't', tvgCode: 'v', wvCode: 'w' },
      { surveyId: 12, interviewId: new mongoose.Types.ObjectId(), districtCode: 'MMR0100', tspCode: 't', tvgCode: 'v', wvCode: 'w' }
    ]);
    await idService.initIdCounters(redis);
    expect(await redis.get(idService.SURVEY_KEY)).toBe('12');
    expect(await idService.generateSurveyId(redis)).toBe(13);
  });

  test('SETNX does not lower an existing higher counter', async () => {
    await redis.set(idService.SURVEY_KEY, 100);
    await idService.initIdCounters(redis);
    expect(await redis.get(idService.SURVEY_KEY)).toBe('100');
  });
});

describe('reconcileIdCounters (Redis data loss recovery)', () => {
  test('raises counter when DB max is higher', async () => {
    await InterviewInfo.insertMany([
      { interviewId: 55, hName: 'a', hEdu: 'x', hGender: 'm', hPhone: '09', hAge: 30, ansDate: new Date(), tspCode: 't', tvgCode: 'v', wvCode: 'w' }
    ]);
    await redis.set(idService.INTERVIEW_KEY, 5);
    await idService.reconcileIdCounters(redis);
    expect(await redis.get(idService.INTERVIEW_KEY)).toBe('55');
  });

  test('leaves a higher counter untouched', async () => {
    await redis.set(idService.INTERVIEW_KEY, 999);
    await idService.reconcileIdCounters(redis);
    expect(await redis.get(idService.INTERVIEW_KEY)).toBe('999');
  });
});
