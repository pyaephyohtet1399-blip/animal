const ApiError = require('../utils/apiError');

const ROLE_LIMITS = { village: 100, township: 200, district: 500 };

const getWindowMs = () => Number(process.env.RATE_LIMIT_WINDOW_MS) || 60000;

const getAnonMax = () => Number(process.env.RATE_LIMIT_ANON_MAX) || 30;

const rateLimit = (windowMs, max) => async (req, res, next) => {
  try {
    const redis = req.app.locals.redis;
    if (!redis) throw new Error('Redis client not available');
    const key = `rl:${req.user ? req.user.userId : req.ip}`;
    const pipeline = redis.pipeline();
    pipeline.incr(key);
    pipeline.pexpire(key, windowMs);
    const results = await pipeline.exec();
    if (results.some(([err]) => err)) {
      throw results.find(([err]) => err)[1];
    }
    const current = Number(results[0][1]);
    res.set('X-RateLimit-Limit', String(max));
    res.set('X-RateLimit-Remaining', String(Math.max(0, max - current)));
    res.set('X-RateLimit-Reset', String(Math.ceil((Date.now() + windowMs) / 1000)));
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
  const max = req.user && ROLE_LIMITS[req.user.role] ? ROLE_LIMITS[req.user.role] : getAnonMax();
  return rateLimit(getWindowMs(), max)(req, res, next);
};

module.exports = { rateLimit, anonLimiter, rateLimitByRole, ROLE_LIMITS };
