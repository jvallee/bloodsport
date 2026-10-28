import test from 'node:test';
import assert from 'node:assert/strict';
import { createRng } from '../src/rng.js';
import { createMatch, autoPlay, playRound } from '../src/fight.js';
import { blank } from './helpers.js';
import { createFighter } from '../src/run.js';
import { narrateRound, narrateStory, adviceFor, resultText, fmtPct, signed, modLabel } from '../src/narrate.js';

test('fmtPct formats ChanceE5 values', () => {
  assert.equal(fmtPct(50000), '50%');
  assert.equal(fmtPct(99999), '99.999%');
  assert.equal(fmtPct(1), '0.001%');
  assert.equal(fmtPct(37215), '37.215%');
});

test('signed and modLabel', () => {
  assert.equal(signed(3), '+3');
  assert.equal(signed(-2), '-2');
  assert.equal(signed(0), '0');
  assert.equal(modLabel({ source: 'Hateful', value: 10000 }, true), 'Hateful +10%');
  assert.equal(modLabel({ source: 'Blinded', value: -2 }, false), 'Blinded -2');
});

test('narration covers every round of random matches without gaps', () => {
  const rng = createRng(2024);
  for (let i = 0; i < 300; i++) {
    const a = createFighter(rng, { id: 'a', decorLevel: 2 });
    const b = createFighter(rng, { id: 'b', power: 5 + (i % 5), decorLevel: 2 });
    a.injuries = i % 3 === 0 ? [{ tag: 'poisoned', weight: 2 }] : [];
    const m = createMatch({ a, b, rng, debuff: i % 2 === 0 ? 'firstInjuryDouble' : null });
    autoPlay(m);
    for (const r of m.rounds) {
      const lines = narrateRound(m, r);
      assert.ok(lines.length >= 4);
      for (const l of lines) assert.doesNotMatch(l.text, /undefined|NaN|null/, l.text);
      const story = narrateStory(m, r);
      assert.ok(story.length >= 2);
      for (const l of story) assert.doesNotMatch(l.text, /undefined|NaN|null/, l.text);
    }
    const advice = adviceFor(m);
    assert.equal(advice === null, m.result.winner === 'A');
    if (advice) assert.doesNotMatch(advice, /undefined|NaN/);
    assert.doesNotMatch(resultText(m), /undefined|NaN/);
  }
});

test('advice points at the Death Gate after a death and at Stress after an overtrained loss', () => {
  const base = { a: { f: { name: 'Livia' } }, rounds: [], preMatch: [] };
  assert.match(adviceFor({ ...base, result: { winner: 'B', reason: 'death' } }), /Death Gate/);
  assert.match(adviceFor({ ...base, preMatch: [{ source: 'Overtrained' }], result: { winner: 'B', reason: 'rounds' } }), /Rest the week/);
  assert.match(adviceFor({ ...base, rounds: [{ delta: -3, checks: [] }], result: { winner: 'B', reason: 'rounds' } }), /out-powered/);
});

test('rolls read on a 1–100 scale', async () => {
  const { roll100 } = await import('../src/narrate.js');
  assert.equal(roll100(55000), '55');
  assert.equal(roll100(5920), '5.9');
  assert.equal(roll100(99999), '100');
});

test('a favourite who loses hears that the dice turned, not that it was an even fight', () => {
  const m = { a: { f: { name: 'Vex' } }, b: { f: { name: 'Duma' } }, preMatch: [], result: { winner: 'B', reason: 'rounds' }, rounds: [{ delta: 3, checks: [] }, { delta: 3, checks: [] }] };
  assert.match(adviceFor(m), /stronger/);
  assert.doesNotMatch(adviceFor(m), /even fight/);
});

test('the math narration lists every win-chance bonus', () => {
  const m = createMatch({ a: blank({ name: 'A' }), b: blank({ name: 'B', humor: 'choleric' }), rng: createRng(4) });
  const r = playRound(m, { stance: 'guard' });
  const text = narrateRound(m, r).map((l) => l.text).join(' ');
  assert.match(text, /Win-chance bonuses:.*First Strike/);
});
