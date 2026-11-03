// The Emperor's summons (the designer, 5.4.2): once a career, before the Imperial Coliseum is open, a fighter is ordered onto
// the Imperial sand; refusing costs SUMMONS.refuseFavor Favour.
import test from 'node:test';
import assert from 'node:assert/strict';
import { SUMMONS } from '../src/data.js';
import { REAL_SUMMONS_CHANCE } from './setup.js';
import {
  createRun, recruit, advanceWeek, advanceToTournament, advanceBlocker, answerSummons, refuseSummons, summonsBlocker, serialize, deserialize,
} from '../src/run.js';

// A house with two fighters, summoned this month.
function summoned(seed = 1) {
  const run = createRun(seed);
  recruit(run, run.market[0].id);
  recruit(run, run.market[0].id);
  run.week = SUMMONS.fromWeek;
  run.summons = { week: run.week };
  return run;
}
const toFightDay = (run) => { run.boutPending = false; run.bouts = null; advanceToTournament(run); };

test('the summons comes once a career, at a month\'s start, on its own dice, never once the Imperial Coliseum is open', () => {
  SUMMONS.chance = 1;
  try {
    const run = createRun(2);
    recruit(run, run.market[0].id);
    for (let i = 0; i < 12 && !run.summons; i++) { if (run.boutPending) { run.boutPending = false; run.bouts = null; } advanceWeek(run); }
    assert.ok(run.summons, 'summoned');
    assert.ok(run.week >= SUMMONS.fromWeek);
    assert.ok(run.talk.some((t) => t.key.startsWith('summons-')), 'the Emperor says so');
    refuseSummons(run);
    assert.equal(run.summonsDone, true);
    const later = createRun(3);
    later.arenas[SUMMONS.tier] = { ...structuredClone(later.arenas[1]), tier: SUMMONS.tier };
    for (let i = 0; i < 12; i++) { if (later.boutPending) { later.boutPending = false; later.bouts = null; } advanceWeek(later); }
    assert.equal(later.summons ?? null, null, 'the Imperial Coliseum is already open to you');
  } finally {
    SUMMONS.chance = REAL_SUMMONS_CHANCE;
  }
});

test('refusing costs SUMMONS.refuseFavor Favour; fight day waits for an answer', () => {
  const run = summoned(4);
  run.favor = 80;
  toFightDay(run);
  run.boutPending = false; // the house's own bout settled
  assert.match(advanceBlocker(run), /summons/);
  refuseSummons(run);
  assert.equal(run.favor, 80 + SUMMONS.refuseFavor);
  assert.equal(run.summons, null);
  assert.equal(advanceBlocker(run), null);
});

test('only on fight day, with an order, by a fighter who hasn\'t fought this week', () => {
  const run = summoned(5);
  const [a] = run.roster;
  assert.match(summonsBlocker(run, a.id, 'yield'), /fight day/);
  toFightDay(run);
  assert.match(summonsBlocker(run, a.id, 'maybe'), /yield/);
  assert.equal(summonsBlocker(run, a.id, 'yield'), null);
});

test('sent with orders to yield, a fighter never dies on the Imperial sand; the result is in the history, once', () => {
  for (let seed = 10; seed < 40; seed++) {
    const run = summoned(seed);
    toFightDay(run);
    const f = run.roster[0];
    const s = answerSummons(run, f.id, 'yield');
    assert.equal(s.died, false, `seed ${seed}`);
    assert.ok(run.history.some((h) => h.summons && h.fighterId === f.id));
    assert.equal(run.summonsDone, true);
    assert.match(summonsBlocker(run, run.roster[1].id, 'yield'), /summoned nobody/);
  }
});

test('to the death: some fall, and leave a body for the Temple of Vulcan; Favour follows the outcome', () => {
  let died = 0;
  for (let seed = 50; seed < 90; seed++) {
    const run = summoned(seed);
    toFightDay(run);
    const f = run.roster[0];
    const favor = run.favor;
    const s = answerSummons(run, f.id, 'death');
    if (s.died) {
      died += 1;
      assert.ok(!run.roster.includes(f));
      assert.ok(run.fallen.some((x) => x.id === f.id && x.arena), 'a body');
    } else if (s.won) assert.equal(run.favor, Math.min(100, favor + SUMMONS.winFavor));
    else assert.equal(run.favor, Math.min(100, favor + SUMMONS.surviveFavor), 'stood to the end');
  }
  assert.ok(died > 0, 'the Imperial sand is dangerous');
});

test('a summoned career survives save and load', () => {
  const run = summoned(6);
  const back = deserialize(serialize(run));
  assert.deepEqual(back.summons, run.summons);
});
