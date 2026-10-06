const mongoose = require('mongoose');

const health = (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
};

const ready = async (req, res) => {
  const payload = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    database: 'unknown',
    redis: 'unknown'
  };

  try {
    if (mongoose.connection.readyState !== 1) {
      throw new Error('not connected');
    }
    await mongoose.connection.db.admin().ping();
    payload.database = 'connected';
  } catch (err) {
    payload.database = 'disconnected';
    payload.status = 'error';
  }

  const redis = req.app.locals.redis;
  try {
    if (!redis) throw new Error('not connected');
    await redis.ping();
    payload.redis = 'connected';
  } catch (err) {
    payload.redis = 'disconnected';
    payload.status = 'error';
  }

  res.status(payload.status === 'ok' ? 200 : 503).json(payload);
};

module.exports = { health, ready };
