import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun } from '../src/run.js';
import { CIRCUITS } from '../src/data.js';
import {
  build, buildBlocker, upgrade, upgradeBlocker, plotCount, plotsFree, rosterCap, trainerRooms, trainCap, trainCost,
  medbaySlots, healRate, decorCap, oracleLevel, prestigeLevelFor, stressRelief,
} from '../src/ludus.js';

const richRun = (level = 1) => {
  const run = createRun(1);
  run.gold = 1000;
  run.prestigeLevel = level;
  return run;
};
const idOf = (run, type) => run.buildings.find((b) => b.type === type).id;

test('a new Ludus has Quarters, a Trainer Room and a Medbay filling all 3 plots', () => {
  const run = createRun(1);
  assert.deepEqual(run.buildings.map((b) => b.type), ['quarters', 'trainer', 'medbay']);
  assert.deepEqual([plotCount(run), plotsFree(run)], [3, 0]);
  assert.deepEqual([rosterCap(run), trainerRooms(run), trainCap(run), trainCost(run), medbaySlots(run), healRate(run), decorCap(run)], [2, 1, 3, 1, 1, 1, 1]);
});

test('building needs a free plot, the unlock level and Gold', () => {
  const run = richRun(1);
  assert.match(buildBlocker(run, 'oracle'), /Prestige level 2/);
  assert.match(buildBlocker(run, 'trainer'), /No free plots/);
  run.prestigeLevel = 2;
  assert.equal(buildBlocker(run, 'oracle'), null);
  run.gold = 3;
  assert.match(buildBlocker(run, 'oracle'), /Needs 8 Gold/);
  assert.match(buildBlocker(run, 'castle'), /Unknown/);
});

test('building spends Gold and uses a plot', () => {
  const run = richRun(2);
  build(run, 'oracle');
  build(run, 'trainer');
  assert.deepEqual([plotsFree(run), oracleLevel(run), trainerRooms(run), run.gold], [0, 1, 2, 1000 - 16]);
});

test('upgrades follow the cost and Prestige requirements', () => {
  const run = richRun(1);
  const q = idOf(run, 'quarters');
  upgrade(run, q);
  assert.equal(rosterCap(run), 4); // Quarters level 2 houses 4 
  assert.match(upgradeBlocker(run, q), /Prestige level 3/);
  run.prestigeLevel = 3;
  upgrade(run, q);
  assert.equal(upgradeBlocker(run, q), 'Fully upgraded.');
  assert.deepEqual([rosterCap(run), decorCap(run)], [5, 3]);
});

test('trainer levels raise the cap and the weekly cost', () => {
  const run = richRun(5);
  const t = idOf(run, 'trainer');
  for (let i = 0; i < 4; i++) upgrade(run, t);
  run.topTier = 3;
  assert.deepEqual([trainCap(run), trainCost(run)], [21, 5]);
});

test('below the Silver Coliseum, training costs at most 2 Gold a fighter-week (the Bronze wall, 5.4.0)', () => {
  const run = richRun(5);
  const t = idOf(run, 'trainer');
  assert.equal(trainCost(run), 1);
  for (let i = 0; i < 4; i++) upgrade(run, t);
  for (const [tier, fee] of [[1, 2], [2, 2], [3, 5], [4, 5], [5, 5]]) {
    run.topTier = tier;
    assert.equal(trainCost(run), fee, `top arena tier ${tier}`);
  }
});

test('the Bronze Boss fights at Power 13 (the Bronze wall, 5.4.0)', () => {
  assert.deepEqual(CIRCUITS[1].oppPower, [11, 12, 13]);
});

test('Medbay Lv 2 heals 2 weeks per week; Lv 3 treats 3 fighters', () => {
  const run = richRun(4);
  const m = idOf(run, 'medbay');
  upgrade(run, m);
  assert.deepEqual([medbaySlots(run), healRate(run)], [2, 2]);
  upgrade(run, m);
  assert.deepEqual([medbaySlots(run), healRate(run)], [3, 2]);
});

test('roster cap is limited by the Prestige level fighter cap', () => {
  const run = richRun(2);
  build(run, 'quarters');
  build(run, 'quarters');
  assert.equal(rosterCap(run), 6);
  run.prestigeLevel = 1;
  assert.equal(rosterCap(run), 4);
});

test('Entertainment Room relieves 15 Stress a week', () => {
  const run = richRun(2);
  run.buildings = run.buildings.filter((b) => b.type !== 'medbay');
  build(run, 'entertainment');
  assert.equal(stressRelief(run), 15);
});

// Playtest #8: raised from 10 / 25 / 50 / 90 to offset Prestige for every tournament win.
test('Prestige levels are reached at 12 / 30 / 60 / 110 and never lost', () => {
  assert.deepEqual([0, 11, 12, 30, 60, 110, 500].map((p) => prestigeLevelFor(p)), [1, 1, 2, 3, 4, 5, 5]);
  assert.equal(prestigeLevelFor(3, 4), 4);
});

test('Oracle, Liaison and Entertainment Room are one per estate (a second would do nothing)', () => {
  const run = richRun(3);
  for (const type of ['oracle', 'liaison', 'entertainment']) {
    run.buildings = run.buildings.slice(0, 3);
    build(run, type);
    assert.match(buildBlocker(run, type), /already have one/);
  }
  assert.equal(buildBlocker(run, 'trainer'), null, 'extra Trainer Rooms train more fighters');
});
