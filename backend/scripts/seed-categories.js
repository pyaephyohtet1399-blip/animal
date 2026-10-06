const fs = require('fs');
const path = require('path');
const BigAnimalCategory = require('../src/models/BigAnimalCategory');
const SmallAnimalCategory = require('../src/models/SmallAnimalCategory');
const PoultryCategory = require('../src/models/PoultryCategory');
const BreedingCategory = require('../src/models/BreedingCategory');
const { connectDb, clearCache, runCli } = require('./lib/seedHelpers');

const DEFAULT_FILE = path.join(__dirname, '..', 'data', 'categories.json');

const TYPE_MODELS = {
  big: BigAnimalCategory,
  small: SmallAnimalCategory,
  poultry: PoultryCategory,
  breeding: BreedingCategory
};

const main = async (options = {}) => {
  const filePath = process.env.SEED_CATEGORIES_FILE || DEFAULT_FILE;
  await connectDb();
  const categories = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  let total = 0;
  for (const [type, model] of Object.entries(TYPE_MODELS)) {
    const docs = categories[type];
    if (!Array.isArray(docs) || docs.length === 0) {
      throw new Error(`Missing categories for type: ${type}`);
    }
    const seen = new Set();
    docs.forEach((doc) => {
      if (!Number.isInteger(doc.categoryId) || !doc.name) {
        throw new Error(`Invalid category entry in ${type}: ${JSON.stringify(doc)}`);
      }
      if (seen.has(doc.categoryId)) {
        throw new Error(`Duplicate categoryId ${doc.categoryId} in ${type}`);
      }
      seen.add(doc.categoryId);
    });
    await model.bulkWrite(
      docs.map((doc) => ({
        updateOne: {
          filter: { categoryId: doc.categoryId },
          update: { $set: { categoryId: doc.categoryId, name: doc.name } },
          upsert: true
        }
      })),
      { ordered: false }
    );
    total += docs.length;
    process.stdout.write(`seed-categories: ${type} ${docs.length}\n`);
  }

  await clearCache('categories:*', options.redis);
  process.stdout.write(`seed-categories: total ${total}\n`);
};

if (require.main === module) {
  runCli(main, 'seed-categories');
}

module.exports = { main };
