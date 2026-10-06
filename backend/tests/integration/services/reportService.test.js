const reportService = require('../../../src/services/reportService');
const SurveySummary = require('../../../src/models/SurveySummary');
const { seedReportData, REPORT_TSP_A, REPORT_DISTRICT, OTHER_TSP, OTHER_DISTRICT, WV_A } = require('../../helpers/seedReports');
const { setupTestApp, teardownTestApp, clearDb, clearRedis } = require('../../helpers/testApp');

let app;

const DISTRICT_USER = { role: 'district', districtCode: REPORT_DISTRICT };
const OTHER_DISTRICT_USER = { role: 'district', districtCode: OTHER_DISTRICT };

beforeAll(async () => {
  app = await setupTestApp();
});

afterAll(async () => {
  await teardownTestApp();
});

beforeEach(async () => {
  await clearDb();
  await clearRedis(app);
  await seedReportData();
});

describe('getDistrictReport — summaries fast path (§9.1 row 1)', () => {
  test('totals equal rebuild output and exclude other district', async () => {
    const report = await reportService.getDistrictReport(REPORT_DISTRICT);
    expect(report.districtCode).toBe(REPORT_DISTRICT);
    expect(report.totalSurveys).toBe(4);
    expect(report.totalHouseholds).toBe(4);
    expect(report.totalBigAnimals).toBe(21);
    expect(report.totalSmallAnimals).toBe(8);
    expect(report.totalPoultry).toBe(26);
    expect(report.totalBreedingAnimals).toBe(6);
    expect(report.byTownship).toEqual([
      {
        tspCode: REPORT_TSP_A,
        totalSurveys: 3,
        totalBigAnimals: 17,
        totalSmallAnimals: 7,
        totalPoultry: 24,
        totalBreedingAnimals: 6
      },
      {
        tspCode: 'MMR010028',
        totalSurveys: 1,
        totalBigAnimals: 4,
        totalSmallAnimals: 1,
        totalPoultry: 2,
        totalBreedingAnimals: 0
      }
    ]);
  });

  test('other district only sees its own summaries', async () => {
    const report = await reportService.getDistrictReport(OTHER_DISTRICT);
    expect(report.totalSurveys).toBe(1);
    expect(report.totalBigAnimals).toBe(999);
    expect(report.byTownship).toHaveLength(1);
    expect(report.byTownship[0].tspCode).toBe(OTHER_TSP);
  });

  test('district with no data yields zeros', async () => {
    const report = await reportService.getDistrictReport('MMR9999');
    expect(report).toMatchObject({ totalSurveys: 0, totalBigAnimals: 0, byTownship: [] });
  });

  test('legacy summary doc without totalBreedingAnimals yields 0 not NaN', async () => {
    await SurveySummary.collection.updateMany(
      { tspCode: REPORT_TSP_A },
      { $unset: { totalBreedingAnimals: '' } }
    );
    const report = await reportService.getDistrictReport(REPORT_DISTRICT);
    expect(Number.isFinite(report.totalBreedingAnimals)).toBe(true);
    expect(report.totalBreedingAnimals).toBe(0);
    expect(report.totalBigAnimals).toBe(21);
    expect(report.byTownship.every((row) => Number.isFinite(row.totalBreedingAnimals))).toBe(true);
  });
});

describe('getTownshipReport — direct aggregation (§9.1 row 2)', () => {
  test('totals, avgAge and village breakdown', async () => {
    const report = await reportService.getTownshipReport(REPORT_TSP_A);
    expect(report.tspCode).toBe(REPORT_TSP_A);
    expect(report.totalSurveys).toBe(3);
    expect(report.totalHouseholds).toBe(3);
    expect(report.avgAge).toBe(50);
    expect(report.totalBigAnimals).toBe(17);
    expect(report.totalSmallAnimals).toBe(7);
    expect(report.totalPoultry).toBe(24);
    expect(report.totalBreedingAnimals).toBe(6);
    expect(report.villages).toEqual([
      {
        wvCode: WV_A,
        totalSurveys: 2,
        totalBigAnimals: 14,
        totalSmallAnimals: 6,
        totalPoultry: 16,
        totalBreedingAnimals: 5
      },
      {
        wvCode: '194660',
        totalSurveys: 1,
        totalBigAnimals: 3,
        totalSmallAnimals: 1,
        totalPoultry: 8,
        totalBreedingAnimals: 1
      }
    ]);
  });

  test('from/to (ansDate) narrows the report (D-22)', async () => {
    const report = await reportService.getTownshipReport(REPORT_TSP_A, {
      from: new Date('2026-01-01'),
      to: new Date('2026-02-15')
    });
    expect(report.totalSurveys).toBe(2);
    expect(report.avgAge).toBe(45);
    expect(report.totalBigAnimals).toBe(14);
    expect(report.villages).toHaveLength(1);
    expect(report.villages[0].wvCode).toBe(WV_A);
  });

  test('empty township yields zero rows', async () => {
    const report = await reportService.getTownshipReport('MMR010099');
    expect(report.totalSurveys).toBe(0);
    expect(report.avgAge).toBeNull();
    expect(report.villages).toEqual([]);
  });
});

describe('village animal count — direct vs summary fast path (§9.1 rows 3/4)', () => {
  test('direct and fast agree for full and partial filters', async () => {
    expect(await reportService.getVillageAnimalCount(WV_A)).toBe(14);
    expect(await reportService.getVillageAnimalCountFast(WV_A)).toBe(14);

    expect(await reportService.getVillageAnimalCount(WV_A, { categoryId: 1 })).toBe(7);
    expect(await reportService.getVillageAnimalCountFast(WV_A, { categoryId: 1 })).toBe(7);

    expect(await reportService.getVillageAnimalCount(WV_A, { ageLimit: 'LessThanOne' })).toBe(7);
    expect(await reportService.getVillageAnimalCountFast(WV_A, { ageLimit: 'LessThanOne' })).toBe(7);

    expect(
      await reportService.getVillageAnimalCount(WV_A, {
        categoryId: 1,
        ageLimit: 'LessThanOne',
        sex: 'male'
      })
    ).toBe(2);
    expect(
      await reportService.getVillageAnimalCountFast(WV_A, {
        categoryId: 1,
        ageLimit: 'LessThanOne',
        sex: 'male'
      })
    ).toBe(2);

    expect(await reportService.getVillageAnimalCount(WV_A, { sex: 'female' })).toBe(12);
    expect(await reportService.getVillageAnimalCountFast(WV_A, { sex: 'female' })).toBe(12);
  });

  test('supports type=smallAnimals', async () => {
    expect(await reportService.getVillageAnimalCount(WV_A, { type: 'smallAnimals' })).toBe(6);
    expect(await reportService.getVillageAnimalCountFast(WV_A, {}, 'smallAnimals')).toBe(6);
    expect(
      await reportService.getVillageAnimalCount(WV_A, {
        type: 'smallAnimals',
        categoryId: 3,
        ageLimit: 'Between2and6months',
        sex: 'male'
      })
    ).toBe(4);
    expect(
      await reportService.getVillageAnimalCountFast(
        WV_A,
        { categoryId: 3, ageLimit: 'Between2and6months', sex: 'male' },
        'smallAnimals'
      )
    ).toBe(4);
  });

  test('unknown village returns 0 on both paths', async () => {
    expect(await reportService.getVillageAnimalCount('000000')).toBe(0);
    expect(await reportService.getVillageAnimalCountFast('000000')).toBe(0);
  });

  test('getVillageBreakdown groups by ageLimit/sex', async () => {
    const rows = await reportService.getVillageBreakdown(WV_A, 1);
    expect(rows).toEqual([
      { ageLimit: 'LessThanOne', sex: 'female', total: 5 },
      { ageLimit: 'LessThanOne', sex: 'male', total: 2 }
    ]);
    expect(await reportService.getVillageBreakdown(WV_A, 99)).toEqual([]);
  });

  test('breeding breakdown rows carry ageLimit: null (missing path)', async () => {
    const rows = await reportService.getVillageBreakdown(WV_A, 1, 'breedingAnimals');
    expect(rows).toEqual([{ ageLimit: null, sex: 'male', total: 3 }]);
    const otherVillage = await reportService.getVillageBreakdown('000000', 1, 'breedingAnimals');
    expect(otherVillage).toEqual([]);
  });
});

describe('drillToTownship / drillToVillage (§9.1 rows 5/6)', () => {
  test('L1 fast path (no filters) totals match summaries', async () => {
    const rows = await reportService.drillToTownship(DISTRICT_USER, { level: 'township' });
    expect(rows).toEqual([
      { tspCode: REPORT_TSP_A, households: 3, total: 17, male: 2, female: 12 },
      { tspCode: 'MMR010028', households: 1, total: 4, male: 0, female: 4 }
    ]);
  });

  test('L1 direct path (filtered) equals expected aggregation', async () => {
    const rows = await reportService.drillToTownship(DISTRICT_USER, { categoryId: 1 });
    expect(rows).toEqual([
      { tspCode: REPORT_TSP_A, households: 2, total: 7, male: 2, female: 5 },
      { tspCode: 'MMR010028', households: 1, total: 4, male: 0, female: 4 }
    ]);
  });

  test('L1 fast path equals direct path when all counted surveys in range', async () => {
    const fast = await reportService.drillToTownship(DISTRICT_USER, { type: 'bigAnimals' });
    const direct = await reportService.drillToTownship(DISTRICT_USER, {
      type: 'bigAnimals',
      from: new Date('2026-01-01'),
      to: new Date('2026-12-31')
    });
    expect(fast).toEqual(direct);
  });

  test('L1 excludes other district', async () => {
    const rows = await reportService.drillToTownship(OTHER_DISTRICT_USER, {});
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ tspCode: OTHER_TSP, total: 999, male: 999 });
  });

  test('L2 fast and direct agree', async () => {
    const fast = await reportService.drillToVillage(DISTRICT_USER, REPORT_TSP_A, {});
    expect(fast).toEqual([
      { wvCode: WV_A, households: 2, total: 14 },
      { wvCode: '194660', households: 1, total: 3 }
    ]);
    const direct = await reportService.drillToVillage(DISTRICT_USER, REPORT_TSP_A, {
      from: new Date('2026-01-01')
    });
    expect(direct).toEqual(fast);
  });

  test('L2 filtered by categoryId', async () => {
    const rows = await reportService.drillToVillage(DISTRICT_USER, REPORT_TSP_A, { categoryId: 2 });
    expect(rows).toEqual([
      { wvCode: WV_A, households: 1, total: 7 },
      { wvCode: '194660', households: 1, total: 3 }
    ]);
  });

  test('L2 rejects cross-district township on both paths', async () => {
    expect(await reportService.drillToVillage(DISTRICT_USER, OTHER_TSP, {})).toEqual([]);
    expect(
      await reportService.drillToVillage(DISTRICT_USER, OTHER_TSP, { categoryId: 1 })
    ).toEqual([]);
  });
});

describe('drillToHousehold (§9.1 row 7)', () => {
  test('returns households with byAge and meta', async () => {
    const result = await reportService.drillToHousehold(DISTRICT_USER, WV_A, { level: 'household' }, 1, 20);
    expect(result.meta).toEqual({ total: 2, page: 1, per_page: 20, total_pages: 1 });
    expect(result.data).toHaveLength(2);
    expect(result.data[0]).toMatchObject({ surveyId: 1, hName: 'အိမ်တစ်', total: 9, male: 2, female: 7 });
    expect(result.data[0].byAge).toEqual([
      { ageLimit: 'LessThanOne', sex: 'male', count: 2 },
      { ageLimit: 'Over3', sex: 'female', count: 7 }
    ]);
    expect(result.data[1]).toMatchObject({ surveyId: 2, total: 5, male: 0, female: 5 });
  });

  test('paginates and sorts by total desc', async () => {
    const page1 = await reportService.drillToHousehold(DISTRICT_USER, WV_A, {}, 1, 1);
    expect(page1.data).toHaveLength(1);
    expect(page1.data[0].surveyId).toBe(1);
    expect(page1.meta).toEqual({ total: 2, page: 1, per_page: 1, total_pages: 2 });

    const page2 = await reportService.drillToHousehold(DISTRICT_USER, WV_A, {}, 2, 1);
    expect(page2.data).toHaveLength(1);
    expect(page2.data[0].surveyId).toBe(2);
    expect(page2.meta.total).toBe(2);
  });

  test('category + age range filters apply per element', async () => {
    const cat2 = await reportService.drillToHousehold(DISTRICT_USER, WV_A, { categoryId: 2 });
    expect(cat2.meta.total).toBe(1);
    expect(cat2.data).toEqual([
      expect.objectContaining({ surveyId: 1, total: 7 })
    ]);

    const ageOnly = await reportService.drillToHousehold(DISTRICT_USER, WV_A, {
      ageFrom: 'LessThanOne',
      ageTo: 'LessThanOne'
    });
    expect(ageOnly.meta.total).toBe(2);

    const conjunction = await reportService.drillToHousehold(DISTRICT_USER, WV_A, {
      categoryId: 2,
      ageFrom: 'LessThanOne',
      ageTo: 'LessThanOne'
    });
    expect(conjunction.meta.total).toBe(0);
    expect(conjunction.data).toEqual([]);
  });

  test('from/to filters by ansDate (D-22)', async () => {
    const result = await reportService.drillToHousehold(DISTRICT_USER, WV_A, {
      from: new Date('2026-02-01')
    });
    expect(result.meta.total).toBe(1);
    expect(result.data[0].surveyId).toBe(2);
  });

  test('type=smallAnimals uses small array', async () => {
    const result = await reportService.drillToHousehold(DISTRICT_USER, WV_A, { type: 'smallAnimals' });
    expect(result.meta.total).toBe(2);
    expect(result.data[0].total).toBe(4);
    expect(result.data[1].total).toBe(2);
  });

  test('excludes submitted, deleted and other-district surveys', async () => {
    const result = await reportService.drillToHousehold(DISTRICT_USER, WV_A, {});
    const surveyIds = result.data.map((row) => row.surveyId);
    expect(surveyIds).not.toContain(4);
    expect(surveyIds).not.toContain(5);
    expect(result.meta.total).toBe(2);
  });
});

describe('buildAnimalFilter (D-24 age rank map)', () => {
  test('builds $in range instead of $gte/$lte on enum strings', () => {
    expect(reportService.buildAnimalFilter({ ageFrom: 'Between1and3', ageTo: 'Over3' })).toEqual({
      'bigAnimals.ageLimit': { $in: ['Between1and3', 'Over3'] }
    });
    expect(reportService.buildAnimalFilter({ type: 'poultry', ageTo: 'Young' })).toEqual({
      'poultry.ageLimit': { $in: ['Young'] }
    });
    expect(
      reportService.buildAnimalFilter({ type: 'smallAnimals', ageFrom: 'Between2and6months', ageTo: 'Over6months' })
    ).toEqual({
      'smallAnimals.ageLimit': { $in: ['Between2and6months', 'Over6months'] }
    });
  });

  test('includes categoryId and sex when provided', () => {
    expect(reportService.buildAnimalFilter({ categoryId: '2', sex: 'female' })).toEqual({
      'bigAnimals.categoryId': 2,
      'bigAnimals.sex': 'female'
    });
  });

  test('empty query yields empty match', () => {
    expect(reportService.buildAnimalFilter()).toEqual({});
  });
});
