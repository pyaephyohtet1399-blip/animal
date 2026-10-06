const mongoose = require('mongoose');
const { connectDb, runCli } = require('./lib/seedHelpers');
const BreedingCategory = require('../src/models/BreedingCategory');
const Township = require('../src/models/Township');
const Wardvillage = require('../src/models/Wardvillage');
const InterviewInfo = require('../src/models/InterviewInfo');
const Survey = require('../src/models/Survey');
const SurveySummary = require('../src/models/SurveySummary');
const surveyService = require('../src/services/surveyService');
const summaryService = require('../src/services/summaryService');
const reportService = require('../src/services/reportService');
const exportService = require('../src/services/exportService');
const categoryService = require('../src/services/categoryService');

const IDS = [999801, 999802, 999803];
const COUNTED = ['township_verified', 'district_approved'];
const out = (msg) => process.stdout.write(`${msg}\n`);

const stubRedis = {
  get: async () => null,
  set: async () => 'OK',
  setex: async () => 'OK'
};

let captured = [];
mongoose.set('debug', (coll, method, ...args) => {
  captured.push({ coll, method, args });
});

const compact = (value) =>
  JSON.stringify(value, (key, val) => {
    if (Array.isArray(val) && val.length > 4) {
      return `[...${val.length} items: ${JSON.stringify(val.slice(0, 3))} ...]`;
    }
    return val;
  });

const findCaptured = (coll, method) => captured.find((q) => q.coll === coll && q.method === method);

const probe = async (title, fn) => {
  captured = [];
  let result;
  try {
    result = await fn();
  } catch (error) {
    out(`\n── ${title} ──`);
    out(`ERROR: ${error.message}`);
    return null;
  }
  out(`\n── ${title} ──`);
  for (const q of captured) {
    out(`  Q: ${q.coll}.${q.method} ${compact(q.args)}`);
  }
  out(`  => ${result}`);
  return result;
};

const findDeep = (node, match) => {
  if (!node || typeof node !== 'object') return null;
  if (match(node)) return node;
  for (const value of Object.values(node)) {
    const found = findDeep(value, match);
    if (found) return found;
  }
  return null;
};

const collectStages = (node, stages) => {
  if (!node || typeof node !== 'object') return;
  if (node.stage) stages.push(node.indexName ? `${node.stage}(${node.indexName})` : node.stage);
  for (const key of ['inputPlan', 'inputStage', 'innerStage', 'outerStage', 'queryPlan', 'executionStages']) {
    if (node[key]) collectStages(node[key], stages);
  }
};

const explainFind = async (label, coll, filter, opts = {}) => {
  try {
    const cmd = { find: coll, filter };
    for (const key of ['sort', 'skip', 'limit', 'projection']) {
      if (opts[key] !== undefined) cmd[key] = opts[key];
    }
    const explain = await mongoose.connection.db.command({
      explain: cmd,
      verbosity: 'executionStats'
    });
    const stats = findDeep(explain, (n) => n.nReturned !== undefined && n.totalDocsExamined !== undefined);
    const planner = findDeep(explain, (n) => n.winningPlan !== undefined);
    const stages = [];
    if (planner) collectStages(planner.winningPlan, stages);
    out(
      `  EXPLAIN ${label}: ${stages.join(' <- ') || 'n/a'} | nReturned=${stats ? stats.nReturned : '?'} ` +
        `keysExamined=${stats ? stats.totalKeysExamined : '?'} docsExamined=${stats ? stats.totalDocsExamined : '?'} ` +
        `${stats ? stats.executionTimeMillis : '?'}ms`
    );
  } catch (error) {
    out(`  EXPLAIN ${label}: ERROR ${error.message}`);
  }
};

const explainAgg = async (label, coll, pipeline) => {
  try {
    const explain = await mongoose.connection.db.command({
      explain: { aggregate: coll, pipeline, cursor: {} },
      verbosity: 'executionStats'
    });
    const stats = findDeep(explain, (n) => n.nReturned !== undefined && n.totalDocsExamined !== undefined);
    const planner = findDeep(explain, (n) => n.winningPlan !== undefined);
    const stages = [];
    if (planner) collectStages(planner.winningPlan, stages);
    out(
      `  EXPLAIN ${label}: ${stages.join(' <- ') || 'pipeline'} | nReturned=${stats ? stats.nReturned : '?'} ` +
        `keysExamined=${stats ? stats.totalKeysExamined : '?'} docsExamined=${stats ? stats.totalDocsExamined : '?'} ` +
        `${stats ? stats.executionTimeMillis : '?'}ms`
    );
  } catch (error) {
    out(`  EXPLAIN ${label}: ERROR ${error.message}`);
  }
};

const explainFromCaptured = async (label, coll, method = 'find') => {
  const q = findCaptured(coll, method);
  if (!q) return;
  if (method === 'aggregate') await explainAgg(label, coll, q.args[0]);
  else await explainFind(label, coll, q.args[0], q.args[1] || {});
};

const cleanup = async () => {
  await Survey.deleteMany({ surveyId: { $in: IDS } });
  await InterviewInfo.deleteMany({ interviewId: { $in: IDS } });
};

const main = async () => {
  await connectDb();
  await cleanup();

  const township = await Township.findOne({}).lean();
  const wv = await Wardvillage.findOne({}).lean();
  if (!township || !wv) throw new Error('locations empty — run npm run seed:locations');
  const districtCode = township.districtCode;
  const scope = {
    districtCode,
    tspCode: township.tspCode,
    tvgCode: wv.tvgCode,
    wvCode: wv.wvCode
  };
  const districtUser = { role: 'district', districtCode };

  const summaryExistedBefore = Boolean(
    await SurveySummary.findOne({ tspCode: scope.tspCode, wvCode: scope.wvCode }).lean()
  );

  // ---- setup: 3 surveys (mixed status/breeding), interviewId linked ----
  const interviewIds = {};
  for (const id of IDS) {
    const iv = await InterviewInfo.create({
      interviewId: id,
      hName: `စမ်းသပ်အိမ်${id}`,
      hEdu: 'ဘွဲ့',
      hGender: 'အထီး',
      hPhone: '09999000000',
      hAge: 40,
      ansDate: new Date(),
      ...scope
    });
    interviewIds[id] = iv._id;
  }
  const sA = await Survey.create({
    surveyId: IDS[0],
    interviewId: interviewIds[IDS[0]],
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
  const sB = await Survey.create({
    surveyId: IDS[1],
    interviewId: interviewIds[IDS[1]],
    villageHeadmanId: new mongoose.Types.ObjectId(),
    status: 'draft',
    ...scope,
    syncVersion: 1,
    bigAnimals: [],
    smallAnimals: [],
    poultry: [],
    breedingAnimals: [{ categoryId: 1, sex: 'female', count: 1 }],
    hasBreeding: true
  });
  const sC = await Survey.create({
    surveyId: IDS[2],
    interviewId: interviewIds[IDS[2]],
    villageHeadmanId: new mongoose.Types.ObjectId(),
    status: 'district_approved',
    ...scope,
    syncVersion: 1,
    bigAnimals: [{ categoryId: 5, ageLimit: 'LessThanOne', sex: 'female', count: 5 }],
    smallAnimals: [],
    poultry: [],
    breedingAnimals: [],
    hasBreeding: false
  });
  await summaryService.updateSummary(sA.toObject(), 1);
  await summaryService.updateSummary(sC.toObject(), 1);

  // ---- 0. collection stats + indexes ----
  out('===== 0. COLLECTIONS & INDEXES =====');
  const db = mongoose.connection.db;
  for (const coll of ['surveys', 'surveysummaries', 'interviewinfos', 'breedingcategories', 'townships', 'wardvillages']) {
    try {
      const count = await db.collection(coll).estimatedDocumentCount();
      const indexes = await db.collection(coll).indexes();
      const list = indexes
        .map((i) => `${Object.keys(i.key).join('+')}${i.unique ? '[U]' : ''}`)
        .filter((name) => name !== '_id_');
      out(`  ${coll}: docs≈${count} | indexes: ${list.join(', ') || '(none)'}`);
    } catch (error) {
      out(`  ${coll}: ERROR ${error.message}`);
    }
  }

  // ---- 1. categories ----
  out('\n===== 1. CATEGORIES (GET /categories/breeding) =====');
  await probe('categoryService.getCategories("breeding")', async () => {
    const data = await categoryService.getCategories('breeding', stubRedis);
    return `${data.length} rows: ${data.map((c) => `${c.categoryId}=${c.name}`).join(', ')}`;
  });
  await explainFromCaptured('breedingcategories list', 'breedingcategories');

  // ---- 2. survey list ----
  out('\n===== 2. SURVEY LIST (GET /surveys) =====');
  await probe('list — district scope, page 1', async () => {
    const r = await surveyService.list(districtUser, { page: 1, per_page: 20 }, stubRedis);
    return `data=${r.data.length} total=${r.meta.total} total_pages=${r.meta.total_pages}`;
  });
  const listQuery = findCaptured('surveys', 'find');
  if (listQuery) {
    await explainFromCaptured('surveys list (deletedAt + sort createdAt)', 'surveys');
  }

  await probe('list — ?hasBreeding=true (D-54 သီးသန့်စာရင်း)', async () => {
    const r = await surveyService.list(districtUser, { hasBreeding: true, page: 1, per_page: 20 }, stubRedis);
    return `data=${r.data.length} total=${r.meta.total} surveyIds=${r.data.map((s) => s.surveyId).join(',')}`;
  });
  const breedQuery = findCaptured('surveys', 'find');
  if (breedQuery) {
    await explainFromCaptured('surveys hasBreeding=true', 'surveys');
  }

  await probe('list — ?status=draft', async () => {
    const r = await surveyService.list(districtUser, { status: 'draft', page: 1, per_page: 20 }, stubRedis);
    return `data=${r.data.length} total=${r.meta.total}`;
  });

  // ---- 3. district report ----
  out('\n===== 3. DISTRICT REPORT (§9.1 row 1 — summaries fast path) =====');
  await probe('getDistrictReport', async () => {
    const r = await reportService.getDistrictReport(districtCode);
    return `totalSurveys=${r.totalSurveys} breeding=${r.totalBreedingAnimals} townships=${r.byTownship.length}`;
  });
  const distinctQ = findCaptured('townships', 'distinct');
  if (distinctQ) out(`  (distinct filter: ${compact(distinctQ.args)})`);
  const sumFind = findCaptured('surveysummaries', 'find');
  if (sumFind) {
    await explainFromCaptured('surveysummaries district sums', 'surveysummaries');
  }

  // ---- 4. township report ----
  out('\n===== 4. TOWNSHIP REPORT (§9.1 row 2 — direct aggregation) =====');
  await probe('getTownshipReport', async () => {
    const r = await reportService.getTownshipReport(scope.tspCode);
    return `totalSurveys=${r.totalSurveys} breeding=${r.totalBreedingAnimals} villages=${r.villages.length}`;
  });
  const townAgg = findCaptured('surveys', 'aggregate');
  if (townAgg) await explainFromCaptured('township report pipeline', 'surveys', 'aggregate');

  // ---- 5. drilldown L1 ----
  out('\n===== 5. DRILLDOWN L1 (fast = summaries / direct = aggregation) =====');
  await probe('drillToTownship — fast (no filters)', async () => {
    const rows = await reportService.drillToTownship(districtUser, { type: 'breedingAnimals' });
    return `${rows.length} rows: ${compact(rows)}`;
  });
  const fastFind = findCaptured('surveysummaries', 'find');
  if (fastFind) await explainFromCaptured('L1 fast summaries', 'surveysummaries');

  await probe('drillToTownship — direct (type + categoryId)', async () => {
    const rows = await reportService.drillToTownship(districtUser, { type: 'breedingAnimals', categoryId: 1 });
    return `${rows.length} rows: ${compact(rows)}`;
  });
  const directAgg = findCaptured('surveys', 'aggregate');
  if (directAgg) await explainFromCaptured('L1 direct pipeline', 'surveys', 'aggregate');

  // ---- 6. drilldown L2/L3 ----
  out('\n===== 6. DRILLDOWN L2 (village) / L3 (household) =====');
  await probe('drillToVillage', async () => {
    const rows = await reportService.drillToVillage(districtUser, scope.tspCode, { type: 'breedingAnimals' });
    return `${rows.length} rows: ${compact(rows)}`;
  });

  await probe('drillToHousehold L3 (survey row + interview join)', async () => {
    const r = await reportService.drillToHousehold(districtUser, scope.wvCode, { type: 'breedingAnimals' });
    return `rows=${r.data.length} (page1): ${compact(r.data.slice(0, 2))}`;
  });
  const l3Agg = findCaptured('surveys', 'aggregate');
  if (l3Agg) await explainFromCaptured('L3 pipeline ($lookup interviewinfos)', 'surveys', 'aggregate');

  // ---- 7. village counts + breakdown ----
  out('\n===== 7. VILLAGE COUNTS (§9.1 rows 3/4) + BREAKDOWN =====');
  await probe('getVillageAnimalCountFast (summary)', async () => {
    const n = await reportService.getVillageAnimalCountFast(scope.wvCode, { categoryId: 1, sex: 'male' }, 'breedingAnimals');
    return `count=${n}`;
  });
  const fastOne = findCaptured('surveysummaries', 'findOne');
  if (fastOne) await explainFromCaptured('fast count summary lookup', 'surveysummaries', 'findOne');

  await probe('getVillageAnimalCount (direct)', async () => {
    const n = await reportService.getVillageAnimalCount(scope.wvCode, { type: 'breedingAnimals', categoryId: 1 });
    return `count=${n}`;
  });
  const cntAgg = findCaptured('surveys', 'aggregate');
  if (cntAgg) await explainFromCaptured('direct count pipeline', 'surveys', 'aggregate');

  await probe('getVillageBreakdown', async () => {
    const rows = await reportService.getVillageBreakdown(scope.wvCode, 1, 'breedingAnimals');
    return `${rows.length} rows: ${compact(rows)}`;
  });
  const bdAgg = findCaptured('surveys', 'aggregate');
  if (bdAgg) await explainFromCaptured('breakdown pipeline', 'surveys', 'aggregate');

  // ---- 8. export ----
  out('\n===== 8. EXPORT (exportTownship → Excel) =====');
  await probe('exportTownship', async () => {
    const r = await exportService.exportTownship(scope.tspCode);
    const ws = r.workbook.getWorksheet('Surveys');
    return `rows=${ws.rowCount - 1} cols=${ws.columnCount}`;
  });
  const expFind = findCaptured('surveys', 'find');
  if (expFind) await explainFromCaptured('export find', 'surveys');

  // ---- cleanup ----
  mongoose.set('debug', false);
  await summaryService.updateSummary(sA.toObject(), -1);
  await summaryService.updateSummary(sC.toObject(), -1);
  if (!summaryExistedBefore) {
    await SurveySummary.deleteOne({ tspCode: scope.tspCode, wvCode: scope.wvCode });
  }
  await cleanup();
  out('\ncleanup done');
};

if (require.main === module) {
  runCli(main, 'probe-queries');
}

module.exports = { main };
