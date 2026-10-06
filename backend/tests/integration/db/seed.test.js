const fs = require('fs');
const os = require('os');
const path = require('path');
const User = require('../../../src/models/User');
const Township = require('../../../src/models/Township');
const Townvg = require('../../../src/models/Townvg');
const Wardvillage = require('../../../src/models/Wardvillage');
const BigAnimalCategory = require('../../../src/models/BigAnimalCategory');
const SmallAnimalCategory = require('../../../src/models/SmallAnimalCategory');
const PoultryCategory = require('../../../src/models/PoultryCategory');
const { comparePassword } = require('../../../src/utils/password');
const { setupTestApp, teardownTestApp, clearDb } = require('../../helpers/testApp');

const seedLocations = require('../../../scripts/seed-locations');
const seedCategories = require('../../../scripts/seed-categories');
const seedUsers = require('../../../scripts/seed-users');

let app;
let tmpDir;
const originalEnv = {};

const setEnv = (key, value) => {
  if (!(key in originalEnv)) originalEnv[key] = process.env[key];
  process.env[key] = value;
};

const writeFixture = (name, content) => {
  const filePath = path.join(tmpDir, name);
  fs.writeFileSync(filePath, content, 'utf8');
  return filePath;
};

beforeAll(async () => {
  app = await setupTestApp();
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'livestock-seed-'));
});

afterAll(async () => {
  Object.entries(originalEnv).forEach(([key, value]) => {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  });
  fs.rmSync(tmpDir, { recursive: true, force: true });
  await teardownTestApp();
});

beforeEach(async () => {
  await clearDb();
  await app.locals.redis.flushall();
});

describe('seed-locations.js', () => {
  test('loads full location dataset and is idempotent', async () => {
    await seedLocations.main();
    expect(await Township.countDocuments()).toBe(4);
    expect(await Townvg.countDocuments()).toBe(207);
    expect(await Wardvillage.countDocuments()).toBe(840);

    const township = await Township.findOne({ tspCode: 'MMR010031' }).lean();
    expect(township.tspName).toBe('ဝမ်းတွင်း');
    expect(township.districtCode).toBe('MMR0100');

    await seedLocations.main();
    expect(await Township.countDocuments()).toBe(4);
    expect(await Townvg.countDocuments()).toBe(207);
    expect(await Wardvillage.countDocuments()).toBe(840);

    const wards = await Wardvillage.countDocuments({ wvCode: /^MMR\d{12}$/ });
    expect(wards).toBe(31);
  }, 30000);

  test('clears location cache keys on seed', async () => {
    await app.locals.redis.set('locations:townships', '["stale"]');
    await seedLocations.main({ redis: app.locals.redis });
    expect(await app.locals.redis.get('locations:townships')).toBeNull();
  });
});

describe('seed-categories.js', () => {
  test('loads 8/5/11 categories and is idempotent', async () => {
    await seedCategories.main();
    expect(await BigAnimalCategory.countDocuments()).toBe(8);
    expect(await SmallAnimalCategory.countDocuments()).toBe(5);
    expect(await PoultryCategory.countDocuments()).toBe(11);

    const big = await BigAnimalCategory.findOne({ categoryId: 1 }).lean();
    expect(big.name).toBe('ဒေသနွား');

    await seedCategories.main();
    expect(await BigAnimalCategory.countDocuments()).toBe(8);
    expect(await SmallAnimalCategory.countDocuments()).toBe(5);
    expect(await PoultryCategory.countDocuments()).toBe(11);
  });

  test('clears category cache keys on seed', async () => {
    await app.locals.redis.set('categories:big', '["stale"]');
    await seedCategories.main({ redis: app.locals.redis });
    expect(await app.locals.redis.get('categories:big')).toBeNull();
  });
});

describe('seed-users.js', () => {
  const usersCsv = [
    'loginCode,role,districtCode,tspCode,tvgCode,wvCode',
    'MMR0100,district,MMR0100,,,',
    'MMR010031,township,MMR0100,MMR010031,,',
    '194657,village,MMR0100,MMR010031,MMR010031047,194657',
    'MMR010031701504,village,MMR0100,MMR010031,MMR010031701,MMR010031701504',
    ''
  ].join('\n');

  const setupSeedEnv = () => {
    setEnv('SEED_USERS_FILE', writeFixture('users.csv', usersCsv));
    setEnv('SEED_PASSWORDS_FILE', path.join(tmpDir, 'generated-passwords.csv'));
  };

  test('creates users with generated passwords CSV and is idempotent', async () => {
    setupSeedEnv();

    await seedUsers.main();
    expect(await User.countDocuments()).toBe(4);

    const passwordsFile = process.env.SEED_PASSWORDS_FILE;
    expect(fs.existsSync(passwordsFile)).toBe(true);
    const csvLines = fs.readFileSync(passwordsFile, 'utf8').trim().split(/\r?\n/);
    expect(csvLines[0]).toBe('loginCode,password,village,township,district');
    expect(csvLines).toHaveLength(5);

    const district = await User.findOne({ loginCode: 'MMR0100' }).lean();
    expect(district.role).toBe('district');
    expect(district.mustChangePassword).toBe(false);
    expect(district.isActive).toBe(true);
    expect(district.districtCode).toBe('MMR0100');

    const ward = await User.findOne({ loginCode: 'MMR010031701504' }).lean();
    expect(ward.role).toBe('village');
    expect(ward.wvCode).toBe('MMR010031701504');

    const passwordLine = csvLines.find((line) => line.startsWith('194657,'));
    const generated = passwordLine.split(',')[1];
    expect(generated).toHaveLength(10);
    expect(passwordLine.split(',').slice(2)).toEqual(['ကျောင်းကုန်း', 'ဝမ်းတွင်း', 'မိတ္ထီလာ']);
    await expect(comparePassword(generated, district.passwordHash)).resolves.toBe(false);
    const villageDoc = await User.findOne({ loginCode: '194657' }).lean();
    await expect(comparePassword(generated, villageDoc.passwordHash)).resolves.toBe(true);

    await User.updateOne(
      { loginCode: '194657' },
      { $set: { mustChangePassword: true, role: 'village' } }
    );
    const csvBefore = fs.readFileSync(passwordsFile, 'utf8');

    await seedUsers.main();
    expect(await User.countDocuments()).toBe(4);
    const villageAfter = await User.findOne({ loginCode: '194657' }).lean();
    expect(villageAfter.mustChangePassword).toBe(true);
    expect(fs.readFileSync(passwordsFile, 'utf8')).toBe(csvBefore);
  }, 30000);

  test('rejects role mismatch at seed time (D-51)', async () => {
    setEnv('SEED_USERS_FILE', writeFixture('bad-users.csv', 'loginCode,role,districtCode,tspCode,tvgCode,wvCode\n194657,township,MMR0100,,,'));
    setEnv('SEED_PASSWORDS_FILE', path.join(tmpDir, 'unused-passwords.csv'));
    await expect(seedUsers.main()).rejects.toThrow(/Role mismatch/);
    expect(await User.countDocuments()).toBe(0);
  });

  test('rejects duplicate loginCodes', async () => {
    setEnv(
      'SEED_USERS_FILE',
      writeFixture(
        'dup-users.csv',
        'loginCode,role,districtCode,tspCode,tvgCode,wvCode\n194657,village,MMR0100,,, \n194657,village,MMR0100,,,\n'
      )
    );
    setEnv('SEED_PASSWORDS_FILE', path.join(tmpDir, 'dup-passwords.csv'));
    await expect(seedUsers.main()).rejects.toThrow(/Duplicate loginCodes/);
  });
});
