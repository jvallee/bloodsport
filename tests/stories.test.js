import test from 'node:test';
import assert from 'node:assert/strict';
import { createRng } from '../src/rng.js';
import { SURGERY, SCARS } from '../src/data.js';
import { createMatch, computePower, computePhase2, playRound } from '../src/fight.js';
import {
  createRun, recruit, advanceToTournament, startMatch, finishMatch, augment, augmentBlocker, retire, retireBlocker, serialize, deserialize,
} from '../src/run.js';
import { blank, injuries } from './helpers.js';

const pair = (a, b) => {
  const m = createMatch({ a: blank(a), b: blank(b), rng: createRng(1) });
  return [m.a, m.b];
};
const sources = (mods) => mods.map((x) => `${x.source}:${x.value}`);
const atBout = (seed = 1) => {
  const run = createRun(seed);
  const f = recruit(run, run.market[0].id);
  advanceToTournament(run);
  return { run, f };
};
const play = (run, id, { winner = 'A', reason = 'rounds', alive = true, injuries: inj = [] } = {}) => {
  const m = startMatch(run, id);
  m.over = true;
  m.result = { winner, reason };
  m.a.f.alive = alive;
  m.a.f.injuries = inj;
  return finishMatch(run, m);
};

test('Afeared of ranged fighters: weaker and warier against them, normal against melee', () => {
  const [A, archer] = pair({ scars: [{ id: 'afeared', vs: 'ranged' }] }, { cls: 'sagittarius' });
  assert.ok(sources(computePower(A, archer, 1).mods).includes('Afeared (ranged):-1'));
  const p = computePhase2(A, archer, 1);
  assert.ok(sources(p.enemy).includes('Afeared (ranged):-10000'));
  assert.ok(sources(p.self).includes('Afeared (ranged):-10000'));
  const [B, brawler] = pair({ scars: [{ id: 'afeared', vs: 'ranged' }] }, { cls: 'cestus' });
  assert.deepEqual(sources(computePower(B, brawler, 1).mods), []);
});

test('Enraged against melee fighters: stronger and more dangerous, but reckless', () => {
  const [A, brawler] = pair({ scars: [{ id: 'enraged', vs: 'melee' }] }, { cls: 'cestus' });
  assert.ok(sources(computePower(A, brawler, 1).mods).includes('Enraged (melee):1'));
  const p = computePhase2(A, brawler, 1);
  assert.ok(sources(p.enemy).includes('Enraged (melee):15000'));
  assert.ok(sources(p.self).includes('Enraged (melee):15000'));
});

test('Battle-Hardened and cyborg augments', () => {
  const [A, X] = pair({ scars: [{ id: 'hardened' }], augments: ['arm', 'eye'] }, {});
  assert.ok(sources(computePhase2(A, X, 1).self).includes('Battle-Hardened:-5000'));
  assert.ok(sources(computePower(A, X, 1).mods).includes('Cyborg Arm:1'));
  assert.ok(sources(computePower(A, X, 1).mods).includes('Cyborg Eye:1'));
});

test('a cyborg eye cannot be Blinded: the wound becomes a Flesh Wound', () => {
  let blinded = 0;
  for (let seed = 1; seed <= 300; seed++) {
    const m = createMatch({ a: blank({ augments: ['eye'], injuries: injuries('concussed', 'concussed') }), b: blank({ power: 15 }), rng: createRng(seed) });
    playRound(m);
    if (m.a.f.injuries.some((i) => i.tag === 'blinded')) blinded++;
  }
  assert.equal(blinded, 0);
});

test('surviving a severe wound can leave a scar; a Bloodied Victory leaves Battle-Hardened', () => {
  let scarred = 0;
  for (let seed = 1; seed <= 40; seed++) {
    const { run, f } = atBout(seed);
    play(run, f.id, { winner: 'B', injuries: [{ tag: 'maimed', weight: 1 }] });
    if ((f.scars ?? []).some((s) => s.id === 'afeared' || s.id === 'enraged')) scarred++;
  }
  assert.ok(scarred > 8 && scarred < 32, `${scarred}/40 scarred (50% expected)`);
  const { run, f } = atBout(2);
  play(run, f.id, { injuries: [{ tag: 'fleshWound', weight: 1 }, { tag: 'concussed', weight: 1 }] });
  assert.ok(f.scars.some((s) => s.id === 'hardened'));
  assert.ok(f.story.some((e) => /Battle-Hardened/.test(e.text)));
});

test('cyborg surgery needs a Medbay Lv 2 and Gold, removes a Maimed or Blinded wound, adds an augment', () => {
  const run = createRun(3);
  const f = recruit(run, run.market[0].id);
  f.injuries = [{ tag: 'maimed', weight: 1, weeksLeft: 3 }, { tag: 'fleshWound', weight: 1, weeksLeft: 1 }];
  assert.match(augmentBlocker(run, f.id, 0), /Medbay level 2/);
  run.buildings.find((b) => b.type === 'medbay').level = 2;
  run.gold = 0;
  assert.match(augmentBlocker(run, f.id, 0), /Needs \d+ Gold/);
  assert.match(augmentBlocker(run, f.id, 1), /Maimed or Blinded/);
  run.gold = 100;
  const renown = f.renown;
  augment(run, f.id, 0);
  assert.deepEqual(f.injuries.map((i) => i.tag), ['fleshWound']);
  assert.deepEqual(f.augments, ['arm']);
  assert.equal(run.gold, 100 - SURGERY.cost);
  assert.equal(f.renown, Math.max(0, renown + SURGERY.renown));
});

test('fighters keep a chronicle; a death adds a eulogy', () => {
  const { run, f } = atBout(4);
  assert.ok(f.story.some((e) => /Joined/.test(e.text)));
  play(run, f.id, { reason: 'death' });
  assert.ok(f.story.some((e) => /first kill/i.test(e.text)));
  const other = atBout(5);
  const s = play(other.run, other.f.id, { winner: 'B', reason: 'death', alive: false });
  assert.match(s.eulogy, new RegExp(`Here lies ${other.f.name}`));
  assert.ok(other.run.fallen[0].story.some((e) => /Fell/.test(e.text)));
});

test('veterans can retire to the Hall of Champions: Prestige for the house, Morale for the roster', () => {
  const run = createRun(5);
  const vet = recruit(run, run.market[0].id);
  const other = recruit(run, run.market[0].id);
  assert.match(retireBlocker(run, vet.id), /level 4 or a Title/);
  vet.level = 4;
  vet.renown = 10;
  const [prestige, morale] = [run.prestige, other.morale];
  const legend = retire(run, vet.id);
  assert.equal(run.roster.includes(vet), false);
  assert.equal(run.prestige, prestige + 5);
  assert.equal(other.morale, Math.min(100, morale + 10));
  assert.equal(legend.name, vet.name);
  assert.deepEqual(run.retired.map((x) => x.name), [vet.name]);
});

test('scars, augments and stories survive saves', () => {
  const run = createRun(6);
  const f = recruit(run, run.market[0].id);
  f.scars = [{ id: 'enraged', vs: 'melee' }];
  f.augments = ['eye'];
  const back = deserialize(serialize(run)).roster[0];
  assert.deepEqual([back.scars, back.augments], [f.scars, f.augments]);
  assert.ok(Object.keys(SCARS).length >= 3);
});
