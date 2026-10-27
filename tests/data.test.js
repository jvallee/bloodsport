import test from 'node:test';
import assert from 'node:assert/strict';
import { deltaRow, clampDelta, injuryForScore, INJURIES, KINDS, TRAITS, TOURNAMENTS } from '../src/data.js';

test('Delta 0 is a coin flip with 10% / 25% injury chances', () => {
  assert.deepEqual(deltaRow(0), { delta: 0, win: 50000, winnerInjury: 10000, loserInjury: 25000 });
});

test('positive Deltas follow the design doc table', () => {
  assert.equal(deltaRow(1).win, 55000);
  assert.equal(deltaRow(4).win, 85000);
  assert.equal(deltaRow(5).win, 95000);
  assert.equal(deltaRow(10).win, 99999);
  assert.equal(deltaRow(3).loserInjury, 50000);
  assert.equal(deltaRow(6).winnerInjury, 5000);
});

test('negative Deltas mirror win chance and keep injury chances', () => {
  for (let k = 1; k <= 10; k++) {
    const pos = deltaRow(k);
    const neg = deltaRow(-k);
    assert.equal(neg.win, 100000 - pos.win);
    assert.equal(neg.winnerInjury, pos.winnerInjury);
    assert.equal(neg.loserInjury, pos.loserInjury);
  }
});

test('Delta clamps at ±10', () => {
  assert.equal(clampDelta(25), 10);
  assert.equal(clampDelta(-25), -10);
  assert.deepEqual(deltaRow(17), deltaRow(10));
  assert.deepEqual(deltaRow(-17), deltaRow(-10));
});

test('injury tier boundaries match the injury table', () => {
  const cases = [
    [1, 'distracted'], [25, 'distracted'], [26, 'fleshWound'], [45, 'fleshWound'], [46, 'concussed'], [60, 'concussed'],
    [61, 'poisoned'], [74, 'poisoned'], [75, 'maimed'], [84, 'maimed'], [85, 'senseless'], [92, 'senseless'],
    [93, 'blinded'], [99, 'blinded'], [100, 'death'], [175, 'death'],
  ];
  for (const [score, tag] of cases) assert.equal(injuryForScore(score).tag, tag, `score ${score}`);
});

test('only Poisoned weighs 2 among non-fatal injuries', () => {
  for (const i of INJURIES.filter((x) => x.tag !== 'death')) assert.equal(i.weight, i.tag === 'poisoned' ? 2 : 1);
});

test('every kind trait is defined and Orc starts at Power 6', () => {
  for (const k of Object.values(KINDS)) for (const t of k.traits) assert.ok(TRAITS[t], t);
  assert.equal(KINDS.orc.basePower, 6);
  assert.equal(KINDS.human.basePower, 5);
});

test('tournament placeholders match fight-rules.md', () => {
  assert.deepEqual(TOURNAMENTS.map((t) => t.buyIn), [1, 2, 3]);
  assert.deepEqual(TOURNAMENTS.map((t) => t.winGold), [3, 5, 8]);
  assert.deepEqual(TOURNAMENTS.map((t) => t.oppPower), [5, 7, 9]);
  assert.deepEqual(TOURNAMENTS.map((t) => t.bossDebuff), [false, false, true]);
});
