import test from 'node:test';
import assert from 'node:assert/strict';
import { BUILDINGS, DECOR, PRESTIGE_LEVELS, UNREST } from '../src/data.js';
import {
  VILLA_PLOTS, ROOF_ORACLE_SLOT, ROOM_SLOTS, decorZoneOf, isPlotUnlocked,
  resolveEstateSlots, plotCount, plotsFree, buildBlocker, decorCap,
} from '../src/ludus.js';
import {
  SAVE_VERSION, createRun, recruit, buildRoom, upgradeRoom, release,
  buyDecor, assignDecor, buyAndAssignDecor, buyAndAssignDecorBlocker,
  moveDecorAnchor, moveDecorBlocker, removeDecor, serialize, deserialize,
} from '../src/run.js';
import { applyGameAction } from '../src/game.js';
import { estateTab, ludusTab } from '../src/ui/views.js';

const BAD = /undefined|NaN|\[object Object\]/;
const fakeOdds = () => ({ win: 0.5, injury: 0.2, death: 0.01 });

test('VILLA_PLOTS defines 21 Fibonacci plots matching plotCount at every Prestige level', () => {
  assert.equal(VILLA_PLOTS.length, 21);
  assert.equal(VILLA_PLOTS.filter((p) => p.floor === 'upper').length, 6);
  assert.equal(VILLA_PLOTS.filter((p) => p.floor === 'ground').length, 8);
  assert.equal(VILLA_PLOTS.filter((p) => p.floor === 'catacomb').length, 7);
  assert.equal(new Set(VILLA_PLOTS.map((p) => p.id)).size, 21);

  const run = createRun(101);
  for (const lv of PRESTIGE_LEVELS) {
    run.prestigeLevel = lv.level;
    const unlocked = VILLA_PLOTS.filter((p) => isPlotUnlocked(run, p));
    assert.equal(unlocked.length, plotCount(run), `Prestige level ${lv.level} should unlock ${lv.plots} plots`);
  }
});

test('starting buildings land on Lv-1 plots and Legacy Oracle lands on Roof Observatory without breaking plotsFree', () => {
  const base = createRun(102);
  assert.equal(base.buildings.length, 3);
  assert.equal(new Set(base.buildings.map((b) => b.slot)).size, 3);
  assert.equal(plotsFree(base), 0);
  for (const b of base.buildings) {
    const plot = VILLA_PLOTS.find((p) => p.id === b.slot);
    assert.ok(plot, `starting building ${b.type} has valid plot ${b.slot}`);
    assert.equal(plot.unlockLv, 1);
  }

  const withOracle = createRun(102, { unlocks: ['oracle'] });
  assert.equal(withOracle.buildings.length, 4);
  const oracle = withOracle.buildings.find((b) => b.type === 'oracle');
  assert.equal(oracle.slot, ROOF_ORACLE_SLOT);
  assert.equal(new Set(withOracle.buildings.map((b) => b.slot)).size, 4);
  assert.equal(plotsFree(withOracle), -1); // exact legacy invariant preserved
});

test('slot-targeted buildRoom allows free placement across floors and blocks invalid/locked/occupied plots', () => {
  const run = createRun(103);
  run.gold = 500;
  run.prestigeLevel = 3; // 8 plots unlocked (upper-0..1, ground-0..3, catacomb-0..1)

  assert.match(buildBlocker(run, 'vulcan', 'not-a-slot') ?? '', /unknown plot/i);
  assert.match(buildBlocker(run, 'vulcan', 'upper-5') ?? '', /Prestige level/i);
  assert.match(buildBlocker(run, 'vulcan', 'ground-0') ?? '', /already has a building/i);

  // Free placement: Vulcan on Upper Colonnade and Exhibition Ring in Catacombs both work.
  assert.equal(buildBlocker(run, 'vulcan', 'upper-0'), null);
  buildRoom(run, 'vulcan', 'upper-0');
  assert.equal(run.buildings.at(-1).slot, 'upper-0');

  assert.equal(buildBlocker(run, 'exhibition', 'catacomb-1'), null);
  buildRoom(run, 'exhibition', 'catacomb-1');
  assert.equal(run.buildings.at(-1).slot, 'catacomb-1');
});

test('Whispering Gallery prefers catacomb-0 narrative anchor and never soft-locks if catacomb-0 is occupied', () => {
  // Case 1: catacomb-0 is open -> default slot picks catacomb-0
  const a = createRun(104);
  a.gold = 500;
  a.prestigeLevel = 3;
  a.plot = { stage: 2, galleryAsked: true };
  buildRoom(a, 'gallery');
  assert.equal(a.buildings.find((b) => b.type === 'gallery').slot, 'catacomb-0');

  // Case 2: catacomb-0 already taken -> gallery still builds cleanly on another open plot
  const b = createRun(105);
  b.gold = 500;
  b.prestigeLevel = 3;
  b.plot = { stage: 2, galleryAsked: true };
  buildRoom(b, 'armourer', 'catacomb-0');
  assert.equal(buildBlocker(b, 'gallery'), null);
  buildRoom(b, 'gallery');
  const gal = b.buildings.find((x) => x.type === 'gallery');
  assert.ok(gal.slot && gal.slot !== 'catacomb-0');
  assert.equal(new Set(b.buildings.map((x) => x.slot)).size, b.buildings.length);
});

test('Save v7 backwards compatibility resolves slot-less buildings purely and backfills fighter roomLayout without bumping SAVE_VERSION', () => {
  const run = createRun(106);
  run.gold = 400;
  recruit(run, run.market[0].id);
  const f = run.roster[0];
  buyDecor(run, 'warBanner');
  buyDecor(run, 'fireBrazier');
  assignDecor(run, f.id, 'warBanner');
  assignDecor(run, f.id, 'fireBrazier');

  // Simulate an older v7 save that lacks b.slot and f.roomLayout
  const parsed = JSON.parse(serialize(run));
  assert.equal(parsed.version, SAVE_VERSION);
  for (const b of parsed.buildings) delete b.slot;
  for (const r of parsed.roster) delete r.roomLayout;

  const loaded = deserialize(JSON.stringify(parsed));
  assert.equal(loaded.version, SAVE_VERSION);
  // Pure resolution maps every legacy building onto a distinct canonical slot without mutating legacy building records
  const resolved = resolveEstateSlots(loaded);
  assert.equal(resolved.size, loaded.buildings.length);
  const lf = loaded.roster[0];
  assert.ok(lf.roomLayout.warBanner);
  assert.ok(lf.roomLayout.fireBrazier);
  assert.equal(ROOM_SLOTS.find((s) => s.id === lf.roomLayout.warBanner).zone, 'wall');
  assert.equal(ROOM_SLOTS.find((s) => s.id === lf.roomLayout.fireBrazier).zone, 'floor');
});

test('3/4 room decorator supports storeroom-first buy-and-place, ×3 stacking (all 39 items), anchor move/swap, and clean removal', () => {
  const run = createRun(107);
  run.gold = 5000;
  run.prestigeLevel = 5;
  const q = run.buildings.find((b) => b.type === 'quarters');
  upgradeRoom(run, q.id);
  upgradeRoom(run, q.id);
  assert.equal(decorCap(run), 3);

  recruit(run, run.market[0].id);
  const f = run.roster[0];

  // Put 1 warBanner in storeroom -> buyAndAssignDecor uses storeroom first (0 Gold spent)
  buyDecor(run, 'warBanner');
  const goldBefore = run.gold;
  buyAndAssignDecor(run, f.id, 'warBanner', 'wall-2');
  assert.equal(run.gold, goldBefore);
  assert.equal(run.inventory.decor.warBanner, 0);
  assert.equal(f.decor.warBanner, 1);
  assert.equal(f.roomLayout.warBanner, 'wall-2');

  // 2nd and 3rd copy buy directly for Gold and stack on the same anchor wall-2
  buyAndAssignDecor(run, f.id, 'warBanner', 'wall-2');
  buyAndAssignDecor(run, f.id, 'warBanner', 'wall-2');
  assert.equal(f.decor.warBanner, 3);
  assert.equal(f.roomLayout.warBanner, 'wall-2');
  assert.equal(run.gold, goldBefore - DECOR.warBanner.price * 2);
  assert.match(buyAndAssignDecorBlocker(run, f.id, 'warBanner') ?? '', /Quarters fit 3/i);

  // Move to empty wall anchor, then swap with trophy
  buyAndAssignDecor(run, f.id, 'trophy', 'wall-0');
  assert.match(moveDecorBlocker(run, f.id, 'warBanner', 'floor-0') ?? '', /wall anchor/i);
  moveDecorAnchor(run, f.id, 'warBanner', 'wall-3');
  assert.equal(f.roomLayout.warBanner, 'wall-3');
  moveDecorAnchor(run, f.id, 'warBanner', 'wall-0');
  assert.equal(f.roomLayout.warBanner, 'wall-0');
  assert.equal(f.roomLayout.trophy, 'wall-3');

  // Fill ALL 13 decor items to ×3 = 39 items without running out of anchors!
  for (const k of Object.keys(DECOR)) {
    while (f.decor[k] < 3) buyAndAssignDecor(run, f.id, k);
    const slotId = f.roomLayout[k];
    assert.ok(slotId, `${k} has an anchor`);
    assert.equal(ROOM_SLOTS.find((s) => s.id === slotId).zone, decorZoneOf(k));
  }
  assert.equal(Object.values(f.decor).reduce((s, n) => s + n, 0), 39);
  assert.equal(new Set(Object.values(f.roomLayout)).size, 13);

  // Removing all 3 copies clears the anchor from roomLayout
  removeDecor(run, f.id, 'warBanner');
  removeDecor(run, f.id, 'warBanner');
  assert.equal(f.roomLayout.warBanner, 'wall-0');
  removeDecor(run, f.id, 'warBanner');
  assert.equal(f.decor.warBanner, 0);
  assert.equal('warBanner' in f.roomLayout, false);

  // Releasing fighter returns remaining decor and deletes roomLayout cleanly
  release(run, f.id);
  assert.equal(f.roomLayout, undefined);
  assert.equal(run.inventory.decor.trophy, 3);
});

test('GAME_ACTIONS replays build, buy-assign-decor, move-decor, and remove-decor deterministically with flat strings', () => {
  const replay = (seed) => {
    const r = createRun(seed);
    r.gold = 500;
    r.prestigeLevel = 3;
    const state = { run: r, match: null };
    const fid = r.market[0].id;
    applyGameAction(state, 'recruit', { id: fid });
    applyGameAction(state, 'build', { type: 'armourer', slot: 'upper-0' });
    applyGameAction(state, 'buy-assign-decor', { id: fid, item: 'warBanner', slot: 'wall-1' });
    applyGameAction(state, 'buy-assign-decor', { id: fid, item: 'fireBrazier', slot: 'floor-4' });
    applyGameAction(state, 'move-decor', { id: fid, item: 'warBanner', slot: 'wall-2' });
    applyGameAction(state, 'remove-decor', { id: fid, item: 'fireBrazier' });
    return r;
  };
  const a = replay(202);
  const b = replay(202);
  assert.equal(serialize(a), serialize(b));
  assert.equal(a.buildings.find((x) => x.type === 'armourer').slot, 'upper-0');
  assert.equal(a.roster[0].roomLayout.warBanner, 'wall-2');
  assert.equal('fireBrazier' in a.roster[0].roomLayout, false);
  for (const [, params] of a.actions) {
    assert.doesNotMatch(JSON.stringify(params), /\[object Object\]/);
  }
});

test('estateTab renders all 12 buildings, Roof Observatory, Cracked Masonry, Unrest, Lounge, Espionage, and 3/4 Room with all 13 decor items', () => {
  const run = createRun(108, { unlocks: ['oracle'] });
  run.gold = 10000;
  run.prestigeLevel = 5;
  run.unrest = UNREST.warn + 5;
  run.plot = { stage: 'cause', suspicion: 15, hidden: true, galleryAsked: true };
  recruit(run, run.market[0].id);
  const f = run.roster[0];

  // First check Cracked Masonry Wall before Whispering Gallery is built
  const preGalleryHtml = estateTab(run, { mode: 'villa', slot: 'catacomb-0' });
  assert.doesNotMatch(preGalleryHtml, BAD);
  assert.match(preGalleryHtml, /Cracked Masonry/);
  assert.match(preGalleryHtml, /Roof Observatory/);
  assert.match(preGalleryHtml, /unrest-hot/);

  // Build every remaining building type so all 12 building SVGs render simultaneously
  for (const type of Object.keys(BUILDINGS)) {
    if (!run.buildings.some((b) => b.type === type)) buildRoom(run, type);
  }
  const fullVillaHtml = estateTab(run);
  assert.doesNotMatch(fullVillaHtml, BAD);
  for (const def of Object.values(BUILDINGS)) {
    assert.ok(fullVillaHtml.includes(def.name), `Villa renders ${def.name}`);
  }
  assert.match(fullVillaHtml, /The Patron Lounge/);
  assert.match(fullVillaHtml, /Knives in the dark/);

  // Inspect Medbay to confirm Hidden Plot stranger appears
  const medSlot = run.buildings.find((b) => b.type === 'medbay').slot;
  const medHtml = estateTab(run, { mode: 'villa', slot: medSlot });
  assert.doesNotMatch(medHtml, BAD);
  assert.match(medHtml, /Shrouded Stranger/);

  // Place all 13 decor items (with stacking) and render 3/4 Room Decorator + Move Mode
  const q = run.buildings.find((b) => b.type === 'quarters');
  upgradeRoom(run, q.id);
  for (const k of Object.keys(DECOR)) buyAndAssignDecor(run, f.id, k);
  buyAndAssignDecor(run, f.id, 'warBanner'); // ×2 badge

  const roomHtml = estateTab(run, {
    mode: 'room',
    fighterId: f.id,
    roomSlot: f.roomLayout.warBanner,
    movingItem: 'warBanner',
  });
  assert.doesNotMatch(roomHtml, BAD);
  assert.match(roomHtml, /3\/4 Cutaway/);
  assert.match(roomHtml, /×2/);
  assert.match(roomHtml, /data-action="move-decor"/);
  for (const d of Object.values(DECOR)) {
    assert.ok(roomHtml.includes(d.name), `Room renders ${d.name}`);
  }

  // Ludus tab includes Open 2D Room shortcut on fighter card
  const ludusHtml = ludusTab(run, fakeOdds);
  assert.doesNotMatch(ludusHtml, BAD);
  assert.match(ludusHtml, /data-action="estate-open-room"/);
});
