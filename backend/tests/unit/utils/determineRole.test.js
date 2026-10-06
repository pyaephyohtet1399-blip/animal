const { determineRole } = require('../../../src/utils/determineRole');

describe('determineRole', () => {
  test('district code → district', () => {
    expect(determineRole('MMR0100')).toBe('district');
  });

  test('township codes → township', () => {
    expect(determineRole('MMR010028')).toBe('township');
    expect(determineRole('MMR010031')).toBe('township');
  });

  test('numeric village pcode → village', () => {
    expect(determineRole('194657')).toBe('village');
    expect(determineRole('1234')).toBe('village');
    expect(determineRole('12345678')).toBe('village');
  });

  test('ward pcode → village', () => {
    expect(determineRole('MMR010031701504')).toBe('village');
  });
});
