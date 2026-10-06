const {
  drilldownSchema,
  townshipReportSchema,
  exportSchema
} = require('../../../src/validators/report.validator');

const parseDrilldown = (query) => drilldownSchema.parse({ query });
const parseTownship = (query = {}, params = { tspCode: 'MMR010031' }) =>
  townshipReportSchema.parse({ params, query });
const parseExport = (query = {}, params = { tspCode: 'MMR010031' }) =>
  exportSchema.parse({ params, query });

describe('drilldownSchema (D-22/D-24)', () => {
  test('requires level', () => {
    expect(() => parseDrilldown({})).toThrow();
    expect(() => parseDrilldown({ level: 'country' })).toThrow();
  });

  test('applies defaults for type/page/per_page', () => {
    const parsed = parseDrilldown({ level: 'township' });
    expect(parsed.query).toMatchObject({ level: 'township', type: 'bigAnimals', page: 1, per_page: 20 });
  });

  test('coerces page and per_page', () => {
    const parsed = parseDrilldown({ level: 'household', wvCode: '194657', page: '3', per_page: '50' });
    expect(parsed.query.page).toBe(3);
    expect(parsed.query.per_page).toBe(50);
  });

  test('rejects out-of-range pagination', () => {
    expect(() => parseDrilldown({ level: 'township', page: '0' })).toThrow();
    expect(() => parseDrilldown({ level: 'township', per_page: '101' })).toThrow();
  });

  test('level=village requires tspCode; level=household requires wvCode', () => {
    expect(() => parseDrilldown({ level: 'village' })).toThrow();
    expect(parseDrilldown({ level: 'village', tspCode: 'MMR010031' }).query.tspCode).toBe('MMR010031');
    expect(() => parseDrilldown({ level: 'household' })).toThrow();
    expect(parseDrilldown({ level: 'household', wvCode: '194657' }).query.wvCode).toBe('194657');
  });

  test('rejects invalid location codes (regex injection)', () => {
    expect(() => parseDrilldown({ level: 'village', tspCode: '../etc' })).toThrow();
    expect(() => parseDrilldown({ level: 'household', wvCode: '$ne=1' })).toThrow();
  });

  test('age enums validated per type (D-24/D-55)', () => {
    expect(() => parseDrilldown({ level: 'township', ageFrom: 'Nope' })).toThrow();
    expect(() => parseDrilldown({ level: 'township', type: 'poultry', ageFrom: 'Over3' })).toThrow();
    expect(() => parseDrilldown({ level: 'township', type: 'bigAnimals', ageFrom: 'Old' })).toThrow();
    expect(() => parseDrilldown({ level: 'township', type: 'smallAnimals', ageFrom: 'LessThanOne' })).toThrow();
    expect(
      parseDrilldown({ level: 'township', type: 'poultry', ageFrom: 'Young', ageTo: 'Old' }).query.ageTo
    ).toBe('Old');
    expect(
      parseDrilldown({ level: 'township', type: 'smallAnimals', ageFrom: 'Under2months', ageTo: 'Over6months' })
        .query.ageTo
    ).toBe('Over6months');
    expect(() => parseDrilldown({ level: 'township', ageFrom: 'Over3', ageTo: 'LessThanOne' })).toThrow();
    expect(() => parseDrilldown({ level: 'township', type: 'smallAnimals', ageFrom: 'Over6months', ageTo: 'Under2months' })).toThrow();
  });

  test('sex enum depends on type', () => {
    expect(parseDrilldown({ level: 'township', sex: 'ca_male' }).query.sex).toBe('ca_male');
    expect(() => parseDrilldown({ level: 'township', type: 'poultry', sex: 'ca_male' })).toThrow();
    expect(() => parseDrilldown({ level: 'township', sex: 'unknown' })).toThrow();
  });

  test('type whitelist blocks unknown field paths (D-24)', () => {
    expect(() => parseDrilldown({ level: 'township', type: 'password' })).toThrow();
  });

  test('categoryId coerced to positive int', () => {
    expect(parseDrilldown({ level: 'township', categoryId: '3' }).query.categoryId).toBe(3);
    expect(() => parseDrilldown({ level: 'township', categoryId: '-1' })).toThrow();
    expect(() => parseDrilldown({ level: 'township', categoryId: '1.5' })).toThrow();
  });

  test('from/to coerced to Date, empty string ignored, range checked', () => {
    const parsed = parseDrilldown({ level: 'township', from: '2026-01-01', to: '2026-01-31' });
    expect(parsed.query.from).toBeInstanceOf(Date);
    expect(parsed.query.to).toBeInstanceOf(Date);
    expect(parseDrilldown({ level: 'township', from: '' }).query.from).toBeUndefined();
    expect(() => parseDrilldown({ level: 'township', from: 'not-a-date' })).toThrow();
    expect(() =>
      parseDrilldown({ level: 'township', from: '2026-02-01', to: '2026-01-01' })
    ).toThrow();
  });
});

describe('townshipReportSchema / exportSchema', () => {
  test('accepts valid tspCode with empty query', () => {
    expect(parseTownship().params.tspCode).toBe('MMR010031');
    expect(parseExport().query).toEqual({});
  });

  test('rejects invalid tspCode', () => {
    expect(() => parseTownship({}, { tspCode: 'MMR/../' })).toThrow();
    expect(() => parseExport({}, { tspCode: '' })).toThrow();
  });

  test('validates from/to range', () => {
    expect(() => parseTownship({ from: '2026-02-01', to: '2026-01-01' })).toThrow();
    expect(() => parseExport({ from: '2026-02-01', to: '2026-01-01' })).toThrow();
    expect(parseExport({ from: '2026-01-01' }).query.from).toBeInstanceOf(Date);
  });
});
