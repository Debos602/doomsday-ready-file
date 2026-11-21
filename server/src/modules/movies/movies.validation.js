const ApiError = require('../../common/errors/ApiError');
const { isInt, isPlainObject, parseIntInRange } = require('../../common/utils/validators');

/**
 * Validates a movie payload. With { partial: true } every field is optional (PATCH).
 * Prerequisites may be sent as `prerequisites` or `prerequisiteIds` (array of movie ids).
 */
function validateMovie(body, { partial = false } = {}) {
  if (!isPlainObject(body)) throw ApiError.badRequest('Request body must be a JSON object');
  const out = {};

  if (!partial || body.title !== undefined) {
    if (typeof body.title !== 'string' || body.title.trim() === '') {
      throw ApiError.badRequest('title is required and must be a non-empty string');
    }
    const title = body.title.trim();
    if (title.length > 200) throw ApiError.badRequest('title must be at most 200 characters');
    out.title = title;
  }

  if (!partial || body.releaseYear !== undefined) {
    out.releaseYear = parseIntInRange(body.releaseYear, 1888, 2100, 'releaseYear');
  }

  if (!partial || body.runtime !== undefined) {
    out.runtime = parseIntInRange(body.runtime, 1, 300, 'runtime');
  }

  if (body.watched !== undefined) {
    if (typeof body.watched !== 'boolean') throw ApiError.badRequest('watched must be true or false');
    out.watched = body.watched;
  }

  const rawPrereqs = body.prerequisites !== undefined ? body.prerequisites : body.prerequisiteIds;
  if (rawPrereqs !== undefined) {
    if (!Array.isArray(rawPrereqs)) throw ApiError.badRequest('prerequisites must be an array of movie ids');
    const ids = rawPrereqs.map((v) => {
      const n = typeof v === 'string' && /^\d+$/.test(v) ? Number(v) : v;
      if (!isInt(n) || n < 1) throw ApiError.badRequest('prerequisites must contain positive integer movie ids');
      return n;
    });
    out.prerequisites = [...new Set(ids)];
  }

  if (partial && Object.keys(out).length === 0) {
    throw ApiError.badRequest('Provide at least one field to update');
  }
  return out;
}

module.exports = { validateMovie };
