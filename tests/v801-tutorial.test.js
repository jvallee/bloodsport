import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createRun, recruit, draftCompanion, advanceWeek, advanceToTournament, setJob,
  freeDraftPicks, startMatch, finishMatch, forfeitBout, serialize, resolveMercy, choosePerk, fightBlocker,
} from '../src/run.js';
import {
  GUIDE, STEPS, FIGHT_STEPS, nextStep, nextGuideStep, advanceGuide, stepText, guideBlocker, guideProgress, migrateTutorialPrefs,
} from '../src/tutorial.js';
import { guideBar, draftModal } from '../src/ui/views.js';
import { createSession } from '../scripts/play-text.js';

test('v8.0.1 Slice 2: freeDraftPicks handles empty house, 1 rail fighter, full house, Week 1, and patronBunk', () => {
  const r1 = createRun(1);
  assert.deepEqual(freeDraftPicks(r1)?.remaining, 2);

  recruit(r1, r1.market[0].id);
  assert.equal(freeDraftPicks(r1)?.remaining, 1, '1 open bed left after 1 rail recruit');

  recruit(r1, r1.market[0].id);
  assert.equal(freeDraftPicks(r1), null, 'full house has 0 usable free picks');

  const r2 = createRun(2);
  draftCompanion(r2, 'orc');
  assert.equal(freeDraftPicks(r2)?.remaining, 1);
  advanceWeek(r2);
  assert.equal(freeDraftPicks(r2), null, 'returns null after Week 0');

  const r3 = createRun(3, { patron: 'veteran' });
  assert.ok(freeDraftPicks(r3)?.bedsLeft >= 2, 'veteran patron bunk preserves Week-0 free picks');
});

// Walks a short career to its first Boss day through the engine, with the guide following along.
function guidedToBossDay() {
  const run = createRun(4, { short: true });
  const done = [];
  const walk = () => { done.push(...advanceGuide(done, run).completed); return nextGuideStep(done, run); };

  draftCompanion(run, 'orc');
  draftCompanion(run, 'basa');
  walk();
  setJob(run, run.roster[0].id, 'trainPower');
  walk();
  advanceToTournament(run);
  assert.equal(walk().id, 'bout');

  // Win the first fight in the Dirt Pits.
  const f = run.roster[0];
  const m = startMatch(run, f.id, 1);
  m.over = true;
  m.result = { winner: 'A', reason: 'rounds' };
  finishMatch(run, m);
  if (run.mercy) resolveMercy(run, 'spare');
  if (f.pendingPerks.length) {
    // A level-up blocks the week: it becomes the step on show, and the bar does not also say "First:" about it.
    const step = walk();
    assert.equal(step.id, 'perkchoice');
    assert.equal(guideBlocker(run, step), null);
    while (f.pendingPerks.length) choosePerk(run, f.id, f.pendingPerks[0][0]);
  }
  assert.equal(walk().id, 'firstweekend');
  advanceWeek(run);

  // A Fortune hand: the step speaks up, and retires the tip it replaces the moment it is shown.
  run.fortune = { cards: [{ kind: 'gold' }] };
  assert.equal(walk().id, 'fortunehand');
  assert.ok(done.includes('fortune'), "the Fortune's wheel tip is covered");
  assert.equal(done.includes('levelup'), false, 'the Level up tip keeps its detail on signature moves for later');
  assert.equal(done.includes('boss'), false, 'the Boss tip keeps its detail on arena rules for later');
  run.fortune = null;

  // Boss prep: the stakes in numbers, as a magnitude.
  const prep = walk();
  assert.equal(prep.id, 'bossprep');
  const prepText = stepText(prep, run);
  assert.match(prepText, /a loss costs <b>\d+ Imperial Favour<\/b>/);
  assert.doesNotMatch(prepText, /undefined|NaN|\$\{|!|—/);

  advanceToTournament(run);
  const day = walk();
  assert.equal(day.id, 'bossday');
  const dayText = stepText(day, run);
  assert.match(dayText, /a loss costs <b>\d+ Imperial Favour<\/b>/);
  assert.doesNotMatch(dayText, /undefined|NaN|\$\{|!|—/);
  return { run, done, walk, f };
}

for (const ending of ['win', 'loss', 'forfeit']) {
  test(`8.0.1: the guide walks a new house to its first Boss and ends cleanly on a ${ending}`, () => {
    const { run, walk, f } = guidedToBossDay();
    if (ending === 'forfeit') forfeitBout(run);
    else {
      const m = startMatch(run, f.id, 1);
      m.over = true;
      m.result = { winner: ending === 'win' ? 'A' : 'B', reason: 'rounds' };
      finishMatch(run, m);
    }
    assert.equal(walk(), null, `the guide is over once the first Boss ends in a ${ending}`);
  });
}

test('8.0.1: a blocking card becomes the step on show while guided, and the bar does not also say "First:" about it', () => {
  const run = createRun(12);
  draftCompanion(run, 'orc');
  draftCompanion(run, 'basa');
  const done = [];
  done.push(...advanceGuide(done, run).completed);
  assert.equal(nextGuideStep(done, run).id, 'jobs');

  run.event = { id: 'testEvent' };
  const step = nextGuideStep(done, run);
  assert.equal(step.id, 'eventcard');
  assert.equal(guideBlocker(run, step), null, 'the step itself says what to do');
  assert.match(guideBlocker(run, GUIDE.find((g) => g.id === 'jobs')), /event card/, 'any other step still gets the "First:" line');
  const prog = guideProgress(run, done);
  assert.equal(prog.items[prog.index - 1].id, 'eventcard', 'it joins the checklist just before what comes next');
  assert.equal(prog.items[prog.index].id, 'jobs');

  run.event = null;
  assert.equal(nextGuideStep(done, run).id, 'jobs', 'settled: back to the written step');
  assert.equal(guideProgress(run, done).items.some((x) => x.id === 'eventcard'), false, 'and out of the checklist');

  run.event = { id: 'testEvent' };
  assert.equal(nextGuideStep(done, run).id, 'eventcard', 'it speaks up again for the next card before the first Boss');
  run.arenas[1].conquered = true;
  assert.notEqual(nextGuideStep(done, run)?.id, 'eventcard', 'and stops once the first Boss is done');
});

test('8.0.1: guide steps, tips and fight tips never share an id, and a step only covers a tip that exists', () => {
  const ids = [...GUIDE, ...STEPS, ...FIGHT_STEPS].map((s) => s.id);
  assert.equal(new Set(ids).size, ids.length, 'no id is used twice (the done list is shared)');
  for (const g of GUIDE) for (const c of g.covers ?? []) assert.ok(STEPS.some((s) => s.id === c), `${g.id} covers a real tip (${c})`);

  const r = createRun(3);
  r.fortune = { cards: [] };
  assert.equal(advanceGuide(['fortune'], r).step.id, 'fortunehand', 'a player who had read the Fortune tip still gets the step');
  assert.deepEqual(advanceGuide([], r).completed, ['fortune'], 'showing the step retires the tip it replaces');
});

test('v8.0.1 Slice 2: guideBlocker, guideProgress, guideBar, and draftModal are pure and accessible', () => {
  const run = createRun(9);
  const before = serialize(run);
  const warn = freeDraftPicks(run);
  const modalHtml = draftModal(warn);
  assert.match(modalHtml, /data-action="draft-market" autofocus/);
  assert.doesNotMatch(modalHtml, /class="close"[^>]*autofocus/);

  run.event = { id: 'testEvent' };
  assert.match(guideBlocker(run), /event card/i);
  const step = nextStep(GUIDE, [], run);
  const prog = guideProgress(run, []);
  assert.equal(prog.index, 1);
  assert.ok(prog.total >= 8);
  const barHtml = guideBar(step, false, run, { progress: prog, blocker: guideBlocker(run) });
  assert.match(barHtml, /Step 1 of/);
  assert.match(barHtml, /guide-blocker/);
  assert.match(barHtml, /guide-checklist/);

  // Old 2-arg guideBar signature still works
  assert.match(guideBar(step, true, run), /Galen-VII/);

  run.event = null;
  assert.equal(serialize(run), before, 'tutorial helpers and builders mutate zero run state or RNG');
});

test('v8.0.1 Slice 2: migrateTutorialPrefs keeps legacy skipped users skipped after new GUIDE steps are added', () => {
  const legacyAll = [
    'recruit', 'jobs', 'endweek', 'tofight', 'bout', 'firstweekend',
    ...STEPS.map((s) => s.id),
    ...FIGHT_STEPS.map((s) => s.id),
  ];
  const migrated = migrateTutorialPrefs({ tutorial: legacyAll });
  assert.equal(migrated.tutorialOff, true, 'legacy full skip sets tutorialOff = true');

  const fresh = migrateTutorialPrefs({ tutorial: ['recruit'] });
  assert.equal(fresh.tutorialOff, false);

  const tampered = migrateTutorialPrefs({ tutorial: 'broken', tutorialOff: 'yes' });
  assert.deepEqual(tampered.tutorial, []);
  assert.equal(tampered.tutorialOff, false);
});

test('v8.0.1 Slice 2: play-text.js shows Week-0 free-draft notice, step counter, and unused-draft note', () => {
  const s = createSession(7, { oddsSamples: 20 });
  const l0 = s.exec('look');
  assert.match(l0, /2 free Core Companion draft picks left in Week 0/);
  assert.match(l0, /Your steward \(tutorial month\) · Step 1\//);

  s.exec('draft orc');
  const endOut = s.exec('end-week');
  assert.match(endOut, /1 Week-0 free Core Companion draft went unused/);
  assert.match(s.exec('skip-tutorial'), /Tutorial skipped/);
  assert.doesNotMatch(s.exec('look'), /Your steward \(tutorial month\)/);
});

// What the bar showed, point by point, over a career walked through the engine to its first Boss day. tests/setup.js
// switches the monthly Fortune hand off, so the hand the month's turn would deal is put on the table by hand.
function barTrail(short) {
  const run = createRun(4, { short });
  const done = [];
  const trail = [];
  const look = () => {
    done.push(...advanceGuide(done, run).completed);
    const step = nextGuideStep(done, run);
    if (!step) return null;
    const prog = guideProgress(run, done);
    trail.push({ id: step.id, week: run.week, ticked: prog.items.filter((x) => x.done).length, index: prog.index, total: prog.total });
    return step;
  };
  const winBout = () => {
    const f = run.roster.find((x) => !fightBlocker(run, x.id, 1));
    const m = startMatch(run, f.id, 1);
    m.over = true;
    m.result = { winner: 'A', reason: 'rounds' };
    finishMatch(run, m);
    for (const x of run.roster) while (x.pendingPerks.length) { look(); choosePerk(run, x.id, x.pendingPerks[0][0]); }
    if (run.mercy) resolveMercy(run, 'spare');
    return look();
  };
  const monthTurns = () => {
    advanceWeek(run);
    run.fortune = { cards: [{ kind: 'gold' }] };
    look();
    run.fortune = null;
    look();
  };
  draftCompanion(run, 'orc');
  draftCompanion(run, 'basa');
  look();
  setJob(run, run.roster[0].id, 'trainPower');
  look();
  advanceWeek(run);
  look();
  advanceToTournament(run);
  look();
  const afterFirst = winBout();
  monthTurns();
  let afterSecond = null;
  if (!short) {
    advanceToTournament(run);
    look();
    afterSecond = winBout();
    monthTurns();
  }
  advanceToTournament(run);
  const bossDay = look();
  return { trail, afterFirst, afterSecond, bossDay };
}

for (const short of [true, false]) {
  test(`8.0.1: the step counter only moves forward on the way to the first Boss (${short ? 'season' : 'the Long Road'})`, () => {
    const { trail, afterFirst, afterSecond, bossDay } = barTrail(short);
    assert.equal(afterFirst.id, 'firstweekend');
    assert.equal(bossDay.id, 'bossday');
    if (!short) assert.notEqual(afterSecond?.id, 'firstweekend', '"your first fight is done" is not said again after Tournament 2');
    assert.ok(trail.some((t) => t.id === 'fortunehand'), 'the walk met a Fortune hand');
    for (const [i, t] of trail.entries()) {
      const where = `${t.id} in week ${t.week}`;
      assert.ok(t.ticked < t.total, `${where}: a step on show is never drawn as the whole list ticked`);
      assert.equal(t.index, t.ticked + 1, `${where}: the step on show comes straight after the ticked ones`);
      if (i > 0) assert.ok(t.ticked >= trail[i - 1].ticked, `${where}: the checklist does not lose ticks (${trail[i - 1].ticked} then ${t.ticked})`);
    }
    const hand = trail.find((t) => t.id === 'fortunehand');
    const prep = trail.find((t) => t.id === 'bossprep');
    assert.equal(hand.ticked, prep.ticked, 'a Fortune hand before Boss prep sits where Boss prep will');
  });
}

test('8.0.1: the "First:" line reads once, with no "first" or "below" of its own', () => {
  const run = createRun(9);
  for (const [set, clear] of [
    [() => { run.mercy = { fighterId: 'x' }; }, () => { run.mercy = null; }],
    [() => { run.event = { id: 'testEvent' }; }, () => { run.event = null; }],
    [() => { run.fortune = { cards: [] }; }, () => { run.fortune = null; }],
  ]) {
    set();
    const line = guideBlocker(run);
    assert.ok(line, 'something is pending');
    assert.doesNotMatch(line, /\bfirst\b|\bbelow\b/i, line);
    clear();
  }
});
