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
