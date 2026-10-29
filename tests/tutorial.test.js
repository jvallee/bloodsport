import test from 'node:test';
import assert from 'node:assert/strict';
import { createRng } from '../src/rng.js';
import { createMatch, playRound } from '../src/fight.js';
import { createRun, recruit, advanceToTournament } from '../src/run.js';
import { INTRO, STEPS, FIGHT_STEPS, nextStep } from '../src/tutorial.js';
import { blank, injuries } from './helpers.js';

test('the intro explains the world, winning, losing and the core stats', () => {
  assert.equal(INTRO.length, 4);
  const text = INTRO.map((p) => p.body).join(' ');
  for (const word of ['Grand Tournament', 'Imperial Favour', 'tribute', 'two injuries', 'Power', 'Speed']) assert.match(text, new RegExp(word));
});

test('the tutorial walks a new career in order: recruit → jobs → fight day', () => {
  const run = createRun(1);
  const done = [];
  assert.equal(nextStep(STEPS, done, run).id, 'recruit');
  recruit(run, run.market[0].id);
  assert.equal(nextStep(STEPS, done, run).id, 'jobs');
  done.push('recruit', 'jobs');
  advanceToTournament(run);
  assert.equal(nextStep(STEPS, done, run).id, 'bout');
});

test('finished steps never come back, and an empty list means no tutorial', () => {
  const run = createRun(1);
  const all = STEPS.map((s) => s.id);
  assert.equal(nextStep(STEPS, all, run), null);
});

test('fight steps follow the match: start → tactics → towel → danger → over', () => {
  const m = createMatch({ a: blank(), b: blank(), rng: createRng(1) });
  const done = [];
  assert.equal(nextStep(FIGHT_STEPS, done, m).id, 'fight-start');
  done.push('fight-start');
  assert.equal(nextStep(FIGHT_STEPS, done, m).id, 'fight-tactics');
  done.push('fight-tactics');
  playRound(m);
  if (!m.over) {
    assert.equal(nextStep(FIGHT_STEPS, done, m).id, 'fight-towel');
    done.push('fight-towel');
    m.a.f.injuries = injuries('poisoned');
    assert.equal(nextStep(FIGHT_STEPS, done, m).id, 'fight-danger');
  }
  m.over = true;
  assert.equal(nextStep(FIGHT_STEPS, ['fight-start', 'fight-tactics', 'fight-towel', 'fight-danger'], m).id, 'fight-over');
});

test('step text has no template leftovers', () => {
  for (const s of [...INTRO, ...STEPS, ...FIGHT_STEPS]) assert.doesNotMatch(s.body + (s.title ?? ''), /undefined|NaN|\$\{/);
});

test('the tutorial explains the trainer cap the first time a fighter reaches it', () => {
  const run = createRun(1);
  const f = recruit(run, run.market[0].id);
  f.trained = 3;
  const done = STEPS.map((s) => s.id).filter((id) => id !== 'trainerCap');
  const step = nextStep(STEPS, done, run);
  assert.equal(step?.id, 'trainerCap');
  assert.match(step.body, /Trainer Room/);
  assert.match(step.body, /Gold/);
});
