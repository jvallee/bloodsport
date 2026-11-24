// 7.8 (review brief 2.11): the Emperor's last word at a career's end, and what is said after The Chains Break and an
// unmasked mole. Scenes are cosmetic: these check the right lines are queued, not the words.
import test from 'node:test';
import assert from 'node:assert/strict';
import { UNREST } from '../src/data.js';
import { createRun, recruit, chooseEvent, openCrisis } from '../src/run.js';
import { endingKind, endingScene, ENDING_SCENES } from '../src/dialogue.js';
import { AFTERMATH_LINES } from '../src/quests.js';

function house(seed = 1, n = 2) {
  const run = createRun(seed);
  run.gold = 50;
  const fs = Array.from({ length: Math.min(n, 2) }, () => recruit(run, run.market[0].id));
  for (let i = 2; i < n; i++) {
    const extra = { ...structuredClone(fs[0]), id: `extra${i}`, name: `Extra ${i}` };
    run.roster.push(extra);
    fs.push(extra);
  }
  return { run, fs };
}
const said = (run) => (run.talk ?? []).flatMap((t) => t.beats.map((b) => b.text));

test('every way a career ends has a last scene, and an active career has none', () => {
  const { run } = house(1);
  assert.equal(endingKind(run), null);
  assert.equal(endingScene(run), null);
  const ended = (patch) => endingKind({ ...run, status: 'lost', ...patch });
  assert.equal(endingKind({ ...run, status: 'won' }), 'grand');
  for (const e of ['coup', 'martyr', 'treason']) assert.equal(ended({ ending: e }), e);
  assert.equal(ended({ favor: 0 }), 'favour');
  assert.equal(ended({ roster: [] }), 'broke');
  assert.equal(ended({}), 'revolt');
  for (const kind of ['grand', 'coup', 'martyr', 'treason', 'favour', 'broke', 'revolt']) assert.ok(ENDING_SCENES[kind]?.length, kind);
});

test('after The Chains Break the leader says a word: coffers and put down', () => {
  const a = house(4, 3);
  a.fs[0].morale = 0;
  a.run.unrest = UNREST.threshold;
  openCrisis(a.run);
  chooseEvent(a.run, 0);
  assert.ok(said(a.run).includes(AFTERMATH_LINES.coffers));

  const b = house(5, 3);
  b.fs[0].morale = 0;
  b.fs[1].morale = 80;
  b.fs[2].morale = 80;
  b.run.unrest = UNREST.threshold;
  openCrisis(b.run);
  if (b.run.event.loyal >= b.run.event.mutineers) {
    chooseEvent(b.run, 1);
    assert.ok(said(b.run).includes(AFTERMATH_LINES.putDown));
  }
});

test('an unmasked mole: each fate gets its line', () => {
  for (const [choice, line] of [[0, AFTERMATH_LINES.executed], [1, AFTERMATH_LINES.turned]]) {
    const { run, fs: [a] } = house(7);
    a.mole = { master: run.houses[0].id, since: 1, clues: 1 };
    run.event = { id: 'moleUnmasked', f: a.id, house: run.houses[0].name };
    chooseEvent(run, choice);
    assert.ok(said(run).includes(line), `choice ${choice}`);
  }
  const { run, fs: [a] } = house(8);
  a.mole = { master: run.houses[0].id, since: 1, clues: 1 };
  run.event = { id: 'moleUnmasked', f: a.id, house: run.houses[0].name };
  chooseEvent(run, 2);
  assert.ok(said(run).includes(AFTERMATH_LINES.ransomed(a.name, run.houses[0].name)));
});
