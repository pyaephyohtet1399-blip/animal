const request = require('supertest');
const jwt = require('jsonwebtoken');
const User = require('../../../src/models/User');
const RefreshToken = require('../../../src/models/RefreshToken');
const AuditLog = require('../../../src/models/AuditLog');
const { hashPassword, comparePassword } = require('../../../src/utils/password');
const { setupTestApp, teardownTestApp, clearDb } = require('../../helpers/testApp');

let app;

const PASSWORDS = {
  district: 'District1pass',
  township: 'Township1pass',
  village: 'Village1pass',
  forced: 'Forced1pass',
  lockout: 'Lockout1pass',
  inactive: 'Inactive1pass',
  resetTarget: 'ResetTarget1pass'
};

const CODE_PASSWORDS = {
  MMR0100: PASSWORDS.district,
  MMR010031: PASSWORDS.township,
  '194657': PASSWORDS.village,
  '194660': PASSWORDS.forced,
  '194999': PASSWORDS.lockout,
  '194998': PASSWORDS.inactive,
  '194997': PASSWORDS.resetTarget
};

const users = [
  {
    loginCode: 'MMR0100',
    role: 'district',
    districtCode: 'MMR0100',
    isActive: true,
    mustChangePassword: false
  },
  {
    loginCode: 'MMR010031',
    role: 'township',
    districtCode: 'MMR0100',
    tspCode: 'MMR010031',
    isActive: true,
    mustChangePassword: false
  },
  {
    loginCode: '194657',
    role: 'village',
    districtCode: 'MMR0100',
    tspCode: 'MMR010031',
    tvgCode: 'MMR010031047',
    wvCode: '194657',
    isActive: true,
    mustChangePassword: false
  },
  {
    loginCode: '194660',
    role: 'village',
    districtCode: 'MMR0100',
    tspCode: 'MMR010031',
    tvgCode: 'MMR010031047',
    wvCode: '194660',
    isActive: true,
    mustChangePassword: true
  },
  {
    loginCode: '194999',
    role: 'village',
    districtCode: 'MMR0100',
    tspCode: 'MMR010031',
    tvgCode: 'MMR010031047',
    wvCode: '194999',
    isActive: true,
    mustChangePassword: false
  },
  {
    loginCode: '194998',
    role: 'village',
    districtCode: 'MMR0100',
    tspCode: 'MMR010031',
    tvgCode: 'MMR010031047',
    wvCode: '194998',
    isActive: false,
    mustChangePassword: false
  },
  {
    loginCode: '194997',
    role: 'village',
    districtCode: 'MMR0100',
    tspCode: 'MMR010031',
    tvgCode: 'MMR010031047',
    wvCode: '194997',
    isActive: true,
    mustChangePassword: false
  }
];

const insertUsers = async () => {
  const hashes = await Promise.all(users.map((user) => hashPassword(CODE_PASSWORDS[user.loginCode])));
  await User.insertMany(
    users.map((user, index) => ({ ...user, passwordHash: hashes[index] }))
  );
};

const login = (loginCode, password) =>
  request(app).post('/api/v1/auth/login').send({ loginCode, password });

beforeAll(async () => {
  app = await setupTestApp();
});

afterAll(async () => {
  await teardownTestApp();
});

beforeEach(async () => {
  await clearDb();
  await app.locals.redis.flushall();
  await insertUsers();
});

describe('POST /api/v1/auth/login', () => {
  test('village login returns tokens with full claims', async () => {
    const res = await login(' 194657 ', PASSWORDS.village);
    expect(res.status).toBe(200);
    expect(res.body.data.role).toBe('village');
    expect(res.body.data.mustChangePassword).toBe(false);
    expect(res.body.data.tokenType).toBe('Bearer');
    expect(res.body.data.expiresIn).toBe(900);
    expect(res.headers['cache-control']).toBe('no-store');
    expect(res.headers['x-ratelimit-limit']).toBeDefined();

    const payload = jwt.verify(res.body.data.accessToken, process.env.JWT_SECRET);
    expect(payload.loginCode).toBe('194657');
    expect(payload.role).toBe('village');
    expect(payload.districtCode).toBe('MMR0100');
    expect(payload.wvCode).toBe('194657');
    expect(payload.mustChangePassword).toBe(false);
  });

  test('normalization accepts lowercase township and district codes', async () => {
    const townshipRes = await login(' mmr010031 ', PASSWORDS.township);
    expect(townshipRes.status).toBe(200);
    expect(townshipRes.body.data.role).toBe('township');

    const districtRes = await login('mmr0100', PASSWORDS.district);
    expect(districtRes.status).toBe(200);
    expect(districtRes.body.data.role).toBe('district');
    const payload = jwt.verify(districtRes.body.data.accessToken, process.env.JWT_SECRET);
    expect(payload.tspCode).toBeNull();
  });

  test('rejects wrong password, unknown and inactive users with 401', async () => {
    const wrong = await login('194657', 'Nope12345');
    expect(wrong.status).toBe(401);
    expect(wrong.body.error.code).toBe('unauthorized');

    const unknown = await login('194656', 'Whatever1');
    expect(unknown.status).toBe(401);

    const inactive = await login('194998', PASSWORDS.inactive);
    expect(inactive.status).toBe(401);
  });

  test('writes audit logs for login success and failure', async () => {
    await login('194657', PASSWORDS.village);
    await login('194657', 'Wrong1234');

    const success = await AuditLog.findOne({ action: 'login_success' });
    expect(success).toBeTruthy();
    expect(success.role).toBe('village');
    expect(success.status).toBe(200);

    const fail = await AuditLog.findOne({ action: 'login_fail' });
    expect(fail).toBeTruthy();
    expect(fail.status).toBe(401);
  });

  test('invalid body returns 422 validation_error', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ loginCode: 'bad code!' });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('validation_error');
    expect(res.body.error.details).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: 'body.loginCode' })])
    );
  });
});

describe('lockout (D-32)', () => {
  test('5 failed attempts lock the account for correct password too', async () => {
    for (let attempt = 1; attempt <= 5; attempt += 1) {
      const res = await login('194999', `Wrong${attempt}pass`);
      expect(res.status).toBe(401);
    }

    const locked = await login('194999', PASSWORDS.lockout);
    expect(locked.status).toBe(429);
    expect(locked.body.error.code).toBe('account_locked');
    expect(locked.headers['retry-after']).toBeDefined();

    const fails = await AuditLog.countDocuments({ action: 'login_fail' });
    expect(fails).toBe(5);
  });

  test('successful login clears the failure counter', async () => {
    await login('194999', 'Wrong1pass');
    await login('194999', 'Wrong2pass');
    const ok = await login('194999', PASSWORDS.lockout);
    expect(ok.status).toBe(200);
    const again = await login('194999', PASSWORDS.lockout);
    expect(again.status).toBe(200);
  });
});

describe('change-password policy', () => {
  const loginVillage = () => login('194657', PASSWORDS.village);

  test('wrong old password returns 401', async () => {
    const { accessToken } = (await loginVillage()).body.data;
    const res = await request(app)
      .post('/api/v1/auth/change-password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ oldPassword: 'Wrong1pass', newPassword: 'BrandNew1pass' });
    expect(res.status).toBe(401);
  });

  test('policy violations return 422 with field details', async () => {
    const { accessToken } = (await loginVillage()).body.data;
    const cases = [
      { oldPassword: PASSWORDS.village, newPassword: PASSWORDS.village },
      { oldPassword: PASSWORDS.village, newPassword: 'abcdefgh' },
      { oldPassword: PASSWORDS.village, newPassword: 'short1' },
      { oldPassword: PASSWORDS.village, newPassword: '194657' }
    ];
    for (const body of cases) {
      const res = await request(app)
        .post('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(body);
      expect(res.status).toBe(422);
      expect(res.body.error.details[0].field).toBe('newPassword');
    }
  });

  test('revokes all refresh tokens on password change', async () => {
    const loginRes = await loginVillage();
    const { accessToken, refreshToken } = loginRes.body.data;
    const res = await request(app)
      .post('/api/v1/auth/change-password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ oldPassword: PASSWORDS.village, newPassword: 'BrandNew1pass' });
    expect(res.status).toBe(200);

    const refreshed = await request(app).post('/api/v1/auth/refresh').send({ refreshToken });
    expect(refreshed.status).toBe(401);

    const newLogin = await login('194657', 'BrandNew1pass');
    expect(newLogin.status).toBe(200);
  });

  test('writes password_change audit log', async () => {
    const { accessToken } = (await loginVillage()).body.data;
    await request(app)
      .post('/api/v1/auth/change-password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ oldPassword: PASSWORDS.village, newPassword: 'BrandNew1pass' });
    const entry = await AuditLog.findOne({ action: 'password_change' });
    expect(entry).toBeTruthy();
    expect(entry.role).toBe('village');
  });
});

describe('POST /api/v1/auth/refresh rotation', () => {
  test('issues new token pair on valid refresh', async () => {
    const loginRes = await login('194657', PASSWORDS.village);
    const { refreshToken } = loginRes.body.data;

    const res = await request(app).post('/api/v1/auth/refresh').send({ refreshToken });
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).not.toBe(refreshToken);

    const payload = jwt.verify(res.body.data.accessToken, process.env.JWT_SECRET);
    expect(payload.loginCode).toBe('194657');
  });

  test('reusing rotated refresh token revokes all sessions', async () => {
    const loginRes = await login('194657', PASSWORDS.village);
    const original = loginRes.body.data.refreshToken;

    const first = await request(app).post('/api/v1/auth/refresh').send({ refreshToken: original });
    expect(first.status).toBe(200);
    const rotated = first.body.data.refreshToken;

    const reuse = await request(app).post('/api/v1/auth/refresh').send({ refreshToken: original });
    expect(reuse.status).toBe(401);
    expect(reuse.body.error.code).toBe('stale_credentials');

    const afterRevoke = await request(app).post('/api/v1/auth/refresh').send({ refreshToken: rotated });
    expect(afterRevoke.status).toBe(401);

    const activeTokens = await RefreshToken.countDocuments({ isActive: true });
    expect(activeTokens).toBe(0);
  });

  test('rejects forged refresh token', async () => {
    const forged = jwt.sign({ userId: 'someone' }, 'wrong-secret', { expiresIn: '7d' });
    const res = await request(app).post('/api/v1/auth/refresh').send({ refreshToken: forged });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('unauthorized');
  });
});

describe('POST /api/v1/auth/logout', () => {
  test('revokes the refresh token', async () => {
    const loginRes = await login('194657', PASSWORDS.village);
    const { accessToken, refreshToken } = loginRes.body.data;

    const res = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ refreshToken });
    expect(res.status).toBe(200);

    const refreshed = await request(app).post('/api/v1/auth/refresh').send({ refreshToken });
    expect(refreshed.status).toBe(401);
    expect(await RefreshToken.countDocuments({ isActive: true })).toBe(0);
  });

  test('requires access token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/logout')
      .send({ refreshToken: 'whatever' });
    expect(res.status).toBe(401);
  });
});

describe('POST /api/v1/auth/reset-password (D-53)', () => {
  const districtLogin = async () => {
    const res = await login('mmr0100', PASSWORDS.district);
    return res.body.data.accessToken;
  };

  test('district admin resets a user and returns new password', async () => {
    const token = await districtLogin();
    const res = await request(app)
      .post('/api/v1/auth/reset-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ loginCode: ' 194997 ' });
    expect(res.status).toBe(200);
    expect(res.body.data.loginCode).toBe('194997');
    expect(res.body.data.newPassword).toMatch(/^[a-zA-Z0-9]{10}$/);

    const oldLogin = await login('194997', PASSWORDS.village);
    expect(oldLogin.status).toBe(401);

    const newLogin = await login('194997', res.body.data.newPassword);
    expect(newLogin.status).toBe(200);
    expect(newLogin.body.data.mustChangePassword).toBe(false);

    const audit = await AuditLog.findOne({ action: 'password_reset' });
    expect(audit).toBeTruthy();
  });

  test('village and township cannot reset passwords', async () => {
    const villageToken = (await login('194657', PASSWORDS.village)).body.data.accessToken;
    const villageRes = await request(app)
      .post('/api/v1/auth/reset-password')
      .set('Authorization', `Bearer ${villageToken}`)
      .send({ loginCode: '194997' });
    expect(villageRes.status).toBe(403);
    expect(villageRes.body.error.code).toBe('forbidden');

    const townshipToken = (await login('mmr010031', PASSWORDS.township)).body.data.accessToken;
    const townshipRes = await request(app)
      .post('/api/v1/auth/reset-password')
      .set('Authorization', `Bearer ${townshipToken}`)
      .send({ loginCode: '194997' });
    expect(townshipRes.status).toBe(403);
  });

  test('unknown loginCode returns 404', async () => {
    const token = await districtLogin();
    const res = await request(app)
      .post('/api/v1/auth/reset-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ loginCode: '194996' });
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('not_found');
  });
});

describe('token authentication edge cases', () => {
  test('missing/garbage/expired access tokens return 401', async () => {
    const missing = await request(app).get('/api/v1/locations/townships');
    expect(missing.status).toBe(401);
    expect(missing.body.error.code).toBe('unauthorized');

    const garbage = await request(app)
      .get('/api/v1/locations/townships')
      .set('Authorization', 'Bearer garbage');
    expect(garbage.status).toBe(401);

    const expired = jwt.sign({ userId: 'u1', role: 'village' }, process.env.JWT_SECRET, {
      expiresIn: -10
    });
    const res = await request(app)
      .get('/api/v1/locations/townships')
      .set('Authorization', `Bearer ${expired}`);
    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe('Access token expired');
  });

  test('password comparison helper rejects mismatched pairs', async () => {
    const user = await User.findOne({ loginCode: '194657' });
    await expect(comparePassword('bad', user.passwordHash)).resolves.toBe(false);
  });
});
