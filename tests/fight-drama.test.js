// Version 6, phase 4: the live crowd meter, the opponent's intent and tells, and All In at the Death Gate.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createMatch, playRound, hypeOf, opponentIntent, opponentTell, suggestTactic, withTell, computePower, deathRisk, autoPlay } from '../src/fight.js';
import { HYPE, INTENT, TACTICS, ROUND_TACTICS } from '../src/data.js';
import { createRng } from '../src/rng.js';
import { Refused } from '../src/errors.js';
import { blank, injuries } from './helpers.js';

const humored = (humor, extra = {}) => blank({ id: 'b', name: 'Varro', humor, ...extra });
const match = (opts = {}) => createMatch({ a: blank({ id: 'a', name: 'Torq', ...opts.a }), b: humored(opts.humor ?? 'choleric', opts.b), rng: createRng(opts.seed ?? 7), oracle: opts.oracle ?? 0 });

test('the crowd: Guard drains hype and Press fills it; it never drops below 0', () => {
  const round = (A, extra = {}) => ({ winner: 'B', win: { chance: 50000 }, checks: [], stances: { A }, ...extra });
  assert.equal(hypeOf({ rounds: [round('press')] }), HYPE.press);
  assert.equal(hypeOf({ rounds: [round('guard')] }), 0, 'never below 0');
  assert.equal(hypeOf({ rounds: [round('allIn'), round('guard')] }), HYPE.allIn + HYPE.guard);
  // Floored round by round: an early Guard doesn't bank a debt against later drama.
  assert.equal(hypeOf({ rounds: [round('guard'), round('press')] }), HYPE.press);
  assert.ok(HYPE.guard < 0 && HYPE.favour > 0 && HYPE.favour <= HYPE.max);
});

test("the crowd's favour: at HYPE.favour or more when a round starts, your fighter has +1 Power that round, and can lose it", () => {
  const m = match();
  assert.equal(m.a.roar, false);
  // Put the crowd behind them: a fake first round full of drama.
  const wound = { attacker: 'A', injury: { tag: 'fleshWound' } };
  m.rounds.push({ winner: 'A', win: { chance: 20000 }, checks: [wound, wound, wound], stances: { A: 'press' } });
  m.a.roar = hypeOf(m) >= HYPE.favour;
  assert.ok(hypeOf(m) >= HYPE.favour, 'an upset, three wounds and Press reach the favour');
  const p = computePower(m.a, m.b, 2);
  assert.ok(p.mods.some((x) => x.source === 'The crowd' && x.value === HYPE.favourPower));
  // A real round sets it from the hype: Guard every round from scratch never earns it.
  const quiet = match();
  playRound(quiet, { stance: 'guard' });
  assert.equal(quiet.a.roar, hypeOf(quiet) >= HYPE.favour);
  assert.equal(quiet.rounds[0].roar, quiet.a.roar);
  assert.equal(computePower(quiet.a, quiet.b, 2).mods.some((x) => x.source === 'The crowd'), quiet.a.roar);
});

test('the intent: the tactic the opponent plays, decided before you pick; reading it early changes nothing', () => {
  for (let seed = 1; seed <= 40; seed++) {
    for (const humor of ['choleric', 'phlegmatic', 'sanguine']) {
      const read = match({ seed, humor, oracle: 1 });
      const unread = match({ seed, humor, oracle: 1 });
      while (!read.over) {
        const intent = opponentIntent(read);
        assert.equal(opponentIntent(read), intent, 'memoised');
        const stance = suggestTactic(read);
        const r = playRound(read, { stance });
        assert.equal(r.stances.B, intent.stance);
        playRound(unread, { stance });
      }
      assert.deepEqual(unread.rounds.map((r) => [r.winner, r.stances, r.roll, r.tell]), read.rounds.map((r) => [r.winner, r.stances, r.roll, r.tell]));
    }
  }
});

test('an Oracle-less fight plays exactly as before the intent existed (the same dice in the same order)', () => {
  // The reference: before phase 4, the opponent's tactic was drawn at the start of the round. Peeking or not is identical.
  const a = match({ seed: 99 });
  const b = match({ seed: 99 });
  autoPlay(a, suggestTactic);
  while (!b.over) { opponentIntent(b); playRound(b, { stance: suggestTactic(b) }); }
  assert.deepEqual(a.rounds.map((r) => r.roll), b.rounds.map((r) => r.roll));
  assert.equal(a.tells, undefined);
  assert.equal(opponentTell(a), null, 'no Oracle, no tell');
});

test('tells: right at about INTENT.accuracy, otherwise naming another tactic; none for an opponent without habits', () => {
  for (const level of [1, 2]) {
    let right = 0;
    let n = 0;
    for (let seed = 1; seed <= 1500; seed++) {
      const m = match({ seed, oracle: level, humor: ['choleric', 'sanguine', 'melancholic'][seed % 3] });
      const intent = opponentIntent(m);
      assert.ok(['press', 'feint', 'guard'].includes(intent.tell));
      n++;
      if (intent.tell === intent.stance) right++;
    }
    assert.ok(Math.abs(right / n - INTENT.accuracy[level]) < 0.04, `level ${level}: ${right / n}`);
  }
  const m = createMatch({ a: blank({ id: 'a' }), b: blank({ id: 'b' }), rng: createRng(3), oracle: 2 });
  assert.equal(opponentTell(m), null);
});

test('the suggestion weighs the tell against the habits (Bayes), and never suggests All In', () => {
  const odds = { press: 0.7, feint: 0.15, guard: 0.15 };
  const post = withTell(odds, 'feint', 0.7);
  assert.ok(Math.abs(Object.values(post).reduce((a, b) => a + b, 0) - 1) < 1e-9);
  assert.ok(post.feint > odds.feint && post.press < odds.press);
  assert.deepEqual(withTell(odds, null, 0.7), odds);
  assert.ok(!ROUND_TACTICS.includes('allIn') && TACTICS.allIn.clutch);
  const m = match({ a: { injuries: injuries('concussed', 'blinded') } });
  assert.notEqual(suggestTactic(m), 'allIn');
});

test('All In: only at the Death Gate; it adds its win, injure and self chances, and the crowd loves it', () => {
  const calm = match();
  assert.throws(() => playRound(calm, { stance: 'allIn' }), Refused);
  assert.equal(calm.round, 0, 'refused before anything happened');
  const m = match({ a: { injuries: injuries('concussed', 'blinded') }, seed: 5 });
  const r = playRound(m, { stance: 'allIn' });
  assert.equal(r.stances.A, 'allIn');
  assert.ok(r.win.modsA.some((x) => x.source === 'All In' && x.value === TACTICS.allIn.win));
  assert.ok(hypeOf(m) >= HYPE.allIn || r.winner === 'B' || r.death);
  // Opponents never pick it.
  for (let seed = 1; seed <= 200; seed++) assert.notEqual(opponentIntent(match({ seed, humor: 'phlegmatic' })).stance, 'allIn');
});

test('the death risk averages over what the opponent might do (it never reads the intent)', () => {
  const m = match({ a: { injuries: injuries('concussed', 'blinded') }, oracle: 2, seed: 11 });
  const before = deathRisk(m, 'steady', 200);
  opponentIntent(m);
  assert.equal(deathRisk(m, 'steady', 200), before);
  assert.ok(deathRisk(m, 'allIn', 200) >= 0);
});
