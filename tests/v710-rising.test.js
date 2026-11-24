// 7.10 (the designer): the rising's story: endings with a lead-in, the steward's last word, replies, asides, warnings.
import test from 'node:test';
import assert from 'node:assert/strict';
import { PLOT } from '../src/data.js';
import { createRun, recruit, createFighter } from '../src/run.js';
import { changeSuspicion } from '../src/run/plotEngine.js';
import { createRng } from '../src/rng.js';
import { endingScene, endingKind, returnScene, rebelStageScene, SCENES } from '../src/dialogue.js';
import { stewardGrandDone } from '../src/quests.js';
import { SUSPICION_LINES } from '../src/plot.js';

function rebelHouse() {
  const run = createRun(1);
  run.gold = 100;
  const a = recruit(run, run.market[0].id);
  const f = createFighter(createRng(9), { id: 'fp', takenNames: [a.name] });
  Object.assign(f, { political: { cell: 'scribe' } });
  run.roster.push(f);
  run.plot = { stage: 'ready', trust: 6, suspicion: 0, refusals: 0, seen: [], cells: ['scribe'], champion: a.id, freed: [], nextAt: 99, ended: null };
  return { run, a, f };
}

test('every ending opens with the narrator; the coup names the champion turning to the box', () => {
  const { run, a } = rebelHouse();
  Object.assign(run, { status: 'won', ending: 'coup' });
  const beats = endingScene(run);
  assert.equal(beats[0].speaker, 'narrator');
  assert.match(beats[0].text, new RegExp(`${a.name}.*turn`));
  for (const patch of [{ status: 'won', ending: null }, { status: 'lost', ending: 'martyr' }, { status: 'lost', ending: 'treason' }, { status: 'lost', ending: null, favor: 0 }]) {
    const r = { ...run, ...patch };
    assert.equal(endingScene(r)[0].speaker, 'narrator', JSON.stringify(patch));
  }
});

test('winning after naming the names is the loyalist ending, and the steward\'s last word fits each ending', () => {
  const { run } = rebelHouse();
  run.status = 'won';
  run.plot.ended = 'loyalist';
  assert.equal(endingKind(run), 'loyalist');
  assert.match(stewardGrandDone(run), /names you gave them/);
  assert.match(stewardGrandDone({ ...run, ending: 'coup' }), /no Emperor/);
  assert.doesNotMatch(stewardGrandDone({ ...run, ending: null, plot: null }), /go to your head/);
});

test('the Emperor\'s visits begin with a lead-in; the rising adds its asides', () => {
  for (const id of ['firstBoss', 'tribute', 'lowFavor', 'grand']) assert.equal(SCENES[id][0].speaker, 'narrator', id);
  const { run, f } = rebelHouse();
  const grand = returnScene('grand', run);
  assert.ok(grand.some((b) => b.speaker === 'rebel' && b.fighter === f), 'the rebel whispers before the Grand');
  run.plot.stage = 'cause';
  assert.equal(returnScene('grand', run).length, SCENES.grand.length, 'not before the rising is ready');
  run.plot.suspicion = PLOT.suspicion.informer;
  assert.match(returnScene('lowFavor', run).at(-1).text, /late hours/);
});

test('each rebel stage scene ends with three replies', () => {
  const { run, f } = rebelHouse();
  for (const stage of ['favours', 'cause', 'ready']) {
    const beats = rebelStageScene(run, f, stage);
    assert.equal(beats.at(-1).replies?.length, 3, stage);
    assert.ok(beats.at(-1).replies.every((r) => r.then.length), stage);
  }
});

test('crossing the informer and cold lines: a warning each, once', () => {
  const { run } = rebelHouse();
  changeSuspicion(run, PLOT.suspicion.informer);
  changeSuspicion(run, -10);
  changeSuspicion(run, 10);
  const said = (run.talk ?? []).map((t) => t.beats[0].text);
  assert.equal(said.filter((t) => t === SUSPICION_LINES.informer).length, 1);
  changeSuspicion(run, PLOT.suspicion.cold);
  assert.ok((run.talk ?? []).some((t) => t.beats[0].text === SUSPICION_LINES.cold));
});
