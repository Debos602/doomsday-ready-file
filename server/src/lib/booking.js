/**
 * Fewest bundles that add up to exactly `groupSize` seats (unbounded coin change).
 * Written by hand (no solver libraries).
 *
 * Dynamic programming over seat counts: best[n] = fewest bundles summing to exactly n.
 * Complexity O(groupSize * sizes) - at most 10,000 * 10 steps.
 *
 * Returns null when no exact combination exists, otherwise
 * { totalBundles, bundles: [{ size, count }] } with sizes in descending order.
 */
function minBundles(bundleSizes, groupSize) {
  // Descending + strict "<" below means that on ties the larger bundle wins,
  // which keeps the answer deterministic.
  const sizes = [...new Set(bundleSizes)].sort((a, b) => b - a);
  const INF = Number.MAX_SAFE_INTEGER;

  const best = new Array(groupSize + 1).fill(INF);
  const lastSize = new Array(groupSize + 1).fill(0); // bundle used to reach n
  best[0] = 0;

  for (let n = 1; n <= groupSize; n++) {
    for (const s of sizes) {
      if (s > n) continue;
      const prev = best[n - s];
      if (prev !== INF && prev + 1 < best[n]) {
        best[n] = prev + 1;
        lastSize[n] = s;
      }
    }
  }

  if (best[groupSize] === INF) return null;

  // Walk back through the chosen bundles and count them per size.
  const counts = new Map();
  for (let n = groupSize; n > 0; n -= lastSize[n]) {
    counts.set(lastSize[n], (counts.get(lastSize[n]) || 0) + 1);
  }

  const bundles = [...counts.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([size, count]) => ({ size, count }));

  return { totalBundles: best[groupSize], bundles };
}

module.exports = { minBundles };
