const {
  rateLimit,
  anonLimiter,
  rateLimitByRole,
  ROLE_LIMITS,
  READ_LIMITS
} = require('../../../src/middleware/rateLimit');

const makePipelineRedis = (count, ttl = 60000) => {
  const redis = {
    pexpire: jest.fn(async () => {}),
    pipeline: () => {
      const pipeline = {
        set: () => pipeline,
        incr: () => pipeline,
        pttl: () => pipeline,
        exec: async () => [
          [null, 'OK'],
          [null, count],
          [null, ttl]
        ]
      };
      return pipeline;
    }
  };
  return redis;
};

const failingRedis = {
  pexpire: jest.fn(async () => {}),
  pipeline: () => {
    const pipeline = {
      set: () => pipeline,
      incr: () => pipeline,
      pttl: () => pipeline,
      exec: async () => [[new Error('Connection is closed'), undefined]]
    };
    return pipeline;
  }
};

const makeReq = (redis, user = null, method = 'GET') => ({
  app: { locals: { redis } },
  user,
  method,
  ip: '127.0.0.1'
});

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
      pexpire: jest.fn(async () => {}),
      pipeline: () => {
        const pipeline = {
          set(key) {
            capturedKey = key;
            return pipeline;
          },
          incr: () => pipeline,
          pttl: () => pipeline,
          exec: async () => [
            [null, 'OK'],
            [null, 1],
            [null, 60000]
          ]
        };
        return pipeline;
      }
    };
    const next = jest.fn();
    await rateLimit(60000, 10)(makeReq(redis, { userId: 'u-42' }), makeRes(), next);
    expect(capturedKey).toBe('rl:u-42');
    expect(next).toHaveBeenCalled();
  });

  test('window is anchored with SET NX (no TTL refresh on each request)', async () => {
    const calls = [];
    const redis = {
      pexpire: jest.fn(async () => {}),
      pipeline: () => {
        const pipeline = {
          set: (...args) => {
            calls.push(['set', ...args]);
            return pipeline;
          },
          incr: (...args) => {
            calls.push(['incr', ...args]);
            return pipeline;
          },
          pttl: (...args) => {
            calls.push(['pttl', ...args]);
            return pipeline;
          },
          exec: async () => [
            [null, 'OK'],
            [null, 7],
            [null, 42000]
          ]
        };
        return pipeline;
      }
    };
    const next = jest.fn();
    const res = makeRes();
    await rateLimit(60000, 10)(makeReq(redis), res, next);
    expect(calls[0]).toEqual(['set', 'rl:127.0.0.1', '0', 'PX', 60000, 'NX']);
    expect(calls[1][0]).toBe('incr');
    expect(calls[2][0]).toBe('pttl');
    expect(res.headers['X-RateLimit-Reset']).toBeDefined();
    expect(redis.pexpire).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  test('missing TTL on the counter key gets re-anchored', async () => {
    const redis = makePipelineRedis(3, -1);
    const next = jest.fn();
    await rateLimit(60000, 10)(makeReq(redis), makeRes(), next);
    expect(redis.pexpire).toHaveBeenCalledWith('rl:127.0.0.1', 60000);
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
  test('limit tables match spec', () => {
    expect(ROLE_LIMITS).toEqual({ village: 100, township: 200, district: 500 });
    expect(READ_LIMITS).toEqual({ village: 1000, township: 2000, district: 5000 });
  });

  test('GET uses the read limit for the role', async () => {
    const next = jest.fn();
    const res = makeRes();
    await rateLimitByRole(makeReq(makePipelineRedis(1), { role: 'township' }, 'GET'), res, next);
    expect(res.headers['X-RateLimit-Limit']).toBe('2000');
    expect(next).toHaveBeenCalled();
  });

  test('POST uses the write limit for the role', async () => {
    const next = jest.fn();
    const res = makeRes();
    await rateLimitByRole(makeReq(makePipelineRedis(1), { role: 'township' }, 'POST'), res, next);
    expect(res.headers['X-RateLimit-Limit']).toBe('200');
    expect(next).toHaveBeenCalled();
  });

  test('reads and writes use separate counter buckets', async () => {
    const keys = [];
    const redis = {
      pexpire: jest.fn(async () => {}),
      pipeline: () => {
        const pipeline = {
          set: (key) => {
            keys.push(key);
            return pipeline;
          },
          incr: () => pipeline,
          pttl: () => pipeline,
          exec: async () => [
            [null, 'OK'],
            [null, 1],
            [null, 60000]
          ]
        };
        return pipeline;
      }
    };
    const user = { userId: 'u-1', role: 'village' };
    await rateLimitByRole(makeReq(redis, user, 'GET'), makeRes(), jest.fn());
    await rateLimitByRole(makeReq(redis, user, 'POST'), makeRes(), jest.fn());
    expect(keys).toEqual(['rl:r:u-1', 'rl:w:u-1']);
  });

  test('rateLimitByRole falls back to anon max without user', async () => {
    const next = jest.fn();
    const res = makeRes();
    await rateLimitByRole(makeReq(makePipelineRedis(1)), res, next);
    expect(res.headers['X-RateLimit-Limit']).toBe(String(Number(process.env.RATE_LIMIT_ANON_MAX) || 30));
    expect(next).toHaveBeenCalled();
  });

  test('anonLimiter uses anon max', async () => {
    const next = jest.fn();
    const res = makeRes();
    await anonLimiter(makeReq(makePipelineRedis(1)), res, next);
    expect(res.headers['X-RateLimit-Limit']).toBe(String(Number(process.env.RATE_LIMIT_ANON_MAX) || 30));
    expect(next).toHaveBeenCalled();
  });
});
