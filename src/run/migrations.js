// L6 save serialization, deserialization, structural validation, and v2 → v3 → v4 migrations.

import { createRng, deriveSeed } from '../rng.js';
import { MORALE, FAVOR } from '../data.js';
import {
  SAVE_VERSION, GRAND_TIER, LOG_CAP, emptyDecor, emptyItems, humorFor, allOpponents,
  clamp, findFighter, unlockedTiers,
} from './helpers.js';
import { makeHouses, openArena } from './houses.js';
import { finishMatch } from './tournaments.js';

export const serialize = (run) => JSON.stringify(run);

// Reject truncated or structurally corrupt saves with a readable error before mutating or migrating.
export function validateRun(run) {
  const ok = run
    && typeof run === 'object'
    && !Array.isArray(run)
    && typeof run.seed === 'number'
    && typeof run.week === 'number'
    && Array.isArray(run.roster)
    && Array.isArray(run.market)
    && Array.isArray(run.fallen)
    && Array.isArray(run.buildings)
    && Array.isArray(run.history)
    && run.arenas && typeof run.arenas === 'object' && !Array.isArray(run.arenas)
    && run.inventory && typeof run.inventory === 'object' && !Array.isArray(run.inventory)
    && run.rng && typeof run.rng === 'object' && !Array.isArray(run.rng);
  if (!ok) throw new Error('This save file is incomplete or corrupted.');
}

// v2 careers upgrade to v3: Strikes become Favour, the single circuit becomes arenas, houses initialize before openArena.
export function migrateV2ToV3(run) {
  if (!Array.isArray(run.roster) || !Array.isArray(run.market) || !Array.isArray(run.fallen) || !run.rng || typeof run.rng !== 'object') {
    throw new Error('This save file is incomplete or corrupted.');
  }
  const fighters = [
    ...run.roster, ...run.market, ...run.fallen,
    ...(run.liaisonOffer ? [run.liaisonOffer] : []),
    ...(run.opponent ? [run.opponent] : []),
  ];
  for (const f of fighters) {
    Object.assign(f, { xp: 0, level: 1, perks: [], pendingPerks: [], renown: 3 * (f.titles?.length ?? 0), morale: MORALE.start, gear: { weapon: null, armor: null } });
    f.decor = { ...emptyDecor(), ...(f.decor ?? {}) };
  }
  const topTier = run.grand ? GRAND_TIER : run.tier;
  run.rng.growth ??= createRng(deriveSeed(run.seed, 4));
  run.rng.events ??= createRng(deriveSeed(run.seed, 5));
  run.rng.houses ??= createRng(deriveSeed(run.seed, 6));
  run.rng.plot ??= createRng(deriveSeed(run.seed, 8));
  run.rng.rivals ??= createRng(deriveSeed(run.seed, 11));
  run.rng.fortune ??= createRng(deriveSeed(run.seed, 13));
  if (!run.houses) {
    run.houses = makeHouses(run.rng.houses);
    run.glory = 0;
  }
  run.favor = clamp(FAVOR.start - 15 * (run.strikes ?? 0), 1, FAVOR.max);
  run.topTier = topTier;
  run.arenas = {};
  run.inventory = { decor: emptyDecor(), gear: [], items: emptyItems() };
  run.armourerStock = [];
  run.revoltWeeks = 0;
  run.liaisonOffers = run.liaisonOffer ? [run.liaisonOffer] : [];
  delete run.liaisonOffer;
  run.matchInfo = run.inMatch ? { fighterId: run.matchFighterId, tier: topTier } : null;
  run.arenas[topTier] = { tier: topTier, stage: run.grand ? 3 : run.stage, debuff: run.debuff, opponent: run.opponent, conquered: false, rival: null };
  for (let t = 1; t < topTier; t++) {
    openArena(run, t);
    run.arenas[t].conquered = true;
  }
  run.bouts = run.boutPending ? Object.fromEntries(unlockedTiers(run).map((t) => [t, 'open'])) : null;
  for (const h of run.history ?? []) h.tier ??= topTier;
  for (const key of ['tier', 'stage', 'grand', 'debuff', 'opponent', 'strikes', 'matchFighterId']) delete run[key];
  run.version = 3;
  return run;
}

// Backfill fields added across v3–v7 and cap oversized logs. Idempotent for both v3 migrations and stripped saves.
function normalizeRun(run) {
  run.inventory.items = { ...emptyItems(), ...(run.inventory.items ?? {}) };
  run.inventory.decor = { ...emptyDecor(), ...(run.inventory.decor ?? {}) };
  run.inventory.gear ??= [];
  run.rng.events ??= createRng(deriveSeed(run.seed, 5));
  run.rng.plot ??= createRng(deriveSeed(run.seed, 8));
  run.rng.fortune ??= createRng(deriveSeed(run.seed, 13));
  run.plot ??= null;
  run.event ??= null;
  run.relics ??= [];
  run.fortune ??= null;
  run.unrest ??= 0;
  run.unrestStats ??= { incidents: 0, crises: 0 };
  run.espionage ??= { clues: [], suspects: null, opMonth: null, op: null, leak: null };
  run.setup ??= { patron: null, decrees: [], classes: [] };
  run.setup.heat ??= 0;
  run.setup.unlocks ??= [];
  run.setup.legends ??= [];
  run.setup.colour ??= null;
  if (!run.houses) {
    run.rng.houses ??= createRng(deriveSeed(run.seed, 6));
    run.houses = makeHouses(run.rng.houses);
    run.glory = 0;
  }
  for (const b of run.buildings) if (b.type === 'stables') b.type = 'vulcan';
  if (!Array.isArray(run.liaisonOffers)) run.liaisonOffers = run.liaisonOffer ? [run.liaisonOffer] : [];
  delete run.liaisonOffer;
  if (!Array.isArray(run.log)) run.log = [];
  if (run.log.length > LOG_CAP) run.log = run.log.slice(-LOG_CAP);
  if (!Array.isArray(run.actions)) {
    run.actions = [];
    run.actionsBase = JSON.stringify(run);
  }
  return run;
}

// v3 careers upgrade cleanly to v4.
export function migrateV3ToV4(run) {
  validateRun(run);
  normalizeRun(run);
  run.version = 4;
  return run;
}

// v4 → v5 (7.1): the four Temperament decor slots; backfillFighters adds them to every fighter on load.
export function migrateV4ToV5(run) {
  validateRun(run);
  run.version = 5;
  return run;
}

// v5 → v6 (7.3): house unrest replaces the average-Morale revolt (normalizeRun backfills run.unrest).
export function migrateV5ToV6(run) {
  validateRun(run);
  run.version = 6;
  return run;
}

// v6 → v7 (7.4): espionage state (normalizeRun backfills run.espionage).
export function migrateV6ToV7(run) {
  validateRun(run);
  run.version = 7;
  return run;
}

function backfillFighters(run) {
  const fighters = [
    ...run.roster,
    ...run.market,
    ...(run.liaisonOffers ?? []),
    ...run.fallen,
    ...allOpponents(run),
    ...(run.nemeses ?? []),
    ...(run.rivalChampion?.f ? [run.rivalChampion.f] : []),
  ];
  for (const f of fighters) {
    f.decor = { ...emptyDecor(), ...(f.decor ?? {}) };
    f.humor ??= humorFor(f);
  }
}

export function deserialize(text) {
  let run;
  try {
    run = JSON.parse(text);
  } catch {
    throw new Error('This save file is corrupted or unreadable.');
  }
  if (!run || typeof run !== 'object' || Array.isArray(run)) {
    throw new Error('This save file is corrupted or unreadable.');
  }
  if (typeof run.version !== 'number' || run.version < 2) {
    throw new Error('This save is from an older version of the game.');
  }
  if (run.version > SAVE_VERSION) {
    throw new Error(`This save is from a newer version of the game (v${run.version}).`);
  }
  if (run.version === 2) run = migrateV2ToV3(run);
  if (run.version === 3) run = migrateV3ToV4(run);
  if (run.version === 4) run = migrateV4ToV5(run);
  if (run.version === 5) run = migrateV5ToV6(run);
  if (run.version === 6) run = migrateV6ToV7(run);
  validateRun(run);
  normalizeRun(run);
  backfillFighters(run);
  // A match in progress isn't saved: reloading mid-fight counts as capitulating (or dying if already felled).
  if (run.inMatch) {
    run.actions.push(['reload']);
    const live = run.matchInfo ? findFighter(run, run.matchInfo.fighterId) : null;
    if (!live || !run.arenas?.[run.matchInfo.tier]) {
      run.inMatch = false;
      run.matchInfo = null;
    } else {
      const f = structuredClone(live);
      const progress = run.matchInfo.progress;
      if (progress) Object.assign(f, { injuries: progress.injuries ?? f.injuries, alive: progress.alive ?? true });
      finishMatch(run, {
        over: true,
        round: progress?.round ?? 1,
        rounds: [],
        result: { winner: 'B', reason: progress?.alive === false ? 'death' : 'towel' },
        a: { f, disabled: progress?.disabled ?? [], arena: null },
      });
    }
  }
  return run;
}
