// 7.9 (the designer): at the Bronze Arena a fighter (or the steward) asks you to buy their cousin out of the cells
// before he is executed. The cousin is a political prisoner, offered by the Liaison until bought or COUSIN.weeks pass.
import test from 'node:test';
import assert from 'node:assert/strict';
import { COUSIN } from '../src/data.js';
import { createRun, recruit, buildRoom, cousinWeek, serialize, deserialize } from '../src/run.js';
import { refreshLiaison } from '../src/run/roster.js';
import { nextHint } from '../src/hints.js';

function house(seed = 1) {
  const run = createRun(seed);
  run.gold = 80;
  const a = recruit(run, run.market[0].id);
  return { run, a };
}
const said = (run) => (run.talk ?? []).map((t) => t.key);
const liaison = (run) => { run.prestigeLevel = Math.max(run.prestigeLevel, 4); buildRoom(run, 'liaison'); };

test('no ask before the Bronze Arena, or once the plot has begun', () => {
  const { run } = house(1);
  cousinWeek(run);
  assert.equal(run.cousin, undefined);
  run.topTier = COUSIN.fromTier;
  run.plot = { stage: 'mark' };
  cousinWeek(run);
  assert.equal(run.cousin, undefined);
});

test('a fighter asks; building the Liaison offers the cousin, a political prisoner; buying him pleases the asker', () => {
  const { run, a } = house(2);
  run.topTier = COUSIN.fromTier;
  cousinWeek(run);
  assert.equal(run.cousin.asker, a.id);
  assert.equal(run.cousin.f, null, 'no Liaison yet');
  assert.ok(said(run).includes('cousin-ask'));
  assert.match(nextHint(run).text, /build a Liaison/);
  liaison(run);
  const offer = run.liaisonOffers.find((f) => f.id === run.cousin.f);
  assert.ok(offer?.political, 'the cousin is a political prisoner');
  assert.equal(offer.cousinOf, a.name);
  assert.ok(said(run).includes('cousin-found'));
  assert.match(nextHint(run).text, new RegExp(offer.name));
  // He stays on offer through a month's refresh.
  refreshLiaison(run);
  assert.ok(run.liaisonOffers.some((f) => f.id === offer.id));
  const morale = a.morale;
  recruit(run, offer.id);
  assert.equal(run.cousin.done, 'saved');
  assert.equal(a.morale, Math.min(100, morale + COUSIN.savedMorale));
  assert.ok(run.plot, 'the plot begins');
  assert.ok(said(run).includes('cousin-saved'));
});

test('left too long, the cousin is executed and the asker grieves', () => {
  const { run, a } = house(3);
  run.topTier = COUSIN.fromTier;
  liaison(run);
  cousinWeek(run);
  const id = run.cousin.f;
  assert.ok(run.liaisonOffers.some((f) => f.id === id), 'offered at once when the Liaison stands');
  const morale = a.morale;
  run.week = run.cousin.until;
  cousinWeek(run);
  assert.equal(run.cousin.done, 'executed');
  assert.ok(!run.liaisonOffers.some((f) => f.id === id));
  assert.equal(a.morale, Math.max(0, morale + COUSIN.missMorale));
  assert.ok(said(run).includes('cousin-executed'));
});

test('with no one to ask, the steward brings word; the cousin survives a save', () => {
  const run = createRun(4);
  run.topTier = COUSIN.fromTier;
  cousinWeek(run);
  assert.equal(run.cousin.asker, null);
  assert.equal(run.talk.find((t) => t.key === 'cousin-ask').beats[0].speaker, 'steward');
  const back = deserialize(serialize(run));
  assert.deepEqual(back.cousin, run.cousin);
});
