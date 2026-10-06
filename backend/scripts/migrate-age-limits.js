const mongoose = require('mongoose');
const Survey = require('../src/models/Survey');
const { connectDb, runCli } = require('./lib/seedHelpers');
const summaryService = require('../src/services/summaryService');

const POULTRY_MAP = { OverOne: 'Old', LessThanOne: 'Young' };
const SMALL_MAP = {
  LessThanOne: 'Under2months',
  Between1and3: 'Between2and6months',
  Over3: 'Over6months'
};

const remap = (items, map) =>
  (items || []).map((item) => (map[item.ageLimit] ? { ...item, ageLimit: map[item.ageLimit] } : item));

const reportDistinct = async (label) => {
  const rows = await Survey.aggregate([
    { $project: { small: '$smallAnimals.ageLimit', poultry: '$poultry.ageLimit' } },
    { $unwind: { path: '$poultry', preserveNullAndEmptyArrays: true } },
    { $group: { _id: '$poultry', n: { $sum: 1 } } }
  ]);
  const smallRows = await Survey.aggregate([
    { $project: { small: '$smallAnimals.ageLimit' } },
    { $unwind: { path: '$small', preserveNullAndEmptyArrays: true } },
    { $group: { _id: '$small', n: { $sum: 1 } } }
  ]);
  process.stdout.write(
    `${label} poultry: ${JSON.stringify(rows)}\n${label} small: ${JSON.stringify(smallRows)}\n`
  );
};

const main = async () => {
  await connectDb();
  await reportDistinct('before');

  const surveys = await Survey.find({}).lean();
  const ops = [];
  let poultryDocs = 0;
  let smallDocs = 0;
  for (const doc of surveys) {
    const poultry = remap(doc.poultry, POULTRY_MAP);
    const small = remap(doc.smallAnimals, SMALL_MAP);
    const poultryChanged = JSON.stringify(poultry) !== JSON.stringify(doc.poultry || []);
    const smallChanged = JSON.stringify(small) !== JSON.stringify(doc.smallAnimals || []);
    if (!poultryChanged && !smallChanged) continue;
    if (poultryChanged) poultryDocs += 1;
    if (smallChanged) smallDocs += 1;
    const set = {};
    if (poultryChanged) set.poultry = poultry;
    if (smallChanged) set.smallAnimals = small;
    ops.push({ updateOne: { filter: { _id: doc._id }, update: { $set: set } } });
  }
  if (ops.length) await Survey.collection.bulkWrite(ops);

  const summaryCount = await summaryService.recomputeAll();
  await reportDistinct('after');
  process.stdout.write(
    `migrate-age-limits: remapped poultry=${poultryDocs} small=${smallDocs} survey(s), recomputed ${summaryCount} summary doc(s)\n`
  );
  await mongoose.disconnect();
};

if (require.main === module) {
  runCli(main, 'migrate-age-limits');
}

module.exports = { main, POULTRY_MAP, SMALL_MAP };
