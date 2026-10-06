const ExcelJS = require('exceljs');
const Survey = require('../models/Survey');
const ApiError = require('../utils/apiError');
const { sumArray } = require('./summaryService');
const { buildDateMatch } = require('./reportService');
const { COUNTED_STATUSES } = require('../constants/surveyStatus');

const EXPORT_ROW_LIMIT = 50000;

const COLUMNS = [
  { header: 'Survey ID', key: 'surveyId' },
  { header: 'အမည်', key: 'hName' },
  { header: 'ဖုန်း', key: 'hPhone' },
  { header: 'ကျေးရွာ', key: 'wvCode' },
  { header: 'တိရစ္ဆာန်ကြီး', key: 'bigAnimals' },
  { header: 'တိရစ္ဆာန်အငယ်', key: 'smallAnimals' },
  { header: 'ကြက်/ဘဲ/ငုံ', key: 'poultry' },
  { header: 'မျိုးပွားစုစုပေါင်း', key: 'breedingAnimals' },
  { header: 'မျိုးပွား-အထီး', key: 'breedingMale' },
  { header: 'မျိုးပွား-အမ', key: 'breedingFemale' }
];

const sumBySex = (arr, sex) => sumArray((arr || []).filter((item) => item.sex === sex));

const exportTownship = async (tspCode, range = {}) => {
  const dateMatch = await buildDateMatch(range);
  const query = {
    tspCode,
    status: { $in: COUNTED_STATUSES },
    deletedAt: null,
    ...dateMatch
  };
  const total = await Survey.countDocuments(query);
  if (total > EXPORT_ROW_LIMIT) {
    throw new ApiError(
      400,
      `Export limit is ${EXPORT_ROW_LIMIT} rows; found ${total}. Narrow the date range.`,
      'row_limit_exceeded'
    );
  }
  const surveys = await Survey.find(query).populate('interviewId').lean();
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Surveys');
  worksheet.columns = COLUMNS;
  for (const survey of surveys) {
    worksheet.addRow({
      surveyId: survey.surveyId,
      hName: survey.interviewId ? survey.interviewId.hName : null,
      hPhone: survey.interviewId ? survey.interviewId.hPhone : null,
      wvCode: survey.wvCode,
      bigAnimals: sumArray(survey.bigAnimals),
      smallAnimals: sumArray(survey.smallAnimals),
      poultry: sumArray(survey.poultry),
      breedingAnimals: sumArray(survey.breedingAnimals),
      breedingMale: sumBySex(survey.breedingAnimals, 'male'),
      breedingFemale: sumBySex(survey.breedingAnimals, 'female')
    });
  }
  return { workbook, filename: `surveys_${tspCode}.xlsx`, count: surveys.length };
};

module.exports = { exportTownship, EXPORT_ROW_LIMIT, COLUMNS };
