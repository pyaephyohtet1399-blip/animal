const locationService = require('../services/locationService');

const CACHE_HEADER = 'public, max-age=3600';

const getTownships = async (req, res, next) => {
  try {
    const data = await locationService.getTownships(req.app.locals.redis, req.user);
    res.set('Cache-Control', CACHE_HEADER);
    return res.json({ data });
  } catch (error) {
    return next(error);
  }
};

const getTownvgs = async (req, res, next) => {
  try {
    const data = await locationService.getTownvgs(req.app.locals.redis, req.user, req.query.tspCode);
    res.set('Cache-Control', CACHE_HEADER);
    return res.json({ data });
  } catch (error) {
    return next(error);
  }
};

const getWardvillages = async (req, res, next) => {
  try {
    const data = await locationService.getWardvillages(req.app.locals.redis, req.user, req.query.tvgCode);
    res.set('Cache-Control', CACHE_HEADER);
    return res.json({ data });
  } catch (error) {
    return next(error);
  }
};

module.exports = { getTownships, getTownvgs, getWardvillages };
