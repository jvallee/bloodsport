// 7.7 (review brief Phase 2): how the game feels.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createMatch, autoPlay, suggestTactic } from '../src/fight.js';
import { createRng } from '../src/rng.js';
import { blank } from './helpers.js';

test('2.1 Quick pace plays a round in well under half the time; the deciding round keeps its slow pause', async () => {
  const { roundTiming, setFightPace } = await import('../src/ui/fightView.js');
  const m = createMatch({ a: blank({ name: 'A', power: 7 }), b: blank({ id: 'b', name: 'B' }), rng: createRng(4) });
  autoPlay(m, suggestTactic);
  const first = m.rounds[0];
  const last = m.rounds.at(-1);
  setFightPace('full');
  const full = roundTiming(m, first).end;
  const fullDecider = roundTiming(m, last);
  setFightPace('quick');
  const quick = roundTiming(m, first).end;
  const quickDecider = roundTiming(m, last);
  setFightPace('full');
  assert.ok(quick < full * 0.5, `quick ${quick} vs full ${full}`);
  // The decider's suspense (the pause before the winner) is the same in both paces.
  const pause = (t) => t.reveal - t.delays[Math.max(0, t.lines.findIndex((l) => l.type === 'roll') - 1)];
  assert.ok(quickDecider.reveal < fullDecider.reveal);
  assert.ok(pause(quickDecider) >= 2 - 1e-9, `decider pause ${pause(quickDecider)}`);
});

test('2.2 first-strike chance: exact over two d6 (ties split), with Concussed and Footwork', async () => {
  const { firstStrikeChance } = await import('../src/fight.js');
  const match = (a, b) => createMatch({ a: blank({ name: 'A', ...a }), b: blank({ id: 'b', name: 'B', ...b }), rng: createRng(1) });
  assert.equal(firstStrikeChance(match({}, {})), 0.5);
  // Speed +1: A wins on d(A)+1 > d(B), i.e. P(dA >= dB) = 21/36, and half the ties of dA+1 = dB (5/36).
  const p = firstStrikeChance(match({ speed: 4 }, { speed: 3 }));
  assert.ok(Math.abs(p - (15 / 36 + 6 / 36 + 0.5 * 5 / 36)) < 1e-9, String(p));
  assert.ok(Math.abs(firstStrikeChance(match({ speed: 3 }, { speed: 4 })) - (1 - p)) < 1e-9, 'symmetric');
  assert.equal(firstStrikeChance(match({ injuries: [{ tag: 'concussed', weight: 1 }] }, {})), 0, 'Concussed always strikes second');
  assert.equal(firstStrikeChance(match({ kindTrait: 'footwork', kind: 'elf', speed: 4 }, { speed: 3 })), 1, 'Footwork and faster');
  assert.equal(firstStrikeChance(match({ speed: 20 }, { speed: 3 })), 1);
});

test('2.2 the fight screen shows the first-strike chance for both fighters before a round', async () => {
  const { fightView } = await import('../src/ui/fightView.js');
  const m = createMatch({ a: blank({ name: 'Aulus', speed: 4 }), b: blank({ id: 'b', name: 'Brutus', speed: 3 }), rng: createRng(1) });
  const html = fightView(m, { animateRound: 0, showMath: false }, { name: 'Test', tier: 1 });
  assert.match(html, /Strikes first: Aulus about <b>65%<\/b> · Brutus about <b>35%<\/b>/);
});
