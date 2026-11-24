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
