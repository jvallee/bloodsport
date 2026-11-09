// Version 6: the month's digest (src/digest.js).
import test from 'node:test';
import assert from 'node:assert/strict';
import { snapshot, monthDigest } from '../src/digest.js';
import { createRun, recruit, setJob, advanceToTournament } from '../src/run.js';

test('a month of training is one line per fighter, not one per week', () => {
  const run = createRun(1);
  const f = recruit(run, run.market[0].id);
  setJob(run, f.id, 'trainPower');
  const before = snapshot(run);
  const mark = run.log.length;
  const power = f.power;
  advanceToTournament(run);
  const lines = monthDigest(before, run, run.log.slice(mark));
  const mine = lines.filter((l) => l.text.startsWith(`${f.name}:`));
  assert.equal(mine.length, 1);
  assert.match(mine[0].text, new RegExp(`\\+${f.power - power} Power`));
  assert.ok(!lines.some((l) => / trains: /.test(l.text)), 'the weekly training lines are summed');
  assert.ok(!lines.some((l) => /^Tournament week/.test(l.text)));
});

test('healing, newcomers and departures are named; other news is kept once, in order', () => {
  const run = createRun(2);
  const f = recruit(run, run.market[0].id);
  f.injuries = [{ tag: 'fleshWound', weight: 1, weeksLeft: 1 }];
  const before = snapshot(run);
  f.injuries = [];
  const g = recruit(run, run.market[0].id);
  const lines = monthDigest(before, run, [{ tone: 'event', text: 'A poet at the gate.' }, { tone: 'event', text: 'A poet at the gate.' }, { tone: 'good', text: `${f.name}'s Flesh Wound has healed.` }]);
  assert.match(lines.find((l) => l.text.startsWith(f.name)).text, /healed: Flesh Wound/);
  assert.ok(lines.some((l) => l.text === `${g.name} joined the house.`));
  assert.equal(lines.filter((l) => l.text === 'A poet at the gate.').length, 1);
  run.roster = run.roster.filter((x) => x !== f);
  assert.ok(monthDigest(before, run, []).some((l) => l.text === `${f.name} has left the house.`));
});

test('the steward\'s plan: the hurt to the Medbay, the tired to Rest, the rest to training while rooms last', async () => {
  const { stewardPlan } = await import('../src/run.js');
  const { STRESS } = await import('../src/data.js');
  const run = createRun(3);
  run.gold = 50;
  const a = recruit(run, run.market[0].id);
  const b = recruit(run, run.market[0].id);
  const c = { ...structuredClone(b), id: 'fc', name: 'Third' }; // the Quarters hold two: added by hand
  run.roster.push(c);
  a.injuries = [{ tag: 'fleshWound', weight: 1, weeksLeft: 1 }];
  b.stress = STRESS.overtrained - STRESS.train;
  c.stress = 0;
  const plan = stewardPlan(run);
  assert.deepEqual(plan.map((p) => p.job), ['medbay', 'rest', 'trainPower']);
  assert.equal(c.job, 'trainPower');
});
