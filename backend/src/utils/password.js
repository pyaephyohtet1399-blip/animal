const crypto = require('crypto');
const bcrypt = require('bcrypt');

const BCRYPT_ROUNDS = 12;
const PASSWORD_CHARS = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';

const genDefaultPassword = (len = 10) =>
  Array.from({ length: len }, () => PASSWORD_CHARS[crypto.randomInt(PASSWORD_CHARS.length)]).join('');

const hashPassword = (plainPassword) => bcrypt.hash(plainPassword, BCRYPT_ROUNDS);

const comparePassword = (plainPassword, passwordHash) => bcrypt.compare(plainPassword, passwordHash);

const validateNewPassword = (newPassword, { oldPassword, loginCode } = {}) => {
  const errors = [];
  if (typeof newPassword !== 'string' || newPassword.length < 8 || newPassword.length > 64) {
    errors.push('Password must be between 8 and 64 characters');
    return errors;
  }
  if (!/[a-zA-Z]/.test(newPassword)) {
    errors.push('Password must contain at least one letter');
  }
  if (!/\d/.test(newPassword)) {
    errors.push('Password must contain at least one digit');
  }
  if (oldPassword && newPassword === oldPassword) {
    errors.push('New password must differ from the old password');
  }
  if (loginCode && newPassword.toUpperCase() === loginCode.toUpperCase()) {
    errors.push('New password must not equal the login code');
  }
  return errors;
};

module.exports = { genDefaultPassword, hashPassword, comparePassword, validateNewPassword, BCRYPT_ROUNDS };
