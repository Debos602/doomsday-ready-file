const ApiError = require('../../common/errors/ApiError');
const repo = require('./movies.repository');
const { validateMovie } = require('./movies.validation');
const { wouldCreateCycle, rewatchOrder } = require('./movies.graph');

const toDto = (m) => ({
  id: m.id,
  title: m.title,
  releaseYear: m.releaseYear,
  runtime: m.runtime,
  watched: m.watched,
  prerequisites: m.prerequisites.map((p) => p.id).sort((a, b) => a - b),
});

const toPrereqMap = (movies) => new Map(movies.map((m) => [m.id, m.prerequisites.map((p) => p.id)]));

async function assertPrerequisitesExist(ids, db) {
  if (ids.length === 0) return;
  if ((await repo.countByIds(ids, db)) !== ids.length) {
    throw ApiError.badRequest('One or more prerequisite movies do not exist');
  }
}

async function list() {
  return (await repo.findAll()).map(toDto);
}

async function getById(id) {
  const movie = await repo.findById(id);
  if (!movie) throw ApiError.notFound('Movie not found');
  return toDto(movie);
}

/** Creates one movie or an array of movies. Returns an array of created movies. */
async function create(body) {
  const items = Array.isArray(body) ? body : [body];
  if (Array.isArray(body) && items.length === 0) throw ApiError.badRequest('Provide at least one movie');
  const payloads = items.map((b) => validateMovie(b));

  return repo.transaction(async (tx) => {
    const created = [];
    for (const { prerequisites = [], watched = false, ...data } of payloads) {
      await assertPrerequisitesExist(prerequisites, tx);
      // A brand-new movie has no dependents yet, so it cannot be part of a cycle.
      created.push(toDto(await repo.create({ ...data, watched }, prerequisites, tx)));
    }
    return created;
  });
}

async function update(id, body) {
  const { prerequisites, ...data } = validateMovie(body, { partial: true });

  if (!(await repo.findById(id))) throw ApiError.notFound('Movie not found');

  if (prerequisites !== undefined) {
    await assertPrerequisitesExist(prerequisites);
    const prereqMap = toPrereqMap(await repo.findAll());
    if (wouldCreateCycle(id, prerequisites, prereqMap)) {
      throw ApiError.conflict(
        'CIRCULAR_DEPENDENCY',
        'This change would make a movie depend on itself, directly or through other movies'
      );
    }
  }

  return toDto(await repo.update(id, data, prerequisites));
}

async function getRewatchOrder(id) {
  const all = await repo.findAll();
  const byId = new Map(all.map((m) => [m.id, m]));
  const target = byId.get(id);
  if (!target) throw ApiError.notFound('Movie not found');

  const order = rewatchOrder(id, toPrereqMap(all)).map((mid) => {
    const m = byId.get(mid);
    return { id: m.id, title: m.title, releaseYear: m.releaseYear, runtime: m.runtime, watched: m.watched };
  });

  return {
    movie: { id: target.id, title: target.title },
    order,
    totalCount: order.length,
    watchedCount: order.filter((m) => m.watched).length,
    unwatchedRuntime: order.filter((m) => !m.watched).reduce((sum, m) => sum + m.runtime, 0),
  };
}

module.exports = { list, getById, create, update, getRewatchOrder };
