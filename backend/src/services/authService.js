const jwt = require('jsonwebtoken');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const AuditLog = require('../models/AuditLog');
const ApiError = require('../utils/apiError');
const logger = require('../utils/logger');
const { generateTokens, verifyRefreshToken, hashToken } = require('../utils/jwt');
const {
  hashPassword,
  comparePassword,
  genDefaultPassword,
  validateNewPassword
} = require('../utils/password');

const LOCK_MAX_FAILS = 5;
const LOCK_TTL_SECONDS = 900;

const normalizeLoginCode = (value) => String(value).trim().toUpperCase();

const lockKey = (loginCode) => `lock:${loginCode}`;

const writeAudit = (entry) => {
  AuditLog.create(entry).catch((error) => {
    logger.error('Audit log write failed', { message: error.message, action: entry.action });
  });
};

const isLocked = async (redis, loginCode) => {
  const fails = await redis.get(lockKey(loginCode));
  const count = Number(fails || 0);
  if (count < LOCK_MAX_FAILS) return { locked: false };
  const ttl = await redis.pttl(lockKey(loginCode));
  return { locked: true, retryAfter: ttl > 0 ? Math.ceil(ttl / 1000) : LOCK_TTL_SECONDS };
};

const recordFailedAttempt = async (redis, loginCode) => {
  const key = lockKey(loginCode);
  const count = await redis.incr(key);
  if (count === 1 || count >= LOCK_MAX_FAILS) {
    await redis.expire(key, LOCK_TTL_SECONDS);
  }
  return count;
};

const issueTokens = async (user) => {
  const { accessToken, refreshToken } = generateTokens(user);
  const refreshPayload = jwt.decode(refreshToken);
  await RefreshToken.create({
    userId: user._id,
    tokenHash: hashToken(refreshToken),
    expiresAt: new Date(refreshPayload.exp * 1000),
    isActive: true
  });
  const accessPayload = jwt.decode(accessToken);
  return {
    accessToken,
    refreshToken,
    tokenType: 'Bearer',
    expiresIn: accessPayload.exp - accessPayload.iat
  };
};

const revokeAllUserTokens = (userId) =>
  RefreshToken.updateMany({ userId, isActive: true }, { $set: { isActive: false } });

const login = async ({ loginCode: rawLoginCode, password }, { redis, meta }) => {
  const loginCode = normalizeLoginCode(rawLoginCode);
  const lock = await isLocked(redis, loginCode);
  if (lock.locked) {
    const error = new ApiError(
      429,
      'Account temporarily locked due to repeated failed attempts',
      'account_locked'
    );
    error.retryAfter = lock.retryAfter;
    throw error;
  }

  const user = await User.findOne({ loginCode, isActive: true });
  const passwordValid = user ? await comparePassword(password, user.passwordHash) : false;

  if (!user || !passwordValid) {
    await recordFailedAttempt(redis, loginCode);
    writeAudit({
      action: 'login_fail',
      userId: user ? user._id : undefined,
      role: user ? user.role : undefined,
      method: 'POST',
      path: meta.path,
      status: 401,
      ip: meta.ip,
      userAgent: meta.userAgent,
      requestId: meta.requestId
    });
    throw new ApiError(401, 'Invalid login credentials', 'unauthorized');
  }

  await redis.del(lockKey(loginCode));
  await User.updateOne({ _id: user._id }, { $set: { lastLoginAt: new Date() } });
  const tokens = await issueTokens(user);
  writeAudit({
    action: 'login_success',
    userId: user._id,
    role: user.role,
    method: 'POST',
    path: meta.path,
    status: 200,
    ip: meta.ip,
    userAgent: meta.userAgent,
    requestId: meta.requestId
  });
  return { ...tokens, mustChangePassword: user.mustChangePassword, role: user.role };
};

const refresh = async ({ refreshToken }) => {
  try {
    verifyRefreshToken(refreshToken);
  } catch (error) {
    throw new ApiError(401, 'Invalid refresh token', 'unauthorized');
  }

  const tokenHash = hashToken(refreshToken);
  const rotated = await RefreshToken.findOneAndUpdate(
    { tokenHash, isActive: true, expiresAt: { $gt: new Date() } },
    { $set: { isActive: false } }
  );

  if (!rotated) {
    const seen = await RefreshToken.findOne({ tokenHash });
    if (seen) {
      await revokeAllUserTokens(seen.userId);
      throw new ApiError(401, 'Refresh token reuse detected, sessions revoked', 'stale_credentials');
    }
    throw new ApiError(401, 'Invalid refresh token', 'unauthorized');
  }

  const user = await User.findOne({ _id: rotated.userId, isActive: true });
  if (!user) {
    throw new ApiError(401, 'Invalid refresh token', 'unauthorized');
  }

  const tokens = await issueTokens(user);
  return { ...tokens, mustChangePassword: user.mustChangePassword, role: user.role };
};

const logout = async ({ refreshToken }) => {
  await RefreshToken.updateMany(
    { tokenHash: hashToken(refreshToken), isActive: true },
    { $set: { isActive: false } }
  );
  return { loggedOut: true };
};

const changePassword = async (claims, { oldPassword, newPassword }, { redis, meta }) => {
  const user = await User.findOne({ loginCode: normalizeLoginCode(claims.loginCode) });
  if (!user || !user.isActive) {
    throw new ApiError(401, 'Invalid credentials', 'unauthorized');
  }

  const oldPasswordValid = await comparePassword(oldPassword, user.passwordHash);
  if (!oldPasswordValid) {
    throw new ApiError(401, 'Old password is incorrect', 'unauthorized');
  }

  const policyErrors = validateNewPassword(newPassword, {
    oldPassword,
    loginCode: user.loginCode
  });
  if (policyErrors.length > 0) {
    throw new ApiError(
      422,
      'New password does not meet the password policy',
      'validation_error',
      policyErrors.map((message) => ({ field: 'newPassword', message }))
    );
  }

  const passwordHash = await hashPassword(newPassword);
  await User.updateOne(
    { _id: user._id },
    { $set: { passwordHash, mustChangePassword: false } }
  );
  await revokeAllUserTokens(user._id);
  await redis.del(lockKey(user.loginCode));
  writeAudit({
    action: 'password_change',
    userId: user._id,
    role: user.role,
    method: 'POST',
    path: meta.path,
    status: 200,
    ip: meta.ip,
    userAgent: meta.userAgent,
    requestId: meta.requestId
  });
  return { mustChangePassword: false };
};

const resetPassword = async ({ loginCode: rawLoginCode }, { redis, meta }) => {
  const loginCode = normalizeLoginCode(rawLoginCode);
  const user = await User.findOne({ loginCode, isActive: true });
  if (!user) {
    throw new ApiError(404, 'User not found', 'not_found');
  }

  const newPassword = genDefaultPassword();
  const passwordHash = await hashPassword(newPassword);
  await User.updateOne({ _id: user._id }, { $set: { passwordHash } });
  await revokeAllUserTokens(user._id);
  await redis.del(lockKey(user.loginCode));
  writeAudit({
    action: 'password_reset',
    userId: user._id,
    role: user.role,
    method: 'POST',
    path: meta.path,
    status: 200,
    ip: meta.ip,
    userAgent: meta.userAgent,
    requestId: meta.requestId
  });
  return { loginCode: user.loginCode, newPassword };
};

module.exports = {
  login,
  refresh,
  logout,
  changePassword,
  resetPassword,
  normalizeLoginCode
};
