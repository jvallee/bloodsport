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

test('the Emperor\'s demands: issued some months, judged when fight day ends; met pays, missed costs a little', async () => {
  const { DEMAND, DEMANDS } = await import('../src/data.js');
  const { demandMet } = await import('../src/run.js');
  let issued = 0;
  for (let seed = 1; seed <= 20; seed++) {
    const run = createRun(seed);
    const f = recruit(run, run.market[0].id);
    for (let i = 0; i < 20 && !run.demand; i++) { run.event = null; run.mercy = null; run.boutPending = false; run.bouts = null; advanceWeek(run); }
    if (!run.demand) continue;
    issued++;
    assert.ok(DEMANDS[run.demand.id]);
    // Meet it by hand: a winning top-arena record of the right kind since the demand.
    run.history.push({ week: run.week, top: true, won: true, bloodied: true, verdict: run.demand.id === 'kill' ? 'kill' : 'spare', tier: 1 });
    if (run.demand.id === 'twoArenas') run.history.push({ week: run.week, won: true, tier: 2 });
    assert.equal(demandMet(run), true, run.demand.id);
    const favor = run.favor;
    const week = run.demand.week;
    for (let i = 0; i < 6 && run.demand?.week === week; i++) { run.event = null; run.mercy = null; if (run.boutPending) { run.boutPending = false; } advanceWeek(run); }
    // Playtest #9: judged before the new month starts, so the next month may already bring a new demand.
    assert.notEqual(run.demand?.week, week, 'judged at the end of fight day');
    assert.ok(run.favor >= favor + DEMAND.favor - 1 || run.favor === 100);
    void f;
  }
  assert.ok(issued >= 5, `${issued} careers got a demand`);
});

test('bonds: sparring partners bond; a bond is comfort, a mentor teaches, and a partner\'s death brings grief', async () => {
  const { exhibition, moraleTarget, bondmate, advanceWeek: week } = await import('../src/run.js');
  const { BOND } = await import('../src/data.js');
  const run = createRun(7);
  const [a, b] = [recruit(run, run.market[0].id), recruit(run, run.market[0].id)];
  run.buildings.push({ id: 'be', type: 'exhibition', level: 1 });
  advanceToTournament(run);
  for (const f of [a, b]) f.injuries = [];
  const before = moraleTarget(run, a).comfort;
  exhibition(run, a.id, b.id);
  assert.equal(bondmate(run, a), b);
  assert.equal(moraleTarget(run, a).comfort, before + BOND.comfort, 'a bond is comfort');
  // A mentor teaches.
  a.level = 5;
  b.level = 1;
  const xp = b.xp;
  run.boutPending = false;
  run.mercy = null;
  week(run);
  assert.ok(b.xp > xp, 'the junior learns');
  // A partner's death: grief, and the bond ends.
  run.roster = run.roster.filter((x) => x !== a);
  run.fallen.push({ ...a, alive: false });
  run.event = null;
  week(run);
  assert.equal(b.bond, undefined);
  assert.ok(b.mood.n <= BOND.grief);
});

test('the crowd\'s hype: upsets, wounds, kills, signatures, Press and comebacks fill it; it pays out at the end', async () => {
  const { hypeOf } = await import('../src/fight.js');
  const { HYPE } = await import('../src/data.js');
  const m = { over: true, result: { winner: 'A' }, rounds: [
    { winner: 'B', win: { chance: 50000 }, checks: [], stances: { A: 'steady' } },
    { winner: 'A', win: { chance: 30000 }, checks: [{ attacker: 'A', injury: { tag: 'fleshWound' } }], signatures: [{ side: 'A' }], stances: { A: 'press' } },
    { winner: 'A', win: { chance: 60000 }, checks: [], stances: { A: 'steady' } },
  ] };
  assert.equal(hypeOf(m), HYPE.upset + HYPE.wound + HYPE.signature + HYPE.press + HYPE.comeback);
  assert.equal(hypeOf({ rounds: [] }), 0);
  assert.equal(hypeOf({}), 0, 'a reload\'s stand-in match');
  // Paid with the purse.
  const run = createRun(3);
  const f = recruit(run, run.market[0].id);
  advanceToTournament(run);
  const match = startMatch(run, f.id, 1);
  Object.assign(match, { over: true, result: { winner: 'A', reason: 'rounds' }, round: 3, rounds: m.rounds });
  const s = finishMatch(run, match);
  assert.equal(s.hype.hype, hypeOf(m));
  assert.equal(s.hype.renown, Math.floor(s.hype.hype / HYPE.renownPer));
});

test('the Patron Lounge: host the Senate monthly for Influence, and spend it on policies that change the rules', async () => {
  const { host, hostBlocker, enact, enactBlocker, hasPolicy, boutFor, tributeDue } = await import('../src/run.js');
  const { LOUNGE } = await import('../src/data.js');
  const { estateTab } = await import('../src/ui/views.js');
  const run = createRun(5);
  const f = recruit(run, run.market[0].id);
  f.renown = 25;
  assert.equal(hostBlocker(run), 'Build the Patron Lounge first.');
  run.buildings.push({ id: 'bl', type: 'lounge', level: 1 });
  run.gold = 100;
  assert.equal(host(run), 3, '1 + 2 for a famous star');
  assert.match(hostBlocker(run), /this month/);
  const purse = boutFor(run, 1).winGold;
  const tribute = tributeDue(run);
  enact(run, 'breadAndCircuses');
  assert.ok(hasPolicy(run, 'breadAndCircuses'));
  assert.equal(boutFor(run, 1).winGold, Math.round(purse * 1.25));
  assert.match(enactBlocker(run, 'lowerTribute'), /no more policies|Influence/);
  run.week += LOUNGE.weeks;
  assert.equal(hasPolicy(run, 'breadAndCircuses'), false, 'policies lapse');
  run.influence = 10;
  enact(run, 'lowerTribute');
  assert.ok(tributeDue(run) < tribute || tributeDue(run) === Math.round(tribute * 0.7));
  assert.match(estateTab(run), /The Patron Lounge/);
});
