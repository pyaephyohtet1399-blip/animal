const ExcelJS = require('exceljs');
const request = require('supertest');
const Survey = require('../../../src/models/Survey');
const { signFor, auth } = require('../../helpers/auth');
const { setupTestApp, teardownTestApp, clearDb, clearRedis } = require('../../helpers/testApp');
const {
  seedReportData,
  REPORT_TSP_A,
  REPORT_DISTRICT,
  OTHER_TSP
} = require('../../helpers/seedReports');

let app;
let villageToken;
let townshipToken;
let otherTownshipToken;
let districtToken;
let otherDistrictToken;

const VILLAGE = {
  _id: '64f1a2b3c4d5e6f7a8b9c0d1',
  loginCode: '194657',
  role: 'village',
  districtCode: REPORT_DISTRICT,
  tspCode: REPORT_TSP_A,
  tvgCode: 'MMR010031047',
  wvCode: '194657'
};

const binaryParser = (res, callback) => {
  const chunks = [];
  res.on('data', (chunk) => chunks.push(chunk));
  res.on('end', () => callback(null, Buffer.concat(chunks)));
};

const getReports = (path, token, useBinary = false) => {
  let req = request(app).get(`/api/v1/reports${path}`).set(auth(token));
  if (useBinary) req = req.buffer(true).parse(binaryParser);
  return req;
};

const loadWorkbook = async (res) => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(res.body);
  return workbook.getWorksheet('Surveys');
};

const sheetSurveyIds = (worksheet) => {
  const ids = [];
  for (let row = 2; row <= worksheet.rowCount; row += 1) {
    ids.push(worksheet.getRow(row).getCell(1).value);
  }
  return ids.sort((a, b) => a - b);
};

beforeAll(async () => {
  app = await setupTestApp();
  villageToken = signFor(VILLAGE);
  townshipToken = signFor({
    _id: '64f1a2b3c4d5e6f7a8b9c0d2',
    loginCode: REPORT_TSP_A,
    role: 'township',
    districtCode: REPORT_DISTRICT,
    tspCode: REPORT_TSP_A
  });
  otherTownshipToken = signFor({
    _id: '64f1a2b3c4d5e6f7a8b9c0d8',
    loginCode: 'MMR010028',
    role: 'township',
    districtCode: REPORT_DISTRICT,
    tspCode: 'MMR010028'
  });
  districtToken = signFor({
    _id: '64f1a2b3c4d5e6f7a8b9c0d3',
    loginCode: 'MMR0100',
    role: 'district',
    districtCode: REPORT_DISTRICT
  });
  otherDistrictToken = signFor({
    _id: '64f1a2b3c4d5e6f7a8b9c0d4',
    loginCode: 'MMR0200',
    role: 'district',
    districtCode: 'MMR0200'
  });
});

afterAll(async () => {
  await teardownTestApp();
});

beforeEach(async () => {
  await clearDb();
  await clearRedis(app);
  await seedReportData();
});

describe('reports RBAC + gate', () => {
  test('all endpoints require authentication', async () => {
    const paths = [
      '/district',
      `/township/${REPORT_TSP_A}`,
      '/drilldown?level=township',
      `/district/${REPORT_TSP_A}/export`
    ];
    for (const path of paths) {
      const res = await request(app).get(`/api/v1/reports${path}`);
      expect(res.status).toBe(401);
    }
  });

  test('village role gets 403 on all report endpoints', async () => {
    const paths = [
      '/district',
      `/township/${REPORT_TSP_A}`,
      '/drilldown?level=township',
      `/district/${REPORT_TSP_A}/export`
    ];
    for (const path of paths) {
      const res = await getReports(path, villageToken);
      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('forbidden');
    }
  });

  test('township can view own township report only', async () => {
    const own = await getReports(`/township/${REPORT_TSP_A}`, townshipToken);
    expect(own.status).toBe(200);

    const other = await getReports(`/township/MMR010028`, townshipToken);
    expect(other.status).toBe(403);
    expect(other.body.error.code).toBe('forbidden');

    expect((await getReports('/district', townshipToken)).status).toBe(403);
    expect((await getReports('/drilldown?level=township', townshipToken)).status).toBe(403);
    expect((await getReports(`/district/${REPORT_TSP_A}/export`, townshipToken)).status).toBe(403);
  });

  test('other township can view its own report', async () => {
    const res = await getReports('/township/MMR010028', otherTownshipToken);
    expect(res.status).toBe(200);
    expect(res.body.data.totalSurveys).toBe(1);
  });
});

describe('GET /reports/district (fast path)', () => {
  test('returns aggregated summaries for the district', async () => {
    const res = await getReports('/district', districtToken);
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      districtCode: REPORT_DISTRICT,
      totalSurveys: 4,
      totalHouseholds: 4,
      totalBigAnimals: 21,
      totalSmallAnimals: 8,
      totalPoultry: 26,
      totalBreedingAnimals: 6
    });
    expect(res.body.data.byTownship).toHaveLength(2);
    expect(res.body.data.byTownship[0]).toMatchObject({ tspCode: REPORT_TSP_A, totalSurveys: 3 });
  });

  test('other district sees only its own data', async () => {
    const res = await getReports('/district', otherDistrictToken);
    expect(res.body.data.totalSurveys).toBe(1);
    expect(res.body.data.byTownship[0].tspCode).toBe(OTHER_TSP);
  });
});

describe('GET /reports/township/:tspCode', () => {
  test('returns totals, avgAge and village breakdown', async () => {
    const res = await getReports(`/township/${REPORT_TSP_A}`, districtToken);
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      tspCode: REPORT_TSP_A,
      totalSurveys: 3,
      totalHouseholds: 3,
      avgAge: 50,
      totalBigAnimals: 17,
      totalSmallAnimals: 7,
      totalPoultry: 24,
      totalBreedingAnimals: 6
    });
    expect(res.body.data.villages[0]).toMatchObject({ wvCode: '194657', totalSurveys: 2 });
  });

  test('supports from/to date range (D-22)', async () => {
    const res = await getReports(
      `/township/${REPORT_TSP_A}?from=2026-01-01&to=2026-02-15`,
      districtToken
    );
    expect(res.status).toBe(200);
    expect(res.body.data.totalSurveys).toBe(2);
    expect(res.body.data.avgAge).toBe(45);
  });

  test('rejects invalid params with 422', async () => {
    expect((await getReports('/township/MMR01!!', districtToken)).status).toBe(422);
    expect((await getReports(`/township/${REPORT_TSP_A}?from=bad-date`, districtToken)).status).toBe(422);
    expect(
      (await getReports(`/township/${REPORT_TSP_A}?from=2026-02-01&to=2026-01-01`, districtToken)).status
    ).toBe(422);
  });
});

describe('GET /reports/drilldown', () => {
  test('level=township fast path returns per-township rows', async () => {
    const res = await getReports('/drilldown?level=township', districtToken);
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([
      { tspCode: REPORT_TSP_A, households: 3, total: 17, male: 2, female: 12 },
      { tspCode: 'MMR010028', households: 1, total: 4, male: 0, female: 4 }
    ]);
  });

  test('level=township with categoryId uses direct aggregation (D-24 whitelist)', async () => {
    const res = await getReports('/drilldown?level=township&categoryId=1', districtToken);
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([
      { tspCode: REPORT_TSP_A, households: 2, total: 7, male: 2, female: 5 },
      { tspCode: 'MMR010028', households: 1, total: 4, male: 0, female: 4 }
    ]);
  });

  test('level=township with type=poultry reads poultry totals', async () => {
    const res = await getReports('/drilldown?level=township&type=poultry', districtToken);
    expect(res.status).toBe(200);
    expect(res.body.data[0]).toMatchObject({ tspCode: REPORT_TSP_A, total: 24 });
    expect(res.body.data[1]).toMatchObject({ tspCode: 'MMR010028', total: 2 });
  });

  test('level=township type=breedingAnimals fast path uses 2-part breakdown keys (D-54)', async () => {
    const res = await getReports('/drilldown?level=township&type=breedingAnimals', districtToken);
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([
      { tspCode: REPORT_TSP_A, households: 3, total: 6, male: 3, female: 3 },
      { tspCode: 'MMR010028', households: 1, total: 0, male: 0, female: 0 }
    ]);
  });

  test('level=township type=breedingAnimals with categoryId uses direct aggregation', async () => {
    const res = await getReports(
      '/drilldown?level=township&type=breedingAnimals&categoryId=1',
      districtToken
    );
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([
      { tspCode: REPORT_TSP_A, households: 2, total: 4, male: 3, female: 1 }
    ]);
  });

  test('level=household type=breedingAnimals returns byAge with ageLimit null (D-54)', async () => {
    const res = await getReports(
      '/drilldown?level=household&wvCode=194657&type=breedingAnimals',
      districtToken
    );
    expect(res.status).toBe(200);
    expect(res.body.meta).toMatchObject({ total: 1 });
    expect(res.body.data[0]).toMatchObject({ surveyId: 1, total: 5, male: 3, female: 2 });
    expect(res.body.data[0].byAge).toEqual([
      { ageLimit: null, sex: 'male', count: 3 },
      { ageLimit: null, sex: 'female', count: 2 }
    ]);
  });

  test('level=village scoped to township', async () => {
    const res = await getReports(
      `/drilldown?level=village&tspCode=${REPORT_TSP_A}`,
      districtToken
    );
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([
      { wvCode: '194657', households: 2, total: 14 },
      { wvCode: '194660', households: 1, total: 3 }
    ]);
  });

  test('level=household returns rows with meta envelope', async () => {
    const res = await getReports(
      '/drilldown?level=household&wvCode=194657',
      districtToken
    );
    expect(res.status).toBe(200);
    expect(res.body.meta).toEqual({ total: 2, page: 1, per_page: 20, total_pages: 1 });
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0]).toMatchObject({ surveyId: 1, hName: 'အိမ်တစ်', total: 9 });
    expect(res.body.data[0].byAge).toHaveLength(2);
  });

  test('level=household paginates', async () => {
    const res = await getReports(
      '/drilldown?level=household&wvCode=194657&per_page=1&page=2',
      districtToken
    );
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].surveyId).toBe(2);
    expect(res.body.meta).toMatchObject({ total: 2, page: 2, per_page: 1, total_pages: 2 });
  });

  test('drilldown is scoped to requesting district', async () => {
    const res = await getReports('/drilldown?level=township', otherDistrictToken);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].tspCode).toBe(OTHER_TSP);
  });

  test('rejects invalid queries with 422', async () => {
    const cases = [
      '/drilldown',
      '/drilldown?level=country',
      '/drilldown?level=township&type=secret',
      '/drilldown?level=village',
      '/drilldown?level=household',
      '/drilldown?level=township&ageFrom=Nope',
      '/drilldown?level=township&type=poultry&ageFrom=Over3',
      '/drilldown?level=township&sex=unknown',
      '/drilldown?level=township&categoryId=-2',
      '/drilldown?level=township&per_page=101',
      '/drilldown?level=township&from=2026-02-01&to=2026-01-01',
      '/drilldown?level=township&ageFrom=Over3&ageTo=LessThanOne',
      '/drilldown?level=township&type=breedingAnimals&ageFrom=LessThanOne',
      '/drilldown?level=township&type=breedingAnimals&ageTo=Over3',
      '/drilldown?level=township&type=breedingAnimals&sex=ca_male'
    ];
    for (const path of cases) {
      const res = await getReports(path, districtToken);
      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('validation_error');
    }
  });
});

describe('GET /reports/district/:tspCode/export (D-23)', () => {
  test('streams xlsx with counted non-deleted rows only', async () => {
    const res = await getReports(`/district/${REPORT_TSP_A}/export`, districtToken, true);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    expect(res.headers['content-disposition']).toContain(
      `attachment; filename="surveys_${REPORT_TSP_A}.xlsx"`
    );
    expect(res.body.slice(0, 2).toString()).toBe('PK');

    const worksheet = await loadWorkbook(res);
    expect(worksheet.getRow(1).getCell(2).value).toBe('အမည်');
    expect(worksheet.getRow(1).getCell(8).value).toBe('မျိုးပွားစုစုပေါင်း');
    expect(worksheet.getRow(1).getCell(9).value).toBe('မျိုးပွား-အထီး');
    expect(worksheet.getRow(1).getCell(10).value).toBe('မျိုးပွား-အမ');
    expect(worksheet.rowCount).toBe(4);
    expect(sheetSurveyIds(worksheet)).toEqual([1, 2, 3]);

    const first = worksheet.getRow(2);
    expect(first.getCell(1).value).toBe(1);
    expect(first.getCell(2).value).toBe('အိမ်တစ်');
    expect(first.getCell(4).value).toBe('194657');
    expect(first.getCell(5).value).toBe(9);
    expect(first.getCell(6).value).toBe(4);
    expect(first.getCell(7).value).toBe(10);
    expect(first.getCell(8).value).toBe(5);
    expect(first.getCell(9).value).toBe(3);
    expect(first.getCell(10).value).toBe(2);
  });

  test('from/to narrows exported rows (D-22)', async () => {
    const res = await getReports(
      `/district/${REPORT_TSP_A}/export?from=2026-01-01&to=2026-02-15`,
      districtToken,
      true
    );
    expect(res.status).toBe(200);
    const worksheet = await loadWorkbook(res);
    expect(worksheet.rowCount).toBe(3);
    expect(sheetSurveyIds(worksheet)).toEqual([1, 2]);
  });

  test('rejects when row count exceeds 50k (D-23)', async () => {
    const spy = jest.spyOn(Survey, 'countDocuments').mockResolvedValueOnce(50001);
    try {
      const res = await getReports(`/district/${REPORT_TSP_A}/export`, districtToken);
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('row_limit_exceeded');
    } finally {
      spy.mockRestore();
    }
  });

  test('rejects invalid tspCode with 422', async () => {
    const res = await getReports('/district/MMR01!!/export', districtToken);
    expect(res.status).toBe(422);
  });

  test('audit log records export action', async () => {
    await getReports(`/district/${REPORT_TSP_A}/export`, districtToken, true);
    await new Promise((resolve) => setTimeout(resolve, 100));
    const AuditLog = require('../../../src/models/AuditLog');
    const entry = await AuditLog.findOne({ action: 'export', role: 'district' }).lean();
    expect(entry).toBeTruthy();
    expect(entry.path).toContain('/export');
  });
});
