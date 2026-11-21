const express = require('express');
const prisma = require('../db');
const { badRequest, notFound, conflict } = require('../lib/errors');
const { parseId, validateMovie } = require('../lib/validate');
const { wouldCreateCycle, rewatchOrder } = require('../lib/graph');

const router = express.Router();

const include = { prerequisites: { select: { id: true } } };

const serialize = (m) => ({
  id: m.id,
  title: m.title,
  releaseYear: m.releaseYear,
  runtime: m.runtime,
  watched: m.watched,
  prerequisites: m.prerequisites.map((p) => p.id).sort((a, b) => a - b),
});

async function loadPrereqMap(db = prisma) {
  const all = await db.movie.findMany({ select: { id: true, prerequisites: { select: { id: true } } } });
  return new Map(all.map((m) => [m.id, m.prerequisites.map((p) => p.id)]));
}

async function assertPrerequisitesExist(ids, db = prisma) {
  if (ids.length === 0) return;
  const found = await db.movie.count({ where: { id: { in: ids } } });
  if (found !== ids.length) throw badRequest('One or more prerequisite movies do not exist');
}

// Create one movie, or an array of movies.
router.post('/', async (req, res) => {
  const isBatch = Array.isArray(req.body);
  const payloads = (isBatch ? req.body : [req.body]).map((b) => validateMovie(b));
  if (isBatch && payloads.length === 0) throw badRequest('Provide at least one movie');

  const created = await prisma.$transaction(async (tx) => {
    const result = [];
    for (const p of payloads) {
      const prereqs = p.prerequisites || [];
      await assertPrerequisitesExist(prereqs, tx);
      // A brand-new movie has no dependents yet, so it cannot be part of a cycle.
      const movie = await tx.movie.create({
        data: {
          title: p.title,
          releaseYear: p.releaseYear,
          runtime: p.runtime,
          watched: p.watched ?? false,
          prerequisites: { connect: prereqs.map((id) => ({ id })) },
        },
        include,
      });
      result.push(serialize(movie));
    }
    return result;
  });

  res.status(201).json(isBatch ? created : created[0]);
});

router.get('/', async (_req, res) => {
  const movies = await prisma.movie.findMany({ include, orderBy: { id: 'asc' } });
  res.json(movies.map(serialize));
});

router.get('/:id', async (req, res) => {
  const id = parseId(req.params.id);
  const movie = await prisma.movie.findUnique({ where: { id }, include });
  if (!movie) throw notFound('Movie not found');
  res.json(serialize(movie));
});

router.patch('/:id', async (req, res) => {
  const id = parseId(req.params.id);
  const data = validateMovie(req.body, { partial: true });

  const existing = await prisma.movie.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw notFound('Movie not found');

  const update = {};
  for (const key of ['title', 'releaseYear', 'runtime', 'watched']) {
    if (data[key] !== undefined) update[key] = data[key];
  }

  if (data.prerequisites !== undefined) {
    await assertPrerequisitesExist(data.prerequisites);
    const prereqMap = await loadPrereqMap();
    if (wouldCreateCycle(id, data.prerequisites, prereqMap)) {
      throw conflict(
        'CIRCULAR_DEPENDENCY',
        'This change would make a movie depend on itself, directly or through other movies'
      );
    }
    update.prerequisites = { set: data.prerequisites.map((pid) => ({ id: pid })) };
  }

  const movie = await prisma.movie.update({ where: { id }, data: update, include });
  res.json(serialize(movie));
});

router.get('/:id/rewatch-order', async (req, res) => {
  const id = parseId(req.params.id);
  const all = await prisma.movie.findMany({ include, orderBy: { id: 'asc' } });
  const byId = new Map(all.map((m) => [m.id, m]));
  const target = byId.get(id);
  if (!target) throw notFound('Movie not found');

  const prereqMap = new Map(all.map((m) => [m.id, m.prerequisites.map((p) => p.id)]));
  const order = rewatchOrder(id, prereqMap).map((mid) => {
    const m = byId.get(mid);
    return { id: m.id, title: m.title, releaseYear: m.releaseYear, runtime: m.runtime, watched: m.watched };
  });

  res.json({
    movie: { id: target.id, title: target.title },
    order,
    totalCount: order.length,
    watchedCount: order.filter((m) => m.watched).length,
    unwatchedRuntime: order.filter((m) => !m.watched).reduce((sum, m) => sum + m.runtime, 0),
  });
});

module.exports = router;
