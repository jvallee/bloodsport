// The user's playtest notes (2026-10-28): prisoners, Stables, titles, gear, tribute, Prestige and auto-play.
import test from 'node:test';
import assert from 'node:assert/strict';
import { CIRCUITS, KINDS } from '../src/data.js';
import { trainCap } from '../src/ludus.js';
import { createRun, recruit, advanceToTournament, advanceWeek } from '../src/run.js';

function atImperial(seed = 1) {
  const run = createRun(seed);
  recruit(run, run.market[0].id);
  advanceToTournament(run);
  for (const t of [2, 3, 4]) run.arenas[t] = { ...structuredClone(run.arenas[1]), tier: t, stage: 0, conquered: t < 4 };
  run.arenas[1].conquered = true;
  run.topTier = 4;
  run.prestigeLevel = 5;
  run.gold = 500;
  return run;
}

test('a prisoner of war arrives fight-ready, but the Power above their natural Power counts as training already done', () => {
  const run = atImperial();
  run.buildings.push({ id: 'bl', type: 'liaison', level: 2 });
  run.boutPending = false;
  advanceWeek(run); // a new month: the Liaison brings a prisoner
  const f = run.liaisonOffer;
  assert.equal(f.origin, 'Prisoner of war');
  const natural = KINDS[f.kind].basePower + CIRCUITS[3].marketPower;
  assert.ok(f.power > natural + 5, 'still a strong fighter on arrival');
  assert.equal(f.trainedPower, f.power - natural);
  assert.equal(f.trained, f.trainedPower);
  // So a prisoner can't train far past a home-grown fighter: at most the Trainer cap in total.
  assert.ok(f.power <= natural + Math.max(f.trained, trainCap(run)));
});

test('a Championship also crowns the fighter in every arena below it, +1 Power for each new Title', async () => {
  const { crownChampion, championTitle, createFighter } = await import('../src/run.js');
  const { createRng } = await import('../src/rng.js');
  const f = createFighter(createRng(1), { id: 'f1' });
  const power = f.power;
  f.titles.push(championTitle(1)); f.power += 1; // already Champion of the Dirt Pits
  assert.deepEqual(crownChampion(f, 3), [championTitle(3), championTitle(2)]);
  assert.equal(f.power, power + 3);
  assert.deepEqual(crownChampion(f, 3), [], 'never twice');
});

test('Unequip all returns every fighter\'s gear to the storeroom', async () => {
  const { unequipAll, unequipAllBlocker } = await import('../src/run.js');
  const run = createRun(1);
  const f = recruit(run, run.market[0].id);
  const g = recruit(run, run.market[0].id);
  assert.equal(unequipAllBlocker(run), 'Nobody has gear equipped.');
  f.gear = { weapon: 'gladius', armor: 'leatherVest' };
  g.gear.weapon = 'trident';
  unequipAll(run);
  assert.deepEqual([f.gear, g.gear], [{ weapon: null, armor: null }, { weapon: null, armor: null }]);
  assert.deepEqual([...run.inventory.gear].sort(), ['gladius', 'leatherVest', 'trident']);
});

test('the Market shows the Stables\' Basa in their own section, and upgrading the Stables brings the second Basa at once', async () => {
  const { buildRoom, upgradeRoom } = await import('../src/run.js');
  const { marketTab } = await import('../src/ui/views.js');
  const run = createRun(3);
  assert.match(marketTab(run), /Build the Stables/);
  run.prestigeLevel = 3;
  run.gold = 100;
  const b = buildRoom(run, 'stables');
  assert.match(marketTab(run), /From the Stables/);
  assert.equal(run.market.filter((f) => f.kind === 'basa').length, 1);
  upgradeRoom(run, b.id);
  assert.equal(run.market.filter((f) => f.kind === 'basa').length, 2);
});

test('Market sections fold away, and the Decor merchant shows each item\'s comfort', async () => {
  const { marketTab } = await import('../src/ui/views.js');
  const { MORALE } = await import('../src/data.js');
  const html = marketTab(createRun(1));
  for (const key of ['fighters', 'stables', 'liaison', 'storeroom', 'apothecary', 'decor', 'armourer']) assert.match(html, new RegExp(`<details class="panel fold" data-key="market-${key}" open>`));
  assert.match(html, new RegExp(`\\+${MORALE.perDecor} comfort`));
});
