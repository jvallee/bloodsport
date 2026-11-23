// 7.3 Bread and chains: individual unrest, incidents and The Chains Break (docs/roadmap-v7.md, Phase 3).
import test from 'node:test';
import assert from 'node:assert/strict';
import { UNREST, MORALE, STRESS } from '../src/data.js';
import {
  createRun, recruit, advanceWeek, chooseEvent, eventChoiceBlocker, unrestFrom, isAgitated, unrestWeek, openCrisis,
  revoltSides, ringleader, serialize, deserialize, SAVE_VERSION, effectivePower, eventNames,
} from '../src/run.js';
import { EVENT_BY_ID, choiceLabel } from '../src/events.js';

function house(seed = 1, n = 2) {
  const run = createRun(seed);
  run.gold = 50;
  const fs = Array.from({ length: Math.min(n, 2) }, () => recruit(run, run.market[0].id));
  for (let i = 2; i < n; i++) { // past the starting Quarters' cap of 2
    const extra = { ...structuredClone(fs[0]), id: `extra${i}`, name: `Extra ${i}` };
    run.roster.push(extra);
    fs.push(extra);
  }
  return { run, fs };
}

test('what a Mutinous fighter adds to unrest: 1, +1 Choleric or convict, +1 champion or level 4+, +1 Skull Rack', () => {
  const f = { morale: 10, humor: 'sanguine', level: 1, titles: [], decor: {} };
  assert.equal(unrestFrom(f), 1);
  assert.equal(unrestFrom({ ...f, humor: 'choleric' }), 2);
  assert.equal(unrestFrom({ ...f, origin: 'Condemned convict' }), 2);
  assert.equal(unrestFrom({ ...f, level: 4 }), 2);
  assert.equal(unrestFrom({ ...f, titles: ['Champion'] }), 2);
  assert.equal(unrestFrom({ ...f, humor: 'choleric', level: 5, decor: { skullRack: 1 } }), 4);
  assert.equal(unrestFrom({ ...f, morale: MORALE.mutinous }), 0, 'not Mutinous');
});

test('agitation: a Restless fighter who is Choleric, overtrained or by a Skull Rack drags a bonded partner', () => {
  const restless = { morale: 30, humor: 'sanguine', stress: 0, decor: {} };
  assert.ok(!isAgitated(restless));
  assert.ok(isAgitated({ ...restless, humor: 'choleric' }));
  assert.ok(isAgitated({ ...restless, stress: STRESS.overtrained }));
  assert.ok(isAgitated({ ...restless, decor: { skullRack: 1 } }));
  assert.ok(!isAgitated({ ...restless, morale: 10, humor: 'choleric' }), 'Mutinous is the next rung');
  const { run, fs: [a, b] } = house(2);
  a.morale = 30;
  a.humor = 'choleric';
  a.bond = { id: b.id };
  b.bond = { id: a.id };
  b.morale = 70;
  unrestWeek(run);
  assert.equal(b.morale, 70 + UNREST.bondDrag);
});

test('unrest builds from Mutinous fighters, cools when none are left, warns before the crisis', () => {
  const { run, fs: [a] } = house(3, 1);
  a.morale = 0;
  a.humor = 'sanguine';
  for (let w = 0; w < UNREST.warn; w++) unrestWeek(run);
  assert.equal(run.unrest, UNREST.warn);
  assert.equal(run.unrestWarned, run.week, 'warned this week');
  // Even at the threshold, the crisis waits for a later week than the warning.
  run.unrest = UNREST.threshold;
  unrestWeek(run);
  assert.equal(run.event, null);
  run.week += 1;
  unrestWeek(run);
  assert.equal(run.event?.id, 'chainsBreak');
  // Cooling.
  run.event = null;
  a.morale = 60;
  const before = run.unrest;
  unrestWeek(run);
  assert.equal(run.unrest, before - UNREST.cool);
});

test('The Chains Break: open the coffers', () => {
  const { run, fs } = house(4, 3);
  fs[0].morale = 0;
  run.unrest = UNREST.threshold;
  openCrisis(run);
  assert.equal(run.event.price, UNREST.coffersPerFighter * 3);
  const gold = run.gold;
  chooseEvent(run, 0);
  assert.equal(run.gold, gold - UNREST.coffersPerFighter * 3);
  assert.equal(run.unrest, 0);
  assert.ok(run.roster.every((f) => f.mood?.n >= UNREST.calmMood));
});

test('The Chains Break: the guards put it down when the loyal are stronger', () => {
  const { run, fs } = house(5, 3);
  fs[0].morale = 0;
  fs[1].morale = 80;
  fs[2].morale = 80;
  run.unrest = UNREST.threshold;
  openCrisis(run);
  const { loyal, mutineers } = revoltSides(run, fs[0]);
  assert.equal(run.event.loyal, loyal);
  assert.equal(loyal, effectivePower(fs[1]) + effectivePower(fs[2]) + UNREST.garrisonPerLevel * run.prestigeLevel);
  assert.equal(mutineers, effectivePower(fs[0]));
  const favor = run.favor;
  chooseEvent(run, 1);
  assert.equal(run.status, 'active');
  assert.ok(fs[0].injuries.some((i) => ['concussed', 'maimed'].includes(i.tag)));
  assert.equal(run.favor, favor + UNREST.putDownFavor);
  assert.equal(run.unrest, UNREST.afterPutDown);
});

test('the ringleader is the strongest Mutinous fighter', () => {
  const { run, fs } = house(6, 3);
  fs[0].morale = 0;
  fs[1].morale = 0;
  fs[1].power = fs[0].power + 5;
  assert.equal(ringleader(run), fs[1]);
});

test('The Chains Break: the Palatine only for a house in the cause, once a career', () => {
  const { run, fs } = house(7, 2);
  fs[0].morale = 0;
  run.unrest = UNREST.threshold;
  openCrisis(run);
  assert.ok(eventChoiceBlocker(run, 2), 'no plot: not offered');
  run.event = null;
  run.plot = { stage: 'cause', trust: 3, suspicion: 10, refusals: 0, seen: [], cells: [], champion: null, freed: [], nextAt: 99, ended: null };
  openCrisis(run);
  assert.equal(eventChoiceBlocker(run, 2), null);
  chooseEvent(run, 2);
  assert.equal(run.plot.champion, fs[0].id);
  assert.equal(run.plot.trust, 3 + UNREST.palatineTrust);
  assert.ok(run.plot.suspicion > 10);
  assert.equal(run.unrest, 0);
  run.unrest = UNREST.threshold;
  openCrisis(run);
  assert.match(eventChoiceBlocker(run, 2), /once a career/i);
});

test('the crisis card shows its price and both sides\' Power', () => {
  const { run, fs } = house(8, 2);
  fs[0].morale = 0;
  openCrisis(run);
  const names = eventNames(run);
  const labels = EVENT_BY_ID.chainsBreak.choices.map((c) => choiceLabel(c, names));
  assert.match(labels[0], new RegExp(`\\(${run.event.price} Gold\\)`));
  assert.match(labels[1], new RegExp(`your ${run.event.loyal} Power against their ${run.event.mutineers}`));
});

test('unrest has its own dice: a house with no Mutinous fighter never touches them', () => {
  const { run } = house(9, 2);
  for (let w = 0; w < 6; w++) {
    run.boutPending = false;
    run.fortune = null;
    run.event = null;
    advanceWeek(run);
  }
  assert.equal(run.rng.unrest, undefined);
});

test('save version 6: a version-5 career loads with no unrest', () => {
  assert.equal(SAVE_VERSION, 6);
  const { run } = house(10, 1);
  const old = JSON.parse(serialize(run));
  old.version = 5;
  delete old.unrest;
  delete old.unrestStats;
  const loaded = deserialize(JSON.stringify(old));
  assert.equal(loaded.version, 6);
  assert.equal(loaded.unrest, 0);
  assert.deepEqual(loaded.unrestStats, { incidents: 0, crises: 0 });
});
