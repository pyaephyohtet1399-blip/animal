const assignOwn = (req, key, value) => {
  if (value === undefined) return;
  Object.defineProperty(req, key, {
    value,
    writable: true,
    enumerable: true,
    configurable: true
  });
};

const validate = (schema) => (req, res, next) => {
  try {
    const parsed = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
      headers: req.headers
    });
    assignOwn(req, 'body', parsed.body);
    assignOwn(req, 'query', parsed.query);
    assignOwn(req, 'params', parsed.params);
    return next();
  } catch (error) {
    return res.status(422).json({
      error: {
        code: 'validation_error',
        message: 'Request validation failed',
        details: error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }))
      }
    });
  }
};

module.exports = validate;
