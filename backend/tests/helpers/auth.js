const { generateTokens } = require('../../src/utils/jwt');

const signFor = (user) => generateTokens({ mustChangePassword: false, ...user }).accessToken;

const auth = (token) => ({ Authorization: `Bearer ${token}` });

module.exports = { signFor, auth };
