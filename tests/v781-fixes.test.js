// 7.8.1: fixes from a code review of 7.8.0.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRng } from '../src/rng.js';
import { createMatch, playRound } from '../src/fight.js';
import { narrateRound, narrateStory } from '../src/narrate.js';
import { blank } from './helpers.js';

test('Blood Drinker draining a Bleeding wound says so in the maths and the story (not "Distraction")', () => {
  let found = null;
  for (let seed = 1; seed < 400 && !found; seed++) {
    const m = createMatch({ a: blank({ name: 'Vlad', kind: 'vampire', kindTrait: 'bloodDrinker', power: 9 }), b: blank({ id: 'b', name: 'Xan', power: 3 }), rng: createRng(seed) });
    m.a.f.injuries = [{ tag: 'bleeding', weight: 1 }];
    const r = playRound(m);
    if (r.checks.some((c) => c.drained === 'bleeding')) found = { m, r };
  }
  assert.ok(found, 'a Bleeding wound drained');
  const text = [...narrateRound(found.m, found.r), ...narrateStory(found.m, found.r)].map((l) => l.text ?? l).join('\n');
  assert.match(text, /drinks deep: their (own )?Bleeding wound closes/);
  assert.doesNotMatch(text, /Distraction closes/);
});

test('the bet buttons quote the odds after an item used before Round 1, and that is what a bet pays', async () => {
  const { createRun, recruit, advanceToTournament, startMatch, useItem, placeBet, betQuote } = await import('../src/run.js');
  const run = createRun(2);
  const f = recruit(run, run.market[0].id);
  advanceToTournament(run);
  run.gold = 40;
  run.inventory.items = { ...(run.inventory.items ?? {}), warPaint: 1 };
  const m = startMatch(run, f.id, 1);
  const before = betQuote(run, m);
  useItem(run, m, 'warPaint');
  const after = betQuote(run, m);
  assert.ok(after.odds < before.odds, `War Paint shortens the odds (${before.odds} → ${after.odds})`);
  assert.equal(after.gold, run.gold);
  const bet = placeBet(run, m, 5);
  assert.equal(bet.odds, after.odds, 'the bet pays what the buttons showed');
  assert.equal(betQuote(run, m), null, 'no quote once a bet is placed');
});

test('Feed the Ash used before Round 1 is priced into the bet (its Ash Stack shortens the odds)', async () => {
  const { createRun, recruit, advanceToTournament, startMatch, betOdds } = await import('../src/run.js');
  const { useSignature } = await import('../src/fight.js');
  const run = createRun(2);
  const f = recruit(run, run.market[0].id);
  Object.assign(f, { cls: 'ashHungry', level: 3 });
  advanceToTournament(run);
  const m = startMatch(run, f.id, 1);
  const before = betOdds(run, m);
  useSignature(m);
  assert.equal(m.a.ash, 1);
  assert.ok(betOdds(run, m) < before, 'the Ash Stack counts');
});
