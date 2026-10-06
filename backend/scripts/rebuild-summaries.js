const mongoose = require('mongoose');
const Survey = require('../src/models/Survey');
const { connectDb, runCli } = require('./lib/seedHelpers');
const summaryService = require('../src/services/summaryService');

const main = async () => {
  await connectDb();
  const backfill = await Survey.updateMany(
    { hasBreeding: { $exists: false } },
    { $set: { hasBreeding: false, breedingAnimals: [] } }
  );
  const count = await summaryService.recomputeAll();
  process.stdout.write(
    `rebuild-summaries: backfilled ${backfill.modifiedCount} survey(s), recomputed ${count} summary document(s)\n`
  );
};

if (require.main === module) {
  runCli(main, 'rebuild-summaries');
}

module.exports = { main };
