const path = require('path');
const User = require('../src/models/User');
const { determineRole } = require('../src/utils/determineRole');
const { genDefaultPassword, hashPassword } = require('../src/utils/password');
const {
  connectDb,
  readCsv,
  readPasswordMap,
  writePasswordMap,
  buildLocationMeta,
  runCli
} = require('./lib/seedHelpers');

const DEFAULT_USERS_FILE = path.join(__dirname, '..', 'data', 'users.csv');
const DEFAULT_LOCATIONS_FILE = path.join(__dirname, '..', 'data', 'locations.csv');
const DEFAULT_PASSWORDS_FILE = path.join(__dirname, '..', 'data', 'generated-passwords.csv');
const DISTRICT_NAME = 'မိတ္ထီလာ';
const HASH_CONCURRENCY = 25;

const normalizeRows = (rows) =>
  rows.map((row) => {
    const loginCode = row.loginCode.trim().toUpperCase();
    if (!loginCode || !row.role) {
      throw new Error(`Invalid users row: ${JSON.stringify(row)}`);
    }
    const role = determineRole(loginCode);
    if (role !== row.role) {
      throw new Error(`Role mismatch for ${loginCode}: csv=${row.role}, derived=${role}`);
    }
    return {
      loginCode,
      role: row.role,
      districtCode: row.districtCode || null,
      tspCode: row.tspCode || null,
      tvgCode: row.tvgCode || null,
      wvCode: row.wvCode || null
    };
  });

const hashNewPasswords = async (rows) => {
  const passwords = new Map();
  for (let start = 0; start < rows.length; start += HASH_CONCURRENCY) {
    const chunk = rows.slice(start, start + HASH_CONCURRENCY);
    const hashed = await Promise.all(
      chunk.map(async (row) => {
        const password = genDefaultPassword();
        return { loginCode: row.loginCode, password, passwordHash: await hashPassword(password) };
      })
    );
    hashed.forEach((item) => passwords.set(item.loginCode, item));
  }
  return passwords;
};

const main = async () => {
  const usersFile = process.env.SEED_USERS_FILE || DEFAULT_USERS_FILE;
  const passwordsFile = process.env.SEED_PASSWORDS_FILE || DEFAULT_PASSWORDS_FILE;
  await connectDb();

  const rows = normalizeRows(readCsv(usersFile));
  const codes = rows.map((row) => row.loginCode);
  const duplicates = codes.filter((code, index) => codes.indexOf(code) !== index);
  if (duplicates.length > 0) {
    throw new Error(`Duplicate loginCodes: ${[...new Set(duplicates)].join(', ')}`);
  }

  const existing = await User.find({ loginCode: { $in: codes } }).select('loginCode').lean();
  const existingSet = new Set(existing.map((doc) => doc.loginCode));
  const newRows = rows.filter((row) => !existingSet.has(row.loginCode));
  const newHashes = await hashNewPasswords(newRows);

  const passwordMap = readPasswordMap(passwordsFile);
  newHashes.forEach((item) => passwordMap.set(item.loginCode, item.password));

  const ops = rows.map((row) => {
    const base = {
      role: row.role,
      districtCode: row.districtCode,
      tspCode: row.tspCode,
      tvgCode: row.tvgCode,
      wvCode: row.wvCode,
      isActive: true
    };
    const update = { $set: base };
    if (newHashes.has(row.loginCode)) {
      update.$setOnInsert = {
        passwordHash: newHashes.get(row.loginCode).passwordHash
      };
    }
    return { updateOne: { filter: { loginCode: row.loginCode }, update, upsert: true } };
  });

  await User.bulkWrite(ops, { ordered: false });

  const locationsFile = process.env.SEED_LOCATIONS_FILE || DEFAULT_LOCATIONS_FILE;
  const locationMeta = buildLocationMeta(locationsFile, rows, DISTRICT_NAME);
  writePasswordMap(passwordsFile, passwordMap, locationMeta);

  process.stdout.write(
    `seed-users: total ${rows.length}, created ${newRows.length}, existing ${existing.length}\n`
  );
};

if (require.main === module) {
  runCli(main, 'seed-users');
}

module.exports = { main };
