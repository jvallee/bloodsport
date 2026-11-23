// The balance harness speed-ups must not change a single result: cached bet odds, the cheaper fighter copy,
// odds simulations without the UI snapshot, and the Speed split run one Boss at a time.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRng } from '../src/rng.js';
import { createMatch, autoPlay, suggestTactic, cloneData } from '../src/fight.js';
import { createRun, recruit, advanceToTournament, startMatch, betOdds, createFighter } from '../src/run.js';
import { speedSplit, mergeSplits } from '../scripts/checks.js';
import { CIRCUITS } from '../src/data.js';

test('cloneData: a deep, independent copy equal to structuredClone', () => {
  const f = createFighter(createRng(3), { id: 'x' });
  f.injuries = [{ tag: 'poisoned', weight: 2 }];
  f.titles = ['a'];
  const c = cloneData(f);
  assert.deepEqual(c, structuredClone(f));
  c.injuries.push({ tag: 'flesh', weight: 1 });
  c.titles[0] = 'b';
  assert.equal(f.injuries.length, 1);
  assert.equal(f.titles[0], 'a');
});

test('a fast match (odds simulations) plays exactly like a normal one, without the pre-round snapshot', () => {
  for (let seed = 1; seed <= 40; seed++) {
    const a = createFighter(createRng(seed), { id: 'a', power: 10 });
    const b = createFighter(createRng(seed + 100), { id: 'b', power: 10 });
    const play = (fast) => {
      const m = createMatch({ a, b, rng: createRng(seed), fast });
      autoPlay(m, suggestTactic);
      return m;
    };
    const slow = play(false);
    const fast = play(true);
    assert.deepEqual(fast.result, slow.result);
    assert.deepEqual(fast.a.f, slow.a.f);
    assert.deepEqual(fast.b.f, slow.b.f);
    assert.ok(slow.rounds.every((r) => r.before));
    assert.ok(fast.rounds.every((r) => !r.before));
    assert.deepEqual(fast.rounds, slow.rounds.map(({ before, ...r }) => r));
  }
});

test('betOdds: cached per match, and recomputed when the fighter changes', () => {
  const run = createRun(2);
  const f = recruit(run, run.market[0].id);
  advanceToTournament(run);
  const m = startMatch(run, f.id, 1);
  const first = betOdds(run, m);
  assert.equal(betOdds(run, m), first);
  const fresh = { ...m }; // a different match object starts with no cache
  assert.equal(betOdds(run, fresh), first);
  m.b.f.power += 15;
  const changed = betOdds(run, m);
  assert.notEqual(changed, first);
  assert.equal(changed, betOdds(run, { ...m }));
});

test('speedSplit one Boss at a time merges to exactly the whole run', () => {
  const whole = speedSplit({ n: 60 });
  const merged = mergeSplits(CIRCUITS.map((_, i) => speedSplit({ n: 60, only: i })));
  assert.deepEqual(merged, whole);
});
