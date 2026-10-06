const {
  genDefaultPassword,
  hashPassword,
  comparePassword,
  validateNewPassword
} = require('../../../src/utils/password');

describe('genDefaultPassword', () => {
  test('generates 10-char password from safe charset', () => {
    const password = genDefaultPassword();
    expect(password).toHaveLength(10);
    expect(password).toMatch(/^[abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789]{10}$/);
  });

  test('excludes ambiguous characters O, 0, l, 1, I', () => {
    const samples = Array.from({ length: 500 }, () => genDefaultPassword()).join('');
    expect(samples).not.toMatch(/[O0l1I]/);
  });

  test('supports custom length', () => {
    expect(genDefaultPassword(16)).toHaveLength(16);
  });

  test('produces unique values', () => {
    const set = new Set(Array.from({ length: 200 }, () => genDefaultPassword()));
    expect(set.size).toBe(200);
  });
});

describe('hashPassword / comparePassword', () => {
  test('roundtrip with bcrypt cost 12', async () => {
    const hash = await hashPassword('Secret123');
    expect(hash.startsWith('$2')).toBe(true);
    await expect(comparePassword('Secret123', hash)).resolves.toBe(true);
    await expect(comparePassword('Wrong123', hash)).resolves.toBe(false);
  });
});

describe('validateNewPassword', () => {
  test('accepts valid password', () => {
    expect(validateNewPassword('abcd1234', { oldPassword: 'oldPass1', loginCode: '194657' })).toEqual([]);
  });

  test('rejects password shorter than 8', () => {
    expect(validateNewPassword('abc1234')).toEqual(['Password must be between 8 and 64 characters']);
  });

  test('rejects password longer than 64', () => {
    expect(validateNewPassword(`a1${'x'.repeat(64)}`)).toEqual([
      'Password must be between 8 and 64 characters'
    ]);
  });

  test('rejects missing digit', () => {
    expect(validateNewPassword('abcdefgh')).toEqual(['Password must contain at least one digit']);
  });

  test('rejects missing letter', () => {
    expect(validateNewPassword('12345678')).toEqual(['Password must contain at least one letter']);
  });

  test('rejects reusing old password', () => {
    expect(validateNewPassword('abcd1234', { oldPassword: 'abcd1234' })).toEqual([
      'New password must differ from the old password'
    ]);
  });

  test('rejects password equal to loginCode case-insensitively', () => {
    expect(validateNewPassword('mmr010031', { loginCode: 'MMR010031' })).toEqual([
      'New password must not equal the login code'
    ]);
  });

  test('collects multiple violations', () => {
    const errors = validateNewPassword('12345678', {
      oldPassword: '12345678',
      loginCode: '12345678'
    });
    expect(errors).toHaveLength(3);
  });
});
