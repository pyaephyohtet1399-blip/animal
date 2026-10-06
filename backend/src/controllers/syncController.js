const syncService = require('../services/syncService');

const push = async (req, res, next) => {
  try {
    const body = await syncService.push(
      req.user,
      req.body.items,
      req.headers['idempotency-key'],
      req.app.locals.redis
    );
    return res.json(body);
  } catch (error) {
    return next(error);
  }
};

const pull = async (req, res, next) => {
  try {
    const body = await syncService.pull(req.user, req.query, req.app.locals.redis);
    return res.json(body);
  } catch (error) {
    return next(error);
  }
};

module.exports = { push, pull };
