import test from 'node:test';
import assert from 'node:assert/strict';
import { createRng } from '../src/rng.js';
import { HOUSES } from '../src/data.js';
import { createMatch, computePower, computePhase2 } from '../src/fight.js';
import {
  createRun, recruit, advanceToTournament, advanceWeek, startMatch, finishMatch, matchOptions, standings, houseOf, serialize, deserialize, skipBout,
} from '../src/run.js';
import { blank } from './helpers.js';

const atBout = (seed = 1) => {
  const run = createRun(seed);
  const f = recruit(run, run.market[0].id);
  advanceToTournament(run);
  return { run, f };
};
const play = (run, id, { winner = 'A', reason = 'rounds', alive = true } = {}) => {
  const m = startMatch(run, id);
  m.over = true;
  m.result = { winner, reason };
  m.a.f.alive = alive;
  return finishMatch(run, m);
};

test('a career starts with three rival houses, and every opponent fights for one', () => {
  const run = createRun(1);
  assert.equal(run.houses.length, HOUSES.rivals);
  assert.equal(new Set(run.houses.map((h) => h.name)).size, HOUSES.rivals);
  assert.ok(houseOf(run, run.arenas[1].opponent), 'the opponent has a house');
  assert.deepEqual(createRun(1).houses, run.houses, 'seeded');
});

test('standings rank your house among the rivals by Glory; wins earn Glory by tier', () => {
  const { run, f } = atBout();
  const before = run.glory;
  const opp = houseOf(run, run.arenas[1].opponent);
  const oppGlory = opp.glory;
  play(run, f.id);
  assert.equal(run.glory, before + HOUSES.glory.win * 1);
  assert.equal(opp.glory, oppGlory - HOUSES.glory.beaten);
  const table = standings(run);
  assert.equal(table.length, HOUSES.rivals + 1);
  assert.ok(table.some((r) => r.you));
  assert.ok(table.every((r, i) => i === 0 || table[i - 1].glory >= r.glory));
});

test('rival houses compete every tournament week and climb the arenas', () => {
  const run = createRun(2);
  recruit(run, run.market[0].id);
  const start = run.houses.map((h) => h.glory);
  for (let i = 0; i < 12; i++) {
    advanceToTournament(run);
    if (run.event) run.event = null;
    run.boutPending = false; // these tests are about the houses, not your bouts
    for (const f of run.roster) f.pendingPerks = [];
    advanceWeek(run);
  }
  assert.ok(run.houses.some((h, i) => h.glory > start[i]), 'rivals gained Glory');
  assert.ok(run.houses.some((h) => h.tier >= 2), 'a rival climbed');
});

test('killing a house\'s fighter starts a feud: their fighters get +1 Power against you for a while', () => {
  const { run, f } = atBout(3);
  const house = houseOf(run, run.arenas[1].opponent);
  const s = play(run, f.id, { reason: 'death' });
  assert.equal(house.feud, HOUSES.feudMonths);
  assert.match(s.feud, new RegExp(house.name));
  // The next opponent from that house fights with +1 Power.
  run.arenas[1].opponent.house = house.id;
  assert.equal(matchOptions(run, f, 1).grudge, 1);
  const m = createMatch({ a: blank(), b: blank(), rng: createRng(1), grudge: 1 });
  assert.ok(computePower(m.b, m.a, 1).mods.some((x) => x.source === 'Feud' && x.value === 1));
});

test('losing a fighter to a house gives your fighters vengeance: +5% win chance against them', () => {
  const { run, f } = atBout(4);
  const other = recruit(run, run.market[0].id);
  const house = houseOf(run, run.arenas[1].opponent);
  play(run, f.id, { winner: 'B', reason: 'death', alive: false });
  assert.equal(house.vengeance, HOUSES.feudMonths);
  run.arenas[1].opponent.house = house.id;
  assert.equal(matchOptions(run, other, 1).vengeance, true);
  const m = createMatch({ a: blank(), b: blank(), rng: createRng(1), vengeance: true });
  assert.ok(computePhase2(m.a, m.b, 1).win.some((x) => x.source === 'Vengeance' && x.value === 5000));
});

test('feuds and vengeance fade month by month', () => {
  const run = createRun(5);
  recruit(run, run.market[0].id);
  run.houses[0].feud = 2;
  run.houses[0].vengeance = 1;
  for (let i = 0; i < 3; i++) {
    advanceToTournament(run);
    if (run.event) run.event = null;
    run.boutPending = false; // these tests are about the houses, not your bouts
    for (const f of run.roster) f.pendingPerks = [];
    advanceWeek(run);
  }
  assert.deepEqual([run.houses[0].feud, run.houses[0].vengeance], [0, 0]);
});

test('older saves get rival houses on load', () => {
  const run = createRun(6);
  const old = JSON.parse(serialize(run));
  delete old.houses;
  delete old.glory;
  const back = deserialize(JSON.stringify(old));
  assert.equal(back.houses.length, HOUSES.rivals);
  assert.equal(back.glory, 0);
});
