// Version 6, phase 6 polish (docs/plan-v6-phase6.md): wants and names from playtest LLM-13.
import test from 'node:test';
import assert from 'node:assert/strict';
import { FORTUNE } from '../src/data.js';
import { createRun, recruit, wantFor, effectivePower, advanceWeek, skipBout, passFortune } from '../src/run.js';

test('"Retire with honour" is never asked by the house\'s strongest fighter (playtest LLM-13)', () => {
  const run = createRun(5);
  const a = recruit(run, run.market[0].id);
  const b = recruit(run, run.market[1].id);
  for (const f of [a, b]) Object.assign(f, { level: 5, titles: ['Champion of the Dirt Pits', 'Champion of the Bronze Arena'] });
  run.prestige = 999;
  a.power += 10;
  assert.ok(effectivePower(a) > effectivePower(b));
  assert.equal(wantFor(run, a, 'retire'), null, 'the champion mid-climb is not asked');
  assert.ok(wantFor(run, b, 'retire'), 'a veteran behind them may ask');
});

test('a Fortune fighter card is remembered when dealt, so a card passed over never comes back as someone else (playtest LLM-13)', () => {
  FORTUNE.enabled = true;
  try {
    let seen = 0;
    for (let seed = 1; seed <= 40; seed++) {
      const run = createRun(seed);
      recruit(run, run.market[0].id);
      while (!run.fortune) {
        if (run.boutPending) skipBout(run);
        advanceWeek(run);
      }
      for (const c of run.fortune.cards.filter((x) => x.kind === 'fighter')) {
        assert.ok(run.recentNames.includes(c.fighter.name), `${c.fighter.name} is remembered`);
        seen++;
      }
      passFortune(run);
    }
    assert.ok(seen > 0, 'a fighter card was dealt');
  } finally {
    FORTUNE.enabled = false;
  }
});
