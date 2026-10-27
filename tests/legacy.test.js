import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun, recruit, advanceToTournament, startMatch, finishMatch, boutFor, tributeDue, bossLossFavor, serialize, deserialize } from '../src/run.js';
import { FAVOR, ECONOMY, TRIBUTE, CONSUMABLES } from '../src/data.js';
import {
  createLegacy, loadLegacy, checkAchievements, unlockedPatrons, unlockedClasses, decreesUnlocked, careerScore, recordCareer, bestFighter, ACHIEVEMENTS,
} from '../src/legacy.js';
import { createRng } from '../src/rng.js';
import { replay } from '../src/debug.js';

test('achievements unlock patrons, classes and decrees, once each', () => {
  const legacy = createLegacy();
  const run = createRun(1);
  run.topTier = 3;
  run.history.push({ boss: true, won: true, fighterId: 'x' });
  const fresh = checkAchievements(legacy, run).map((a) => a.id);
  assert.deepEqual(fresh.sort(), ['bronze', 'firstBoss', 'silver']);
  assert.deepEqual(checkAchievements(legacy, run), [], 'not twice');
  assert.deepEqual(unlockedPatrons(legacy).sort(), ['purse', 'veteran']);
  assert.deepEqual(unlockedClasses(legacy), ['thornBlade']);
  assert.equal(decreesUnlocked(legacy), false);
  run.status = 'won';
  checkAchievements(legacy, run);
  assert.equal(decreesUnlocked(legacy), true);
});

test('a broken or missing legacy loads as a fresh one', () => {
  assert.deepEqual(loadLegacy('nope'), createLegacy());
  assert.deepEqual(loadLegacy(null), createLegacy());
  assert.deepEqual(loadLegacy(JSON.stringify({ achievements: ['bronze'], careers: 2, best: 50, past: [] })).achievements, ['bronze']);
});

test('patrons change the start of a career', () => {
  const plain = createRun(7);
  assert.equal(createRun(7, { patron: 'purse' }).gold, plain.gold + 10);
  assert.equal(createRun(7, { patron: 'friend' }).favor, plain.favor + 15);
  const chest = createRun(7, { patron: 'warChest' });
  assert.deepEqual([chest.inventory.items.warPaint, chest.inventory.items.blessedBandage], [2, 1]);
  const vet = createRun(7, { patron: 'veteran' });
  assert.equal(vet.roster.length, 1);
  assert.equal(vet.roster[0].level, 3);
  const def = createRun(7, { patron: 'defector' });
  assert.equal(def.roster.length, 1);
  assert.ok(def.roster[0].power >= 8);
  assert.deepEqual(createRun(7, { patron: 'veteran' }).roster, vet.roster, 'seeded');
});

test('unlocked classes appear in the market; locked ones never do', () => {
  const seen = new Set();
  for (let seed = 1; seed <= 60; seed++) for (const f of createRun(seed, { classes: ['thornBlade', 'samnite'] }).market) seen.add(f.cls);
  assert.ok(seen.has('thornBlade') && seen.has('samnite'));
  for (let seed = 1; seed <= 60; seed++) for (const f of createRun(seed).market) assert.ok(!['thornBlade', 'samnite'].includes(f.cls));
});

test('decrees make a career harder: Iron Bosses, a Greedy Emperor, Harsh Judges', () => {
  const run = createRun(3, { decrees: ['ironBosses', 'greedyEmperor', 'harshJudges'] });
  run.arenas[1].stage = 2;
  assert.equal(boutFor(run, 1).oppPower, 7 + 1);
  assert.equal(tributeDue(run), Math.round(TRIBUTE.perYear * 1.5));
  assert.equal(bossLossFavor(1, run), FAVOR.bossLoss[0] - 5);
});

test('career score and best fighter', () => {
  const run = createRun(2);
  const f = recruit(run, run.market[0].id);
  run.glory = 10;
  run.topTier = 2;
  run.history.push({ won: true, fighterId: f.id });
  assert.equal(careerScore(run), 10 + 25 + 0 + 2);
  run.status = 'won';
  run.setup = { decrees: ['ironBosses'] };
  assert.equal(careerScore(run), 10 + 25 + 2 + 200 + 30);
  assert.equal(bestFighter(run).id, f.id);
});

test('a finished career is recorded once, with its score', () => {
  const legacy = createLegacy();
  const run = createRun(4);
  assert.equal(recordCareer(legacy, run), null, 'not while active');
  run.status = 'lost';
  run.endReason = 'Executed.';
  assert.ok(recordCareer(legacy, run));
  assert.equal(recordCareer(legacy, run), null);
  assert.equal(legacy.careers, 1);
});

test('a career with a setup survives saves and replays from its seed and setup', () => {
  const run = createRun(9, { patron: 'veteran', decrees: ['ironBosses'], classes: ['samnite'] });
  const back = deserialize(serialize(run));
  assert.deepEqual(back.setup, run.setup);
  const { state } = replay({ seed: 9, actions: [], save: JSON.parse(serialize(run)) });
  assert.equal(serialize(state.run), serialize(run));
});

test('every achievement explains itself', () => {
  for (const a of ACHIEVEMENTS) assert.ok(a.name && a.desc, a.id);
});
