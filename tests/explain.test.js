import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun, recruit, advanceToTournament, startMatch } from '../src/run.js';
import { playRound } from '../src/fight.js';
import { ECONOMY } from '../src/data.js';
import { fighterWarnings, arenaStakes, roundStats } from '../src/explain.js';

const twoTiers = () => {
  const run = createRun(2);
  const f = recruit(run, run.market[0].id);
  run.topTier = 2;
  run.arenas[2] = { ...run.arenas[1], tier: 2, stage: 0 };
  return { run, f };
};

test('rookies get a reassurance, not a jeer warning, in lower arenas', () => {
  const { run, f } = twoTiers();
  f.renown = 0;
  f.power = run.arenas[1].opponent.power + 6;
  const texts = fighterWarnings(run, f, 1).map((w) => w.text).join(' | ');
  assert.match(texts, /Rookie/);
  assert.doesNotMatch(texts, /Crushing/);
});

test('a known fighter far stronger than the opponent gets the crushing warning with the actual gap', () => {
  const { run, f } = twoTiers();
  f.renown = ECONOMY.knownRenown;
  f.power = run.arenas[1].opponent.power + 4;
  assert.match(fighterWarnings(run, f, 1).map((w) => w.text).join(' | '), /Crushing mismatch \(\+4 Power/);
});

test('lower-arena stakes no longer claim "no Favour at stake" and mention what still earns Favour', () => {
  const { run } = twoTiers();
  const text = arenaStakes(run, 1);
  assert.doesNotMatch(text, /no Favour at stake/);
  assert.match(text, /Upsets and Bloodied Victories \(wins with 2\+ injuries\) still earn Favour/);
});

test('Boss stakes show the real per-tier Favour loss and forfeit cost', () => {
  const run = createRun(2);
  run.arenas[1].stage = 2;
  assert.match(arenaStakes(run, 1), /Lose: -10 Favour\. Forfeit: -15 Favour/);
});

test('roundStats reports the Power and Speed the round will actually use', () => {
  const run = createRun(2);
  const f = recruit(run, run.market[0].id);
  f.gear.weapon = 'gladius';
  advanceToTournament(run);
  const m = startMatch(run, f.id);
  const s = roundStats(m);
  assert.equal(s.round, 1);
  assert.equal(s.A.power, f.power + 1, 'gear included');
  playRound(m);
  if (!m.over) assert.equal(roundStats(m).round, 2);
});
