const surveyService = require('../services/surveyService');

const list = async (req, res, next) => {
  try {
    const result = await surveyService.list(req.user, req.query, req.app.locals.redis);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

const getDetail = async (req, res, next) => {
  try {
    const survey = await surveyService.getBySurveyId(req.user, req.params.surveyId);
    return res.json({ data: survey });
  } catch (error) {
    return next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const data = await surveyService.create(req.user, req.body, req.app.locals.redis);
    return res.status(201).json({ data });
  } catch (error) {
    return next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const data = await surveyService.update(
      req.user,
      req.params.surveyId,
      req.body,
      req.app.locals.redis
    );
    return res.json({ data });
  } catch (error) {
    return next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const data = await surveyService.remove(req.user, req.params.surveyId, req.app.locals.redis);
    return res.json({ data });
  } catch (error) {
    return next(error);
  }
};

const action = (fn, auditAction) => async (req, res, next) => {
  try {
    req.auditAction = auditAction;
    const redis = req.app.locals.redis;
    const data = await fn(req, redis);
    return res.json({ data });
  } catch (error) {
    return next(error);
  }
};

const submit = action(
  (req, redis) => surveyService.submit(req.user, req.params.surveyId, redis),
  'submit'
);

module.exports = { list, getDetail, create, update, remove, submit };
