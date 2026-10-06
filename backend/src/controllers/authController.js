const authService = require('../services/authService');
const ApiError = require('../utils/apiError');

const requestMeta = (req) => ({
  ip: req.ip,
  userAgent: req.headers['user-agent'],
  requestId: req.id,
  path: req.originalUrl
});

const handleAuthError = (req, res, next) => (error) => {
  if (error instanceof ApiError && error.retryAfter) {
    res.set('Retry-After', String(error.retryAfter));
  }
  return next(error);
};

const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body, {
      redis: req.app.locals.redis,
      meta: requestMeta(req)
    });
    return res.json({ data: result });
  } catch (error) {
    return handleAuthError(req, res, next)(error);
  }
};

const refresh = async (req, res, next) => {
  try {
    const result = await authService.refresh(req.body);
    return res.json({ data: result });
  } catch (error) {
    return handleAuthError(req, res, next)(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const result = await authService.logout(req.body);
    return res.json({ data: result });
  } catch (error) {
    return handleAuthError(req, res, next)(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const result = await authService.changePassword(req.user, req.body, {
      redis: req.app.locals.redis,
      meta: requestMeta(req)
    });
    return res.json({ data: result });
  } catch (error) {
    return handleAuthError(req, res, next)(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const result = await authService.resetPassword(req.body, {
      redis: req.app.locals.redis,
      meta: requestMeta(req)
    });
    return res.json({ data: result });
  } catch (error) {
    return handleAuthError(req, res, next)(error);
  }
};

module.exports = { login, refresh, logout, changePassword, resetPassword };
