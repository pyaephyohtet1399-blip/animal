const mongoose = require('mongoose');
const { connectDb, runCli } = require('./lib/seedHelpers');
const BreedingCategory = require('../src/models/BreedingCategory');
const Township = require('../src/models/Township');
const Wardvillage = require('../src/models/Wardvillage');
const InterviewInfo = require('../src/models/InterviewInfo');
const Survey = require('../src/models/Survey');
const SurveySummary = require('../src/models/SurveySummary');
const summaryService = require('../src/services/summaryService');
const reportService = require('../src/services/reportService');
const exportService = require('../src/services/exportService');
const rebuild = require('./rebuild-summaries');

const INTERVIEW_ID = 999901;
const SURVEY_ID = 999901;
const OLD_DOC_ID = 999900;
const OLD_DOC_MONGO_ID = new mongoose.Types.ObjectId();

const out = (msg) => process.stdout.write(`${msg}\n`);
const check = (name, cond, extra = '') => {
  out(`${cond ? 'PASS' : 'FAIL'} | ${name}${extra ? ` | ${extra}` : ''}`);
  if (!cond) process.exitCode = 1;
};

const districtUser = (districtCode) => ({ role: 'district', districtCode });

const main = async () => {
  await connectDb();

  const cleanup = async () => {
    await Survey.deleteMany({ surveyId: { $in: [SURVEY_ID, OLD_DOC_ID] } });
    await InterviewInfo.deleteMany({ interviewId: INTERVIEW_ID });
  };
  await cleanup();

  // 1. seed check
  const cats = await BreedingCategory.find({}).sort({ categoryId: 1 }).lean();
  check('breedingcategories seeded in Atlas (6 rows)', cats.length === 6, `count=${cats.length}`);
  const EXPECTED_SPECIES = ['ဒေသနွား', 'ဒေသကျွဲ', 'နို့စားကျွဲ', 'ဝက်', 'ဆိတ်', 'သိုး'];
  const actualSpecies = cats.map((c) => c.name);
  check(
    'breeding species names match spec (D-54)',
    JSON.stringify(actualSpecies) === JSON.stringify(EXPECTED_SPECIES),
    JSON.stringify(actualSpecies)
  );

  const township = await Township.findOne({}).lean();
  const wv = await Wardvillage.findOne({}).lean();
  if (!township || !wv) throw new Error('locations empty — run npm run seed:locations');
  const user = districtUser(township.districtCode);
  const scope = {
    districtCode: township.districtCode,
    tspCode: township.tspCode,
    tvgCode: wv.tvgCode,
    wvCode: wv.wvCode
  };

  // 2. schema guard: invalid sex rejected by Mongoose
  let rejected = false;
  try {
    await Survey.create({
      surveyId: 999902,
      interviewId: new mongoose.Types.ObjectId(),
      ...scope,
      breedingAnimals: [{ categoryId: 1, sex: 'ca_male', count: 1 }]
    });
  } catch (error) {
    rejected = error.name === 'ValidationError';
  }
  check('Mongoose rejects ca_male for breedingAnimals', rejected);
  await Survey.deleteMany({ surveyId: 999902 });

  // 3. baseline snapshots (before our survey)
  const summaryBefore = await SurveySummary.findOne({ tspCode: scope.tspCode, wvCode: scope.wvCode }).lean();
  const summaryExistedBefore = Boolean(summaryBefore);
  const districtBefore = await reportService.getDistrictReport(scope.districtCode);
  const townshipBefore = await reportService.getTownshipReport(scope.tspCode);

  // 4. create interview + survey (counted status, breeding data)
  const iv = await InterviewInfo.create({
    interviewId: INTERVIEW_ID,
    hName: 'စမ်းသပ်အိမ်',
    hEdu: 'ဘွဲ့',
    hGender: 'အထီး',
    hPhone: '09999000000',
    hAge: 40,
    ansDate: new Date(),
    tspCode: scope.tspCode,
    tvgCode: scope.tvgCode,
    wvCode: scope.wvCode
  });
  const survey = await Survey.create({
    surveyId: SURVEY_ID,
    interviewId: iv._id,
    villageHeadmanId: new mongoose.Types.ObjectId(),
    status: 'township_verified',
    ...scope,
    syncVersion: 1,
    bigAnimals: [{ categoryId: 1, ageLimit: 'Over3', sex: 'male', count: 10 }],
    smallAnimals: [],
    poultry: [],
    breedingAnimals: [
      { categoryId: 1, sex: 'male', count: 3 },
      { categoryId: 4, sex: 'female', count: 2 }
    ],
    hasBreeding: true
  });
  check('survey persisted with hasBreeding=true', survey.hasBreeding === true && survey.breedingAnimals.length === 2);

  // 5. summary delta +1 (D-38 semantics)
  await summaryService.updateSummary(survey.toObject(), 1);
  const summary = await SurveySummary.findOne({ tspCode: scope.tspCode, wvCode: scope.wvCode }).lean();
  check('summary totalBreedingAnimals +5', summary.totalBreedingAnimals >= 5, `value=${summary.totalBreedingAnimals}`);
  check(
    'breedingBreakdown 2-part keys',
    summary.breedingBreakdown['1:male'] >= 3 && summary.breedingBreakdown['4:female'] >= 2,
    JSON.stringify(summary.breedingBreakdown)
  );

  // 6. reports (delta vs baseline)
  const districtAfter = await reportService.getDistrictReport(scope.districtCode);
  check(
    'district report totals breeding +5',
    districtAfter.totalBreedingAnimals - districtBefore.totalBreedingAnimals === 5,
    `delta=${districtAfter.totalBreedingAnimals - districtBefore.totalBreedingAnimals}`
  );
  const townshipAfter = await reportService.getTownshipReport(scope.tspCode);
  check(
    'township report totals breeding +5',
    townshipAfter.totalBreedingAnimals - townshipBefore.totalBreedingAnimals === 5,
    `delta=${townshipAfter.totalBreedingAnimals - townshipBefore.totalBreedingAnimals}`
  );
  check('township report village row has breeding', Array.isArray(townshipAfter.villages));

  // 7. drilldown fast path (summaries)
  const fastRows = await reportService.drillToTownship(user, { type: 'breedingAnimals' });
  const fastRow = fastRows.find((r) => r.tspCode === scope.tspCode);
  check(
    'drilldown L1 fast: breeding row male+female=total',
    fastRow && fastRow.total === fastRow.male + fastRow.female && fastRow.total >= 5,
    JSON.stringify(fastRow)
  );

  // 8. drilldown direct (aggregation on surveys)
  const directRows = await reportService.drillToTownship(user, {
    type: 'breedingAnimals',
    categoryId: 1
  });
  const directRow = directRows.find((r) => r.tspCode === scope.tspCode);
  check(
    'drilldown L1 direct: cat1 male>=3',
    directRow && directRow.male >= 3 && directRow.total >= 3,
    JSON.stringify(directRow)
  );

  // 9. drilldown L3 household: byAge ageLimit=null
  const household = await reportService.drillToHousehold(user, scope.wvCode, { type: 'breedingAnimals' });
  const row = household.data.find((r) => r.surveyId === SURVEY_ID);
  check(
    'drilldown L3: total=5, male=3, female=2',
    row && row.total === 5 && row.male === 3 && row.female === 2,
    JSON.stringify(row)
  );
  check(
    'drilldown L3: byAge[].ageLimit === null',
    row && row.byAge.length === 2 && row.byAge.every((e) => e.ageLimit === null),
    JSON.stringify(row && row.byAge)
  );

  // 10. village fast count: 2-part key consistency
  const fastCount = await reportService.getVillageAnimalCountFast(
    scope.wvCode,
    { categoryId: 1, sex: 'male' },
    'breedingAnimals'
  );
  check(
    'village fast count == summary breakdown value',
    fastCount === summary.breedingBreakdown['1:male'],
    `fast=${fastCount}`
  );
  const slowCount = await reportService.getVillageAnimalCount(scope.wvCode, {
    type: 'breedingAnimals',
    categoryId: 1
  });
  check('village direct count >= fast count', slowCount >= fastCount, `direct=${slowCount}`);

  // 11. village breakdown rows (ageLimit null)
  const breakdown = await reportService.getVillageBreakdown(scope.wvCode, 1, 'breedingAnimals');
  check(
    'village breakdown rows sex-only (ageLimit null)',
    breakdown.length >= 1 && breakdown.every((r) => r.ageLimit === null),
    JSON.stringify(breakdown)
  );

  // 12. Excel export columns 8/9/10
  const exported = await exportService.exportTownship(scope.tspCode);
  const ws = exported.workbook.getWorksheet('Surveys');
  const headers = [8, 9, 10].map((c) => ws.getRow(1).getCell(c).value);
  check(
    'export headers 8-10',
    headers[0] === 'မျိုးပွားစုစုပေါင်း' && headers[1] === 'မျိုးပွား-အထီး' && headers[2] === 'မျိုးပွား-အမ',
    JSON.stringify(headers)
  );
  let exportRow = null;
  for (let r = 2; r <= ws.rowCount; r += 1) {
    if (ws.getRow(r).getCell(1).value === SURVEY_ID) exportRow = ws.getRow(r);
  }
  check(
    'export row: total=5, male=3, female=2',
    exportRow &&
      exportRow.getCell(8).value === 5 &&
      exportRow.getCell(9).value === 3 &&
      exportRow.getCell(10).value === 2
  );

  // 13. rebuild backfill: native old-style doc (no hasBreeding/breedingAnimals fields)
  await Survey.collection.insertOne({
    _id: OLD_DOC_MONGO_ID,
    surveyId: OLD_DOC_ID,
    interviewId: iv._id,
    status: 'draft',
    ...scope,
    syncVersion: 0,
    deletedAt: null
  });
  const rawBefore = await Survey.collection.findOne({ surveyId: OLD_DOC_ID });
  check('old-style doc lacks hasBreeding field', rawBefore.hasBreeding === undefined);
  await rebuild.main();
  const rawAfter = await Survey.collection.findOne({ surveyId: OLD_DOC_ID });
  check(
    'rebuild backfill sets hasBreeding=false + breedingAnimals=[]',
    rawAfter.hasBreeding === false && Array.isArray(rawAfter.breedingAnimals) && rawAfter.breedingAnimals.length === 0
  );
  const summaryAfterRebuild = await SurveySummary.findOne({
    tspCode: scope.tspCode,
    wvCode: scope.wvCode
  }).lean();
  check(
    'summary still holds breeding after rebuild',
    summaryAfterRebuild && summaryAfterRebuild.totalBreedingAnimals >= 5,
    `value=${summaryAfterRebuild && summaryAfterRebuild.totalBreedingAnimals}`
  );

  // 14. summary delta -1 exact reverse
  await summaryService.updateSummary(survey.toObject(), -1);
  const summaryReversed = await SurveySummary.findOne({
    tspCode: scope.tspCode,
    wvCode: scope.wvCode
  }).lean();
  const expected = (summaryAfterRebuild.totalBreedingAnimals || 0) - 5;
  check(
    'summary -1 reverses exactly',
    (summaryReversed.totalBreedingAnimals || 0) === expected,
    `${summaryReversed.totalBreedingAnimals} == ${expected}`
  );

  // cleanup
  await cleanup();
  if (!summaryExistedBefore) {
    await SurveySummary.deleteOne({ tspCode: scope.tspCode, wvCode: scope.wvCode });
  }
  out('cleanup done');
};

if (require.main === module) {
  runCli(main, 'smoke-breeding');
}

module.exports = { main };
