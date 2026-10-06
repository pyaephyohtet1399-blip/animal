const path = require('path');
const mongoose = require('mongoose');
const Township = require('../src/models/Township');
const Townvg = require('../src/models/Townvg');
const Wardvillage = require('../src/models/Wardvillage');
const { connectDb, readCsv, clearCache, runCli } = require('./lib/seedHelpers');

const DEFAULT_FILE = path.join(__dirname, '..', 'data', 'locations.csv');

const main = async (options = {}) => {
  const filePath = process.env.SEED_LOCATIONS_FILE || DEFAULT_FILE;
  await connectDb();
  const rows = readCsv(filePath);

  const townships = new Map();
  const townvgs = new Map();
  const wardvillages = new Map();

  rows.forEach((row) => {
    if (!row.tspCode || !row.tvgCode || !row.wvCode) {
      throw new Error(`Invalid locations row: ${JSON.stringify(row)}`);
    }
    if (!townships.has(row.tspCode)) {
      townships.set(row.tspCode, {
        tspCode: row.tspCode,
        tspName: row.tspName,
        districtCode: row.districtCode
      });
    }
    if (!townvgs.has(row.tvgCode)) {
      townvgs.set(row.tvgCode, {
        tvgCode: row.tvgCode,
        tvgName: row.tvgName,
        tspCode: row.tspCode
      });
    }
    if (wardvillages.has(row.wvCode)) {
      throw new Error(`Duplicate wvCode: ${row.wvCode}`);
    }
    wardvillages.set(row.wvCode, {
      wvCode: row.wvCode,
      wvName: row.wvName,
      tvgCode: row.tvgCode
    });
  });

  await Township.bulkWrite(
    [...townships.values()].map((doc) => ({
      updateOne: { filter: { tspCode: doc.tspCode }, update: { $set: doc }, upsert: true }
    })),
    { ordered: false }
  );
  await Townvg.bulkWrite(
    [...townvgs.values()].map((doc) => ({
      updateOne: { filter: { tvgCode: doc.tvgCode }, update: { $set: doc }, upsert: true }
    })),
    { ordered: false }
  );
  await Wardvillage.bulkWrite(
    [...wardvillages.values()].map((doc) => ({
      updateOne: { filter: { wvCode: doc.wvCode }, update: { $set: doc }, upsert: true }
    })),
    { ordered: false }
  );

  await clearCache('locations:*', options.redis);

  process.stdout.write(
    `seed-locations: townships ${townships.size}, townvgs ${townvgs.size}, wardvillages ${wardvillages.size}\n`
  );
};

if (require.main === module) {
  runCli(main, 'seed-locations');
}

module.exports = { main };
