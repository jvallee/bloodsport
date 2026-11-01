// Version 5.3.0: lower arenas move on without you, the Basa in the Market, and reanimating the dead.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun, recruit, advanceToTournament, advanceWeek, startMatch, finishMatch, choosePerk, resolveMercy } from '../src/run.js';

export const play = (run, id, tier, { winner = 'A', reason = 'rounds', alive = true } = {}) => {
  for (const x of run.roster) while (x.pendingPerks.length) choosePerk(run, x.id, x.pendingPerks[0][0]);
  const m = startMatch(run, id, tier);
  m.over = true;
  m.result = { winner, reason };
  m.a.f.alive = alive;
  m.round = 2;
  const s = finishMatch(run, m);
  if (run.mercy) resolveMercy(run, 'spare');
  for (const x of run.roster) while (x.pendingPerks.length) choosePerk(run, x.id, x.pendingPerks[0][0]);
  return s;
};

// A career whose top arena is the Bronze Arena: the Dirt Pits conquered by a champion with Power to spare.
export function bronzeCareer(seed = 3) {
  const run = createRun(seed);
  const f = recruit(run, run.market[0].id);
  f.power = 40;
  while (run.topTier === 1) {
    advanceToTournament(run);
    play(run, f.id, 1);
    advanceWeek(run);
  }
  return { run, f };
}

test('a lower arena you sit out moves on: its circuit advances and a new opponent steps up', () => {
  const { run, f } = bronzeCareer();
  advanceToTournament(run);
  const before = { stage: run.arenas[1].stage, opp: run.arenas[1].opponent.id };
  play(run, f.id, 2); // the top arena only; nobody goes to the Dirt Pits
  advanceWeek(run);
  assert.notEqual(run.arenas[1].opponent.id, before.opp);
  assert.equal(run.arenas[1].stage, (before.stage + 1) % 3);
});

test('a lower arena at its Boss that you sit out starts a new circuit', () => {
  const { run, f } = bronzeCareer();
  advanceToTournament(run);
  run.arenas[1].stage = 2;
  play(run, f.id, 2);
  advanceWeek(run);
  assert.equal(run.arenas[1].stage, 0);
});

test('a lower arena you fight in moves on as before, once', () => {
  const { run, f } = bronzeCareer();
  const g = recruit(run, run.market[0].id);
  g.power = 40;
  advanceToTournament(run);
  const stage = run.arenas[1].stage;
  play(run, f.id, 2);
  play(run, g.id, 1);
  advanceWeek(run);
  assert.equal(run.arenas[1].stage, (stage + 1) % 3);
});
