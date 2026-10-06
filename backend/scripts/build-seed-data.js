/* One-time converter: source location CSV → data/locations.csv + data/users.csv
 * Source: "Animal Village Code Data.csv" (user-provided, same as MySQL livestock_survey).
 * Categories: big/small/poultry from legacy `animal.sql` (MC1-MC3; MC4 dropped); breeding = D-54 spec.
 * Usage: node scripts/build-seed-data.js [sourceCsvPath]
 */
const fs = require('fs');
const path = require('path');

const DEFAULT_SOURCE =
  'C:\\Users\\Lenovo\\Downloads\\Telegram Desktop\\Animal Village Code Data.csv';

const DATA_DIR = path.join(__dirname, '..', 'data');
const DISTRICT_CODE = 'MMR0100';
const DISTRICT_NAME = 'မိတ္ထီလာ';

const CATEGORIES = {
  big: [
    { categoryId: 1, name: 'ဒေသနွား', legacyId: 'C1' },
    { categoryId: 2, name: 'အသားစားနွား', legacyId: 'C2' },
    { categoryId: 3, name: 'နို့စားနွား', legacyId: 'C3' },
    { categoryId: 4, name: 'နွားနောက်', legacyId: 'C4' },
    { categoryId: 5, name: 'ဒေသကျွဲ', legacyId: 'C5' },
    { categoryId: 6, name: 'နို့စားကျွဲ', legacyId: 'C6' },
    { categoryId: 7, name: 'မြင်း', legacyId: 'C7' },
    { categoryId: 8, name: 'အခြား', legacyId: 'C8' }
  ],
  small: [
    { categoryId: 1, name: 'ဆိတ်', legacyId: 'C9' },
    { categoryId: 2, name: 'သိုး', legacyId: 'C10' },
    { categoryId: 3, name: 'ဝက်', legacyId: 'C11' },
    { categoryId: 4, name: 'ခွေး', legacyId: 'C12' },
    { categoryId: 5, name: 'အခြား', legacyId: 'C13' }
  ],
  poultry: [
    { categoryId: 1, name: 'ဥစားကြက်', legacyId: 'C14' },
    { categoryId: 2, name: 'အသားစားကြက်', legacyId: 'C15' },
    { categoryId: 3, name: 'ဒေသကြက်', legacyId: 'C16' },
    { categoryId: 4, name: 'ဥစားဘဲ', legacyId: 'C17' },
    { categoryId: 5, name: 'အသားစားဘဲ', legacyId: 'C18' },
    { categoryId: 6, name: 'ဒေသဘဲ/ဓါတ်', legacyId: 'C19' },
    { categoryId: 7, name: 'ကြက်ဆင်', legacyId: 'C20' },
    { categoryId: 8, name: 'ဘဲငန်း', legacyId: 'C21' },
    { categoryId: 9, name: 'မန်ဒါလီ', legacyId: 'C22' },
    { categoryId: 10, name: 'ငုံး', legacyId: 'C23' },
    { categoryId: 11, name: 'အခြား', legacyId: 'C24' }
  ],
  breeding: [
    { categoryId: 1, name: 'ဒေသနွား' },
    { categoryId: 2, name: 'ဒေသကျွဲ' },
    { categoryId: 3, name: 'နို့စားကျွဲ' },
    { categoryId: 4, name: 'ဝက်' },
    { categoryId: 5, name: 'ဆိတ်' },
    { categoryId: 6, name: 'သိုး' }
  ]
};

const csvEscape = (value) => {
  const s = String(value ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const readSourceRows = (filePath) => {
  const raw = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
  const lines = raw.split(/\r?\n/).filter((l) => l.trim());
  return lines.slice(1).map((line) => line.split(','));
};

const main = () => {
  const sourcePath = process.argv[2] || DEFAULT_SOURCE;
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Source CSV not found: ${sourcePath}`);
  }

  const rows = readSourceRows(sourcePath);
  const valid = rows.filter((r) => r[4] && r[6] && r[9]);
  if (valid.length === 0) throw new Error('No valid rows in source CSV');

  const locations = valid.map((r) => ({
    districtCode: DISTRICT_CODE,
    tspCode: r[4].trim(),
    tspName: r[5].trim(),
    tvgCode: r[6].trim(),
    tvgName: r[7].trim(),
    wvCode: r[9].trim(),
    wvName: r[10].trim()
  }));

  const seenWv = new Set();
  locations.forEach((l) => {
    if (seenWv.has(l.wvCode)) throw new Error(`Duplicate wvCode: ${l.wvCode}`);
    seenWv.add(l.wvCode);
    if (l.tspCode.slice(0, 7) !== l.districtCode) {
      throw new Error(`tspCode ${l.tspCode} does not belong to ${DISTRICT_CODE}`);
    }
  });

  fs.mkdirSync(DATA_DIR, { recursive: true });

  const locHeader = 'districtCode,tspCode,tspName,tvgCode,tvgName,wvCode,wvName';
  const locCsv = [locHeader]
    .concat(locations.map((l) => Object.values(l).map(csvEscape).join(',')))
    .join('\n');
  fs.writeFileSync(path.join(DATA_DIR, 'locations.csv'), `﻿${locCsv}\n`, 'utf8');

  const tspMap = new Map();
  locations.forEach((l) => {
    if (!tspMap.has(l.tspCode)) tspMap.set(l.tspCode, l.tspName);
  });

  const users = [
    { loginCode: DISTRICT_CODE, role: 'district', districtCode: DISTRICT_CODE, tspCode: '', tvgCode: '', wvCode: '' }
  ];
  tspMap.forEach((tspName, tspCode) => {
    users.push({ loginCode: tspCode, role: 'township', districtCode: DISTRICT_CODE, tspCode, tvgCode: '', wvCode: '' });
  });
  locations.forEach((l) => {
    users.push({
      loginCode: l.wvCode,
      role: 'village',
      districtCode: DISTRICT_CODE,
      tspCode: l.tspCode,
      tvgCode: l.tvgCode,
      wvCode: l.wvCode
    });
  });

  const userHeader = 'loginCode,role,districtCode,tspCode,tvgCode,wvCode';
  const userCsv = [userHeader]
    .concat(users.map((u) => Object.values(u).map(csvEscape).join(',')))
    .join('\n');
  fs.writeFileSync(path.join(DATA_DIR, 'users.csv'), `﻿${userCsv}\n`, 'utf8');

  fs.writeFileSync(
    path.join(DATA_DIR, 'categories.json'),
    `${JSON.stringify(CATEGORIES, null, 2)}\n`,
    'utf8'
  );

  process.stdout.write(
    `locations.csv: ${locations.length} rows\nusers.csv: ${users.length} rows (district 1 + township ${tspMap.size} + village ${locations.length})\n` +
      `categories.json: big ${CATEGORIES.big.length}, small ${CATEGORIES.small.length}, poultry ${CATEGORIES.poultry.length}, breeding ${CATEGORIES.breeding.length}\n`
  );
};

main();
