const ApiError = require('../utils/apiError');
const logger = require('../utils/logger');
const Survey = require('../models/Survey');
const InterviewInfo = require('../models/InterviewInfo');
const { buildSurveyScope } = require('../middleware/scope');
const surveyService = require('./surveyService');
const locationService = require('./locationService');
const categoryService = require('./categoryService');
const { PULL_TYPES, PULL_LIMIT } = require('../validators/sync.validator');

const LOCK_TTL_SECONDS = 30;
const RESULT_TTL_SECONDS = 86400;

const lockKey = (key) => `idem:lock:${key}`;
const resultKey = (key) => `idem:${key}`;

const rejectedResult = (item, error) => {
  const known = error instanceof ApiError;
  const payload = {
    code: known ? error.code : 'internal_error',
    message: known ? error.message : 'Item processing failed'
  };
  if (known && error.code === 'version_conflict') {
    payload.serverVersion = error.serverVersion;
    payload.serverData = error.serverData;
  }
  return {
    localRowId: item.localRowId,
    status: 'rejected',
    ...(item.surveyId !== undefined ? { surveyId: item.surveyId } : {}),
    error: payload
  };
};

const processCreate = async (user, item, redis) => {
  const payload = { ...item.interview, ...item.survey };
  const created = await surveyService.create(user, payload, redis, { syncVersion: 1 });
  return {
    localRowId: item.localRowId,
    status: 'created',
    surveyId: created.surveyId,
    syncVersion: 1
  };
};

const processUpdate = async (user, item, redis) => {
  if (user.role !== 'village') {
    throw new ApiError(403, 'Only village users can update surveys', 'forbidden');
  }
  const existing = await surveyService.loadScopedOrNull(user, item.surveyId);
  if (!existing || existing.villageHeadmanId?.toString() !== user.userId) {
    throw new ApiError(403, 'Survey not found in scope', 'forbidden');
  }
  surveyService.canEdit(existing, user);
  if (item.syncVersion <= existing.syncVersion) {
    const error = new ApiError(409, 'Stale data - please refresh', 'version_conflict');
    error.serverVersion = existing.syncVersion;
    error.serverData = existing.toObject();
    throw error;
  }
  if (item.interview) {
    const interview = await InterviewInfo.findById(existing.interviewId);
    if (!interview) throw new ApiError(404, 'Interview not found', 'not_found');
    interview.set(item.interview);
    await interview.save();
  }
  if (item.survey) {
    existing.set({
      bigAnimals: item.survey.bigAnimals,
      smallAnimals: item.survey.smallAnimals,
      poultry: item.survey.poultry,
      breedingAnimals: item.survey.breedingAnimals,
      hasBreeding: item.survey.breedingAnimals.length > 0
    });
  }
  existing.syncVersion = item.syncVersion;
  await existing.save();
  await surveyService.invalidateCountCache(redis);
  return {
    localRowId: item.localRowId,
    status: 'updated',
    surveyId: existing.surveyId,
    syncVersion: existing.syncVersion
  };
};

const processSubmit = async (user, item, redis) => {
  const result = await surveyService.submit(user, item.surveyId, redis);
  return { localRowId: item.localRowId, status: 'submitted', ...result };
};

const processDelete = async (user, item, redis) => {
  let result;
  try {
    result = await surveyService.remove(user, item.surveyId, redis);
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 404) {
      throw new ApiError(403, 'Survey not found in scope', 'forbidden');
    }
    throw error;
  }
  return { localRowId: item.localRowId, status: 'deleted', surveyId: result.surveyId };
};

const processItem = async (user, item, redis) => {
  try {
    if (item.op === 'create') return await processCreate(user, item, redis);
    if (item.op === 'update') return await processUpdate(user, item, redis);
    if (item.op === 'submit') return await processSubmit(user, item, redis);
    return await processDelete(user, item, redis);
  } catch (error) {
    if (!(error instanceof ApiError)) {
      logger.error('sync item failed', { op: item.op, message: error.message });
    }
    return rejectedResult(item, error);
  }
};

const push = async (user, items, idempotencyKey, redis) => {
  const acquired = await redis.set(lockKey(idempotencyKey), '1', 'EX', LOCK_TTL_SECONDS, 'NX');
  if (acquired !== 'OK') {
    throw new ApiError(
      409,
      'A sync request with this Idempotency-Key is already in progress',
      'request_in_progress'
    );
  }
  try {
    const cached = await redis.get(resultKey(idempotencyKey));
    if (cached) return JSON.parse(cached);
    const results = [];
    for (const item of items) {
      results.push(await processItem(user, item, redis));
    }
    const body = { data: { results } };
    await redis.setex(resultKey(idempotencyKey), RESULT_TTL_SECONDS, JSON.stringify(body));
    return body;
  } finally {
    await redis.del(lockKey(idempotencyKey));
  }
};

const pullSurveys = async (user, { since, cursor }) => {
  const filter = { ...buildSurveyScope(user) };
  if (since) filter.updatedAt = { $gt: since };
  if (cursor) filter._id = { $gt: cursor };
  const docs = await Survey.find(filter).sort({ _id: 1 }).limit(PULL_LIMIT + 1).lean();
  const hasMore = docs.length > PULL_LIMIT;
  const page = hasMore ? docs.slice(0, PULL_LIMIT) : docs;
  return {
    surveys: page,
    nextCursor: hasMore ? String(page[page.length - 1]._id) : null,
    hasMore
  };
};

const pull = async (user, query, redis) => {
  const serverTime = new Date();
  const wanted = query.types && query.types.length > 0 ? query.types : PULL_TYPES;
  const data = {};
  let nextCursor = null;
  let hasMore = false;

  if (wanted.includes('surveys')) {
    const result = await pullSurveys(user, query);
    data.surveys = result.surveys;
    nextCursor = result.nextCursor;
    hasMore = result.hasMore;
  }
  if (wanted.includes('locations')) {
    const [townships, townvgs, wardvillages] = await Promise.all([
      locationService.getTownships(redis, user),
      locationService.getTownvgs(redis, user),
      locationService.getWardvillages(redis, user)
    ]);
    data.locations = { townships, townvgs, wardvillages };
  }
  if (wanted.includes('categories')) {
    const [big, small, poultry, breeding] = await Promise.all([
      categoryService.getCategories('big', redis),
      categoryService.getCategories('small', redis),
      categoryService.getCategories('poultry', redis),
      categoryService.getCategories('breeding', redis)
    ]);
    data.categories = { big, small, poultry, breeding };
  }

  return {
    data,
    meta: { serverTime: serverTime.toISOString(), nextCursor, hasMore }
  };
};

module.exports = { push, pull, lockKey, resultKey };
