const { buildSummaryInc, sumArray } = require('../../../src/services/summaryService');

const surveyFixture = {
  tspCode: 'MMR010031',
  wvCode: '194657',
  bigAnimals: [
    { categoryId: 1, ageLimit: 'LessThanOne', sex: 'male', count: 2 },
    { categoryId: 1, ageLimit: 'Over3', sex: 'ca_male', count: 3 },
    { categoryId: 2, ageLimit: 'Between1and3', sex: 'female', count: 5 }
  ],
  smallAnimals: [{ categoryId: 3, ageLimit: 'Under2months', sex: 'female', count: 4 }],
  poultry: [{ categoryId: 1, ageLimit: 'Old', sex: 'male', count: 10 }]
};

describe('sumArray', () => {
  test('sums counts', () => {
    expect(sumArray(surveyFixture.bigAnimals)).toBe(10);
  });
  test('handles empty/undefined', () => {
    expect(sumArray([])).toBe(0);
    expect(sumArray(undefined)).toBe(0);
  });
});

describe('buildSummaryInc (+1)', () => {
  test('builds totals and dotted breakdown keys', () => {
    const inc = buildSummaryInc(surveyFixture, 1);
    expect(inc.totalSurveys).toBe(1);
    expect(inc.totalBigAnimals).toBe(10);
    expect(inc.totalSmallAnimals).toBe(4);
    expect(inc.totalPoultry).toBe(10);
    expect(inc['bigBreakdown.1:LessThanOne:male']).toBe(2);
    expect(inc['bigBreakdown.1:Over3:ca_male']).toBe(3);
    expect(inc['bigBreakdown.2:Between1and3:female']).toBe(5);
    expect(inc['smallBreakdown.3:Under2months:female']).toBe(4);
    expect(inc['poultryBreakdown.1:Old:male']).toBe(10);
  });

  test('merges duplicate category entries under one key', () => {
    const survey = {
      tspCode: 'a',
      wvCode: 'b',
      bigAnimals: [
        { categoryId: 1, ageLimit: 'LessThanOne', sex: 'male', count: 2 },
        { categoryId: 1, ageLimit: 'LessThanOne', sex: 'male', count: 3 }
      ],
      smallAnimals: [],
      poultry: []
    };
    const inc = buildSummaryInc(survey, 1);
    expect(inc['bigBreakdown.1:LessThanOne:male']).toBe(5);
    expect(inc.totalBigAnimals).toBe(5);
  });
});

describe('buildSummaryInc (-1)', () => {
  test('negates all values', () => {
    const inc = buildSummaryInc(surveyFixture, -1);
    expect(inc.totalSurveys).toBe(-1);
    expect(inc.totalBigAnimals).toBe(-10);
    expect(inc['bigBreakdown.1:LessThanOne:male']).toBe(-2);
    expect(inc['poultryBreakdown.1:Old:male']).toBe(-10);
  });

  test('+1 and -1 are exact inverses', () => {
    expect(buildSummaryInc(surveyFixture, 1)).toEqual(
      Object.fromEntries(
        Object.entries(buildSummaryInc(surveyFixture, -1)).map(([k, v]) => [k, -v])
      )
    );
  });
});

describe('buildSummaryInc (empty arrays)', () => {
  test('still increments totalSurveys', () => {
    const inc = buildSummaryInc(
      { tspCode: 'a', wvCode: 'b', bigAnimals: [], smallAnimals: [], poultry: [], breedingAnimals: [] },
      1
    );
    expect(inc.totalSurveys).toBe(1);
    expect(inc.totalBigAnimals).toBe(0);
    expect(inc.totalBreedingAnimals).toBe(0);
    expect(Object.keys(inc)).toHaveLength(5);
  });
});

describe('buildSummaryInc breeding (D-54)', () => {
  test('uses 2-part categoryId:sex breakdown keys and sums totals', () => {
    const inc = buildSummaryInc(
      {
        tspCode: 'a',
        wvCode: 'b',
        breedingAnimals: [
          { categoryId: 1, sex: 'male', count: 3 },
          { categoryId: 1, sex: 'female', count: 2 },
          { categoryId: 4, sex: 'male', count: 5 }
        ]
      },
      1
    );
    expect(inc.totalBreedingAnimals).toBe(10);
    expect(inc['breedingBreakdown.1:male']).toBe(3);
    expect(inc['breedingBreakdown.1:female']).toBe(2);
    expect(inc['breedingBreakdown.4:male']).toBe(5);
    const breedingKeys = Object.keys(inc).filter((k) => k.startsWith('breedingBreakdown'));
    expect(breedingKeys).toHaveLength(3);
    expect(inc['bigBreakdown.1:LessThanOne:male']).toBeUndefined();
  });

  test('-1 reverses breeding deltas exactly', () => {
    const survey = {
      tspCode: 'a',
      wvCode: 'b',
      breedingAnimals: [{ categoryId: 1, sex: 'female', count: 7 }]
    };
    expect(buildSummaryInc(survey, 1)).toEqual(
      Object.fromEntries(Object.entries(buildSummaryInc(survey, -1)).map(([k, v]) => [k, -v]))
    );
  });
});
