const statisticsService = require('../services/statisticsService');

const overview = async (req, res, next) => {
  try {
    const data = await statisticsService.overview(req.user);
    return res.json({ data });
  } catch (error) {
    return next(error);
  }
};

module.exports = { overview };
