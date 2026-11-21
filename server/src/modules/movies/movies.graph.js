/**
 * Graph helpers for movie prerequisites (written by hand, no graph libraries).
 *
 * `prereqMap` is a Map<number, number[]> : movieId -> ids of its direct prerequisites.
 */

/**
 * Would giving `movieId` the prerequisites `newPrereqIds` create a cycle?
 *
 * A cycle appears exactly when `movieId` is already reachable from one of the new
 * prerequisites by following "prerequisite" edges, or when it lists itself.
 * Iterative DFS, so very deep chains cannot overflow the call stack.
 */
function wouldCreateCycle(movieId, newPrereqIds, prereqMap) {
  if (newPrereqIds.includes(movieId)) return true;

  const seen = new Set();
  const stack = [...newPrereqIds];

  while (stack.length > 0) {
    const node = stack.pop();
    if (node === movieId) return true;
    if (seen.has(node)) continue;
    seen.add(node);
    for (const p of prereqMap.get(node) || []) stack.push(p);
  }
  return false;
}

/**
 * Every movie that must be watched before `targetId` (transitively), each exactly once,
 * ordered so that every movie appears after all of its own prerequisites.
 * The target itself is not included.
 *
 * Iterative DFS post-order; prerequisites are visited in ascending id order so the
 * result is deterministic.
 */
function rewatchOrder(targetId, prereqMap) {
  const order = [];
  const visited = new Set([targetId]);
  const onPath = new Set([targetId]); // cycle guard for corrupted data
  const sortedPrereqs = (id) => [...(prereqMap.get(id) || [])].sort((a, b) => a - b);

  const stack = [{ id: targetId, prereqs: sortedPrereqs(targetId), next: 0 }];

  while (stack.length > 0) {
    const frame = stack[stack.length - 1];

    if (frame.next < frame.prereqs.length) {
      const p = frame.prereqs[frame.next++];
      if (onPath.has(p)) throw new Error('Circular dependency detected in stored data');
      if (visited.has(p)) continue;
      visited.add(p);
      onPath.add(p);
      stack.push({ id: p, prereqs: sortedPrereqs(p), next: 0 });
    } else {
      stack.pop();
      onPath.delete(frame.id);
      if (frame.id !== targetId) order.push(frame.id);
    }
  }
  return order;
}

module.exports = { wouldCreateCycle, rewatchOrder };
