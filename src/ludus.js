// The Ludus estate: room plots, buildings and what they provide. Pure.

import { BUILDINGS, PRESTIGE_LEVELS } from './data.js';
import { Refused } from './errors.js';

export const levelInfo = (level) => PRESTIGE_LEVELS[level - 1];
export const plotCount = (run) => levelInfo(run.prestigeLevel).plots;
export const plotsFree = (run) => plotCount(run) - run.buildings.length;

export function prestigeLevelFor(prestige, current = 1) {
  const reached = PRESTIGE_LEVELS.filter((p) => prestige >= p.at).at(-1).level;
  return Math.max(current, reached);
}

const ofType = (run, type) => run.buildings.filter((b) => b.type === type);
export const maxLevel = (run, type) => Math.max(0, ...ofType(run, type).map((b) => b.level));
export const effectAt = (type, level) => (level ? BUILDINGS[type].per[level - 1] : 0);

// Roster capacity: quarters capacity, capped by the Prestige level's fighter limit.
export const rosterCap = (run) => Math.min(ofType(run, 'quarters').reduce((s, b) => s + effectAt('quarters', b.level), 0), levelInfo(run.prestigeLevel).maxFighters);
export const trainerRooms = (run) => ofType(run, 'trainer').length;
export const trainCap = (run) => effectAt('trainer', maxLevel(run, 'trainer'));
export const trainCost = (run) => Math.max(1, maxLevel(run, 'trainer'));
// A stranger hidden in the Medbay (v6's hidden plot) takes up one bed.
export const medbaySlots = (run) => Math.max(0, ofType(run, 'medbay').reduce((s, b) => s + effectAt('medbay', b.level), 0) - (run.plot?.hidden ? 1 : 0));
export const healRate = (run) => (maxLevel(run, 'medbay') >= 2 ? 2 : 1);
export const decorCap = (run) => maxLevel(run, 'quarters');
export const oracleLevel = (run) => maxLevel(run, 'oracle');
export const liaisonLevel = (run) => maxLevel(run, 'liaison');
export const stressRelief = (run) => effectAt('entertainment', maxLevel(run, 'entertainment'));

export function buildBlocker(run, type) {
  const def = BUILDINGS[type];
  if (!def) return 'Unknown building.';
  if (run.status !== 'active') return 'The run is over.';
  if (run.inMatch) return 'A match is in progress.';
  if (run.prestigeLevel < def.req[0]) return `Unlocks at Prestige level ${def.req[0]}.`;
  if (def.unique && ofType(run, type).length) return 'You already have one. Upgrade it instead.';
  if (plotsFree(run) <= 0) return 'No free plots. Raise your Prestige level for more.';
  if (run.gold < def.cost[0]) return `Needs ${def.cost[0]} Gold.`;
  return null;
}

export function build(run, type) {
  const reason = buildBlocker(run, type);
  if (reason) throw new Refused(reason);
  run.gold -= BUILDINGS[type].cost[0];
  const b = { id: `b${run.nextId++}`, type, level: 1 };
  run.buildings.push(b);
  return b;
}

export function upgradeBlocker(run, id) {
  const b = run.buildings.find((x) => x.id === id);
  if (!b) return 'Unknown building.';
  if (run.status !== 'active') return 'The run is over.';
  if (run.inMatch) return 'A match is in progress.';
  const def = BUILDINGS[b.type];
  if (b.level >= def.cost.length) return 'Fully upgraded.';
  if (run.prestigeLevel < def.req[b.level]) return `Needs Prestige level ${def.req[b.level]}.`;
  if (run.gold < def.cost[b.level]) return `Needs ${def.cost[b.level]} Gold.`;
  return null;
}

export function upgrade(run, id) {
  const reason = upgradeBlocker(run, id);
  if (reason) throw new Refused(reason);
  const b = run.buildings.find((x) => x.id === id);
  run.gold -= BUILDINGS[b.type].cost[b.level];
  b.level += 1;
  return b;
}
