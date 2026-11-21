const test = require('node:test');
const assert = require('node:assert/strict');
const { wouldCreateCycle, rewatchOrder } = require('../src/modules/movies/movies.graph');
const { minBundles } = require('../src/modules/cinemas/cinemas.bundles');

// Sample data (ids 1..8) from the assessment.
const NAMES = {
  1: 'Iron Man', 2: 'First Avenger', 3: 'The Avengers', 4: 'Civil War',
  5: 'Ragnarok', 6: 'Infinity War', 7: 'Endgame', 8: 'Doomsday',
};
const graph = () =>
  new Map([
    [1, []], [2, []], [3, [1, 2]], [4, [3]], [5, []], [6, [4, 5]], [7, [6]], [8, [7]],
  ]);
const names = (ids) => ids.map((i) => NAMES[i]);

function assertValidOrder(order, map) {
  const pos = new Map(order.map((id, i) => [id, i]));
  assert.equal(pos.size, order.length, 'each movie exactly once');
  for (const id of order) {
    for (const p of map.get(id)) assert.ok(pos.get(p) < pos.get(id), `${p} before ${id}`);
  }
}

test('rewatch order for Doomsday: all 7 others, valid order', () => {
  const order = rewatchOrder(8, graph());
  assert.deepEqual(names(order), [
    'Iron Man', 'First Avenger', 'The Avengers', 'Civil War', 'Ragnarok', 'Infinity War', 'Endgame',
  ]);
  assertValidOrder(order, graph());
});

test('rewatch order for Civil War', () => {
  assert.deepEqual(names(rewatchOrder(4, graph())), ['Iron Man', 'First Avenger', 'The Avengers']);
});

test('rewatch order for Ragnarok is empty', () => {
  assert.deepEqual(rewatchOrder(5, graph()), []);
});

test('diamond dependencies appear once and never include the target', () => {
  const g = new Map([[1, []], [2, [1]], [3, [1]], [4, [2, 3]]]);
  const order = rewatchOrder(4, g);
  assert.deepEqual([...order].sort(), [1, 2, 3]);
  assert.ok(!order.includes(4));
  assertValidOrder(order, g);
});

test('Endgame as prerequisite of Iron Man is circular', () => {
  assert.equal(wouldCreateCycle(1, [7], graph()), true);
});

test('self dependency is circular', () => {
  assert.equal(wouldCreateCycle(3, [3], graph()), true);
});

test('valid changes are not flagged', () => {
  assert.equal(wouldCreateCycle(5, [1], graph()), false); // Ragnarok after Iron Man
  assert.equal(wouldCreateCycle(8, [7, 5], graph()), false);
  assert.equal(wouldCreateCycle(3, [], graph()), false);
});

test('very long chain does not overflow the stack', () => {
  const n = 50000;
  const g = new Map();
  for (let i = 1; i <= n; i++) g.set(i, i === 1 ? [] : [i - 1]);
  assert.equal(rewatchOrder(n, g).length, n - 1);
  assert.equal(wouldCreateCycle(1, [n], g), true);
});

const quote = (sizes, n) => minBundles(sizes, n);

test('booking: 1,3,4 for 6 -> 2 bundles (3 x 2)', () => {
  assert.deepEqual(quote([1, 3, 4], 6), { totalBundles: 2, bundles: [{ size: 3, count: 2 }] });
});

test('booking: 2,5 for 11 -> 4 bundles (5 x 1, 2 x 3)', () => {
  assert.deepEqual(quote([2, 5], 11), {
    totalBundles: 4,
    bundles: [{ size: 5, count: 1 }, { size: 2, count: 3 }],
  });
});

test('booking: 6,9,20 for 44 -> 4 bundles (20, 9 x 2, 6)', () => {
  assert.deepEqual(quote([6, 9, 20], 44), {
    totalBundles: 4,
    bundles: [{ size: 20, count: 1 }, { size: 9, count: 2 }, { size: 6, count: 1 }],
  });
});

test('booking: 4,6 for 7 -> not possible', () => {
  assert.equal(quote([4, 6], 7), null);
});

test('booking: greedy trap and large group', () => {
  assert.equal(quote([1, 3, 4], 6).totalBundles, 2); // greedy would give 3
  const big = quote([1, 500], 10000);
  assert.deepEqual(big, { totalBundles: 20, bundles: [{ size: 500, count: 20 }] });
  assert.equal(quote([7], 10000), null);
  assert.equal(quote([5], 1), null);
});
