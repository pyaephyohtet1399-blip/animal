const Redis = require('ioredis');
const logger = require('../utils/logger');

const createRedis = (url) => {
  const client = new Redis(url, {
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => Math.min(times * 1000, 30000),
    enableReadyCheck: true
  });
  client.on('error', (err) => {
    logger.error('Redis error', { message: err.message });
  });
  client.on('connect', () => {
    logger.info('Redis connected');
  });
  return client;
};

module.exports = { createRedis };
