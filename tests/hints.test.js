import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun, recruit, advanceToTournament, setJob } from '../src/run.js';
import { nextHint } from '../src/hints.js';

test('a new career points you to the Market', () => {
  const h = nextHint(createRun(1));
  assert.match(h.text, /Recruit/);
  assert.equal(h.tab, 'market');
});

test('tournament week points at your top arena', () => {
  const run = createRun(1);
  recruit(run, run.market[0].id);
  advanceToTournament(run);
  assert.match(nextHint(run).text, /Tournament week: send a fighter to The Dirt Pits/);
});

test('an injured fighter not in the Medbay is flagged before anything routine', () => {
  const run = createRun(1);
  const f = recruit(run, run.market[0].id);
  f.injuries = [{ tag: 'fleshWound', weight: 1, weeksLeft: 1 }];
  assert.match(nextHint(run).text, /injured: set their job to Medbay/);
  setJob(run, f.id, 'medbay');
  assert.doesNotMatch(nextHint(run).text, /injured/);
});

test('a resting fighter who could train is suggested; otherwise it says to end the week', () => {
  const run = createRun(1);
  const f = recruit(run, run.market[0].id);
  assert.match(nextHint(run).text, /could train/);
  setJob(run, f.id, 'trainPower');
  assert.match(nextHint(run).text, /End the week/);
});

test('no hint once the career is over', () => {
  const run = createRun(1);
  run.status = 'lost';
  assert.equal(nextHint(run), null);
});

test('when the top arena is unaffordable, the hint says so and points at the Dirt Pits', () => {
  const run = createRun(1);
  recruit(run, run.market[0].id);
  advanceToTournament(run);
  run.topTier = 2;
  run.arenas[2] = { ...structuredClone(run.arenas[1]), tier: 2 };
  run.bouts = { 1: 'open', 2: 'open' };
  run.prestige = 1;
  const h = nextHint(run);
  assert.equal(h.tone, 'bad');
  assert.match(h.text, /Not enough Prestige for The Bronze Arena: the buy-in is 2 and you have 1\. Skip it, and win Prestige back in The Dirt Pits/);
});
