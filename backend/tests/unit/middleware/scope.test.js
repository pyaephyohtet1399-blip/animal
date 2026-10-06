const { buildSurveyScope, inScope } = require('../../../src/middleware/scope');

const district = { role: 'district', districtCode: 'MMR0100' };
const township = { role: 'township', districtCode: 'MMR0100', tspCode: 'MMR010031' };
const village = {
  role: 'village',
  districtCode: 'MMR0100',
  tspCode: 'MMR010031',
  wvCode: '194657'
};

describe('buildSurveyScope', () => {
  test('district sees everything', () => {
    expect(buildSurveyScope(district)).toEqual({});
  });

  test('township scoped to own tspCode', () => {
    expect(buildSurveyScope(township)).toEqual({ tspCode: 'MMR010031' });
  });

  test('village scoped to own wvCode', () => {
    expect(buildSurveyScope(village)).toEqual({ wvCode: '194657' });
  });

  test('missing user returns empty scope', () => {
    expect(buildSurveyScope(undefined)).toEqual({});
  });
});

describe('inScope', () => {
  const otherVillageDoc = { tspCode: 'MMR010031', wvCode: '194660' };
  const ownDoc = { tspCode: 'MMR010031', wvCode: '194657' };
  const otherTownshipDoc = { tspCode: 'MMR010028', wvCode: '194660' };

  test('district access to any doc', () => {
    expect(inScope(district, otherVillageDoc)).toBe(true);
    expect(inScope(district, otherTownshipDoc)).toBe(true);
  });

  test('township access limited to own tspCode', () => {
    expect(inScope(township, ownDoc)).toBe(true);
    expect(inScope(township, otherTownshipDoc)).toBe(false);
  });

  test('village access limited to own wvCode', () => {
    expect(inScope(village, ownDoc)).toBe(true);
    expect(inScope(village, otherVillageDoc)).toBe(false);
    expect(inScope(village, otherTownshipDoc)).toBe(false);
  });
});
