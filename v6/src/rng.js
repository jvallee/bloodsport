// Seeded RNG (mulberry32). State is a plain object so runs stay JSON-serializable.
// Tests may set `script`: an array of values in [0, 1) returned before the generator.

export function createRng(seed) {
  return { state: seed >>> 0 };
}

export function next(rng) {
  if (rng.script && rng.script.length) return rng.script.shift();
  let t = (rng.state = (rng.state + 0x6d2b79f5) >>> 0);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function int(rng, min, max) {
  return min + Math.floor(next(rng) * (max - min + 1));
}

export const rollE5 = (rng) => int(rng, 1, 100000);
export const d100 = (rng) => int(rng, 1, 100);
export const d6 = (rng) => int(rng, 1, 6);

export function pick(rng, list) {
  return list[int(rng, 0, list.length - 1)];
}

// Derive an independent stream seed per domain (market, opponents, fights).
export function deriveSeed(seed, domain) {
  let h = (seed ^ Math.imul(domain + 1, 0x9e3779b9)) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35) >>> 0;
  return (h ^ (h >>> 16)) >>> 0;
}

export function randomSeed() {
  return Math.floor(Math.random() * 1e9);
}
