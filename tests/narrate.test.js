import test from 'node:test';
import assert from 'node:assert/strict';
import { createRng } from '../src/rng.js';
import { createMatch, autoPlay } from '../src/fight.js';
import { createFighter } from '../src/run.js';
import { narrateRound, resultText, fmtPct, signed, modLabel } from '../src/narrate.js';

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
    const m = createMatch({ a, b, rng, bossDebuff: i % 2 === 0 });
    autoPlay(m);
    for (const r of m.rounds) {
      const lines = narrateRound(m, r);
      assert.ok(lines.length >= 4);
      for (const l of lines) assert.doesNotMatch(l.text, /undefined|NaN|null/, l.text);
    }
    assert.doesNotMatch(resultText(m), /undefined|NaN/);
  }
});
