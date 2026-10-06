class ApiError extends Error {
  constructor(statusCode, message, code = 'internal_error', details = undefined) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

module.exports = ApiError;
