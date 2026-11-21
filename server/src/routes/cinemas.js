const express = require('express');
const prisma = require('../db');
const { badRequest, notFound } = require('../lib/errors');
const { parseId, parseIntInRange, validateCinema } = require('../lib/validate');
const { minBundles } = require('../lib/booking');

const router = express.Router();

const serialize = (c) => ({ id: c.id, name: c.name, bundleSizes: [...c.bundleSizes].sort((a, b) => a - b) });

// Create one cinema, or an array of cinemas.
router.post('/', async (req, res) => {
  const isBatch = Array.isArray(req.body);
  const payloads = (isBatch ? req.body : [req.body]).map((b) => validateCinema(b));
  if (isBatch && payloads.length === 0) throw badRequest('Provide at least one cinema');

  const created = await prisma.$transaction(payloads.map((data) => prisma.cinema.create({ data })));
  const result = created.map(serialize);
  res.status(201).json(isBatch ? result : result[0]);
});

router.get('/', async (_req, res) => {
  const cinemas = await prisma.cinema.findMany({ orderBy: { id: 'asc' } });
  res.json(cinemas.map(serialize));
});

router.get('/:id/booking', async (req, res) => {
  const id = parseId(req.params.id);
  if (req.query.groupSize === undefined) throw badRequest('groupSize query parameter is required');
  const groupSize = parseIntInRange(String(req.query.groupSize), 1, 10000, 'groupSize');

  const cinema = await prisma.cinema.findUnique({ where: { id } });
  if (!cinema) throw notFound('Cinema not found');

  const quote = minBundles(cinema.bundleSizes, groupSize);
  const base = { cinema: { id: cinema.id, name: cinema.name }, groupSize };

  if (!quote) {
    return res.json({
      ...base,
      possible: false,
      totalBundles: null,
      bundles: [],
      message: `No exact combination of bundles adds up to ${groupSize} seats`,
    });
  }
  res.json({ ...base, possible: true, totalBundles: quote.totalBundles, bundles: quote.bundles });
});

module.exports = router;
