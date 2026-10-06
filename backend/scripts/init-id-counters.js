const mongoose = require('mongoose');
const Redis = require('ioredis');
const { loadEnv } = require('../src/config/env');
const { connectDB } = require('../src/config/database');
const idService = require('../src/services/idService');

const main = async (options = {}) => {
  loadEnv();
  if (mongoose.connection.readyState !== 1) {
    await connectDB(process.env.MONGODB_URI);
  }
  let redis = options.redis;
  let owned = false;
  try {
    if (!redis) {
      redis = new Redis(process.env.REDIS_URL, {
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        retryStrategy: () => null
      });
      await redis.connect();
      owned = true;
    }
    await idService.initIdCounters(redis);
    const surveyId = await redis.get(idService.SURVEY_KEY);
    const interviewId = await redis.get(idService.INTERVIEW_KEY);
    process.stdout.write(
      `init-id-counters: survey:id=${surveyId || 0} interview:id=${interviewId || 0}\n`
    );
  } finally {
    if (owned && redis) redis.disconnect();
  }
};

if (require.main === module) {
  main()
    .then(async () => {
      await mongoose.disconnect();
      process.exit(0);
    })
    .catch(async (error) => {
      process.stderr.write(`init-id-counters failed: ${error.message}\n`);
      process.exit(1);
    });
}

module.exports = { main };
