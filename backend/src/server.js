const mongoose = require('mongoose');
const { loadEnv } = require('./config/env');
const logger = require('./utils/logger');

const main = async () => {
  const env = loadEnv();

  const { connectDB } = require('./config/database');
  const { createRedis } = require('./config/redis');
  const createApp = require('./app');

  const redis = createRedis(env.REDIS_URL);
  await connectDB(env.MONGODB_URI);
  logger.info('MongoDB connected');

  const models = require('./models');
  await Promise.all(Object.values(models).map((model) => model.syncIndexes()));
  logger.info('MongoDB indexes synced');

  const idService = require('./services/idService');
  await idService.initIdCounters(redis);
  logger.info('ID counters initialized');

  const reconcileTimer = setInterval(() => {
    idService
      .reconcileIdCounters(redis)
      .catch((err) => logger.error('ID counter reconcile failed', { message: err.message }));
  }, env.ID_COUNTER_RECONCILE_MINUTES * 60 * 1000);
  reconcileTimer.unref();

  const app = createApp();
  app.locals.redis = redis;

  const server = app.listen(env.PORT, () => {
    logger.info(`Server listening on port ${env.PORT}`, { env: env.NODE_ENV });
    if (process.send) {
      process.send('ready');
    }
  });

  const shutdown = (signal) => async () => {
    logger.info(`${signal} received. Starting graceful shutdown...`);
    const forceTimer = setTimeout(() => {
      logger.error('Forced shutdown after 30s');
      process.exit(1);
    }, 30000);
    forceTimer.unref();

    server.close(async () => {
      logger.info('HTTP server closed');
      try {
        await mongoose.disconnect();
        logger.info('MongoDB connection closed');
      } catch (err) {
        logger.error('MongoDB close error', { message: err.message });
      }
      try {
        await redis.quit();
        logger.info('Redis connection closed');
      } catch (err) {
        logger.error('Redis close error', { message: err.message });
      }
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown('SIGTERM'));
  process.on('SIGINT', shutdown('SIGINT'));
};

main().catch((err) => {
  logger.error('Fatal startup error', { message: err.message, stack: err.stack });
  process.exit(1);
});
