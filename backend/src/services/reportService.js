const Survey = require('../models/Survey');
const SurveySummary = require('../models/SurveySummary');
const Township = require('../models/Township');
const InterviewInfo = require('../models/InterviewInfo');
const { COUNTED_STATUSES } = require('../constants/surveyStatus');
const { AGE_RANKS } = require('../constants/ageLimits');

const REPORT_STATUS = { $in: COUNTED_STATUSES };
const TYPE_META = {
  bigAnimals: { totalField: 'totalBigAnimals', breakdownField: 'bigBreakdown' },
  smallAnimals: { totalField: 'totalSmallAnimals', breakdownField: 'smallBreakdown' },
  poultry: { totalField: 'totalPoultry', breakdownField: 'poultryBreakdown' },
  breedingAnimals: { totalField: 'totalBreedingAnimals', breakdownField: 'breedingBreakdown' }
};
const TOTAL_FIELDS = [
  'totalSurveys',
  'totalBigAnimals',
  'totalSmallAnimals',
  'totalPoultry',
  'totalBreedingAnimals'
];

const countedMatch = (extra = {}) => ({ status: REPORT_STATUS, deletedAt: null, ...extra });
const emptyTotals = () => ({
  totalSurveys: 0,
  totalBigAnimals: 0,
  totalSmallAnimals: 0,
  totalPoultry: 0,
  totalBreedingAnimals: 0
});

const buildAnimalFilter = (query = {}) => {
  const { type = 'bigAnimals', categoryId, ageFrom, ageTo, sex } = query;
  const match = {};
  if (categoryId !== undefined) match[`${type}.categoryId`] = Number(categoryId);
  if ((ageFrom || ageTo) && type !== 'breedingAnimals') {
    const rank = AGE_RANKS[type];
    const allowed = Object.keys(rank).filter((age) => {
      if (ageFrom && rank[age] < rank[ageFrom]) return false;
      if (ageTo && rank[age] > rank[ageTo]) return false;
      return true;
    });
    match[`${type}.ageLimit`] = { $in: allowed };
  }
  if (sex) match[`${type}.sex`] = sex;
  return match;
};

const buildDateMatch = async ({ from, to } = {}) => {
  if (!from && !to) return {};
  const ansMatch = {};
  if (from) ansMatch.$gte = from;
  if (to) ansMatch.$lte = to;
  const ids = await InterviewInfo.distinct('_id', { ansDate: ansMatch });
  return { interviewId: { $in: ids } };
};

const sumBreakdownBySex = (breakdown = {}) => {
  let male = 0;
  let female = 0;
  for (const [key, value] of Object.entries(breakdown)) {
    const sex = key.split(':').pop();
    if (sex === 'male') male += value;
    else if (sex === 'female') female += value;
  }
  return { male, female };
};

const roundOne = (value) => (value === null || value === undefined ? null : Math.round(value * 10) / 10);

const districtTspCodes = (districtCode) => Township.distinct('tspCode', { districtCode });

const getDistrictReport = async (districtCode) => {
  const tspCodes = await districtTspCodes(districtCode);
  const summaries = await SurveySummary.find({ tspCode: { $in: tspCodes } })
    .select(
      'tspCode totalSurveys totalBigAnimals totalSmallAnimals totalPoultry totalBreedingAnimals'
    )
    .lean();
  const totals = emptyTotals();
  const groups = new Map();
  for (const summary of summaries) {
    const acc = groups.get(summary.tspCode) || { tspCode: summary.tspCode, ...emptyTotals() };
    for (const field of TOTAL_FIELDS) {
      const value = summary[field] || 0;
      acc[field] += value;
      totals[field] += value;
    }
    groups.set(summary.tspCode, acc);
  }
  const byTownship = [...groups.values()].sort((a, b) => b.totalSurveys - a.totalSurveys);
  return {
    districtCode,
    ...totals,
    totalHouseholds: totals.totalSurveys,
    byTownship
  };
};

const getTownshipReport = async (tspCode, range = {}) => {
  const dateMatch = await buildDateMatch(range);
  const base = countedMatch({ tspCode, ...dateMatch });
  const [totals, villages] = await Promise.all([
    Survey.aggregate([
      { $match: base },
      { $lookup: { from: 'interviewinfos', localField: 'interviewId', foreignField: '_id', as: 'interview' } },
      { $unwind: '$interview' },
      {
        $group: {
          _id: '$tspCode',
          totalSurveys: { $sum: 1 },
          totalHouseholds: { $sum: 1 },
          avgAge: { $avg: '$interview.hAge' },
          totalBigAnimals: { $sum: { $sum: '$bigAnimals.count' } },
          totalSmallAnimals: { $sum: { $sum: '$smallAnimals.count' } },
          totalPoultry: { $sum: { $sum: '$poultry.count' } },
          totalBreedingAnimals: { $sum: { $sum: '$breedingAnimals.count' } }
        }
      }
    ]),
    Survey.aggregate([
      { $match: base },
      {
        $group: {
          _id: '$wvCode',
          totalSurveys: { $sum: 1 },
          totalBigAnimals: { $sum: { $sum: '$bigAnimals.count' } },
          totalSmallAnimals: { $sum: { $sum: '$smallAnimals.count' } },
          totalPoultry: { $sum: { $sum: '$poultry.count' } },
          totalBreedingAnimals: { $sum: { $sum: '$breedingAnimals.count' } }
        }
      },
      { $sort: { totalSurveys: -1 } }
    ])
  ]);
  const head = totals[0];
  return {
    tspCode,
    totalSurveys: head ? head.totalSurveys : 0,
    totalHouseholds: head ? head.totalHouseholds : 0,
    avgAge: head ? roundOne(head.avgAge) : null,
    totalBigAnimals: head ? head.totalBigAnimals : 0,
    totalSmallAnimals: head ? head.totalSmallAnimals : 0,
    totalPoultry: head ? head.totalPoultry : 0,
    totalBreedingAnimals: head ? head.totalBreedingAnimals : 0,
    villages: villages.map((row) => ({
      wvCode: row._id,
      totalSurveys: row.totalSurveys,
      totalBigAnimals: row.totalBigAnimals,
      totalSmallAnimals: row.totalSmallAnimals,
      totalPoultry: row.totalPoultry,
      totalBreedingAnimals: row.totalBreedingAnimals
    }))
  };
};

const getVillageAnimalCount = async (wvCode, filters = {}) => {
  const { type = 'bigAnimals', categoryId, ageLimit, sex } = filters;
  const animalMatch = {};
  if (categoryId !== undefined) animalMatch[`${type}.categoryId`] = Number(categoryId);
  if (ageLimit && type !== 'breedingAnimals') animalMatch[`${type}.ageLimit`] = ageLimit;
  if (sex) animalMatch[`${type}.sex`] = sex;
  const [result] = await Survey.aggregate([
    { $match: countedMatch({ wvCode }) },
    { $unwind: `$${type}` },
    { $match: animalMatch },
    { $group: { _id: null, total: { $sum: `$${type}.count` } } }
  ]);
  return result ? result.total : 0;
};

const getVillageAnimalCountFast = async (wvCode, filters = {}, type = 'bigAnimals') => {
  const { categoryId, ageLimit, sex } = filters;
  const { breakdownField } = TYPE_META[type];
  const doc = await SurveySummary.findOne({ wvCode }).select(breakdownField).lean();
  const breakdown = doc ? doc[breakdownField] : null;
  if (!breakdown) return 0;
  const isBreeding = type === 'breedingAnimals';
  if (categoryId !== undefined && sex && (isBreeding || ageLimit)) {
    const key = isBreeding ? `${categoryId}:${sex}` : `${categoryId}:${ageLimit}:${sex}`;
    return breakdown[key] || 0;
  }
  const prefix = categoryId !== undefined ? `${categoryId}:` : '';
  let total = 0;
  for (const [key, value] of Object.entries(breakdown)) {
    if (!key.startsWith(prefix)) continue;
    const parts = key.split(':');
    if (isBreeding) {
      if (sex && parts[1] !== sex) continue;
    } else {
      if (ageLimit && parts[1] !== ageLimit) continue;
      if (sex && parts[2] !== sex) continue;
    }
    total += value;
  }
  return total;
};

const getVillageBreakdown = async (wvCode, categoryId, type = 'bigAnimals') => {
  const rows = await Survey.aggregate([
    { $match: countedMatch({ wvCode }) },
    { $unwind: `$${type}` },
    { $match: { [`${type}.categoryId`]: Number(categoryId) } },
    {
      $group: {
        _id: { ageLimit: `$${type}.ageLimit`, sex: `$${type}.sex` },
        total: { $sum: `$${type}.count` }
      }
    },
    { $sort: { '_id.ageLimit': 1, '_id.sex': 1 } }
  ]);
  return rows.map((row) => ({ ageLimit: row._id.ageLimit ?? null, sex: row._id.sex, total: row.total }));
};

const canUseFastPath = (query = {}) =>
  query.categoryId === undefined &&
  !query.ageFrom &&
  !query.ageTo &&
  !query.sex &&
  !query.from &&
  !query.to;

const drillToTownship = async (user, query = {}) => {
  const type = query.type || 'bigAnimals';
  const { totalField, breakdownField } = TYPE_META[type];
  if (canUseFastPath(query)) {
    const tspCodes = await districtTspCodes(user.districtCode);
    const summaries = await SurveySummary.find({ tspCode: { $in: tspCodes } })
      .select(`tspCode totalSurveys ${totalField} ${breakdownField}`)
      .lean();
    const groups = new Map();
    for (const summary of summaries) {
      const acc = groups.get(summary.tspCode) || {
        tspCode: summary.tspCode,
        households: 0,
        total: 0,
        male: 0,
        female: 0
      };
      acc.households += summary.totalSurveys;
      acc.total += summary[totalField] || 0;
      const bySex = sumBreakdownBySex(summary[breakdownField]);
      acc.male += bySex.male;
      acc.female += bySex.female;
      groups.set(summary.tspCode, acc);
    }
    return [...groups.values()].sort((a, b) => b.total - a.total);
  }
  const dateMatch = await buildDateMatch(query);
  const animalFilter = buildAnimalFilter(query);
  const rows = await Survey.aggregate([
    { $match: countedMatch({ districtCode: user.districtCode, ...dateMatch }) },
    { $unwind: `$${type}` },
    { $match: animalFilter },
    {
      $group: {
        _id: '$tspCode',
        households: { $addToSet: '$surveyId' },
        total: { $sum: `$${type}.count` },
        male: { $sum: { $cond: [{ $eq: [`$${type}.sex`, 'male'] }, `$${type}.count`, 0] } },
        female: { $sum: { $cond: [{ $eq: [`$${type}.sex`, 'female'] }, `$${type}.count`, 0] } }
      }
    },
    { $addFields: { households: { $size: '$households' } } },
    { $sort: { total: -1 } }
  ]);
  return rows.map((row) => ({
    tspCode: row._id,
    households: row.households,
    total: row.total,
    male: row.male,
    female: row.female
  }));
};

const drillToVillage = async (user, tspCode, query = {}) => {
  const type = query.type || 'bigAnimals';
  const { totalField } = TYPE_META[type];
  if (canUseFastPath(query)) {
    const tspCodes = await districtTspCodes(user.districtCode);
    if (!tspCodes.includes(tspCode)) return [];
    const summaries = await SurveySummary.find({ tspCode })
      .select(`wvCode totalSurveys ${totalField}`)
      .lean();
    const groups = new Map();
    for (const summary of summaries) {
      const acc = groups.get(summary.wvCode) || { wvCode: summary.wvCode, households: 0, total: 0 };
      acc.households += summary.totalSurveys;
      acc.total += summary[totalField] || 0;
      groups.set(summary.wvCode, acc);
    }
    return [...groups.values()].sort((a, b) => b.total - a.total);
  }
  const dateMatch = await buildDateMatch(query);
  const animalFilter = buildAnimalFilter(query);
  const rows = await Survey.aggregate([
    { $match: countedMatch({ districtCode: user.districtCode, tspCode, ...dateMatch }) },
    { $unwind: `$${type}` },
    { $match: animalFilter },
    {
      $group: {
        _id: '$wvCode',
        households: { $addToSet: '$surveyId' },
        total: { $sum: `$${type}.count` }
      }
    },
    { $addFields: { households: { $size: '$households' } } },
    { $sort: { total: -1 } }
  ]);
  return rows.map((row) => ({
    wvCode: row._id,
    households: row.households,
    total: row.total
  }));
};

const drillToHousehold = async (user, wvCode, query = {}, page = 1, perPage = 20) => {
  const type = query.type || 'bigAnimals';
  const animalFilter = buildAnimalFilter(query);
  const dateMatch = await buildDateMatch(query);
  const base = countedMatch({ districtCode: user.districtCode, wvCode, ...dateMatch });
  const matchStages = [{ $match: base }, { $unwind: `$${type}` }, { $match: animalFilter }];
  const [rows, countRows] = await Promise.all([
    Survey.aggregate([
      ...matchStages,
      { $lookup: { from: 'interviewinfos', localField: 'interviewId', foreignField: '_id', as: 'iv' } },
      { $unwind: '$iv' },
      {
        $group: {
          _id: '$surveyId',
          hName: { $first: '$iv.hName' },
          hPhone: { $first: '$iv.hPhone' },
          total: { $sum: `$${type}.count` },
          male: { $sum: { $cond: [{ $eq: [`$${type}.sex`, 'male'] }, `$${type}.count`, 0] } },
          female: { $sum: { $cond: [{ $eq: [`$${type}.sex`, 'female'] }, `$${type}.count`, 0] } },
          byAge: {
            $push: { ageLimit: `$${type}.ageLimit`, sex: `$${type}.sex`, count: `$${type}.count` }
          }
        }
      },
      { $sort: { total: -1 } },
      { $skip: (page - 1) * perPage },
      { $limit: perPage }
    ]),
    Survey.aggregate([...matchStages, { $group: { _id: '$_id' } }, { $count: 'total' }])
  ]);
  const total = countRows[0] ? countRows[0].total : 0;
  return {
    data: rows.map((row) => ({
      surveyId: row._id,
      hName: row.hName,
      hPhone: row.hPhone,
      total: row.total,
      male: row.male,
      female: row.female,
      byAge: row.byAge.map((entry) => ({
        ageLimit: entry.ageLimit ?? null,
        sex: entry.sex,
        count: entry.count
      }))
    })),
    meta: { total, page, per_page: perPage, total_pages: Math.ceil(total / perPage) }
  };
};

module.exports = {
  REPORT_STATUS,
  AGE_RANKS,
  TYPE_META,
  buildAnimalFilter,
  buildDateMatch,
  getDistrictReport,
  getTownshipReport,
  getVillageAnimalCount,
  getVillageAnimalCountFast,
  getVillageBreakdown,
  drillToTownship,
  drillToVillage,
  drillToHousehold
};
