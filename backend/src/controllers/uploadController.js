const ApiError = require('../utils/apiError');
const uploadService = require('../services/uploadService');

const GZIP_ENCODINGS = ['gzip', 'deflate'];

const upload = async (req, res, next) => {
  try {
    if (!req.rawBody) {
      throw new ApiError(400, 'Raw upload body is unavailable', 'invalid_json');
    }
    const response = await uploadService.upload(req.user, req.body, {
      rawBody: req.rawBody,
      contentHash: req.headers['x-content-hash'],
      compressed: GZIP_ENCODINGS.includes(
        String(req.headers['content-encoding'] || '').toLowerCase()
      ),
      redis: req.app.locals.redis
    });
    return res.json(response);
  } catch (error) {
    return next(error);
  }
};

const status = async (req, res, next) => {
  try {
    const data = await uploadService.status(req.user, req.params.contentHash);
    return res.json({ data });
  } catch (error) {
    return next(error);
  }
};

module.exports = { upload, status };
