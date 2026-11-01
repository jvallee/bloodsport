// Version 5.3.0: lower arenas move on without you, the Basa in the Market, and reanimating the dead.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun, recruit, advanceToTournament, advanceWeek, startMatch, finishMatch, choosePerk, resolveMercy } from '../src/run.js';
import { createRng } from '../src/rng.js';
import { KINDS, REANIMATE, BUILDINGS } from '../src/data.js';
import { createMatch, computePower, computePhase2, deathGateAt } from '../src/fight.js';
import { buildRoom, upgradeRoom, reanimate, reanimateBlocker, reanimatePrice, raisable, moraleTarget, serialize, deserialize } from '../src/run.js';
import { GAME_ACTIONS } from '../src/game.js';
import { blank } from './helpers.js';

export const play = (run, id, tier, { winner = 'A', reason = 'rounds', alive = true } = {}) => {
  for (const x of run.roster) while (x.pendingPerks.length) choosePerk(run, x.id, x.pendingPerks[0][0]);
  const m = startMatch(run, id, tier);
  m.over = true;
  m.result = { winner, reason };
  m.a.f.alive = alive;
  m.round = 2;
  const s = finishMatch(run, m);
  if (run.mercy) resolveMercy(run, 'spare');
  for (const x of run.roster) while (x.pendingPerks.length) choosePerk(run, x.id, x.pendingPerks[0][0]);
  return s;
};

// A career whose top arena is the Bronze Arena: the Dirt Pits conquered by a champion with Power to spare.
export function bronzeCareer(seed = 3) {
  const run = createRun(seed);
  const f = recruit(run, run.market[0].id);
  f.power = 40;
  while (run.topTier === 1) {
    advanceToTournament(run);
    play(run, f.id, 1);
    advanceWeek(run);
  }
  return { run, f };
}

test('a lower arena you sit out moves on: its circuit advances and a new opponent steps up', () => {
  const { run, f } = bronzeCareer();
  advanceToTournament(run);
  const before = { stage: run.arenas[1].stage, opp: run.arenas[1].opponent.id };
  play(run, f.id, 2); // the top arena only; nobody goes to the Dirt Pits
  advanceWeek(run);
  assert.notEqual(run.arenas[1].opponent.id, before.opp);
  assert.equal(run.arenas[1].stage, (before.stage + 1) % 3);
});

test('a lower arena at its Boss that you sit out starts a new circuit', () => {
  const { run, f } = bronzeCareer();
  advanceToTournament(run);
  run.arenas[1].stage = 2;
  play(run, f.id, 2);
  advanceWeek(run);
  assert.equal(run.arenas[1].stage, 0);
});

test('a lower arena you fight in moves on as before, once', () => {
  const { run, f } = bronzeCareer();
  const g = recruit(run, run.market[0].id);
  g.power = 40;
  advanceToTournament(run);
  const stage = run.arenas[1].stage;
  play(run, f.id, 2);
  play(run, g.id, 1);
  advanceWeek(run);
  assert.equal(run.arenas[1].stage, (stage + 1) % 3);
});

// ---------- The Unnatural Temple of Vulcan and Revenants ----------

// A career at House level 3 with a Temple, and a fighter who has just died in the Dirt Pits.
function withBody({ level = 1 } = {}) {
  const run = createRun(5);
  run.prestigeLevel = 3;
  run.gold = 200;
  const temple = buildRoom(run, 'vulcan');
  if (level >= 2) upgradeRoom(run, temple.id);
  const f = recruit(run, run.market[0].id);
  Object.assign(f, { level: 3, perks: ['killer', 'thickSkin'], titles: ['Champion of the Dirt Pits'], kills: 2, power: 12, renown: 9 });
  advanceToTournament(run);
  play(run, f.id, 1, { winner: 'B', reason: 'death', alive: false });
  return { run, body: run.fallen.find((x) => x.id === f.id) };
}

test('a fighter killed in the arena can be raised as a Revenant: same name, class, level, perks and titles; 1 less Power', () => {
  const { run, body } = withBody();
  assert.ok(body.arena);
  assert.deepEqual(raisable(run).map((x) => x.id), [body.id]);
  const gold = run.gold;
  const r = reanimate(run, body.id);
  assert.equal(run.gold, gold - reanimatePrice(run));
  assert.equal(reanimatePrice(run), REANIMATE.price + REANIMATE.perTier * 1);
  assert.ok(run.roster.includes(r));
  assert.notEqual(r.id, body.id);
  assert.equal(r.kind, 'revenant');
  assert.ok(KINDS.revenant.traits.includes(r.kindTrait));
  for (const key of ['name', 'cls', 'weapon', 'level', 'humor']) assert.equal(r[key], body[key]);
  assert.deepEqual([r.perks, r.titles, r.kills, r.renown], [body.perks, body.titles, body.kills, body.renown]);
  assert.equal(r.power, body.power + REANIMATE.power);
  assert.deepEqual([r.injuries, r.alive, r.job, r.stress], [[], true, 'rest', 0]);
  assert.equal(run.fallen.length, 1); // the death still counts
  assert.match(reanimateBlocker(run, body.id), /same body twice/);
  assert.deepEqual(raisable(run), []);
});

test('a level-2 Temple raises them at full strength, and keeps bodies longer', () => {
  const { run, body } = withBody({ level: 2 });
  assert.deepEqual(BUILDINGS.vulcan.per, [4, 12]);
  run.week += 10;
  const r = reanimate(run, body.id);
  assert.equal(r.power, body.power);
});

test('bodies keep only so long; executed fighters and Revenants can\'t be raised; the rite needs Gold and a bed', () => {
  const { run, body } = withBody();
  run.week += 5;
  assert.match(reanimateBlocker(run, body.id), /dead too long/);
  run.week -= 5;
  run.gold = 0;
  assert.match(reanimateBlocker(run, body.id), /Needs/);
  run.gold = 200;
  run.fallen.push({ ...body, id: 'exec', arena: undefined });
  assert.match(reanimateBlocker(run, 'exec'), /executed/);
  run.fallen.push({ ...body, id: 'rev', kind: 'revenant' });
  assert.match(reanimateBlocker(run, 'rev'), /same body twice/);
  const none = createRun(5);
  assert.match(reanimateBlocker(none, 'x'), /Build the Unnatural Temple/);
});

test('reanimate is a recorded game action', () => {
  assert.equal(typeof GAME_ACTIONS.reanimate, 'function');
});

test('a Revenant feels nothing: Morale heads for 50 whatever the room', () => {
  const { run, body } = withBody();
  const r = reanimate(run, body.id);
  r.decor.bathhouse = 3;
  r.renown = 40;
  assert.equal(moraleTarget(run, r).target, REANIMATE.morale);
  r.morale = 90;
  advanceWeek(run);
  assert.ok(r.morale < 90 && r.morale >= REANIMATE.morale);
});

const pair = (a, b) => {
  const m = createMatch({ a: blank(a), b: blank(b), rng: createRng(1) });
  return [m.a, m.b, m];
};

test('Revenant traits: Deathless holds the Death Gate one injury longer, Grave Chill −5% to the opponent, Cinder Heart +1 Power from Round 2', () => {
  assert.equal(deathGateAt(blank({ kind: 'revenant', kindTrait: 'deathless' })), 3);
  assert.equal(deathGateAt(blank({ kind: 'revenant', kindTrait: 'deathless' }), null, ['kind']), 2);
  const [G, X] = pair({ kind: 'revenant', kindTrait: 'graveChill' }, {});
  assert.ok(computePhase2(X, G, 1).win.some((x) => x.source === 'Grave Chill' && x.value === -5000));
  assert.ok(!computePhase2(G, X, 1).win.some((x) => x.source === 'Grave Chill'));
  const [C, Y] = pair({ kind: 'revenant', kindTrait: 'cinderHeart' }, {});
  assert.equal(computePower(C, Y, 1).total, 5);
  assert.equal(computePower(C, Y, 2).total, 6);
  assert.equal(computePower(C, Y, 3).total, 6);
});

test('Revenants are never sold or met in the arena', () => {
  for (let seed = 1; seed <= 30; seed++) {
    const run = createRun(seed);
    assert.ok(![...run.market, ...Object.values(run.arenas).map((a) => a.opponent)].some((f) => f.kind === 'revenant'));
  }
});

test('a save with the Stables loads with the Temple of Vulcan in its place, at the same level', () => {
  const run = createRun(2);
  run.buildings.push({ id: 'b99', type: 'stables', level: 2 });
  const back = deserialize(serialize(run));
  assert.deepEqual(back.buildings.find((b) => b.id === 'b99'), { id: 'b99', type: 'vulcan', level: 2 });
});

// ---------- The designer's notes (2026-11-01) ----------
import { MERCY } from '../src/data.js';
import { spareFavor } from '../src/run.js';

function wonWounded(seed = 1) {
  const run = createRun(seed);
  const f = recruit(run, run.market[0].id);
  advanceToTournament(run);
  const m = startMatch(run, f.id);
  m.b.f.injuries.push({ tag: 'fleshWound', weight: 1 });
  Object.assign(m, { over: true, result: { winner: 'A', reason: 'rounds' } });
  finishMatch(run, m);
  return { run, f };
}

test('sparing when the crowd calls for blood earns no Favour: the Emperor wanted a death too', () => {
  const { run } = wonWounded();
  run.mercy.crowd = 'kill';
  assert.equal(spareFavor(run), 0);
  const favor = run.favor;
  const out = resolveMercy(run, 'spare');
  assert.equal(run.favor, favor);
  assert.equal(out.favor, 0);
  assert.doesNotMatch(run.log.at(-2).text + run.log.at(-1).text, /approves/);
});

test('sparing when the Emperor has demanded a death earns no Favour, even if the crowd wanted mercy', () => {
  const { run } = wonWounded();
  run.mercy.crowd = 'spare';
  run.demand = { id: 'kill', week: run.week };
  assert.equal(spareFavor(run), 0);
  run.demand = null;
  assert.equal(spareFavor(run), MERCY.spareFavor);
});

// The rebel's confession: the first political prisoner says plainly that there is a rising, coloured by your record.
import { rebelScene, dueRebel, houseRecord } from '../src/dialogue.js';
import { release } from '../src/run.js';
import { dialogueModal } from '../src/ui/views.js';

function withRebel() {
  const run = createRun(4, { patron: 'liberator' }); // starts with a political prisoner
  return { run, rebel: run.roster.find((f) => f.political) };
}

test('the first political prisoner confesses the rising, once per career', () => {
  const { run, rebel } = withRebel();
  assert.ok(rebel && run.plot);
  assert.equal(dueRebel(run, []), rebel);
  assert.equal(dueRebel(run, ['rebel']), null);
  const beats = rebelScene(run, rebel);
  const text = beats.map((b) => b.text).join(' ');
  assert.match(text, /There is a rising against Silbannacus/);
  assert.match(text, /Not me by you, and not you by the Emperor/);
  assert.ok(beats.at(-1).replies.length >= 2);
  assert.match(dialogueModal('rebel', beats, 1), new RegExp(rebel.name));
  assert.equal(dueRebel(createRun(4), []), null, 'no prisoner, no confession');
});

test('what the rebel has heard depends on your record: mercy at a cost, fighters set free, kills, Morale', () => {
  const { run, rebel } = withRebel();
  assert.match(rebelScene(run, rebel).map((b) => b.text).join(' '), /I don't know you yet/);
  const other = recruit(run, run.market[0].id);
  release(run, other.id);
  assert.equal(houseRecord(run).released, 1);
  run.history.push({ verdict: 'spare', mercy: 'kill' }, { verdict: 'kill', mercy: 'kill' });
  const text = rebelScene(run, rebel).map((b) => b.text).join(' ');
  assert.match(text, /even when the crowd bayed for blood/);
  assert.match(text, /set them free/);
  run.history = [{ verdict: 'kill' }, { verdict: 'kill' }, { verdict: 'kill' }];
  run.released = 0;
  assert.match(rebelScene(run, rebel).map((b) => b.text).join(' '), /thumb down 3 times, and never up/);
});
