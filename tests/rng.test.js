import test from 'node:test';
import assert from 'node:assert/strict';
import { createRng, next, int, rollE5, d100, d6, pick, deriveSeed } from '../src/rng.js';

test('same seed gives the same sequence', () => {
  const a = createRng(42);
  const b = createRng(42);
  for (let i = 0; i < 100; i++) assert.equal(next(a), next(b));
});

test('different seeds give different sequences', () => {
  const a = createRng(1);
  const b = createRng(2);
  const sa = Array.from({ length: 10 }, () => next(a));
  const sb = Array.from({ length: 10 }, () => next(b));
  assert.notDeepEqual(sa, sb);
});

test('next stays in [0, 1)', () => {
  const r = createRng(7);
  for (let i = 0; i < 10000; i++) {
    const v = next(r);
    assert.ok(v >= 0 && v < 1);
  }
});

test('int, rollE5, d100 and d6 stay in range and hit both ends', () => {
  const r = createRng(9);
  const seen = { e5min: false, d100: new Set(), d6: new Set() };
  for (let i = 0; i < 50000; i++) {
    const e5 = rollE5(r);
    assert.ok(e5 >= 1 && e5 <= 100000);
    seen.d100.add(d100(r));
    seen.d6.add(d6(r));
    const x = int(r, -3, 3);
    assert.ok(x >= -3 && x <= 3);
  }
  assert.equal(seen.d100.size, 100);
  assert.deepEqual([...seen.d6].sort(), [1, 2, 3, 4, 5, 6]);
});

test('scripted values are used before the generator', () => {
  const r = createRng(1);
  r.script = [0, 0.999999];
  assert.equal(d100(r), 1);
  assert.equal(d100(r), 100);
});

test('pick returns list members', () => {
  const r = createRng(3);
  for (let i = 0; i < 100; i++) assert.ok(['a', 'b', 'c'].includes(pick(r, ['a', 'b', 'c'])));
});

test('deriveSeed gives distinct deterministic streams per domain', () => {
  assert.equal(deriveSeed(123, 1), deriveSeed(123, 1));
  assert.notEqual(deriveSeed(123, 1), deriveSeed(123, 2));
  assert.notEqual(deriveSeed(123, 1), deriveSeed(124, 1));
});
