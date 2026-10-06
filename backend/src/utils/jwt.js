const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const generateTokens = (user) => {
  const accessToken = jwt.sign(
    {
      userId: user._id,
      loginCode: user.loginCode,
      role: user.role,
      districtCode: user.districtCode || null,
      tspCode: user.tspCode || null,
      tvgCode: user.tvgCode || null,
      wvCode: user.wvCode || null,
      mustChangePassword: Boolean(user.mustChangePassword)
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_ACCESS_TTL || '15m' }
  );
  const refreshToken = jwt.sign(
    { userId: user._id, jti: crypto.randomUUID() },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_TTL || '7d' }
  );
  return { accessToken, refreshToken };
};

const verifyAccessToken = (token) => jwt.verify(token, process.env.JWT_SECRET);

const verifyRefreshToken = (token) => jwt.verify(token, process.env.JWT_REFRESH_SECRET);

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

module.exports = { generateTokens, verifyAccessToken, verifyRefreshToken, hashToken };
