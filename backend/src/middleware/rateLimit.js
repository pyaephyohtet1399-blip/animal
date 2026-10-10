const ApiError = require('../utils/apiError');

const ROLE_LIMITS = { village: 100, township: 200, district: 500 };
const READ_LIMITS = { village: 1000, township: 2000, district: 5000 };

const getWindowMs = () => Number(process.env.RATE_LIMIT_WINDOW_MS) || 60000;

const getAnonMax = () => Number(process.env.RATE_LIMIT_ANON_MAX) || 30;

const isReadMethod = (req) => req.method === 'GET' || req.method === 'HEAD';

const rateLimit = (windowMs, max, bucket = '') => async (req, res, next) => {
  try {
    const redis = req.app.locals.redis;
    if (!redis) throw new Error('Redis client not available');
    const key = `rl:${bucket}${req.user ? req.user.userId : req.ip}`;
    const pipeline = redis.pipeline();
    // Anchor the window at the first request only (SET NX keeps the TTL
    // from being extended by sustained traffic), then count within it.
    pipeline.set(key, '0', 'PX', windowMs, 'NX');
    pipeline.incr(key);
    pipeline.pttl(key);
    const results = await pipeline.exec();
    if (results.some(([err]) => err)) {
      throw results.find(([err]) => err)[1];
    }
    const current = Number(results[1][1]);
    const ttl = Number(results[2][1]);
    if (ttl < 0) await redis.pexpire(key, windowMs);
    const resetAt = ttl > 0 ? Date.now() + ttl : Date.now() + windowMs;
    res.set('X-RateLimit-Limit', String(max));
    res.set('X-RateLimit-Remaining', String(Math.max(0, max - current)));
    res.set('X-RateLimit-Reset', String(Math.ceil(resetAt / 1000)));
    if (current > max) {
      res.set('Retry-After', String(Math.ceil(windowMs / 1000)));
      return res.status(429).json({
        error: { code: 'rate_limit_exceeded', message: 'Too many requests, please try again later.' }
      });
    }
    return next();
  } catch (error) {
    return next(new ApiError(503, 'Rate limiter unavailable', 'service_unavailable'));
  }
};

const anonLimiter = (req, res, next) => rateLimit(getWindowMs(), getAnonMax())(req, res, next);

const rateLimitByRole = (req, res, next) => {
  const limits = isReadMethod(req) ? READ_LIMITS : ROLE_LIMITS;
  const bucket = isReadMethod(req) ? 'r:' : 'w:';
  const max = req.user && limits[req.user.role] ? limits[req.user.role] : getAnonMax();
  return rateLimit(getWindowMs(), max, bucket)(req, res, next);
};

module.exports = { rateLimit, anonLimiter, rateLimitByRole, ROLE_LIMITS, READ_LIMITS };
