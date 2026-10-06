const mongoose = require('mongoose');
const { health, ready } = require('../../src/controllers/healthController');

const buildRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('healthController', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  test('health returns 200 process info', () => {
    const res = buildRes();
    health({}, res);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'ok', uptime: expect.any(Number) })
    );
  });

  test('ready returns 200 when mongo and redis connected', async () => {
    Object.defineProperty(mongoose.connection, 'readyState', { value: 1, configurable: true });
    Object.defineProperty(mongoose.connection, 'db', {
      value: { admin: () => ({ ping: jest.fn().mockResolvedValue({ ok: 1 }) }) },
      configurable: true
    });
    const req = { app: { locals: { redis: { ping: jest.fn().mockResolvedValue('PONG') } } } };
    const res = buildRes();
    await ready(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'ok', database: 'connected', redis: 'connected' })
    );
  });

  test('ready returns 503 when redis missing', async () => {
    Object.defineProperty(mongoose.connection, 'readyState', { value: 1, configurable: true });
    Object.defineProperty(mongoose.connection, 'db', {
      value: { admin: () => ({ ping: jest.fn().mockResolvedValue({ ok: 1 }) }) },
      configurable: true
    });
    const req = { app: { locals: {} } };
    const res = buildRes();
    await ready(req, res);
    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'error', redis: 'disconnected' })
    );
  });

  test('ready returns 503 when mongo not connected', async () => {
    Object.defineProperty(mongoose.connection, 'readyState', { value: 0, configurable: true });
    const req = { app: { locals: { redis: { ping: jest.fn().mockResolvedValue('PONG') } } } };
    const res = buildRes();
    await ready(req, res);
    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'error', database: 'disconnected' })
    );
  });
});
