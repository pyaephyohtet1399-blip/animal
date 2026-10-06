const {
  loginSchema,
  refreshSchema,
  changePasswordSchema,
  resetPasswordSchema
} = require('../../../src/validators/auth.validator');

describe('loginSchema', () => {
  test('normalizes loginCode with trim + uppercase', () => {
    const result = loginSchema.parse({ body: { loginCode: '  mmr010031 ', password: 'x' } });
    expect(result.body.loginCode).toBe('MMR010031');
  });

  test('accepts all valid loginCode formats', () => {
    ['194657', 'MMR0100', 'MMR010028', 'MMR010031701504'].forEach((loginCode) => {
      expect(() => loginSchema.parse({ body: { loginCode, password: 'x' } })).not.toThrow();
    });
  });

  test('rejects invalid loginCode formats', () => {
    ['ABC123', 'MMR010031701', 'toolong123456', '12', 'mmr-0100'].forEach((loginCode) => {
      expect(() => loginSchema.parse({ body: { loginCode, password: 'x' } })).toThrow();
    });
  });

  test('rejects missing password', () => {
    expect(() => loginSchema.parse({ body: { loginCode: '194657' } })).toThrow();
  });
});

describe('refreshSchema / logout body', () => {
  test('accepts refresh token', () => {
    const result = refreshSchema.parse({ body: { refreshToken: 'abc.def.ghi' } });
    expect(result.body.refreshToken).toBe('abc.def.ghi');
  });

  test('rejects empty refresh token', () => {
    expect(() => refreshSchema.parse({ body: { refreshToken: '' } })).toThrow();
  });
});

describe('changePasswordSchema', () => {
  test('accepts old + new password pair', () => {
    const result = changePasswordSchema.parse({
      body: { oldPassword: 'old1', newPassword: 'newPass123' }
    });
    expect(result.body.newPassword).toBe('newPass123');
  });

  test('rejects missing fields', () => {
    expect(() => changePasswordSchema.parse({ body: {} })).toThrow();
    expect(() => changePasswordSchema.parse({ body: { oldPassword: 'x' } })).toThrow();
  });
});

describe('resetPasswordSchema', () => {
  test('normalizes loginCode', () => {
    const result = resetPasswordSchema.parse({ body: { loginCode: ' 194657 ' } });
    expect(result.body.loginCode).toBe('194657');
  });

  test('rejects bad loginCode', () => {
    expect(() => resetPasswordSchema.parse({ body: { loginCode: 'nope' } })).toThrow();
  });
});
