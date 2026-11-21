const { badRequest } = require('./errors');

const isInt = (v) => typeof v === 'number' && Number.isInteger(v);
const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

function parseId(raw, label = 'id') {
  if (!/^\d+$/.test(String(raw))) throw badRequest(`${label} must be a positive integer`);
  const id = Number(raw);
  if (!Number.isSafeInteger(id) || id < 1) throw badRequest(`${label} must be a positive integer`);
  return id;
}

function parseIntInRange(value, min, max, label) {
  const n = typeof value === 'string' && /^-?\d+$/.test(value.trim()) ? Number(value) : value;
  if (!isInt(n) || n < min || n > max) {
    throw badRequest(`${label} must be an integer between ${min} and ${max}`);
  }
  return n;
}

/**
 * Validates a movie payload. With { partial: true } every field is optional (PATCH).
 * Prerequisites may be sent as `prerequisites` or `prerequisiteIds` (array of movie ids).
 */
function validateMovie(body, { partial = false } = {}) {
  if (!isPlainObject(body)) throw badRequest('Request body must be a JSON object');
  const out = {};

  if (!partial || body.title !== undefined) {
    if (typeof body.title !== 'string' || body.title.trim() === '') {
      throw badRequest('title is required and must be a non-empty string');
    }
    const title = body.title.trim();
    if (title.length > 200) throw badRequest('title must be at most 200 characters');
    out.title = title;
  }

  if (!partial || body.releaseYear !== undefined) {
    out.releaseYear = parseIntInRange(body.releaseYear, 1888, 2100, 'releaseYear');
  }

  if (!partial || body.runtime !== undefined) {
    out.runtime = parseIntInRange(body.runtime, 1, 300, 'runtime');
  }

  if (body.watched !== undefined) {
    if (typeof body.watched !== 'boolean') throw badRequest('watched must be true or false');
    out.watched = body.watched;
  }

  const rawPrereqs = body.prerequisites !== undefined ? body.prerequisites : body.prerequisiteIds;
  if (rawPrereqs !== undefined) {
    if (!Array.isArray(rawPrereqs)) throw badRequest('prerequisites must be an array of movie ids');
    const ids = rawPrereqs.map((v) => {
      const n = typeof v === 'string' && /^\d+$/.test(v) ? Number(v) : v;
      if (!isInt(n) || n < 1) throw badRequest('prerequisites must contain positive integer movie ids');
      return n;
    });
    out.prerequisites = [...new Set(ids)];
  }

  if (partial && Object.keys(out).length === 0) {
    throw badRequest('Provide at least one field to update');
  }
  return out;
}

function validateCinema(body) {
  if (!isPlainObject(body)) throw badRequest('Request body must be a JSON object');

  if (typeof body.name !== 'string' || body.name.trim() === '') {
    throw badRequest('name is required and must be a non-empty string');
  }
  const name = body.name.trim();
  if (name.length > 200) throw badRequest('name must be at most 200 characters');

  if (!Array.isArray(body.bundleSizes)) throw badRequest('bundleSizes must be an array of integers');
  const sizes = body.bundleSizes.map((v) => {
    const n = typeof v === 'string' && /^\d+$/.test(v.trim()) ? Number(v) : v;
    if (!isInt(n) || n < 1 || n > 500) {
      throw badRequest('each bundle size must be an integer between 1 and 500');
    }
    return n;
  });
  // "Different" sizes: duplicates are collapsed, order is normalised.
  const bundleSizes = [...new Set(sizes)].sort((a, b) => a - b);
  if (bundleSizes.length < 1 || bundleSizes.length > 10) {
    throw badRequest('a cinema must have between 1 and 10 different bundle sizes');
  }
  return { name, bundleSizes };
}

module.exports = { parseId, parseIntInRange, validateMovie, validateCinema };
