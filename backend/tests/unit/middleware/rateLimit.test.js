const { rateLimit, anonLimiter, rateLimitByRole, ROLE_LIMITS } = require('../../../src/middleware/rateLimit');

const makePipelineRedis = (count) => ({
  pipeline: () => {
    const pipeline = {
      incr: () => pipeline,
      pexpire: () => pipeline,
      exec: async () => [[null, count]]
    };
    return pipeline;
  }
});

const failingRedis = {
  pipeline: () => {
    const pipeline = {
      incr: () => pipeline,
      pexpire: () => pipeline,
      exec: async () => [[new Error('Connection is closed'), undefined]]
    };
    return pipeline;
  }
};

const makeReq = (redis, user = null) => ({ app: { locals: { redis } }, user, ip: '127.0.0.1' });

const makeRes = () => {
  const res = { headers: {} };
  res.set = jest.fn((name, value) => {
    res.headers[name] = value;
    return res;
  });
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('rateLimit', () => {
  test('passes through under the limit with headers', async () => {
    const next = jest.fn();
    const res = makeRes();
    await rateLimit(60000, 30)(makeReq(makePipelineRedis(5)), res, next);
    expect(next).toHaveBeenCalledWith();
    expect(res.headers['X-RateLimit-Limit']).toBe('30');
    expect(res.headers['X-RateLimit-Remaining']).toBe('25');
    expect(res.headers['X-RateLimit-Reset']).toBeDefined();
    expect(res.status).not.toHaveBeenCalled();
  });

  test('remaining never goes below zero', async () => {
    const next = jest.fn();
    const res = makeRes();
    await rateLimit(60000, 10)(makeReq(makePipelineRedis(11)), res, next);
    expect(res.headers['X-RateLimit-Remaining']).toBe('0');
  });

  test('returns 429 with Retry-After over the limit', async () => {
    const next = jest.fn();
    const res = makeRes();
    await rateLimit(60000, 10)(makeReq(makePipelineRedis(11)), res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.headers['Retry-After']).toBe('60');
    expect(res.json).toHaveBeenCalledWith({
      error: { code: 'rate_limit_exceeded', message: 'Too many requests, please try again later.' }
    });
  });

  test('keys by userId when authenticated', async () => {
    let capturedKey;
    const redis = {
      pipeline: () => {
        const pipeline = {
          incr() {
            capturedKey = 'rl:u-42';
            return pipeline;
          },
          pexpire: () => pipeline,
          exec: async () => [[null, 1]]
        };
        return pipeline;
      }
    };
    const next = jest.fn();
    await rateLimit(60000, 10)(makeReq(redis, { userId: 'u-42' }), makeRes(), next);
    expect(capturedKey).toBe('rl:u-42');
    expect(next).toHaveBeenCalled();
  });

  test('redis failure surfaces 503 service_unavailable', async () => {
    const next = jest.fn();
    await rateLimit(60000, 10)(makeReq(failingRedis), makeRes(), next);
    const error = next.mock.calls[0][0];
    expect(error.statusCode).toBe(503);
    expect(error.code).toBe('service_unavailable');
  });
});

describe('rateLimitByRole / anonLimiter', () => {
  test('role limits match spec table', () => {
    expect(ROLE_LIMITS).toEqual({ village: 100, township: 200, district: 500 });
  });

  test('rateLimitByRole uses role limit from user', async () => {
    const next = jest.fn();
    const res = makeRes();
    await rateLimitByRole(makeReq(makePipelineRedis(1), { role: 'township' }), res, next);
    expect(res.headers['X-RateLimit-Limit']).toBe('200');
    expect(next).toHaveBeenCalled();
  });

  test('rateLimitByRole falls back to anon max without user', async () => {
    const next = jest.fn();
    const res = makeRes();
    await rateLimitByRole(makeReq(makePipelineRedis(1)), res, next);
    expect(res.headers['X-RateLimit-Limit']).toBe(String(Number(process.env.RATE_LIMIT_ANON_MAX) || 30));
  });

  test('anonLimiter uses anon max', async () => {
    const next = jest.fn();
    const res = makeRes();
    await anonLimiter(makeReq(makePipelineRedis(1)), res, next);
    expect(res.headers['X-RateLimit-Limit']).toBe(String(Number(process.env.RATE_LIMIT_ANON_MAX) || 30));
    expect(next).toHaveBeenCalled();
  });
});
