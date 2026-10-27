import test from 'node:test';
import assert from 'node:assert/strict';
import { createSession } from '../scripts/play-text.js';

const BAD = /undefined|NaN|\[object Object\]/;
const clean = (text) => assert.doesNotMatch(text, BAD, text.match(new RegExp(`.{0,80}(${BAD.source}).{0,40}`))?.[0]);

test('a scripted text career prints cleanly: intro, shops, jobs, a fight, the Codex and blockers', () => {
  const s = createSession(7, { oddsSamples: 50 });
  clean(s.intro());
  const [a, b] = s.run.market;
  const script = [
    `recruit ${a.id}`, `recruit ${b.id}`, 'ok', 'ok', `job ${a.id} trainPower`, `job ${b.id} trainPower`, 'end-week',
    'market', 'estate', 'store', 'codex', 'codex basics:favor', 'codex nope', 'help', 'buy-decor trophy', `place ${a.id} trophy`,
    'end-week', 'fight f1', 'bogus', 'to-tournament', 'look', `fight ${a.id}`, 'end-week', 'math', 'next', 'next', 'next', 'next', 'look',
  ];
  const outputs = script.map((line) => s.exec(line));
  for (const out of outputs) clean(out);
  assert.match(outputs[1], /joins the Ludus/);
  assert.match(outputs[5], /is training \(1 Trainer Room\)/, 'a failed command prints the blocker');
  assert.match(outputs[18], /Unknown command/);
  assert.match(outputs[20], /Fight day/);
  assert.match(outputs[21], /walks into/);
  assert.match(outputs[22], /A match is in progress/);
  assert.match(outputs.slice(24).join('\n'), /Round 1:[\s\S]*(wins|loses|died)/);
  assert.equal(s.match, null, 'the match finishes on its own');
  assert.equal(s.run.inMatch, false);
});

test('a tutorial card is printed by the command that makes it appear, so `ok` never dismisses an unseen card', () => {
  const s = createSession(7, { oddsSamples: 20 });
  s.intro();
  const out = s.exec(`recruit ${s.run.market[0].id}`);
  assert.match(out, /Tutorial: Give everyone a weekly job/);
  assert.match(s.exec('ok'), /Dismissed "Give everyone a weekly job"/);
  assert.doesNotMatch(s.exec('look'), /Tutorial: Give everyone/);
});

test('the text interface replays a career exactly from the seed', () => {
  const play = () => {
    const s = createSession(3, { oddsSamples: 20 });
    const ids = s.run.market.slice(0, 2).map((f) => f.id);
    const lines = [...ids.map((id) => `recruit ${id}`), 'to-tournament', `fight ${ids[0]}`, 'next', 'next', 'next', 'end-week', 'to-tournament'];
    return lines.map((l) => s.exec(l)).join('\n');
  };
  assert.equal(play(), play());
});
