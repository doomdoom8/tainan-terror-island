export const HEX_RADIUS = 1;
export const HEX_GAP = 0.06;
const SQRT3 = Math.sqrt(3);

export const cellToXZ = ([col, row]) => ({
  x: (col + (row % 2) * 0.5) * SQRT3 * HEX_RADIUS,
  z: row * 1.5 * HEX_RADIUS,
});

export const gridCenter = (cells) => {
  const points = cells.map(cellToXZ);
  const xs = points.map((p) => p.x);
  const zs = points.map((p) => p.z);
  return {
    x: (Math.min(...xs) + Math.max(...xs)) / 2,
    z: (Math.min(...zs) + Math.max(...zs)) / 2,
    span: Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...zs) - Math.min(...zs)),
  };
};

export const seeded = (seed) => {
  let s = [...String(seed)].reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) >>> 0, 2166136261);
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
