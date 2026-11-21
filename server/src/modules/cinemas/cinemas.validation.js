const ApiError = require('../../common/errors/ApiError');
const { isInt, isPlainObject } = require('../../common/utils/validators');

function validateCinema(body) {
  if (!isPlainObject(body)) throw ApiError.badRequest('Request body must be a JSON object');

  if (typeof body.name !== 'string' || body.name.trim() === '') {
    throw ApiError.badRequest('name is required and must be a non-empty string');
  }
  const name = body.name.trim();
  if (name.length > 200) throw ApiError.badRequest('name must be at most 200 characters');

  if (!Array.isArray(body.bundleSizes)) throw ApiError.badRequest('bundleSizes must be an array of integers');
  const sizes = body.bundleSizes.map((v) => {
    const n = typeof v === 'string' && /^\d+$/.test(v.trim()) ? Number(v) : v;
    if (!isInt(n) || n < 1 || n > 500) {
      throw ApiError.badRequest('each bundle size must be an integer between 1 and 500');
    }
    return n;
  });
  // "Different" sizes: duplicates are collapsed, order is normalised.
  const bundleSizes = [...new Set(sizes)].sort((a, b) => a - b);
  if (bundleSizes.length < 1 || bundleSizes.length > 10) {
    throw ApiError.badRequest('a cinema must have between 1 and 10 different bundle sizes');
  }
  return { name, bundleSizes };
}

module.exports = { validateCinema };
