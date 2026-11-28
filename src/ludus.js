// The Ludus estate: room plots, buildings and what they provide. Pure.

import { BUILDINGS, PRESTIGE_LEVELS, TRAINING, SHORT } from './data.js';
import { Refused } from './errors.js';

export const levelInfo = (level) => PRESTIGE_LEVELS[level - 1];
export const plotCount = (run) => levelInfo(run.prestigeLevel).plots;
export const CRYPT_HADES_SLOT = 'crypt-hades';
export const ROOF_ORACLE_SLOT = 'roof-oracle';
export const ROOF_TEMPLE_SLOT = 'roof-temple';
export const ROOF_STEWARD_SLOT = 'roof-steward';
const NON_PLOT_SLOTS = new Set([CRYPT_HADES_SLOT, ROOF_ORACLE_SLOT, ROOF_TEMPLE_SLOT, ROOF_STEWARD_SLOT]);
export const plotsFree = (run) => plotCount(run) - run.buildings.filter((b) => !NON_PLOT_SLOTS.has(b.slot)).length;

export function prestigeLevelFor(prestige, current = 1) {
  const reached = PRESTIGE_LEVELS.filter((p) => prestige >= p.at).at(-1).level;
  return Math.max(current, reached);
}

const ofType = (run, type) => run.buildings.filter((b) => b.type === type);
export const maxLevel = (run, type) => Math.max(0, ...ofType(run, type).map((b) => b.level));
export const effectAt = (type, level) => (level ? BUILDINGS[type].per[level - 1] : 0);

// Roster capacity: quarters capacity (+ any temporary patron/draft bunk), capped by the Prestige level's fighter limit.
export const rosterCap = (run) => Math.min(ofType(run, 'quarters').reduce((s, b) => s + effectAt('quarters', b.level), 0) + (run.patronBunk ?? 0), levelInfo(run.prestigeLevel).maxFighters);
export const trainerRooms = (run) => ofType(run, 'trainer').length;
export const trainCap = (run) => effectAt('trainer', maxLevel(run, 'trainer')) + (run.setup?.short && maxLevel(run, 'trainer') > 0 ? SHORT.trainCap : 0); // a season trains further (SHORT.trainCap)
export const trainCost = (run) => {
  const fee = Math.max(1, maxLevel(run, 'trainer'));
  const midTier = TRAINING.midTier ?? 3;
  const midFee = TRAINING.midFee ?? 3;
  if (run.topTier < midTier) return Math.min(fee, TRAINING.cheapFee);
  if (run.topTier < TRAINING.fullFeeFrom) return Math.min(fee, midFee);
  return fee;
};
// A stranger hidden in the Medbay (v6's hidden plot) takes up one bed.
export const medbaySlots = (run) => Math.max(0, ofType(run, 'medbay').reduce((s, b) => s + effectAt('medbay', b.level), 0) - (run.plot?.hidden ? 1 : 0));
export const healRate = (run) => (maxLevel(run, 'medbay') >= 2 ? 2 : 1);
export const decorCap = (run) => maxLevel(run, 'quarters');
export const oracleLevel = (run) => maxLevel(run, 'oracle');
export const liaisonLevel = (run) => maxLevel(run, 'liaison');
export const stressRelief = (run) => effectAt('entertainment', maxLevel(run, 'entertainment'));

// 21 Fibonacci villa plots across three architectural tiers (cumulative unlocks: 3 → 5 → 8 → 13 → 21).
export const VILLA_PLOTS = [
  // Upper Colonnade (6 plots)
  { id: 'upper-0', floor: 'upper', unlockLv: 2, hint: 'Sunlit Loggia' },
  { id: 'upper-1', floor: 'upper', unlockLv: 3, hint: 'East Colonnade' },
  { id: 'upper-2', floor: 'upper', unlockLv: 4, hint: 'Terrace Wing' },
  { id: 'upper-3', floor: 'upper', unlockLv: 4, hint: 'Senator Balcony' },
  { id: 'upper-4', floor: 'upper', unlockLv: 5, hint: 'Imperial Hall' },
  { id: 'upper-5', floor: 'upper', unlockLv: 5, hint: 'High Peristyle' },
  // Courtyard & Ground Floor (8 plots; starts with 3 excavated at Prestige Lv 1)
  { id: 'ground-0', floor: 'ground', unlockLv: 1, hint: 'West Barracks' },
  { id: 'ground-1', floor: 'ground', unlockLv: 1, hint: 'Sand Yard' },
  { id: 'ground-2', floor: 'ground', unlockLv: 1, hint: 'Infirmary Arch' },
  { id: 'ground-3', floor: 'ground', unlockLv: 3, hint: 'Smithy Gate' },
  { id: 'ground-4', floor: 'ground', unlockLv: 4, hint: 'Courtyard Annex' },
  { id: 'ground-5', floor: 'ground', unlockLv: 4, hint: 'East Archway' },
  { id: 'ground-6', floor: 'ground', unlockLv: 5, hint: 'Grand Portico' },
  { id: 'ground-7', floor: 'ground', unlockLv: 5, hint: 'Arena Tunnel' },
  // Subterranean Catacombs (7 plots)
  { id: 'catacomb-0', floor: 'catacomb', unlockLv: 2, hint: 'Cellar Vault', sealedGallery: true },
  { id: 'catacomb-1', floor: 'catacomb', unlockLv: 3, hint: 'Obsidian Crypt' },
  { id: 'catacomb-2', floor: 'catacomb', unlockLv: 4, hint: 'Iron Gaol' },
  { id: 'catacomb-3', floor: 'catacomb', unlockLv: 5, hint: 'Deep Cistern' },
  { id: 'catacomb-4', floor: 'catacomb', unlockLv: 5, hint: 'Under-Forge' },
  { id: 'catacomb-5', floor: 'catacomb', unlockLv: 5, hint: 'Tufa Chamber' },
  { id: 'catacomb-6', floor: 'catacomb', unlockLv: 5, hint: 'Hidden Catacomb' },
];
const PLOT_BY_ID = Object.fromEntries(VILLA_PLOTS.map((p) => [p.id, p]));

// 3/4 Oblique Cutaway room anchors (4 wall mounts + 9 floor tiles). Multiple copies stack visually on their anchor.
export const ROOM_SLOTS = [
  { id: 'wall-0', zone: 'wall', label: 'Left Wall Niche', x: 175, y: 112 },
  { id: 'wall-1', zone: 'wall', label: 'Centre-Left Wall', x: 300, y: 108 },
  { id: 'wall-2', zone: 'wall', label: 'Centre-Right Wall', x: 428, y: 108 },
  { id: 'wall-3', zone: 'wall', label: 'Right Wall Niche', x: 552, y: 112 },
  { id: 'floor-0', zone: 'floor', label: 'Back-Left Corner', x: 205, y: 208 },
  { id: 'floor-1', zone: 'floor', label: 'Back Centre', x: 360, y: 208 },
  { id: 'floor-2', zone: 'floor', label: 'Back-Right Corner', x: 515, y: 208 },
  { id: 'floor-3', zone: 'floor', label: 'Mid-Left Floor', x: 175, y: 272 },
  { id: 'floor-4', zone: 'floor', label: 'Centre Mosaic', x: 360, y: 272 },
  { id: 'floor-5', zone: 'floor', label: 'Mid-Right Floor', x: 545, y: 272 },
  { id: 'floor-6', zone: 'floor', label: 'Front-Left Corner', x: 145, y: 342 },
  { id: 'floor-7', zone: 'floor', label: 'Front Hearth', x: 360, y: 342 },
  { id: 'floor-8', zone: 'floor', label: 'Front-Right Corner', x: 575, y: 342 },
];
const ROOM_SLOT_BY_ID = Object.fromEntries(ROOM_SLOTS.map((s) => [s.id, s]));
export const DECOR_ZONE = {
  warBanner: 'wall', trophy: 'wall', shrine: 'wall', skullRack: 'wall',
  bird: 'floor', fireBrazier: 'floor', bathhouse: 'floor', lionCage: 'floor',
  rockGarden: 'floor', spikyBed: 'floor', wineAmphora: 'floor', terrarium: 'floor', whetstone: 'floor',
};
export const decorZoneOf = (item) => DECOR_ZONE[item] ?? 'floor';
export const plotById = (id) => PLOT_BY_ID[id] ?? null;
export const roomSlotById = (id) => ROOM_SLOT_BY_ID[id] ?? null;
export const isPlotUnlocked = (run, plot) => Boolean(plot) && plot.unlockLv <= (run.prestigeLevel ?? 1);

const FLOOR_PREF = {
  quarters: ['ground', 'upper', 'catacomb'],
  trainer: ['ground', 'upper', 'catacomb'],
  medbay: ['ground', 'upper', 'catacomb'],
  armourer: ['ground', 'catacomb', 'upper'],
  exhibition: ['ground', 'upper', 'catacomb'],
  temple: ['ground', 'upper', 'catacomb'],
  entertainment: ['upper', 'ground', 'catacomb'],
  lounge: ['upper', 'ground', 'catacomb'],
  oracle: ['upper', 'ground', 'catacomb'],
  gallery: ['catacomb', 'ground', 'upper'],
  vulcan: ['catacomb', 'ground', 'upper'],
  hades: ['catacomb', 'ground', 'upper'],
  liaison: ['catacomb', 'ground', 'upper'],
};

export function pickDefaultSlot(run, type, used) {
  if (type === 'oracle' && (run.prestigeLevel ?? 1) === 1 && !used.has(ROOF_ORACLE_SLOT) && VILLA_PLOTS.filter((p) => p.unlockLv <= 1 && !used.has(p.id)).length === 0) {
    return ROOF_ORACLE_SLOT;
  }
  const lv = run.prestigeLevel ?? 1;
  if (type === 'hades') {
    const freeUnlocked = VILLA_PLOTS.filter((p) => p.unlockLv <= lv && !used.has(p.id));
    if (!freeUnlocked.length || plotsFree(run) <= 0) {
      if (!used.has(CRYPT_HADES_SLOT)) return CRYPT_HADES_SLOT;
    } else {
      const nonGalleryCatacomb = VILLA_PLOTS.find((p) => p.floor === 'catacomb' && !p.sealedGallery && p.unlockLv <= lv && !used.has(p.id));
      if (nonGalleryCatacomb) return nonGalleryCatacomb.id;
    }
  }
  const prefs = FLOOR_PREF[type] ?? ['ground', 'upper', 'catacomb'];
  // Unlocked plots first (by floor preference), then any open plot as safety fallback for older/migrated saves.
  for (const unlockedOnly of [true, false]) {
    for (const floor of prefs) {
      const hit = VILLA_PLOTS.find((p) => p.floor === floor && (!unlockedOnly || p.unlockLv <= lv) && !used.has(p.id));
      if (hit) return hit.id;
    }
  }
  if (type === 'hades' && !used.has(CRYPT_HADES_SLOT)) return CRYPT_HADES_SLOT;
  return !used.has(ROOF_ORACLE_SLOT) ? ROOF_ORACLE_SLOT : null;
}

// Pure deterministic slot resolution so legacy saves without b.slot map cleanly without mutating building objects.
export function resolveEstateSlots(run) {
  const bySlot = new Map();
  const used = new Set();
  const unassigned = [];
  for (const b of run?.buildings ?? []) {
    if (b.slot && (PLOT_BY_ID[b.slot] || b.slot === ROOF_ORACLE_SLOT || b.slot === CRYPT_HADES_SLOT) && !used.has(b.slot)) {
      bySlot.set(b.slot, b);
      used.add(b.slot);
    } else {
      unassigned.push(b);
    }
  }
  for (const b of unassigned) {
    const slot = pickDefaultSlot(run, b.type, used);
    if (slot) {
      bySlot.set(slot, b);
      used.add(slot);
    }
  }
  return bySlot;
}

export const buildingAtSlot = (run, slotId) => resolveEstateSlots(run).get(slotId) ?? null;

// Assign canonical slots onto freshly created starting buildings.
export function ensureEstateSlots(run) {
  if (!Array.isArray(run?.buildings)) return;
  for (const [slot, b] of resolveEstateSlots(run)) b.slot = slot;
}

// Guarantee every placed decor item on a fighter maps to a unique matching-zone room anchor (omits empty roomLayout).
export function ensureRoomLayout(f) {
  if (!f || !f.decor) return {};
  const layout = (f.roomLayout && typeof f.roomLayout === 'object' && !Array.isArray(f.roomLayout)) ? { ...f.roomLayout } : {};
  const used = new Set();
  for (const [item, slotId] of Object.entries(layout)) {
    const slot = ROOM_SLOT_BY_ID[slotId];
    if ((f.decor[item] ?? 0) > 0 && slot && slot.zone === decorZoneOf(item) && !used.has(slotId)) {
      used.add(slotId);
    } else {
      delete layout[item];
    }
  }
  for (const [item, count] of Object.entries(f.decor)) {
    if ((count ?? 0) <= 0 || layout[item]) continue;
    const zone = decorZoneOf(item);
    const open = ROOM_SLOTS.find((s) => s.zone === zone && !used.has(s.id));
    if (open) {
      layout[item] = open.id;
      used.add(open.id);
    }
  }
  if (Object.keys(layout).length) f.roomLayout = layout;
  else delete f.roomLayout;
  return layout;
}

// A secret building (5.4.0: the Whispering Gallery) exists for the house only once the resistance has asked for it.
export const buildingKnown = (run, type) => Object.hasOwn(BUILDINGS, type) && (!BUILDINGS[type].secret || Boolean(run.plot?.galleryAsked) || ofType(run, type).length > 0);

export function buildBlocker(run, type, slot = null) {
  const def = Object.hasOwn(BUILDINGS, type) ? BUILDINGS[type] : null;
  if (!def || !buildingKnown(run, type)) return 'Unknown building.';
  if (run.status !== 'active') return 'The run is over.';
  if (run.inMatch) return 'A match is in progress.';
  if (run.mercy) return "First decide the beaten opponent's fate: thumbs up or down.";
  if (run.prestigeLevel < def.req[0]) return `Unlocks at Prestige level ${def.req[0]}.`;
  if (def.unique && ofType(run, type).length) return 'You already have one. Upgrade it instead.';
  const canUseCrypt = type === 'hades' && (!slot || slot === CRYPT_HADES_SLOT) && !buildingAtSlot(run, CRYPT_HADES_SLOT);
  if (plotsFree(run) <= 0 && !canUseCrypt) return 'No free plots. Raise your Prestige level for more.';
  if (slot && slot !== CRYPT_HADES_SLOT) {
    const p = Object.hasOwn(PLOT_BY_ID, slot) ? PLOT_BY_ID[slot] : null;
    if (!p) return 'Unknown plot.';
    if (p.unlockLv > run.prestigeLevel) return `Plot unlocks at Prestige level ${p.unlockLv}.`;
    if (buildingAtSlot(run, slot)) return 'That plot already has a building.';
  } else if (slot === CRYPT_HADES_SLOT) {
    if (type !== 'hades') return 'Unknown plot.';
    if (buildingAtSlot(run, CRYPT_HADES_SLOT)) return 'That plot already has a building.';
  }
  if (run.gold < def.cost[0]) return `Needs ${def.cost[0]} Gold.`;
  return null;
}

export function build(run, type, slot = null) {
  const reason = buildBlocker(run, type, slot);
  if (reason) throw new Refused(reason);
  const used = new Set(resolveEstateSlots(run).keys());
  run.gold -= BUILDINGS[type].cost[0];
  const chosen = slot || pickDefaultSlot(run, type, used);
  const b = { id: `b${run.nextId++}`, type, level: 1, ...(chosen ? { slot: chosen } : {}) };
  run.buildings.push(b);
  return b;
}

export function upgradeBlocker(run, id) {
  const b = run.buildings.find((x) => x.id === id);
  if (!b) return 'Unknown building.';
  if (run.status !== 'active') return 'The run is over.';
  if (run.inMatch) return 'A match is in progress.';
  if (run.mercy) return "First decide the beaten opponent's fate: thumbs up or down.";
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
