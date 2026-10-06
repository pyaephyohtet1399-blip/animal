const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { generateTokens, verifyAccessToken, verifyRefreshToken, hashToken } = require('../../../src/utils/jwt');

const buildUser = (overrides = {}) => ({
  _id: new mongoose.Types.ObjectId(),
  loginCode: '194657',
  role: 'village',
  districtCode: 'MMR0100',
  tspCode: 'MMR010031',
  tvgCode: 'MMR010031047',
  wvCode: '194657',
  mustChangePassword: true,
  ...overrides
});

describe('generateTokens', () => {
  test('access token contains full D-26 claims', () => {
    const user = buildUser();
    const { accessToken } = generateTokens(user);
    const payload = verifyAccessToken(accessToken);
    expect(payload.userId).toBe(String(user._id));
    expect(payload.loginCode).toBe('194657');
    expect(payload.role).toBe('village');
    expect(payload.districtCode).toBe('MMR0100');
    expect(payload.tspCode).toBe('MMR010031');
    expect(payload.tvgCode).toBe('MMR010031047');
    expect(payload.wvCode).toBe('194657');
    expect(payload.mustChangePassword).toBe(true);
  });

  test('district user has null location claims', () => {
    const user = buildUser({
      loginCode: 'MMR0100',
      role: 'district',
      tspCode: undefined,
      tvgCode: undefined,
      wvCode: undefined
    });
    const { accessToken } = generateTokens(user);
    const payload = verifyAccessToken(accessToken);
    expect(payload.role).toBe('district');
    expect(payload.tspCode).toBeNull();
    expect(payload.tvgCode).toBeNull();
    expect(payload.wvCode).toBeNull();
  });

  test('access TTL 15m and refresh TTL 7d', () => {
    const { accessToken, refreshToken } = generateTokens(buildUser());
    const access = jwt.decode(accessToken);
    const refresh = jwt.decode(refreshToken);
    expect(access.exp - access.iat).toBe(900);
    expect(refresh.exp - refresh.iat).toBe(7 * 24 * 60 * 60);
  });

  test('refresh token only carries userId', () => {
    const user = buildUser();
    const { refreshToken } = generateTokens(user);
    const payload = verifyRefreshToken(refreshToken);
    expect(payload.userId).toBe(String(user._id));
    expect(payload).not.toHaveProperty('role');
    expect(payload).not.toHaveProperty('wvCode');
  });

  test('rejects tampered access token', () => {
    const { accessToken } = generateTokens(buildUser());
    expect(() => verifyAccessToken(`${accessToken}x`)).toThrow();
    expect(() => verifyAccessToken(accessToken.replace(/.$/, 'x'))).toThrow();
  });

  test('rejects access token verified with refresh secret', () => {
    const { accessToken } = generateTokens(buildUser());
    expect(() => verifyRefreshToken(accessToken)).toThrow();
  });
});

describe('hashToken', () => {
  test('is deterministic sha256 hex', () => {
    const a = hashToken('abc');
    expect(a).toBe(hashToken('abc'));
    expect(a).toMatch(/^[a-f0-9]{64}$/);
    expect(hashToken('abd')).not.toBe(a);
  });
});
