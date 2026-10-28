// Veterans earn a higher training cap: each level a fighter gains raises that fighter's own Trainer cap
// (VETERAN_CAP.perLevel weeks per level above 1), so veterans don't fall behind fresh Market recruits.
import test from 'node:test';
import assert from 'node:assert/strict';
import { VETERAN_CAP, XP } from '../src/data.js';
import { trainCap, trainCapFor, veteranCapBonus } from '../src/ludus.js';
import { createRun, recruit, setJob, advanceWeek, jobBlocker, trainBlocker, gainXp } from '../src/run.js';
import { trainingText } from '../src/explain.js';
import { ENTRIES } from '../src/codex.js';
import { STEPS, nextStep } from '../src/tutorial.js';
import { fighterCard } from '../src/ui/components.js';
import { ludusTab } from '../src/ui/views.js';
import { createSession } from '../scripts/play-text.js';

function withFighter(level = 1) {
  const run = createRun(1);
  const f = recruit(run, run.market[0].id);
  f.level = level;
  run.gold = 100;
  return { run, f };
}

test('the tunable: +1 training week per level above 1', () => {
  assert.deepEqual(VETERAN_CAP, { perLevel: 1 });
});

test('a level-1 fighter keeps the house Trainer cap', () => {
  const { run, f } = withFighter(1);
  assert.equal(veteranCapBonus(f), 0);
  assert.equal(trainCapFor(run, f), trainCap(run));
  assert.equal(trainCapFor(run, f), 3);
});

test('the cap grows by one week per level gained, up to +5 at level 6', () => {
  const { run, f } = withFighter(1);
  for (let level = 1; level <= XP.levels.length + 1; level++) {
    f.level = level;
    assert.equal(trainCapFor(run, f), trainCap(run) + level - 1, `level ${level}`);
  }
  const old = { ...f };
  delete old.level; // a fighter without a level (older data) counts as level 1
  assert.equal(trainCapFor(run, old), trainCap(run));
});

test('perLevel is sweepable: 0 turns it off, 0.5 gives a week every second level', () => {
  const { run, f } = withFighter(5);
  const saved = VETERAN_CAP.perLevel;
  try {
    VETERAN_CAP.perLevel = 0;
    assert.equal(trainCapFor(run, f), trainCap(run));
    VETERAN_CAP.perLevel = 0.5;
    assert.equal(veteranCapBonus(f), 2);
    f.level = 4;
    assert.equal(veteranCapBonus(f), 1);
  } finally {
    VETERAN_CAP.perLevel = saved;
  }
});

test('a veteran trains past the house cap; the blocker names the personal cap and its parts', () => {
  const { run, f } = withFighter(3);
  f.trained = 3; // at the house cap, but a level-3 fighter has 2 more weeks
  assert.equal(jobBlocker(run, f.id, 'trainPower'), null);
  f.trained = 5;
  const why = trainBlocker(run, f);
  assert.match(why, /Trainer cap reached/);
  assert.match(why, /5 weeks/);
  assert.match(why, /Trainer 3 \+ 2 from level 3/);
  assert.match(jobBlocker(run, f.id, 'trainSpeed'), /Trainer 3 \+ 2 from level 3/);
});

test('a level-1 fighter\'s blocker reads as before, with no level part', () => {
  const { run, f } = withFighter(1);
  f.trained = 3;
  const why = trainBlocker(run, f);
  assert.match(why, /Trainer cap reached \(3 weeks\)/);
  assert.doesNotMatch(why, /from level/);
});

test('the end-of-week switch to Rest uses the personal cap', () => {
  const { run, f } = withFighter(2);
  f.trained = 3;
  setJob(run, f.id, 'trainPower');
  const power = f.power;
  advanceWeek(run);
  assert.deepEqual([f.trained, f.power, f.job], [4, power + 1, 'rest'], 'trains the bonus week, then switches to Rest');
});

test('levelling up raises the cap at once and the log says so', () => {
  const run = createRun(1);
  const f = recruit(run, run.market[0].id);
  f.trained = 3;
  const before = run.log.length;
  gainXp(run, f, XP.levels[0]);
  assert.equal(f.level, 2);
  assert.equal(trainCapFor(run, f), 4);
  const line = run.log.slice(before).map((l) => l.text).join('\n');
  assert.match(line, /reaches level 2/);
  assert.match(line, /\+1 training week \(cap 4\)/);
});

test('the Old Veteran patron (level 3) gets +2 training weeks at once', () => {
  const run = createRun(7, { patron: 'veteran' });
  const vet = run.roster.find((f) => f.level === 3);
  assert.ok(vet);
  assert.equal(trainCapFor(run, vet), trainCap(run) + 2);
});

test('trainingText: plain for level 1, with the breakdown for veterans', () => {
  const { run, f } = withFighter(1);
  f.trained = 2;
  assert.equal(trainingText(run, f), 'Training 2 / 3');
  f.level = 3;
  f.trained = 4;
  assert.equal(trainingText(run, f), 'Training 4 / 5 (Trainer 3 + 2 from level 3)');
});

test('the fighter card puts the training line in the Power and Speed hovers', () => {
  const { run, f } = withFighter(3);
  f.trained = 4;
  const card = fighterCard(f, { training: trainingText(run, f) });
  const power = card.match(/class="badge power[^"]*" title="([^"]*)"/)[1];
  const speed = card.match(/class="badge speed" title="([^"]*)"/)[1];
  assert.match(power, /Training 4 \/ 5 \(Trainer 3 \+ 2 from level 3\)/);
  assert.match(speed, /Training 4 \/ 5 \(Trainer 3 \+ 2 from level 3\)/);
  assert.doesNotMatch(fighterCard(f), /Training 4/, 'cards without a run (Market, opponents) show no training line');
});

test('the roster shows each fighter\'s personal cap with its breakdown', () => {
  const { run, f } = withFighter(3);
  f.trained = 4;
  const html = ludusTab(run, () => ({ win: 0.5, injury: 0.3, death: 0.01 }));
  assert.match(html, /Training 4 \/ 5 \(Trainer 3 \+ 2 from level 3\)/);
  assert.doesNotMatch(html, /trained 4\/3/);
});

test('the Codex entry for the Trainer Room explains the veteran bonus', () => {
  const entry = ENTRIES.find((e) => e.key === 'building:trainer');
  assert.match(entry.rules, /level/i);
  assert.match(entry.rules, /\+1 training week per level/);
});

test('the tutorial\'s Trainer cap card waits for the personal cap', () => {
  const { run, f } = withFighter(2);
  const done = STEPS.map((s) => s.id).filter((id) => id !== 'trainerCap');
  f.trained = 3;
  assert.notEqual(nextStep(STEPS, done, run)?.id, 'trainerCap', 'a level-2 fighter still has a week left');
  f.trained = 4;
  const step = nextStep(STEPS, done, run);
  assert.equal(step?.id, 'trainerCap');
  assert.match(step.body, /level/);
});

test('the text interface shows the personal cap with its breakdown', () => {
  const s = createSession(7, { oddsSamples: 20 });
  const [a] = s.run.market;
  s.exec(`recruit ${a.id}`);
  const f = s.run.roster[0];
  f.level = 3;
  f.trained = 4;
  const out = s.exec('look');
  assert.match(out, /Training 4 \/ 5 \(Trainer 3 \+ 2 from level 3\)/);
});
