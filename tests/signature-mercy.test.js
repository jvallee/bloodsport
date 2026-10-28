// Signature moves (level 3+, once per fight) and thumbs up or down (a beaten opponent's fate).
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRng } from '../src/rng.js';
import { SIGNATURES, SIGNATURE, MERCY, CLASSES, HOUSES } from '../src/data.js';
import { createMatch, playRound, computePower, computePhase2, computeSpeed, signatureOf, signatureBlocker, useSignature } from '../src/fight.js';
import { narrateStory, narrateRound } from '../src/narrate.js';
import {
  createRun, recruit, advanceToTournament, startMatch, finishMatch, resolveMercy, mercyBlocker, advanceBlocker, serialize, deserialize, houseOf,
} from '../src/run.js';
import { applyGameAction } from '../src/game.js';
import { fightView } from '../src/ui/fightView.js';
import { eventCard } from '../src/ui/views.js';
import { blank } from './helpers.js';

test('every class has a signature move, unlocked at level 3', () => {
  for (const cls of Object.keys(CLASSES)) assert.ok(SIGNATURES[cls]?.name && SIGNATURES[cls].desc, cls);
  assert.equal(signatureOf(blank({ cls: 'cestus', level: SIGNATURE.level - 1 })), null);
  assert.equal(signatureOf(blank({ cls: 'cestus', level: SIGNATURE.level })).name, 'Haymaker');
  const m = createMatch({ a: blank({ cls: 'cestus', level: 2 }), b: blank(), rng: createRng(1) });
  assert.match(signatureBlocker(m), /level 3/);
});

test('a signature move boosts only the next round, once per fight, and the story announces it', () => {
  const m = createMatch({ a: blank({ cls: 'cestus', level: 3 }), b: blank(), rng: createRng(1) });
  useSignature(m);
  assert.match(signatureBlocker(m), /already been used/);
  assert.ok(computePower(m.a, m.b, 1).mods.some((x) => x.source === 'Haymaker' && x.value === 2));
  assert.ok(computePhase2(m.a, m.b, 1).self.some((x) => x.source === 'Haymaker'));
  const r = playRound(m);
  assert.deepEqual(r.signatures, [{ side: 'A', name: 'Haymaker' }]);
  assert.ok(narrateStory(m, r).some((l) => l.type === 'signature' && /unleashes Haymaker/.test(l.text)));
  assert.ok(narrateRound(m, r).some((l) => l.type === 'signature'));
  assert.equal(computePower(m.a, m.b, 2).mods.some((x) => x.source === 'Haymaker'), false, 'one round only');
});

test('foe effects hit the opponent: Cast the Net slows them and cuts their win chance', () => {
  const m = createMatch({ a: blank({ cls: 'retiarius', level: 3 }), b: blank(), rng: createRng(1) });
  useSignature(m);
  assert.ok(computeSpeed(m.b, 1).mods.some((x) => x.source === 'Cast the Net' && x.value === -5));
  assert.ok(computePhase2(m.b, m.a, 1).win.some((x) => x.source === 'Cast the Net' && x.value === -5000));
  const ash = createMatch({ a: blank({ cls: 'ashHungry', level: 3 }), b: blank(), rng: createRng(1) });
  useSignature(ash);
  assert.equal(ash.a.ash, 1);
});

test('seasoned opponents unleash theirs once they fall behind, or in Round 3', () => {
  let seen = 0;
  for (let seed = 1; seed <= 40; seed++) {
    const m = createMatch({ a: blank({ power: 9 }), b: blank({ cls: 'fighter', weapon: 'sword', level: SIGNATURE.opponentLevel, power: 9 }), rng: createRng(seed) });
    const r1 = playRound(m);
    assert.equal(r1.signatures.length, 0, 'never in Round 1');
    if (m.over) continue;
    const r2 = playRound(m);
    const used = r2.signatures.some((x) => x.side === 'B');
    assert.equal(used, r1.winner === 'A', 'used in Round 2 only when behind');
    if (used) seen++;
    if (!m.over && !used) assert.ok(playRound(m).signatures.some((x) => x.side === 'B'), 'Round 3 if not used yet');
  }
  assert.ok(seen > 0);
});

// A won fight where the opponent was wounded.
function wonWounded(seed = 1) {
  const run = createRun(seed);
  const f = recruit(run, run.market[0].id);
  advanceToTournament(run);
  const m = startMatch(run, f.id);
  m.b.f.injuries.push({ tag: 'fleshWound', weight: 1 });
  Object.assign(m, { over: true, result: { winner: 'A', reason: 'rounds' } });
  const s = finishMatch(run, m);
  return { run, f, m, s };
}

test('a win over a wounded opponent asks for a verdict, and nothing else happens until you decide', () => {
  const { run, s, m } = wonWounded();
  assert.ok(run.mercy);
  assert.equal(s.mercy, run.mercy.crowd);
  assert.match(advanceBlocker(run), /thumbs up or down/);
  assert.match(mercyBlocker(run, 'maybe'), /Thumbs up/);
  assert.equal(deserialize(serialize(run)).mercy.opp, run.mercy.opp, 'survives a reload');
  const html = fightView(m, { animateRound: 0 }, { name: 'X', tier: 1, buyIn: 1 }, '', {}, null, run.mercy);
  assert.match(html, /data-action="mercy" data-choice="spare"/);
  assert.match(html, /data-action="mercy" data-choice="kill"/);
  assert.doesNotMatch(html, /data-action="leave-fight"/, 'decide before leaving');
  assert.match(eventCard(run), /'s fate|&#39;s fate/);
});

test('no verdict after beating an unwounded opponent', () => {
  const run = createRun(2);
  const f = recruit(run, run.market[0].id);
  advanceToTournament(run);
  const m = startMatch(run, f.id);
  m.b.f.injuries = [];
  Object.assign(m, { over: true, result: { winner: 'A', reason: 'rounds' } });
  finishMatch(run, m);
  assert.equal(run.mercy ?? null, null);
});

test('spare: +Favor; with the crowd: +Renown and Morale', () => {
  const { run, f, s } = wonWounded();
  run.mercy.crowd = 'spare';
  const favor = run.favor;
  const renown = f.renown;
  const morale = f.morale;
  const out = resolveMercy(run, 'spare');
  assert.equal(run.favor, favor + MERCY.spareFavor);
  assert.equal(f.renown, renown + MERCY.crowdRenown);
  assert.equal(f.morale, Math.min(100, morale + MERCY.crowdMorale));
  assert.equal(out.kill, false);
  assert.equal(s.verdict, 'spare');
  assert.equal(run.mercy, null);
});

test('kill: Renown, a kill, the graveyard, and their house swears a feud', () => {
  const { run, f } = wonWounded(3);
  run.mercy.crowd = 'spare'; // against the crowd: no bonus
  const name = run.mercy.opp;
  const house = run.houses.find((h) => h.id === run.mercy.house);
  const renown = f.renown;
  applyGameAction({ run, match: null }, 'mercy', { choice: 'kill' });
  assert.deepEqual(run.actions.at(-1), ['mercy', { choice: 'kill' }], 'recorded for replays');
  assert.equal(f.kills, 1);
  assert.equal(f.renown, renown + MERCY.killRenown);
  assert.ok(run.graveyard.includes(name));
  if (house) assert.equal(house.feud, HOUSES.feudMonths, 'killing against the crowd starts a feud');
  assert.ok(houseOf);
});

test('a kill the crowd demanded starts no feud', () => {
  for (let seed = 1; seed <= 20; seed++) {
    const { run } = wonWounded(seed);
    const house = run.houses.find((h) => h.id === run.mercy.house);
    if (!house || house.feud) continue;
    run.mercy.crowd = 'kill';
    const out = resolveMercy(run, 'kill');
    assert.equal(house.feud ?? 0, 0);
    assert.equal(out.feud, null);
    assert.equal(out.renown, MERCY.killRenown + MERCY.crowdRenown);
    return;
  }
  assert.fail('no seed had a house opponent');
});

test('opponents use signature moves only from their level threshold', () => {
  const m = createMatch({ a: blank({ power: 20 }), b: blank({ cls: 'cestus', level: SIGNATURE.opponentLevel - 1 }), rng: createRng(1) });
  playRound(m);
  if (!m.over) assert.equal(playRound(m).signatures.length, 0);
});

test('the crowd calls for blood at the Death Gate, otherwise for mercy', () => {
  const { run } = wonWounded(4);
  const h = run.houses.find((x) => x.id === run.mercy.house);
  if (!h?.feud && !h?.vengeance) assert.equal(run.mercy.crowd, 'spare', 'one wound: mercy');
  const run2 = createRun(4);
  const f = recruit(run2, run2.market[0].id);
  advanceToTournament(run2);
  const m = startMatch(run2, f.id);
  m.b.f.injuries.push({ tag: 'fleshWound', weight: 1 }, { tag: 'fleshWound', weight: 1 });
  Object.assign(m, { over: true, result: { winner: 'A', reason: 'rounds' } });
  finishMatch(run2, m);
  assert.equal(run2.mercy.crowd, 'kill');
});
