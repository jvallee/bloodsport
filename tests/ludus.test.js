import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun } from '../src/run.js';
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
  assert.equal(rosterCap(run), 3);
  assert.match(upgradeBlocker(run, q), /Prestige level 3/);
  run.prestigeLevel = 3;
  upgrade(run, q);
  assert.equal(upgradeBlocker(run, q), 'Fully upgraded.');
  assert.deepEqual([rosterCap(run), decorCap(run)], [4, 3]);
});

test('trainer levels raise the cap and the weekly cost', () => {
  const run = richRun(5);
  const t = idOf(run, 'trainer');
  for (let i = 0; i < 4; i++) upgrade(run, t);
  assert.deepEqual([trainCap(run), trainCost(run)], [21, 5]);
});

test('Medbay Lv 3 treats 3 fighters and heals 2 weeks per week', () => {
  const run = richRun(4);
  const m = idOf(run, 'medbay');
  upgrade(run, m);
  upgrade(run, m);
  assert.deepEqual([medbaySlots(run), healRate(run)], [3, 2]);
});

test('roster cap is limited by the Prestige level fighter cap', () => {
  const run = richRun(2);
  build(run, 'quarters');
  build(run, 'quarters');
  assert.equal(rosterCap(run), 6);
  run.prestigeLevel = 1;
  assert.equal(rosterCap(run), 3);
});

test('Entertainment Room relieves Stress', () => {
  const run = richRun(3);
  run.buildings = run.buildings.filter((b) => b.type !== 'medbay');
  build(run, 'entertainment');
  assert.equal(stressRelief(run), 10);
});

test('Prestige levels are reached at 10 / 25 / 50 / 90 and never lost', () => {
  assert.deepEqual([0, 9, 10, 25, 50, 90, 500].map((p) => prestigeLevelFor(p)), [1, 1, 2, 3, 4, 5, 5]);
  assert.equal(prestigeLevelFor(3, 4), 4);
});
