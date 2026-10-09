/**
 * Quantise to a grid far finer than any real feature but coarse enough to
 * absorb float noise, so two vertices meant to be the same point compare equal.
 */
const key = (x: number, y: number, z: number) =>
  `${Math.round(x * 1e4)},${Math.round(y * 1e4)},${Math.round(z * 1e4)}`;

/**
 * The single check that matters for printability: in a closed, consistently
 * wound solid every directed edge A→B occurs exactly once, paired with B→A on
 * the neighbouring facet. A hole leaves an unpaired edge; a flipped facet
 * produces the same directed edge twice.
 */
export function edgeAudit(positions: Float32Array, triangleCount: number) {
  const seen = new Map<string, number>();
  for (let t = 0; t < triangleCount; t += 1) {
    const o = t * 9;
    const v = [
      key(positions[o] ?? 0, positions[o + 1] ?? 0, positions[o + 2] ?? 0),
      key(positions[o + 3] ?? 0, positions[o + 4] ?? 0, positions[o + 5] ?? 0),
      key(positions[o + 6] ?? 0, positions[o + 7] ?? 0, positions[o + 8] ?? 0),
    ];
    for (let e = 0; e < 3; e += 1) {
      const d = `${v[e]}|${v[(e + 1) % 3]}`;
      seen.set(d, (seen.get(d) ?? 0) + 1);
    }
  }

  let duplicated = 0;
  let unpaired = 0;
  for (const [d, n] of seen) {
    if (n !== 1) duplicated += 1;
    const [a, b] = d.split('|');
    if (!seen.has(`${b}|${a}`)) unpaired += 1;
  }
  return { duplicated, unpaired, edges: seen.size };
}
