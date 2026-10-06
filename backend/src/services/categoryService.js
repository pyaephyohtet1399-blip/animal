const BigAnimalCategory = require('../models/BigAnimalCategory');
const SmallAnimalCategory = require('../models/SmallAnimalCategory');
const PoultryCategory = require('../models/PoultryCategory');
const BreedingCategory = require('../models/BreedingCategory');
const ApiError = require('../utils/apiError');

const CACHE_TTL_SECONDS = 3600;

const TYPE_MODELS = {
  big: BigAnimalCategory,
  small: SmallAnimalCategory,
  poultry: PoultryCategory,
  breeding: BreedingCategory
};

const getCategories = async (type, redis) => {
  const model = TYPE_MODELS[type];
  const key = `categories:${type}`;
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);
  const data = await model.find({}).sort({ categoryId: 1 }).select('categoryId name -_id').lean();
  await redis.set(key, JSON.stringify(data), 'EX', CACHE_TTL_SECONDS);
  return data;
};

const getCategory = async (type, categoryId, redis) => {
  const list = await getCategories(type, redis);
  const found = list.find((item) => item.categoryId === categoryId);
  if (!found) throw new ApiError(404, 'Category not found', 'not_found');
  return found;
};

module.exports = { getCategories, getCategory, TYPE_MODELS, CACHE_TTL_SECONDS };
