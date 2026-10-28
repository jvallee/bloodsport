// Fixes from LLM playtest #5 (docs/playtest-llm-5.md), test-first.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRng } from '../src/rng.js';
import { createMatch, playRound } from '../src/fight.js';
import { adviceFor } from '../src/narrate.js';
import { createRun, recruit, advanceToTournament, advanceWeek, startMatch, finishMatch } from '../src/run.js';
import { blank } from './helpers.js';

test('a returning rival Boss keeps its name to itself: no new fighter takes it', () => {
  const run = createRun(12);
  const f = recruit(run, run.market[0].id);
  advanceToTournament(run);
  run.arenas[1].stage = 2;
  const boss = run.arenas[1].opponent.name;
  const m = startMatch(run, f.id, 1);
  m.over = true;
  m.result = { winner: 'B', reason: 'rounds' };
  finishMatch(run, m);
  assert.equal(run.arenas[1].rival?.name, boss);
  for (let w = 0; w < 20; w++) {
    run.boutPending = false; run.bouts = null; run.event = null;
    for (const x of run.roster) x.pendingPerks = [];
    advanceWeek(run);
    const live = [...run.market, ...Object.values(run.arenas).map((a) => a.opponent)].filter((x) => x && x !== run.arenas[1].rival);
    assert.ok(!live.some((x) => x.name === boss), `week ${run.week}: ${boss} reused`);
  }
});

test('opponent names are not reused soon after they leave', () => {
  const run = createRun(13);
  recruit(run, run.market[0].id);
  const seen = new Map();
  for (let w = 0; w < 44; w++) {
    run.boutPending = false; run.bouts = null; run.event = null;
    for (const x of run.roster) x.pendingPerks = [];
    advanceWeek(run);
    for (const a of Object.values(run.arenas)) {
      const o = a.opponent;
      if (seen.has(o.name) && seen.get(o.name) !== o.id) assert.fail(`${o.name} came back as a different fighter`);
      seen.set(o.name, o.id);
    }
  }
});

test('the match-deciding round leaves no "next round" effects behind', () => {
  for (let seed = 1; seed <= 20; seed++) {
    const m = createMatch({ a: blank({ cls: 'retiarius', power: 20 }), b: blank(), rng: createRng(seed) });
    let r;
    while (!m.over) r = playRound(m);
    assert.deepEqual(r.endEffects, [], `seed ${seed}`);
  }
});

test('advice: losing rounds you were favoured to win is bad luck, not being out-powered', () => {
  const m = { a: { f: { name: 'Vex' } }, b: { f: { name: 'Duma' } }, preMatch: [], result: { winner: 'B', reason: 'rounds' },
    rounds: [{ delta: -2, win: { chance: 75000 }, checks: [] }, { delta: -2, win: { chance: 75000 }, checks: [] }] };
  assert.doesNotMatch(adviceFor(m), /out-powered/);
  m.rounds = [{ delta: -3, win: { chance: 30000 }, checks: [] }, { delta: -3, win: { chance: 30000 }, checks: [] }];
  assert.match(adviceFor(m), /out-powered/);
});

test('in Mortal Danger the fight shows the chance of dying next round; the real dice are untouched', async () => {
  const { deathRisk, mortalDanger } = await import('../src/fight.js');
  const { injuries } = await import('./helpers.js');
  const m = createMatch({ a: blank({ injuries: injuries('poisoned') }), b: blank({ power: 12 }), rng: createRng(3) });
  assert.equal(mortalDanger(m.a), true);
  const before = JSON.stringify(m.rng);
  const risk = deathRisk(m);
  assert.ok(risk > 0.05 && risk < 0.9, `risk ${risk}`);
  assert.equal(JSON.stringify(m.rng), before);
  assert.equal(deathRisk(createMatch({ a: blank(), b: blank(), rng: createRng(3) })), 0);
});
