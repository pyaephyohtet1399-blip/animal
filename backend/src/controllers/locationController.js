const locationService = require('../services/locationService');

// Role-scoped responses: never mark them cacheable by URL. The global
// `Cache-Control: no-store` (routes/index.js) stays in force — otherwise a
// browser/proxy serves one user's township list to another role on the same
// URL (no Vary: Authorization was sent).
const getTownships = async (req, res, next) => {
  try {
    const data = await locationService.getTownships(req.app.locals.redis, req.user);
    return res.json({ data });
  } catch (error) {
    return next(error);
  }
};

const getTownvgs = async (req, res, next) => {
  try {
    const data = await locationService.getTownvgs(req.app.locals.redis, req.user, req.query.tspCode);
    return res.json({ data });
  } catch (error) {
    return next(error);
  }
};

const getWardvillages = async (req, res, next) => {
  try {
    const data = await locationService.getWardvillages(req.app.locals.redis, req.user, req.query.tvgCode);
    return res.json({ data });
  } catch (error) {
    return next(error);
  }
};

module.exports = { getTownships, getTownvgs, getWardvillages };
