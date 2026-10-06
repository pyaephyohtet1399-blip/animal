const morgan = require('morgan');
const logger = require('../utils/logger');

const stream = {
  write: (message) => logger.info(message.trim())
};

morgan.token('user', (req) => (req.user ? req.user.loginCode : 'anonymous'));
morgan.token('role', (req) => (req.user ? req.user.role : '-'));

const requestLogger = morgan(
  ':method :url :status :res[content-length] - :response-time ms - :user (:role)',
  { stream }
);

module.exports = requestLogger;
