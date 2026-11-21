const ApiError = require('../../common/errors/ApiError');
const { parseIntInRange } = require('../../common/utils/validators');
const repo = require('./cinemas.repository');
const { validateCinema } = require('./cinemas.validation');
const { minBundles } = require('./cinemas.bundles');

const toDto = (c) => ({ id: c.id, name: c.name, bundleSizes: [...c.bundleSizes].sort((a, b) => a - b) });

async function list() {
  return (await repo.findAll()).map(toDto);
}

/** Creates one cinema or an array of cinemas. Returns an array of created cinemas. */
async function create(body) {
  const items = Array.isArray(body) ? body : [body];
  if (Array.isArray(body) && items.length === 0) throw ApiError.badRequest('Provide at least one cinema');
  const payloads = items.map(validateCinema);
  return (await repo.createMany(payloads)).map(toDto);
}

async function getBookingQuote(id, rawGroupSize) {
  if (rawGroupSize === undefined) throw ApiError.badRequest('groupSize query parameter is required');
  const groupSize = parseIntInRange(String(rawGroupSize), 1, 10000, 'groupSize');

  const cinema = await repo.findById(id);
  if (!cinema) throw ApiError.notFound('Cinema not found');

  const base = { cinema: { id: cinema.id, name: cinema.name }, groupSize };
  const quote = minBundles(cinema.bundleSizes, groupSize);

  if (!quote) {
    return {
      ...base,
      possible: false,
      totalBundles: null,
      bundles: [],
      message: `No exact combination of bundles adds up to ${groupSize} seats`,
    };
  }
  return { ...base, possible: true, totalBundles: quote.totalBundles, bundles: quote.bundles };
}

module.exports = { list, create, getBookingQuote };
