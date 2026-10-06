const { createSurveySchema, listQuerySchema } = require('../../../src/validators/survey.validator');
const { drilldownSchema } = require('../../../src/validators/report.validator');

const baseBody = {
  hName: 'ဦးအောင်',
  hEdu: 'ဘွဲ့',
  hGender: 'အထီး',
  hPhone: '0912345678',
  hAge: 45,
  ansDate: '2026-01-15'
};

describe('surveyBodySchema breeding shape (D-54)', () => {
  test('accepts male/female entries without ageLimit', () => {
    const result = createSurveySchema.safeParse({
      body: {
        ...baseBody,
        breedingAnimals: [{ categoryId: 1, sex: 'male', count: 3 }]
      }
    });
    expect(result.success).toBe(true);
    expect(result.data.body.breedingAnimals).toEqual([{ categoryId: 1, sex: 'male', count: 3 }]);
  });

  test('defaults breedingAnimals to [] when absent', () => {
    const result = createSurveySchema.safeParse({ body: baseBody });
    expect(result.success).toBe(true);
    expect(result.data.body.breedingAnimals).toEqual([]);
  });

  test('rejects ca_male sex for breeding', () => {
    const result = createSurveySchema.safeParse({
      body: {
        ...baseBody,
        breedingAnimals: [{ categoryId: 1, sex: 'ca_male', count: 1 }]
      }
    });
    expect(result.success).toBe(false);
  });

  test('rejects negative count for breeding', () => {
    const result = createSurveySchema.safeParse({
      body: {
        ...baseBody,
        breedingAnimals: [{ categoryId: 1, sex: 'female', count: -1 }]
      }
    });
    expect(result.success).toBe(false);
  });
});

describe('listQuerySchema hasBreeding filter (D-54)', () => {
  test('parses hasBreeding=true/false', () => {
    expect(listQuerySchema.parse({ query: { hasBreeding: 'true' } }).query.hasBreeding).toBe(true);
    expect(listQuerySchema.parse({ query: { hasBreeding: 'false' } }).query.hasBreeding).toBe(false);
  });

  test('rejects invalid hasBreeding value', () => {
    expect(listQuerySchema.safeParse({ query: { hasBreeding: 'yes' } }).success).toBe(false);
  });
});

describe('drilldownSchema breeding rules (D-54)', () => {
  const base = { level: 'township', type: 'breedingAnimals' };

  test('accepts type=breedingAnimals without age params', () => {
    expect(drilldownSchema.safeParse({ query: { ...base } }).success).toBe(true);
    expect(
      drilldownSchema.safeParse({ query: { ...base, categoryId: 2, sex: 'female' } }).success
    ).toBe(true);
  });

  test('rejects ageFrom/ageTo for breeding', () => {
    expect(drilldownSchema.safeParse({ query: { ...base, ageFrom: 'LessThanOne' } }).success).toBe(
      false
    );
    expect(drilldownSchema.safeParse({ query: { ...base, ageTo: 'Over3' } }).success).toBe(false);
  });

  test('rejects ca_male sex for breeding but allows it for bigAnimals', () => {
    expect(drilldownSchema.safeParse({ query: { ...base, sex: 'ca_male' } }).success).toBe(false);
    expect(
      drilldownSchema.safeParse({
        query: { level: 'township', type: 'bigAnimals', sex: 'ca_male' }
      }).success
    ).toBe(true);
  });
});
