// The fun ideas (2026-11-01): nemeses, a short career and the daily challenge, betting, the Emperor's demands, bonds,
// the crowd's hype, and the Patron Lounge.
import test from 'node:test';
import assert from 'node:assert/strict';
import { NEMESIS } from '../src/data.js';
import { createRun, recruit, advanceToTournament, advanceWeek, startMatch, finishMatch, choosePerk } from '../src/run.js';

const play = (run, id, tier, { winner = 'A', reason = 'rounds', alive = true } = {}) => {
  for (const x of run.roster) while (x.pendingPerks.length) choosePerk(run, x.id, x.pendingPerks[0][0]);
  const m = startMatch(run, id, tier);
  m.over = true;
  m.result = { winner, reason };
  m.a.f.alive = alive;
  m.round = 2;
  return finishMatch(run, m);
};

test('nemesis: an opponent who beats one of yours is remembered with a name for it', () => {
  const run = createRun(1);
  const f = recruit(run, run.market[0].id);
  advanceToTournament(run);
  const opp = run.arenas[1].opponent;
  play(run, f.id, 1, { winner: 'B' });
  assert.equal(run.nemeses.length, 1);
  const n = run.nemeses[0];
  assert.equal(n.name, opp.name);
  assert.ok(NEMESIS.epithets.includes(n.nemesis.epithet));
  assert.equal(n.nemesis.wins, 1);
});

test('nemesis: they come back stronger, and beating them pays Renown, Gold and Favour', () => {
  const chance = NEMESIS.returnChance;
  NEMESIS.returnChance = 1; // make the return certain for the test
  const run = createRun(1);
  const f = recruit(run, run.market[0].id);
  advanceToTournament(run);
  const base = run.arenas[1].opponent;
  run.nemeses = [{ ...structuredClone(base), id: 'nx', name: 'Gorrak', nemesis: { epithet: 'the Butcher', wins: 2, kills: 1, victims: ['Ulfa'], tier: 1, lastSeen: -100 } }];
  f.power = 40;
  play(run, f.id, 1); // a win: the arena moves on, and the nemesis is the next opponent
  NEMESIS.returnChance = chance;
  const n = run.arenas[1].opponent;
  assert.ok(n.nemesis, 'the nemesis is back');
  assert.equal(n.nemesis.bonus, 2 * NEMESIS.powerPerWin);
  run.mercy = null; // the verdict on the beaten opponent, which would hold the week
  run.boutPending = false;
  for (let i = 0; i < 8 && !run.boutPending; i++) { run.event = null; run.mercy = null; for (const x of run.roster) x.pendingPerks = []; advanceWeek(run); }
  const gold = run.gold;
  const s = play(run, f.id, 1);
  assert.match(s.nemesis, /Gorrak the Butcher/);
  assert.ok(run.gold > gold);
  assert.equal(run.nemeses.length, 0, 'beaten, and gone');
  assert.match(f.story.at(-1).text, /nemesis, Gorrak the Butcher, who had killed Ulfa/);
});

test('a short career goes straight from the tournament to the Boss, with richer purses', async () => {
  const { SHORT, CIRCUITS } = await import('../src/data.js');
  const { boutFor, upcomingBouts } = await import('../src/run.js');
  const full = createRun(4);
  const short = createRun(4, { short: true });
  assert.equal(short.setup.short, true);
  assert.equal(boutFor(short, 1).winGold, Math.round(boutFor(full, 1).winGold * SHORT.purse));
  assert.deepEqual(upcomingBouts(short).map((b) => b.stage), ['Tournament 1', 'Boss Tournament']);
  assert.equal(upcomingBouts(full).length, 3);
  const f = recruit(short, short.market[0].id);
  advanceToTournament(short);
  f.power = 40;
  play(short, f.id, 1);
  assert.equal(short.arenas[1].stage, 2, 'one win and the Boss is next');
  assert.ok(CIRCUITS.length);
});

test('the daily Emperor\'s Challenge: the same short career for everyone on a day, best score kept', async () => {
  const { dailySeed, dailySetup, createLegacy, recordCareer } = await import('../src/legacy.js');
  assert.equal(dailySeed('2026-11-01'), dailySeed('2026-11-01'));
  assert.notEqual(dailySeed('2026-11-01'), dailySeed('2026-11-02'));
  const run = createRun(dailySeed('2026-11-01'), dailySetup('2026-11-01'));
  assert.deepEqual([run.setup.short, run.setup.daily, run.setup.patron], [true, '2026-11-01', null]);
  const legacy = createLegacy();
  run.status = 'lost';
  recordCareer(legacy, run);
  assert.ok(legacy.daily['2026-11-01'] >= 0);
});

test('betting: before Round 1 you can back your fighter at their real odds; a win pays, a loss doesn\'t', async () => {
  const { placeBet, betBlocker, betOdds, betCap } = await import('../src/run.js');
  const { BET } = await import('../src/data.js');
  const { playRound } = await import('../src/fight.js');
  for (const winner of ['A', 'B']) {
    const run = createRun(2);
    const f = recruit(run, run.market[0].id);
    advanceToTournament(run);
    run.gold = 30;
    const m = startMatch(run, f.id, 1);
    const odds = betOdds(run, m);
    assert.ok(odds > 0 && odds <= BET.maxOdds);
    assert.match(betBlocker(run, m, betCap(run, m) + 1), /take up to/);
    const bet = placeBet(run, m, 5);
    assert.equal(run.gold, 25);
    assert.equal(bet.payout, Math.floor(5 * odds));
    assert.match(betBlocker(run, m, 2), /already bet/);
    m.over = true;
    m.result = { winner, reason: 'rounds' };
    m.round = 2;
    const gold = run.gold;
    const s = finishMatch(run, m);
    assert.equal(s.bet.won, winner === 'A');
    if (winner === 'A') assert.ok(run.gold >= gold + bet.payout, 'the payout comes with the purse');
    void playRound;
  }
});
