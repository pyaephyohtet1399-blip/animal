const winston = require('winston');

const transports = [new winston.transports.Console()];
if (process.env.NODE_ENV !== 'test') {
  transports.push(
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  );
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  defaultMeta: { service: 'livestock-survey' },
  transports,
  silent: process.env.NODE_ENV === 'test'
});

module.exports = logger;
