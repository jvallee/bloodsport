import test from 'node:test';
import assert from 'node:assert/strict';
import { createRng } from '../src/rng.js';
import { ECONOMY, TOURNAMENTS, KINDS } from '../src/data.js';
import { autoPlay, throwTowel, playRound } from '../src/fight.js';
import {
  createRun, createFighter, recruit, train, buyDecor, heal, startMatch, finishMatch,
  recruitBlocker, trainBlocker, decorBlocker, healBlocker, fightBlocker,
} from '../src/run.js';

const fakeMatch = (run, id, { winner = 'A', reason = 'rounds', alive = true, injuries = [] } = {}) => {
  const m = startMatch(run, id);
  m.over = true;
  m.result = { winner, reason };
  m.a.f.alive = alive;
  m.a.f.injuries = injuries;
  return m;
};

const runWithFighter = (seed = 1) => {
  const run = createRun(seed);
  const f = recruit(run, run.market[0].id);
  return { run, f };
};

test('a new run starts with 10 Gold, 5 Prestige, an empty roster and 4 fighters for sale', () => {
  const run = createRun(1);
  assert.deepEqual([run.gold, run.prestige, run.roster.length, run.market.length], [10, 5, 0, 4]);
  assert.equal(run.status, 'active');
  assert.equal(run.opponent.power, 5);
});

test('every market includes at least one Orc', () => {
  for (let seed = 0; seed < 50; seed++) assert.ok(createRun(seed).market.some((f) => f.kind === 'orc'), `seed ${seed}`);
});

test('fighter names are unique across roster, market and opponent', () => {
  for (let seed = 0; seed < 50; seed++) {
    const run = createRun(seed);
    recruit(run, run.market[0].id);
    finishMatch(run, fakeMatch(run, run.roster[0].id));
    const names = [...run.roster, ...run.market, run.opponent].map((f) => f.name);
    assert.equal(new Set(names).size, names.length, `seed ${seed}: ${names}`);
  }
});

test('runs are deterministic from the seed', () => {
  assert.equal(JSON.stringify(createRun(42)), JSON.stringify(createRun(42)));
  assert.notEqual(JSON.stringify(createRun(42).market), JSON.stringify(createRun(43).market));
});

test('created fighters follow kind rules: Power by kind, Speed 3, one trait from the kind pool', () => {
  const rng = createRng(4);
  for (let i = 0; i < 200; i++) {
    const f = createFighter(rng, { id: 'x' });
    assert.equal(f.power, KINDS[f.kind].basePower);
    assert.equal(f.speed, 3);
    assert.ok(KINDS[f.kind].traits.includes(f.kindTrait));
    assert.equal(f.weapon !== null, f.cls === 'fighter');
  }
});

test('opponent decor feeds only the build that uses it', () => {
  const rng = createRng(5);
  for (let i = 0; i < 200; i++) {
    const f = createFighter(rng, { id: 'o', decorLevel: 2 });
    assert.equal(f.decor.bird, f.cls === 'ornitharius' ? 2 : 0);
    assert.equal(f.decor.fireBrazier, f.kindTrait === 'firebug' ? 2 : 0);
  }
});

test('recruiting costs 3 Gold, removes the fighter from the market, and caps the roster at 3', () => {
  const run = createRun(1);
  run.gold = 100;
  const ids = run.market.map((f) => f.id);
  recruit(run, ids[0]);
  assert.equal(run.gold, 97);
  assert.equal(run.market.length, 3);
  recruit(run, ids[1]);
  recruit(run, ids[2]);
  assert.match(recruitBlocker(run, ids[3]), /full/);
  assert.throws(() => recruit(run, ids[3]));
});

test('recruiting needs enough Gold', () => {
  const run = createRun(1);
  run.gold = 2;
  assert.equal(recruitBlocker(run, run.market[0].id), 'Not enough Gold.');
});

test('training costs 1 Gold per point and stops at 3 points', () => {
  const { run, f } = runWithFighter();
  const [p, s] = [f.power, f.speed];
  train(run, f.id, 'power');
  train(run, f.id, 'power');
  train(run, f.id, 'speed');
  assert.deepEqual([f.power, f.speed, f.trained, run.gold], [p + 2, s + 1, 3, 4]);
  assert.match(trainBlocker(run, f.id, 'power'), /cap/);
  assert.match(trainBlocker(run, f.id, 'luck'), /only train/);
});

test('decor costs 1 Gold and caps at 3 per item', () => {
  const { run, f } = runWithFighter();
  run.gold = 100;
  for (let i = 0; i < 3; i++) buyDecor(run, f.id, 'bird');
  assert.equal(f.decor.bird, 3);
  assert.match(decorBlocker(run, f.id, 'bird'), /At most/);
  assert.equal(decorBlocker(run, f.id, 'fireBrazier'), null);
  assert.match(decorBlocker(run, f.id, 'statue'), /Unknown/);
});

test('healing removes one injury for 2 Gold', () => {
  const { run, f } = runWithFighter();
  f.injuries = [{ tag: 'concussed', weight: 1 }, { tag: 'poisoned', weight: 2 }];
  heal(run, f.id, 1);
  assert.deepEqual(f.injuries, [{ tag: 'concussed', weight: 1 }]);
  assert.equal(run.gold, 5);
  assert.match(healBlocker(run, f.id, 3), /No such injury/);
  run.gold = 1;
  assert.equal(healBlocker(run, f.id, 0), 'Not enough Gold.');
});

test('starting a match pays the buy-in and locks Ludus actions', () => {
  const { run, f } = runWithFighter();
  startMatch(run, f.id);
  assert.equal(run.prestige, 4);
  assert.equal(run.inMatch, true);
  for (const reason of [trainBlocker(run, f.id, 'power'), healBlocker(run, f.id, 0), fightBlocker(run, f.id), recruitBlocker(run, run.market[0].id)]) {
    assert.equal(reason, 'A match is in progress.');
  }
});

test('finishing an unfinished match is refused', () => {
  const { run, f } = runWithFighter();
  const m = startMatch(run, f.id);
  assert.throws(() => finishMatch(run, m), /not over/);
});

test('a win returns double the buy-in and pays Gold, then advances the circuit', () => {
  const { run, f } = runWithFighter();
  const summary = finishMatch(run, fakeMatch(run, f.id));
  assert.deepEqual([run.prestige, run.gold, run.tournament], [6, 7 + 3, 1]);
  assert.deepEqual([summary.won, summary.prestige, summary.gold], [true, 1, 3]);
  assert.equal(run.opponent.power, TOURNAMENTS[1].oppPower);
  assert.equal(run.inMatch, false);
});

test('a loss or towel keeps the buy-in lost and pays 1 Gold', () => {
  const { run, f } = runWithFighter();
  const m = startMatch(run, f.id);
  playRound(m);
  if (!m.over) throwTowel(m);
  m.result = { winner: 'B', reason: 'towel' };
  const summary = finishMatch(run, m);
  assert.deepEqual([run.prestige, run.gold, summary.prestige], [4, 8, -1]);
});

test('injuries from the match carry back to the roster fighter', () => {
  const { run, f } = runWithFighter();
  finishMatch(run, fakeMatch(run, f.id, { injuries: [{ tag: 'blinded', weight: 1 }] }));
  assert.deepEqual(f.injuries, [{ tag: 'blinded', weight: 1 }]);
});

test('a dead fighter moves to the fallen list', () => {
  const { run, f } = runWithFighter();
  finishMatch(run, fakeMatch(run, f.id, { winner: 'B', reason: 'death', alive: false }));
  assert.equal(run.roster.length, 0);
  assert.equal(run.fallen[0].id, f.id);
});

test('Blood Faith refunds the buy-in when the Orc dies', () => {
  const run = createRun(1);
  const orc = recruit(run, run.market.find((x) => x.kind === 'orc').id);
  const summary = finishMatch(run, fakeMatch(run, orc.id, { winner: 'B', reason: 'death', alive: false }));
  assert.equal(summary.bloodFaith, true);
  assert.equal(run.prestige, 5);
});

test('Blood Faith does nothing when the Orc survives a loss', () => {
  const run = createRun(1);
  const orc = recruit(run, run.market.find((x) => x.kind === 'orc').id);
  const summary = finishMatch(run, fakeMatch(run, orc.id, { winner: 'B' }));
  assert.equal(summary.bloodFaith, false);
  assert.equal(run.prestige, 4);
});

test('the market refreshes after each tournament', () => {
  const { run, f } = runWithFighter();
  const before = run.market.map((x) => x.id);
  finishMatch(run, fakeMatch(run, f.id));
  assert.equal(run.market.length, 4);
  assert.ok(run.market.every((x) => !before.includes(x.id)));
});

test('beating the Boss wins the run; losing the Boss ends it', () => {
  for (const [winner, status] of [['A', 'won'], ['B', 'lost']]) {
    const { run, f } = runWithFighter();
    run.prestige = 20;
    finishMatch(run, fakeMatch(run, f.id));
    finishMatch(run, fakeMatch(run, f.id));
    assert.equal(run.tournament, 2);
    finishMatch(run, fakeMatch(run, f.id, { winner }));
    assert.equal(run.status, status);
    assert.equal(fightBlocker(run, f.id), 'The run is over.');
  }
});

test('the run is lost with no fighters and less than 3 Gold', () => {
  const { run, f } = runWithFighter();
  run.gold = 1;
  finishMatch(run, fakeMatch(run, f.id, { winner: 'B', reason: 'death', alive: false }));
  assert.equal(run.status, 'lost');
  assert.match(run.endReason, /No fighters/);
});

test('losing your last fighter with Gold to spare does not end the run', () => {
  const { run, f } = runWithFighter();
  finishMatch(run, fakeMatch(run, f.id, { winner: 'B', reason: 'death', alive: false }));
  assert.equal(run.status, 'active');
});

test('the run is lost when Prestige cannot cover the next buy-in', () => {
  const { run, f } = runWithFighter();
  run.prestige = 2;
  finishMatch(run, fakeMatch(run, f.id, { winner: 'B' }));
  assert.equal(run.prestige, 1);
  assert.equal(run.status, 'lost');
  assert.match(run.endReason, /buy-in/);
});

test('a full run with real fights always ends in won or lost', () => {
  for (let seed = 0; seed < 100; seed++) {
    const run = createRun(seed);
    recruit(run, run.market[0].id);
    while (run.status === 'active') {
      if (!run.roster.length) recruit(run, run.market[0].id);
      const m = startMatch(run, run.roster[0].id);
      autoPlay(m);
      finishMatch(run, m);
    }
    assert.ok(['won', 'lost'].includes(run.status));
    assert.ok(run.gold >= 0 && run.prestige >= 0);
  }
});

test('economy constants match fight-rules.md', () => {
  assert.deepEqual(
    [ECONOMY.startGold, ECONOMY.startPrestige, ECONOMY.fighterCost, ECONOMY.trainCost, ECONOMY.trainCap, ECONOMY.decorCost, ECONOMY.decorCap, ECONOMY.healCost, ECONOMY.maxRoster],
    [10, 5, 3, 1, 3, 1, 3, 2, 3],
  );
});
