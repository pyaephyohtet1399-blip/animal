const SurveySummary = require('../models/SurveySummary');
const Survey = require('../models/Survey');
const { COUNTED_STATUSES } = require('../constants/surveyStatus');

const sumArray = (arr) => (arr || []).reduce((total, item) => total + (item.count || 0), 0);

const breakdownKey = (item) => `${item.categoryId}:${item.ageLimit}:${item.sex}`;
const breedingKey = (item) => `${item.categoryId}:${item.sex}`;

const addBreakdown = (acc, field, arr, keyFn = breakdownKey) => {
  for (const item of arr || []) {
    const key = `${field}.${keyFn(item)}`;
    acc[key] = (acc[key] || 0) + (item.count || 0);
  }
  return acc;
};

const buildSummaryInc = (survey, sign) => {
  const scaled = (obj) =>
    Object.fromEntries(Object.entries(obj).map(([key, value]) => [key, sign * value]));
  const breakdowns = {
    ...addBreakdown({}, 'bigBreakdown', survey.bigAnimals),
    ...addBreakdown({}, 'smallBreakdown', survey.smallAnimals),
    ...addBreakdown({}, 'poultryBreakdown', survey.poultry),
    ...addBreakdown({}, 'breedingBreakdown', survey.breedingAnimals, breedingKey)
  };
  return {
    totalSurveys: sign * 1,
    totalBigAnimals: sign * sumArray(survey.bigAnimals),
    totalSmallAnimals: sign * sumArray(survey.smallAnimals),
    totalPoultry: sign * sumArray(survey.poultry),
    totalBreedingAnimals: sign * sumArray(survey.breedingAnimals),
    ...scaled(breakdowns)
  };
};

const updateSummary = async (survey, sign = 1) => {
  const inc = buildSummaryInc(survey, sign);
  return SurveySummary.findOneAndUpdate(
    { tspCode: survey.tspCode, wvCode: survey.wvCode },
    { $inc: inc, $set: { lastUpdated: new Date() } },
    { upsert: true }
  );
};

const recomputeAll = async () => {
  await SurveySummary.deleteMany({});
  const cursor = Survey.find({ status: { $in: COUNTED_STATUSES }, deletedAt: null })
    .select('tspCode wvCode bigAnimals smallAnimals poultry breedingAnimals')
    .lean()
    .cursor();
  const totals = new Map();
  for await (const survey of cursor) {
    const key = `${survey.tspCode}|${survey.wvCode}`;
    const inc = buildSummaryInc(survey, 1);
    const acc = totals.get(key) || { tspCode: survey.tspCode, wvCode: survey.wvCode, inc: {} };
    for (const [field, value] of Object.entries(inc)) {
      acc.inc[field] = (acc.inc[field] || 0) + value;
    }
    totals.set(key, acc);
  }
  const ops = [...totals.values()].map(({ tspCode, wvCode, inc }) => ({
    updateOne: {
      filter: { tspCode, wvCode },
      update: { $inc: inc, $set: { lastUpdated: new Date() } },
      upsert: true
    }
  }));
  if (ops.length > 0) await SurveySummary.bulkWrite(ops, { ordered: false });
  return ops.length;
};

module.exports = { sumArray, buildSummaryInc, updateSummary, recomputeAll };
