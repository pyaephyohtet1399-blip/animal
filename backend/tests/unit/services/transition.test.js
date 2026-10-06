const {
  assertTransition,
  isCounted
} = require('../../../src/services/surveyService');

describe('assertTransition', () => {
  test('allows draft → submitted by village', () => {
    expect(() => assertTransition('draft', 'submitted', 'village')).not.toThrow();
  });

  test('rejects submit by township', () => {
    expect(() => assertTransition('draft', 'submitted', 'township')).toThrow(
      expect.objectContaining({ statusCode: 409, code: 'invalid_transition' })
    );
  });

  test('rejects submit by district', () => {
    expect(() => assertTransition('draft', 'submitted', 'district')).toThrow(
      expect.objectContaining({ statusCode: 409, code: 'invalid_transition' })
    );
  });

  test('rejects unknown transition', () => {
    expect(() => assertTransition('submitted', 'draft', 'village')).toThrow(
      expect.objectContaining({ statusCode: 409, code: 'invalid_transition' })
    );
  });
});

describe('isCounted (D-38 v3)', () => {
  test('submitted is counted', () => {
    expect(isCounted('submitted')).toBe(true);
  });

  test('draft is not counted', () => {
    expect(isCounted('draft')).toBe(false);
  });
});
