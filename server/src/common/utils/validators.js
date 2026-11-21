const ApiError = require('../errors/ApiError');

const isInt = (v) => typeof v === 'number' && Number.isInteger(v);
const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

function parseId(raw, label = 'id') {
  if (!/^\d+$/.test(String(raw))) throw ApiError.badRequest(`${label} must be a positive integer`);
  const id = Number(raw);
  if (!Number.isSafeInteger(id) || id < 1) throw ApiError.badRequest(`${label} must be a positive integer`);
  return id;
}

function parseIntInRange(value, min, max, label) {
  const n = typeof value === 'string' && /^-?\d+$/.test(value.trim()) ? Number(value) : value;
  if (!isInt(n) || n < min || n > max) {
    throw ApiError.badRequest(`${label} must be an integer between ${min} and ${max}`);
  }
  return n;
}

module.exports = { isInt, isPlainObject, parseId, parseIntInRange };
