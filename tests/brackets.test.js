import test from 'node:test';
import assert from 'node:assert/strict';
import { BRACKET, CIRCUITS } from '../src/data.js';
import {
  createRun, recruit, advanceToTournament, advanceBlocker, startMatch, finishMatch, fightBlocker, boutFor, opponentFor,
  hasBracket, withdraw, withdrawBlocker, serialize, deserialize, GRAND_TIER, choosePerk, drawBrackets,
} from '../src/run.js';

// A career sitting at a Silver Coliseum tournament week.
function atSilver(seed = 1) {
  const run = createRun(seed);
  const f = recruit(run, run.market[0].id);
  const g = recruit(run, run.market[0].id);
  advanceToTournament(run);
  run.arenas[2] = { ...structuredClone(run.arenas[1]), tier: 2 };
  for (const t of [1, 2]) run.arenas[t].conquered = true;
  run.topTier = 3;
  run.arenas[3] = { ...structuredClone(run.arenas[1]), tier: 3, stage: 0, conquered: false };
  run.bouts = { 1: 'open', 2: 'open', 3: 'open' };
  run.boutPending = true;
  drawBrackets(run); // what the start of a tournament week does
  run.prestige = 50;
  f.power = 30; // wins every fight it's scripted to
  return { run, f, g };
}
const play = (run, id, tier, { winner = 'A', reason = 'rounds', alive = true } = {}) => {
  for (const x of run.roster) while (x.pendingPerks.length) choosePerk(run, x.id, x.pendingPerks[0][0]);
  const m = startMatch(run, id, tier);
  m.over = true;
  m.result = { winner, reason };
  m.a.f.alive = alive;
  return { m, s: finishMatch(run, m) };
};

test('brackets start at the Silver Coliseum: lower arenas stay single matches', () => {
  assert.equal(hasBracket(1), false);
  assert.equal(hasBracket(2), false);
  assert.equal(hasBracket(3), true);
  assert.equal(hasBracket(GRAND_TIER), true);
  assert.deepEqual(BRACKET.rounds, ['Quarter-final', 'Semi-final', 'Final']);
});

test('a Silver tournament is three matches: weaker opponents first, the listed one in the Final', () => {
  const { run, f } = atSilver();
  const final = run.arenas[3].opponent;
  const prestige = run.prestige;
  const qf = opponentFor(run, 3);
  assert.notEqual(qf, final);
  assert.equal(qf.power, boutFor(run, 3).oppPower + BRACKET.power[0]);
  const r1 = play(run, f.id, 3).s;
  assert.equal(r1.bracket, 'Quarter-final');
  assert.equal(r1.next, 'Semi-final');
  assert.equal(run.prestige, prestige - boutFor(run, 3).buyIn, 'the buy-in is paid once');
  assert.match(advanceBlocker(run), /Semi-final/);
  assert.equal(run.boutPending, true);
  const sf = opponentFor(run, 3);
  assert.equal(sf.power, boutFor(run, 3).oppPower + BRACKET.power[1]);
  play(run, f.id, 3);
  assert.equal(opponentFor(run, 3), final);
  const last = play(run, f.id, 3).s;
  assert.equal(last.won, true);
  assert.equal(last.bracket, 'Final');
  assert.equal(run.boutPending, false, 'the tournament is settled');
  assert.equal(run.arenas[3].stage, 1, 'the circuit moves on');
});

test('only the bracket fighter can continue; another fighter is turned away', () => {
  const { run, f, g } = atSilver(2);
  play(run, f.id, 3);
  for (const x of run.roster) while (x.pendingPerks.length) choosePerk(run, x.id, x.pendingPerks[0][0]);
  assert.match(fightBlocker(run, g.id, 3), /in the bracket/);
  assert.equal(fightBlocker(run, f.id, 3), null);
});

test('losing any bracket match loses the tournament', () => {
  const { run, f } = atSilver(3);
  play(run, f.id, 3);
  const { s } = play(run, f.id, 3, { winner: 'B' });
  assert.equal(s.won, false);
  assert.equal(s.bracket, 'Semi-final');
  assert.equal(run.boutPending, false);
  assert.equal(advanceBlocker(run), null);
});

test('withdrawing between matches counts as capitulating', () => {
  const { run, f } = atSilver(4);
  assert.match(withdrawBlocker(run, 3), /Nothing to withdraw/);
  play(run, f.id, 3);
  const s = withdraw(run, 3);
  assert.equal(s.reason, 'towel');
  assert.equal(run.boutPending, false);
  assert.equal(run.roster.find((x) => x.id === f.id).alive, true);
});

test('a bracket in progress survives a save and load', () => {
  const { run, f } = atSilver(5);
  play(run, f.id, 3);
  const back = deserialize(serialize(run));
  assert.equal(opponentFor(back, 3).name, opponentFor(run, 3).name);
  assert.match(advanceBlocker(back), /Semi-final/);
});

test('the Dirt Pits stays a single match', () => {
  const run = createRun(6);
  const f = recruit(run, run.market[0].id);
  advanceToTournament(run);
  const { s } = play(run, f.id, 1);
  assert.equal(s.bracket ?? null, null);
  assert.equal(run.boutPending, false);
  assert.ok(CIRCUITS[0]);
});

test('looking at a bracket never changes the career (rendering rolls no dice)', async () => {
  const { ludusTab } = await import('../src/ui/views.js');
  const { run } = atSilver(7);
  const before = serialize(run);
  opponentFor(run, 3);
  ludusTab(run, () => ({ win: 0.5, injury: 0.2, death: 0 }));
  assert.equal(serialize(run), before);
});
