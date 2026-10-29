// v5 content: new kinds, classes, weapons, matchups, items, gear, perks, decor, arena rules and the Stables.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRng } from '../src/rng.js';
import { CONSUMABLES } from '../src/data.js';
import {
  createMatch, playRound, computePower, computeSpeed, computePhase2, applyRoundEnd, injuryCheck, deathGateAt, canThrowTowel, matchupsFor, mortalDanger,
} from '../src/fight.js';
import { createRun, recruit, startMatch, useItem, buildRoom, advanceToTournament, createFighter } from '../src/run.js';
import { blank, injuries, roundRecord } from './helpers.js';

const pair = (a, b, opts = {}) => {
  const m = createMatch({ a: blank(a), b: blank(b), rng: createRng(1), ...opts });
  return [m.a, m.b, m];
};
const sources = (mods) => mods.map((x) => `${x.source}:${x.value}`);

test('Vampire traits: Nightborn +1 Power in Round 3, Mesmerize +5% win in Round 1', () => {
  const [N, X] = pair({ kind: 'vampire', kindTrait: 'nightborn' }, {});
  assert.deepEqual(sources(computePower(N, X, 3).mods), ['Nightborn:1']);
  assert.deepEqual(sources(computePower(N, X, 2).mods), []);
  const [M, Y] = pair({ kind: 'vampire', kindTrait: 'mesmerize' }, {});
  assert.ok(sources(computePhase2(M, Y, 1).win).includes('Mesmerize:5000'));
  assert.equal(sources(computePhase2(M, Y, 2).win).includes('Mesmerize:5000'), false);
});

test('Blood Drinker: wounding the opponent closes their own newest light wound from this fight', () => {
  const [V, X, m] = pair({ kind: 'vampire', kindTrait: 'bloodDrinker', injuries: [{ tag: 'fleshWound', weight: 1 }] }, {});
  const r = roundRecord({ winner: 'A' });
  r.initiative = { first: 'A' };
  let drained = null;
  for (let i = 0; i < 40 && !drained; i++) {
    V.f.injuries = [{ tag: 'fleshWound', weight: 1 }];
    X.f.injuries = [];
    X.f.alive = true;
    const c = injuryCheck(m, V, X, r, 'First strike');
    if (c.injury && c.injury.tag !== 'death') drained = c.drained;
  }
  assert.equal(drained, 'fleshWound');
  assert.deepEqual(V.f.injuries, []);
});

test('Basa traits: Thick Hide is armour, Pounce +3 Speed in Round 1, Rampage grows with rounds won', () => {
  const [H, X] = pair({ kind: 'basa', kindTrait: 'thickHide' }, {});
  assert.ok(computePhase2(H, X, 1).self.some((x) => x.source === 'Thick Hide' && x.armor));
  const [P] = pair({ kind: 'basa', kindTrait: 'pounce' }, {});
  assert.ok(sources(computeSpeed(P, 1).mods).includes('Pounce:3'));
  const [R, Y, m] = pair({ kind: 'basa', kindTrait: 'rampage', power: 20 }, {});
  playRound(m); // won (a match-deciding round leaves no effects, so check after the first)
  assert.equal(R.rampage, 1);
  assert.ok(sources(computePower(R, Y, 2).mods).includes('Rampage:1'));
});

test('Retiarius: winning a round entangles the opponent (−3 Speed next round)', () => {
  const [A, B, m] = pair({ cls: 'retiarius', power: 20 }, {});
  playRound(m);
  assert.ok(sources(computeSpeed(B, 2).mods).includes('Entangled:-3'));
  assert.equal(A.f.cls, 'retiarius');
});

test('Ash-Hungry: each injury inflicted adds +1 Power and +5% to injure for the match', () => {
  const [A, B] = pair({ cls: 'ashHungry' }, {});
  A.ash = 2;
  assert.ok(sources(computePower(A, B, 1).mods).includes('Ash Stacks:2'));
  assert.ok(sources(computePhase2(A, B, 1).enemy).includes('Ash Stacks:10000'));
});

test('Blood-Bearer: +5% win, and an off-hand strike after losing a round', () => {
  const [A, B] = pair({ cls: 'bloodBearer' }, {});
  assert.ok(sources(computePhase2(A, B, 1).win).includes('Off-Hand:5000'));
  let offhand = 0;
  for (let seed = 1; seed <= 30; seed++) {
    const m = createMatch({ a: blank({ cls: 'bloodBearer' }), b: blank({ power: 20 }), rng: createRng(seed) });
    const r = playRound(m);
    if (r.checks.some((c) => c.label === 'Off-hand strike')) offhand++;
  }
  assert.ok(offhand > 20, `${offhand}/30 rounds lost had an off-hand strike`);
});

test('Axe cleaves (+15 on the injury roll); Dagger backstabs when striking first', () => {
  let axe = 0;
  let plain = 0;
  for (let seed = 1; seed <= 400; seed++) {
    for (const weapon of ['axe', 'sword']) {
      const m = createMatch({ a: blank({ cls: 'fighter', weapon, power: 15 }), b: blank(), rng: createRng(seed) });
      const r = playRound(m);
      const hit = r.checks.find((c) => c.attacker === 'A' && c.injury);
      if (hit && weapon === 'axe') axe += hit.injury.roll >= 0 ? hit.injury.raw : 0;
      if (hit && weapon === 'sword') plain += hit.injury.raw;
    }
  }
  assert.ok(axe > plain, 'axe wounds roll higher');
  const m = createMatch({ a: blank({ cls: 'fighter', weapon: 'dagger', speed: 30 }), b: blank(), rng: createRng(2) });
  const r = playRound(m);
  const first = r.checks.find((c) => c.attacker === 'A' && !c.counter);
  assert.ok(first.mods.some((x) => x.source === 'Backstab'));
});

test('matchups: a Spear against a Cestus, a Club against armour', () => {
  const [S, C] = pair({ cls: 'fighter', weapon: 'spear' }, { cls: 'cestus' });
  assert.deepEqual(matchupsFor(S, C).map((x) => x.style), ['spear']);
  assert.ok(computePhase2(S, C, 1).win.some((x) => x.source === 'Reach keeps brawlers at bay'));
  const [K, Arm] = pair({ cls: 'fighter', weapon: 'club' }, { gear: { weapon: null, armor: 'leatherVest' } });
  assert.ok(computePhase2(K, Arm, 1).enemy.some((x) => x.source === 'Crushes armour'));
  const [K2, Bare] = pair({ cls: 'fighter', weapon: 'club' }, {});
  assert.equal(matchupsFor(K2, Bare).length, 0);
});

test('new items: Iron Tonic, Viper Venom, Berserker Mushroom, Throwing Net, Smelling Salts', () => {
  const run = createRun(1);
  const f = recruit(run, run.market[0].id);
  advanceToTournament(run);
  for (const k of ['ironTonic', 'viperVenom', 'berserkerMushroom', 'throwingNet', 'smellingSalts']) run.inventory.items[k] = 1;
  const m = startMatch(run, f.id);
  m.a.f.injuries = [{ tag: 'concussed', weight: 1, weeksLeft: 2 }];
  for (const k of ['ironTonic', 'viperVenom', 'berserkerMushroom', 'throwingNet', 'smellingSalts']) useItem(run, m, k);
  const p = computePhase2(m.a, m.b, 1);
  assert.ok(p.win.some((x) => x.source === 'Iron Tonic'));
  assert.ok(p.enemy.some((x) => x.source === 'Viper Venom'));
  assert.ok(p.self.some((x) => x.source === 'Berserker Mushroom'));
  assert.ok(computePower(m.a, m.b, 1).mods.some((x) => x.source === 'Berserker Mushroom' && x.value === 2));
  assert.ok(computeSpeed(m.b, 1).mods.some((x) => x.source === 'Throwing Net' && x.value === -3));
  assert.equal(m.a.f.injuries[0].suppressed, true, 'Concussed is suppressed for this fight');
  assert.ok(CONSUMABLES.smellingSalts.salts);
});

test('new gear: a Lion Pelt adds win chance', () => {
  const [A, B] = pair({ gear: { weapon: null, armor: 'lionPelt' } }, {});
  assert.ok(computePhase2(A, B, 1).win.some((x) => x.source === 'Lion Pelt' && x.value === 5000));
});

test('new perks: Bloodthirsty, Counterpuncher, Iron Will', () => {
  const [A, B] = pair({ perks: ['bloodthirsty', 'counterpuncher', 'ironWill'] }, { injuries: injuries('fleshWound') });
  assert.ok(computePhase2(A, B, 1).enemy.some((x) => x.source === 'Bloodthirsty'));
  A.lostRound = 1;
  assert.ok(computePhase2(A, B, 2).win.some((x) => x.source === 'Counterpuncher'));
  assert.equal(deathGateAt(A.f), 3);
});

test('Lions in the Arena open the Death Gate one injury earlier; the Emperor\'s Gaze forbids capitulating', () => {
  const [A, , m] = pair({ injuries: injuries('fleshWound') }, {}, { debuff: 'lions' });
  assert.equal(deathGateAt(A.f, A.arena), 1);
  assert.equal(mortalDanger(A), true);
  const [, , g] = pair({}, {}, { debuff: 'emperorsGaze' });
  playRound(g);
  if (!g.over) assert.equal(canThrowTowel(g), false);
  assert.ok(m);
});

test('the Stables bring exotic Basa to the Market; Basa never appear otherwise', () => {
  for (let seed = 1; seed <= 40; seed++) assert.ok(!createRun(seed).market.some((f) => f.kind === 'basa'));
  const run = createRun(3);
  run.prestigeLevel = 2;
  run.gold = 100;
  buildRoom(run, 'stables');
  assert.equal(run.market.filter((f) => f.kind === 'basa').length, 1);
  assert.ok(createFighter(createRng(1), { kind: 'basa' }).kindTrait);
});

test('a Lion Cage gives a Basa +1 Power', () => {
  const [A, B] = pair({ kind: 'basa', decor: { lionCage: 1 } }, {});
  assert.ok(computePower(A, B, 1).mods.some((x) => x.source === 'Lion Cage'));
  applyRoundEnd;
});
