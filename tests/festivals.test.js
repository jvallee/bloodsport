import test from 'node:test';
import assert from 'node:assert/strict';
import { createRng } from '../src/rng.js';
import { FESTIVALS } from '../src/data.js';
import { festivalOn, nextFestival } from '../src/calendar.js';
import { createMatch, computePower, computePhase2, makeCombatant } from '../src/fight.js';
import { createRun, recruit, advanceToTournament, boutFor, startMatch, finishMatch, matchOptions } from '../src/run.js';
import { blank } from './helpers.js';

const weekOf = (monthIndex, year = 1) => (year - 1) * 44 + monthIndex * 4 + 3; // a month's tournament week

test('festivals fall on their month\'s tournament week only', () => {
  assert.equal(festivalOn(weekOf(7)).id, 'mars');
  assert.equal(festivalOn(weekOf(7) - 1), null, 'not the other weeks');
  assert.equal(festivalOn(weekOf(0)), null, 'the first tournament of a career is plain');
  assert.equal(festivalOn(weekOf(7, 2)).id, 'mars', 'every year');
  const n = nextFestival(0);
  assert.deepEqual([n.festival.id, n.weeks], ['floralia', 11]);
});

test('Armilustrium (Mars): Pressing fighters get +5% win chance', () => {
  const m = createMatch({ a: blank(), b: blank(), rng: createRng(1), festival: 'mars' });
  m.a.stance = 'press';
  assert.ok(computePhase2(m.a, m.b, 1).win.some((x) => x.source === 'Armilustrium' && x.value === 5000));
  m.a.stance = 'guard';
  assert.equal(computePhase2(m.a, m.b, 1).win.some((x) => x.source === 'Armilustrium'), false);
});

test('Ludi Apollinares: ranged fighters (Sagittarius, Bow, Gun, Spear) get +1 Power', () => {
  const m = createMatch({ a: blank({ cls: 'sagittarius' }), b: blank({ cls: 'cestus' }), rng: createRng(1), festival: 'apollo' });
  assert.ok(computePower(m.a, m.b, 1).mods.some((x) => x.source === 'Ludi Apollinares'));
  assert.equal(computePower(m.b, m.a, 1).mods.some((x) => x.source === 'Ludi Apollinares'), false);
});

test('festival payouts: Ludi Romani raises Prestige, Saturnalia waives buy-ins', () => {
  const run = createRun(1);
  const f = recruit(run, run.market[0].id);
  advanceToTournament(run);
  const plain = boutFor(run, 1);
  run.week = weekOf(6); // September: Ludi Romani
  assert.equal(boutFor(run, 1).winPrestige, Math.round(plain.winPrestige * 1.5));
  assert.equal(boutFor(run, 1).festival, 'romani');
  run.week = weekOf(9); // December: Saturnalia
  assert.equal(boutFor(run, 1).buyIn, 0);
  assert.equal(matchOptions(run, f, 1).festival, 'saturnalia');
});

test('Floralia: wins pay +50% Gold', () => {
  const run = createRun(2);
  const f = recruit(run, run.market[0].id);
  advanceToTournament(run);
  const plain = boutFor(run, 1).winGold;
  run.week = weekOf(2); // Maius: Floralia
  assert.equal(boutFor(run, 1).winGold, Math.round(plain * 1.5));
});

test('every festival names its god and explains itself', () => {
  for (const [month, fest] of Object.entries(FESTIVALS)) {
    assert.ok(fest.name && fest.god && fest.desc.length > 20, month);
  }
});
