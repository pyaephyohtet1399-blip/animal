const categoryService = require('../services/categoryService');

const getCategories = async (req, res, next) => {
  try {
    const data = await categoryService.getCategories(req.params.type, req.app.locals.redis);
    return res.json({ data });
  } catch (error) {
    return next(error);
  }
};

const getCategory = async (req, res, next) => {
  try {
    const { type, categoryId } = req.params;
    const data = await categoryService.getCategory(type, categoryId, req.app.locals.redis);
    return res.json({ data });
  } catch (error) {
    return next(error);
  }
};

module.exports = { getCategories, getCategory };
