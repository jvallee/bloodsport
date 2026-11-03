// Afeared (the designer, 5.4.2): rarer, conquered by winning against the style they fear, or lifted at the Temple of Fortuna.
import test from 'node:test';
import assert from 'node:assert/strict';
import { FEAR, SCAR_AFEARED } from '../src/data.js';
import { createRun, recruit, advanceWeek, advanceToTournament, startMatch, finishMatch, choosePerk, buildRoom, rite, riteBlocker, ritePrice } from '../src/run.js';

function afraid(seed = 1) {
  const run = createRun(seed);
  const f = recruit(run, run.market[0].id);
  f.scars = [{ id: 'afeared', vs: 'melee' }];
  return { run, f };
}
function winAgainstMelee(run, f) {
  for (const x of run.roster) while (x.pendingPerks.length) choosePerk(run, x.id, x.pendingPerks[0][0]);
  if (run.bouts) advanceWeek(run); // last month's fight day is over
  advanceToTournament(run);
  const opp = run.arenas[1].opponent;
  Object.assign(opp, { cls: 'cestus', weapon: null });
  for (const x of run.roster) while (x.pendingPerks.length) choosePerk(run, x.id, x.pendingPerks[0][0]);
  const m = startMatch(run, f.id, 1);
  m.over = true;
  m.result = { winner: 'A', reason: 'rounds' };
  const s = finishMatch(run, m);
  run.mercy = null;
  return s;
}

test('Afeared is rarer: about 1 scar in 10', () => {
  assert.ok(SCAR_AFEARED.melancholic <= 0.25 && SCAR_AFEARED.other <= 0.05 && SCAR_AFEARED.choleric === 0);
});

test(`${FEAR.conquerWins} wins against the style they fear conquer it`, () => {
  const { run, f } = afraid(2);
  for (let i = 1; i < FEAR.conquerWins; i++) {
    winAgainstMelee(run, f);
    assert.ok(f.scars.some((x) => x.id === 'afeared'), 'not yet');
  }
  const s = winAgainstMelee(run, f);
  assert.ok(!f.scars.some((x) => x.id === 'afeared'), 'conquered');
  assert.match(s.fearConquered, /melee/);
  assert.ok(f.story.some((e) => /fear/.test(e.text)));
});

test('the Temple of Fortuna lifts the fear, for Gold', () => {
  const { run, f } = afraid(3);
  assert.match(riteBlocker(run, f.id), /Temple/);
  run.gold = 100; run.prestige = 40; run.prestigeLevel = 3;
  buildRoom(run, 'temple');
  const gold = run.gold;
  rite(run, f.id);
  assert.equal(run.gold, gold - ritePrice(run));
  assert.ok(!f.scars.some((x) => x.id === 'afeared'));
  assert.match(riteBlocker(run, f.id), /isn't Afeared/);
});
