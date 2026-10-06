const { escapeRegex } = require('../../../src/utils/escapeRegex');

describe('escapeRegex', () => {
  test('escapes regex special characters', () => {
    expect(escapeRegex('a.b*c+d')).toBe('a\\.b\\*c\\+d');
    expect(escapeRegex('194657')).toBe('194657');
  });

  test('escapes injection attempts', () => {
    const escaped = escapeRegex('.*');
    expect(new RegExp(escaped).test('anything')).toBe(false);
    expect(new RegExp(escaped).test('.*')).toBe(true);
  });

  test('coerces non-string input', () => {
    expect(escapeRegex(123)).toBe('123');
  });
});
