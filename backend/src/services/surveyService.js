const mongoose = require('mongoose');
const crypto = require('crypto');
const Survey = require('../models/Survey');
const InterviewInfo = require('../models/InterviewInfo');
const ApiError = require('../utils/apiError');
const { escapeRegex } = require('../utils/escapeRegex');
const { buildSurveyScope } = require('../middleware/scope');
const idService = require('./idService');
const summaryService = require('./summaryService');
const { TRANSITIONS, COUNTED_STATUSES } = require('../constants/surveyStatus');

const COUNT_TTL_SECONDS = 300;
const SORT_WHITELIST = ['createdAt', '-createdAt', 'updatedAt', '-updatedAt', 'surveyId', '-surveyId'];
const LIST_PROJECTION =
  'surveyId status interviewId villageHeadmanId districtCode tspCode tvgCode wvCode syncVersion createdAt updatedAt';
const POPULATE_FIELDS = {
  village: 'hNo hName hPhone hEdu hGender hAge ansDate',
  township: 'hNo hName hPhone hEdu hGender hAge ansDate wvCode',
  district: 'hNo hName hPhone hEdu hGender hAge ansDate tspCode wvCode'
};

const isCounted = (status) => COUNTED_STATUSES.includes(status);

const canEdit = (survey, user) => {
  if (user.role === 'village') {
    if (survey.villageHeadmanId?.toString() !== user.userId) {
      throw new ApiError(403, 'Cannot edit this survey', 'forbidden');
    }
    return;
  }
  if (user.role === 'township') {
    if (survey.tspCode !== user.tspCode) {
      throw new ApiError(403, 'Cannot edit this survey', 'forbidden');
    }
  }
};

const assertTransition = (currentStatus, nextStatus, role) => {
  const rule = TRANSITIONS[nextStatus];
  if (!rule || !rule.from.includes(currentStatus) || !rule.roles.includes(role)) {
    throw new ApiError(
      409,
      `Cannot move survey from ${currentStatus} to ${nextStatus}`,
      'invalid_transition'
    );
  }
};

const invalidateCountCache = async (redis) => {
  const keys = await redis.keys('count:*');
  if (keys.length > 0) await redis.del(...keys);
};

const buildListQuery = async (user, filters) => {
  const query = { ...buildSurveyScope(user), deletedAt: null };
  if (filters.status) query.status = filters.status;
  if (filters.hasBreeding !== undefined) query.hasBreeding = filters.hasBreeding;
  if (filters.search) {
    const pattern = new RegExp(escapeRegex(filters.search), 'i');
    const interviewIds = await InterviewInfo.distinct('_id', { hName: pattern });
    query.$or = [{ interviewId: { $in: interviewIds } }, { surveyId: Number(filters.search) || null }];
  }
  return query;
};

const countKey = (query) => `count:${crypto.createHash('sha1').update(JSON.stringify(query)).digest('hex')}`;

const getCachedCount = async (query, redis) => {
  const key = countKey(query);
  const cached = await redis.get(key);
  if (cached !== null && cached !== undefined) return Number(cached);
  const total = await Survey.countDocuments(query);
  await redis.set(key, String(total), 'EX', COUNT_TTL_SECONDS);
  return total;
};

const list = async (user, filters, redis) => {
  const query = await buildListQuery(user, filters);
  const sort = SORT_WHITELIST.includes(filters.sort) ? filters.sort : '-createdAt';
  const page = filters.page || 1;
  const perPage = filters.per_page || 20;
  const [surveys, total] = await Promise.all([
    Survey.find(query)
      .populate('interviewId', POPULATE_FIELDS[user.role] || POPULATE_FIELDS.village)
      .select(LIST_PROJECTION)
      .sort(sort)
      .skip((page - 1) * perPage)
      .limit(perPage)
      .lean(),
    getCachedCount(query, redis)
  ]);
  return {
    data: surveys,
    meta: { total, page, per_page: perPage, total_pages: Math.ceil(total / perPage) }
  };
};

const getBySurveyId = async (user, surveyId) => {
  const filter = { surveyId, deletedAt: null, ...buildSurveyScope(user) };
  const survey = await Survey.findOne(filter)
    .populate('interviewId', POPULATE_FIELDS[user.role] || POPULATE_FIELDS.village)
    .lean();
  if (!survey) throw new ApiError(404, 'Survey not found', 'not_found');
  return survey;
};

const create = async (user, payload, redis, options = {}) => {
  if (!user.wvCode) throw new ApiError(403, 'Only village users can create surveys', 'forbidden');
  const session = await mongoose.startSession();
  let created;
  try {
    await session.withTransaction(async () => {
      const interviewId = await idService.generateInterviewId(redis);
      const [interview] = await InterviewInfo.create(
        [
          {
            interviewId,
            hName: payload.hName,
            ...(payload.hNo !== undefined ? { hNo: payload.hNo } : {}),
            hEdu: payload.hEdu,
            hGender: payload.hGender,
            hPhone: payload.hPhone,
            hAge: payload.hAge,
            ansDate: payload.ansDate,
            tspCode: user.tspCode,
            tvgCode: user.tvgCode,
            wvCode: user.wvCode
          }
        ],
        { session }
      );
      const surveyId = await idService.generateSurveyId(redis);
      const [survey] = await Survey.create(
        [
          {
            surveyId,
            interviewId: interview._id,
            villageHeadmanId: user.userId,
            status: 'draft',
            syncVersion: options.syncVersion ?? 0,
            districtCode: user.districtCode,
            tspCode: user.tspCode,
            tvgCode: user.tvgCode,
            wvCode: user.wvCode,
            bigAnimals: payload.bigAnimals,
            smallAnimals: payload.smallAnimals,
            poultry: payload.poultry,
            breedingAnimals: payload.breedingAnimals || [],
            hasBreeding: (payload.breedingAnimals || []).length > 0
          }
        ],
        { session }
      );
      created = survey;
    });
  } finally {
    await session.endSession();
  }
  await invalidateCountCache(redis);
  return { surveyId: created.surveyId, status: created.status, createdAt: created.createdAt };
};

const loadScopedOrNull = (user, surveyId) =>
  Survey.findOne({ surveyId, deletedAt: null, ...buildSurveyScope(user) });

const loadScoped = async (user, surveyId) => {
  const survey = await loadScopedOrNull(user, surveyId);
  if (!survey) throw new ApiError(404, 'Survey not found', 'not_found');
  return survey;
};

const update = async (user, surveyId, payload, redis) => {
  const survey = await loadScoped(user, surveyId);
  canEdit(survey, user);
  const interview = await InterviewInfo.findById(survey.interviewId);
  if (!interview) throw new ApiError(404, 'Interview not found', 'not_found');
  interview.set({
    hName: payload.hName,
    ...(payload.hNo !== undefined ? { hNo: payload.hNo } : {}),
    hEdu: payload.hEdu,
    hGender: payload.hGender,
    hPhone: payload.hPhone,
    hAge: payload.hAge,
    ansDate: payload.ansDate
  });
  survey.set({
    bigAnimals: payload.bigAnimals,
    smallAnimals: payload.smallAnimals,
    poultry: payload.poultry,
    breedingAnimals: payload.breedingAnimals || [],
    hasBreeding: (payload.breedingAnimals || []).length > 0,
    syncVersion: survey.syncVersion + 1
  });
  await interview.save();
  await survey.save();
  await invalidateCountCache(redis);
  return { surveyId: survey.surveyId, status: survey.status, syncVersion: survey.syncVersion };
};

const remove = async (user, surveyId, redis) => {
  const survey = await loadScoped(user, surveyId);
  const ownSurvey = user.role === 'village' && survey.villageHeadmanId?.toString() === user.userId;
  if (user.role !== 'district' && !ownSurvey) {
    throw new ApiError(403, 'Cannot delete this survey', 'forbidden');
  }
  if (isCounted(survey.status)) await summaryService.updateSummary(survey.toObject(), -1);
  survey.deletedAt = new Date();
  survey.syncVersion = survey.syncVersion + 1;
  await survey.save();
  await invalidateCountCache(redis);
  return { surveyId: survey.surveyId, status: survey.status };
};

const applyTransition = async (user, surveyId, nextStatus, extra = {}, redis) => {
  const survey = await loadScoped(user, surveyId);
  assertTransition(survey.status, nextStatus, user.role);
  const wasCounted = isCounted(survey.status);
  const willCounted = isCounted(nextStatus);
  survey.set({
    status: nextStatus,
    syncVersion: survey.syncVersion + 1,
    ...extra
  });
  await survey.save();
  if (willCounted && !wasCounted) await summaryService.updateSummary(survey.toObject(), 1);
  if (!willCounted && wasCounted) await summaryService.updateSummary(survey.toObject(), -1);
  await invalidateCountCache(redis);
  return { surveyId: survey.surveyId, status: survey.status, syncVersion: survey.syncVersion };
};

const submit = (user, surveyId, redis) =>
  applyTransition(user, surveyId, 'submitted', {}, redis);

module.exports = {
  assertTransition,
  isCounted,
  canEdit,
  list,
  getBySurveyId,
  create,
  update,
  remove,
  submit,
  invalidateCountCache,
  loadScopedOrNull
};
