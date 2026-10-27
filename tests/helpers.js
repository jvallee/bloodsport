import { createRng } from '../src/rng.js';
import { deltaRow } from '../src/data.js';

// A fighter with no kind trait or class, so only the base rules apply.
export function blank(overrides = {}) {
  return {
    id: overrides.id ?? 'x',
    name: overrides.name ?? 'Blank',
    kind: 'human',
    kindTrait: null,
    cls: null,
    weapon: null,
    power: 5,
    speed: 3,
    trained: 0,
    decor: { bird: 0, fireBrazier: 0 },
    injuries: [],
    alive: true,
    ...overrides,
  };
}

export const injuries = (...tags) => tags.map((tag) => ({ tag, weight: tag === 'poisoned' ? 2 : 1 }));

// RNG value that makes int(min, max) return `target`.
export const v = (min, max, target) => (target - min + 0.5) / (max - min + 1);
export const e5 = (target) => v(1, 100000, target);
export const pct = (target) => v(1, 100, target);

export function scripted(values, seed = 1) {
  const rng = createRng(seed);
  rng.script = [...values];
  return rng;
}

// Minimal round record for calling injuryCheck directly.
export function roundRecord({ round = 1, winner = 'A', delta = 0, powerA = 5, powerB = 5 } = {}) {
  return { round, winner, row: deltaRow(delta), power: { A: { total: powerA }, B: { total: powerB } }, volley: {}, checks: [] };
}
