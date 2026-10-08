const zlib = require('zlib');
const ApiError = require('../utils/apiError');

const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;
const UPLOAD_PATHS = new Set(['/api/v1/upload/village']);

const readRawBody = (req) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    let settled = false;
    const fail = (error) => {
      if (settled) return;
      settled = true;
      reject(error);
    };
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_UPLOAD_BYTES) {
        fail(new ApiError(413, 'Upload body exceeds size limit', 'payload_too_large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (settled) return;
      settled = true;
      resolve(Buffer.concat(chunks));
    });
    req.on('error', (error) => fail(error));
  });

const gunzip = (buffer) => {
  try {
    return zlib.gunzipSync(buffer);
  } catch (error) {
    throw new ApiError(400, 'Failed to decompress gzip body', 'invalid_encoding');
  }
};

const inflate = (buffer) => {
  try {
    return zlib.inflateSync(buffer);
  } catch (error) {
    throw new ApiError(400, 'Failed to decompress deflate body', 'invalid_encoding');
  }
};

const uploadBody = async (req, res, next) => {
  if (req.method !== 'POST' || !UPLOAD_PATHS.has(req.path)) return next();
  try {
    const raw = await readRawBody(req);
    const encoding = String(req.headers['content-encoding'] || 'identity').toLowerCase();
    let decoded;
    if (encoding === 'identity' || encoding === '') {
      decoded = raw;
    } else if (encoding === 'gzip') {
      decoded = gunzip(raw);
    } else if (encoding === 'deflate') {
      decoded = inflate(raw);
    } else {
      throw new ApiError(415, 'Unsupported Content-Encoding', 'unsupported_encoding');
    }
    if (decoded.length > MAX_UPLOAD_BYTES) {
      throw new ApiError(413, 'Upload body exceeds size limit', 'payload_too_large');
    }
    let body;
    try {
      body = JSON.parse(decoded.toString('utf8'));
    } catch (error) {
      throw new ApiError(400, 'Body must be valid JSON', 'invalid_json');
    }
    req.rawBody = decoded;
    req.body = body;
    req._body = true;
    return next();
  } catch (error) {
    return next(error);
  }
};

module.exports = uploadBody;
module.exports.MAX_UPLOAD_BYTES = MAX_UPLOAD_BYTES;
