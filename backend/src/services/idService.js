const Survey = require('../models/Survey');
const InterviewInfo = require('../models/InterviewInfo');
const logger = require('../utils/logger');

const SURVEY_KEY = 'survey:id';
const INTERVIEW_KEY = 'interview:id';

const findMax = async (model, field) => {
  const doc = await model
    .findOne()
    .sort({ [field]: -1 })
    .select(field)
    .lean();
  return doc ? doc[field] : null;
};

const initIdCounters = async (redis) => {
  const maxSurveyId = await findMax(Survey, 'surveyId');
  const maxInterviewId = await findMax(InterviewInfo, 'interviewId');
  if (maxSurveyId !== null) await redis.setnx(SURVEY_KEY, maxSurveyId);
  if (maxInterviewId !== null) await redis.setnx(INTERVIEW_KEY, maxInterviewId);
};

const reconcileIdCounters = async (redis) => {
  const maxSurveyId = await findMax(Survey, 'surveyId');
  const maxInterviewId = await findMax(InterviewInfo, 'interviewId');
  if (maxSurveyId !== null) {
    const current = Number((await redis.get(SURVEY_KEY)) || 0);
    if (maxSurveyId > current) {
      await redis.set(SURVEY_KEY, maxSurveyId);
      logger.info('id counter reconciled', { key: SURVEY_KEY, from: current, to: maxSurveyId });
    }
  }
  if (maxInterviewId !== null) {
    const current = Number((await redis.get(INTERVIEW_KEY)) || 0);
    if (maxInterviewId > current) {
      await redis.set(INTERVIEW_KEY, maxInterviewId);
      logger.info('id counter reconciled', { key: INTERVIEW_KEY, from: current, to: maxInterviewId });
    }
  }
};

const generateSurveyId = async (redis) => Number(await redis.incr(SURVEY_KEY));

const generateInterviewId = async (redis) => Number(await redis.incr(INTERVIEW_KEY));

module.exports = {
  initIdCounters,
  reconcileIdCounters,
  generateSurveyId,
  generateInterviewId,
  SURVEY_KEY,
  INTERVIEW_KEY
};
