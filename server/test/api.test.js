// API smoke tests against an in-memory fake of the Prisma client (no database needed).
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

function makeFakePrisma() {
  const movies = [];
  const cinemas = [];
  let mid = 1;
  let cid = 1;
  const out = (m) => ({ ...m, prerequisites: [...m.prereqs].map((id) => ({ id })) });
  const find = (where) => movies.find((m) => (where.id !== undefined ? m.id === where.id : m.title === where.title));
  const fake = {
    movie: {
      findMany: async () => movies.map(out),
      findUnique: async ({ where }) => { const m = find(where); return m ? out(m) : null; },
      count: async ({ where }) => movies.filter((m) => where.id.in.includes(m.id)).length,
      create: async ({ data }) => {
        if (movies.some((m) => m.title === data.title)) throw Object.assign(new Error('dup'), { code: 'P2002', meta: { target: ['title'] } });
        const m = { id: mid++, title: data.title, releaseYear: data.releaseYear, runtime: data.runtime, watched: data.watched, prereqs: new Set(data.prerequisites.connect.map((c) => c.id)) };
        movies.push(m);
        return out(m);
      },
      update: async ({ where, data }) => {
        const m = find(where);
        for (const k of ['title', 'releaseYear', 'runtime', 'watched']) if (data[k] !== undefined) m[k] = data[k];
        if (data.prerequisites) m.prereqs = new Set(data.prerequisites.set.map((c) => c.id));
        return out(m);
      },
    },
    cinema: {
      create: async ({ data }) => {
        if (cinemas.some((c) => c.name === data.name)) throw Object.assign(new Error('dup'), { code: 'P2002', meta: { target: ['name'] } });
        const c = { id: cid++, ...data };
        cinemas.push(c);
        return c;
      },
      findMany: async () => cinemas,
      findUnique: async ({ where }) => cinemas.find((c) => c.id === where.id) || null,
    },
    $transaction: async (arg) => (typeof arg === 'function' ? arg(fake) : Promise.all(arg)),
  };
  return fake;
}

const dbPath = require.resolve('../src/config/db');
require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: makeFakePrisma() };
const app = require('../src/app');

let server;
let base;
test.before(async () => {
  await new Promise((r) => { server = app.listen(0, r); });
  base = `http://127.0.0.1:${server.address().port}/api`;
});
test.after(() => server.close());

const call = async (method, p, body) => {
  const res = await fetch(base + p, { method, headers: { 'Content-Type': 'application/json' }, body: body && JSON.stringify(body) });
  return { status: res.status, body: await res.json() };
};

test('movies, rewatch order, circular dependency, bookings', async () => {
  const mk = (title, y, rt, pre = []) => ({ title, releaseYear: y, runtime: rt, prerequisites: pre });
  const r = await call('POST', '/movies', [
    mk('Iron Man', 2008, 126), mk('First Avenger', 2011, 124), mk('The Avengers', 2012, 143, [1, 2]),
    mk('Civil War', 2016, 147, [3]), mk('Ragnarok', 2017, 130), mk('Infinity War', 2018, 149, [4, 5]),
    mk('Endgame', 2019, 181, [6]), mk('Doomsday', 2026, 150, [7]),
  ]);
  assert.equal(r.status, 201);
  assert.equal(r.body.length, 8);

  let o = await call('GET', '/movies/8/rewatch-order');
  assert.deepEqual(o.body.order.map((m) => m.id), [1, 2, 3, 4, 5, 6, 7]);
  assert.equal(o.body.watchedCount, 0);
  assert.equal(o.body.unwatchedRuntime, 126 + 124 + 143 + 147 + 130 + 149 + 181);

  const p = await call('PATCH', '/movies/1', { watched: true });
  assert.equal(p.body.watched, true);
  o = await call('GET', '/movies/8/rewatch-order');
  assert.equal(o.body.watchedCount, 1);
  assert.equal(o.body.unwatchedRuntime, 124 + 143 + 147 + 130 + 149 + 181);

  o = await call('GET', '/movies/4/rewatch-order');
  assert.deepEqual(o.body.order.map((m) => m.id), [1, 2, 3]);
  o = await call('GET', '/movies/5/rewatch-order');
  assert.deepEqual(o.body.order, []);

  const cyc = await call('PATCH', '/movies/1', { prerequisites: [7] });
  assert.equal(cyc.status, 409);
  assert.equal(cyc.body.error.code, 'CIRCULAR_DEPENDENCY');
  const self = await call('PATCH', '/movies/3', { prerequisites: [3] });
  assert.equal(self.status, 409);

  assert.equal((await call('PATCH', '/movies/5', { prerequisites: [1] })).status, 200);
  assert.equal((await call('POST', '/movies', mk('Iron Man', 2008, 126))).status, 409);
  assert.equal((await call('POST', '/movies', mk('Long', 2020, 301))).status, 400);
  assert.equal((await call('POST', '/movies', mk('Bad prereq', 2020, 100, [99]))).status, 400);
  assert.equal((await call('GET', '/movies/99/rewatch-order')).status, 404);
  assert.equal((await call('PATCH', '/movies/1', {})).status, 400);

  const cin = await call('POST', '/cinemas', [
    { name: 'A', bundleSizes: [1, 3, 4] }, { name: 'B', bundleSizes: [2, 5] },
    { name: 'C', bundleSizes: [6, 9, 20] }, { name: 'D', bundleSizes: [4, 6] },
  ]);
  assert.equal(cin.status, 201);
  let b = await call('GET', '/cinemas/1/booking?groupSize=6');
  assert.deepEqual([b.body.possible, b.body.totalBundles, b.body.bundles], [true, 2, [{ size: 3, count: 2 }]]);
  b = await call('GET', '/cinemas/2/booking?groupSize=11');
  assert.deepEqual(b.body.bundles, [{ size: 5, count: 1 }, { size: 2, count: 3 }]);
  b = await call('GET', '/cinemas/3/booking?groupSize=44');
  assert.equal(b.body.totalBundles, 4);
  b = await call('GET', '/cinemas/4/booking?groupSize=7');
  assert.equal(b.body.possible, false);
  assert.equal((await call('GET', '/cinemas/1/booking?groupSize=0')).status, 400);
  assert.equal((await call('GET', '/cinemas/1/booking?groupSize=10001')).status, 400);
  assert.equal((await call('GET', '/cinemas/1/booking')).status, 400);
  assert.equal((await call('GET', '/cinemas/99/booking?groupSize=3')).status, 404);
  assert.equal((await call('POST', '/cinemas', { name: 'X', bundleSizes: [] })).status, 400);
  assert.equal((await call('POST', '/cinemas', { name: 'X', bundleSizes: [501] })).status, 400);
  assert.equal((await call('POST', '/cinemas', { name: 'A', bundleSizes: [2] })).status, 409);
});
