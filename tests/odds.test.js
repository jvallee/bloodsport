import test from 'node:test';
import assert from 'node:assert/strict';
import { estimateOdds, describeOdds, winLabel } from '../src/odds.js';
import { blank, injuries } from './helpers.js';

test('estimated win chance tracks the Power difference', () => {
  const even = estimateOdds(blank(), blank());
  const strong = estimateOdds(blank({ power: 9 }), blank());
  const weak = estimateOdds(blank({ power: 1 }), blank()); // Delta −4: 15% per round, ~6% per best-of-3
  assert.ok(Math.abs(even.win - 0.5) < 0.08, `even ${even.win}`);
  assert.ok(strong.win > 0.9 && weak.win < 0.1);
});

test('death risk is zero for healthy fighters who are not outmatched for long', () => {
  assert.equal(estimateOdds(blank({ power: 9 }), blank()).death, 0);
  assert.ok(estimateOdds(blank({ power: 2, injuries: injuries('poisoned') }), blank({ power: 9 })).death > 0.1);
});

test('the estimate is deterministic and leaves the fighter untouched', () => {
  const f = blank();
  assert.deepEqual(estimateOdds(f, blank()), estimateOdds(f, blank()));
  assert.equal(f.injuries.length, 0);
});

test('the Oracle level controls how precise the numbers are', () => {
  const odds = { win: 0.634, injury: 0.31, death: 0.004 };
  assert.deepEqual(describeOdds(odds, 0), { win: 'Favored', winPct: null, injury: 'Some', injuryPct: null, death: 'Low', deathPct: null });
  assert.equal(describeOdds(odds, 1).winPct, '~60%');
  assert.equal(describeOdds(odds, 2).winPct, '63%');
});

test('win labels cover the range', () => {
  assert.deepEqual([0.9, 0.6, 0.5, 0.3, 0.1].map(winLabel), ['Strong favorite', 'Favored', 'Even fight', 'Underdog', 'Long shot']);
});

test('a small but real risk never shows as ~0%', () => {
  assert.equal(describeOdds({ win: 0.5, injury: 0.3, death: 0.03 }, 1).deathPct, '<10%');
  assert.equal(describeOdds({ win: 0.5, injury: 0.3, death: 0 }, 1).deathPct, '~0%');
  assert.equal(describeOdds({ win: 0.5, injury: 0.3, death: 0.003 }, 2).deathPct, '<1%');
});
