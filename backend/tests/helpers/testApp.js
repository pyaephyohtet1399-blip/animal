const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');
const RedisMock = require('ioredis-mock');
const createApp = require('../../src/app');

let mongod;

const START_RETRIES = 4;

const startReplSet = async () => {
  let lastError;
  for (let attempt = 0; attempt < START_RETRIES; attempt += 1) {
    try {
      return await MongoMemoryReplSet.create({
        count: 1,
        storageEngine: 'wiredTiger'
      });
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
};

const setupTestApp = async () => {
  mongod = await startReplSet();
  await mongoose.connect(mongod.getUri());
  const app = createApp();
  app.locals.redis = new RedisMock();
  return app;
};

const teardownTestApp = async () => {
  await mongoose.disconnect();
  if (mongod) {
    await mongod.stop();
    mongod = undefined;
  }
};

const clearDb = async () => {
  const collections = await mongoose.connection.db.collections();
  await Promise.all(collections.map((collection) => collection.deleteMany({})));
};

const clearRedis = async (app) => {
  await app.locals.redis.flushall();
};

module.exports = { setupTestApp, teardownTestApp, clearDb, clearRedis };
