import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CLASSES, CLASS_RESONANCE, COMBAT, WEAPONS, WEAPON_GROUP, WEAPON_SIGNATURES, SIGNATURES, signatureDef, MATCHUPS,
} from '../src/data.js';
import {
  createMatch, computePhase2, computeSpeed, playRound, suggestTactic, signatureOf, useSignature, hypeOf, injuryCheck,
} from '../src/fight.js';
import { effectiveSpeed } from '../src/run/helpers.js';
import { estimateOdds } from '../src/odds.js';
import { roundStats } from '../src/explain.js';
import { narrateRound } from '../src/narrate.js';
import { ENTRIES } from '../src/codex.js';
import { fighterCard } from '../src/ui/components.js';
import { fightView } from '../src/ui/fightView.js';
import { blank, scripted, e5, roundRecord } from './helpers.js';
import { createRng } from '../src/rng.js';

test('v7.13 class tactic resonances apply in computePhase2 and switch off when class slot is disabled', () => {
  for (const [cls, res] of Object.entries(CLASS_RESONANCE)) {
    const m = createMatch({ a: blank({ cls }), b: blank(), rng: createRng(1) });
    m.a.stance = res.tactic;
    const p2 = computePhase2(m.a, m.b, 1, {});
    if (res.win) assert.ok(p2.win.some((x) => x.source === CLASSES[cls].ability && x.value === res.win), `${cls} win resonance`);
    if (res.injure) assert.ok(p2.enemy.some((x) => x.source === CLASSES[cls].ability && x.value === res.injure), `${cls} injure resonance`);

    // Disabled class slot suppresses tactic resonance.
    m.a.disabled.push('class');
    const p2Off = computePhase2(m.a, m.b, 1, {});
    assert.ok(!p2Off.win.some((x) => x.source === CLASSES[cls].ability), `${cls} win suppressed when disabled`);
    assert.ok(!p2Off.enemy.some((x) => x.source === CLASSES[cls].ability), `${cls} injure suppressed when disabled`);
  }

  // Retiarius extra +4% win against an entangled opponent while Feinting.
  const rm = createMatch({ a: blank({ cls: 'retiarius' }), b: blank(), rng: createRng(2) });
  rm.a.stance = 'feint';
  rm.b.netRound = 1;
  const rp2 = computePhase2(rm.a, rm.b, 1, {});
  assert.ok(rp2.win.some((x) => x.source === 'Net and Trident' && x.value === 8000));
});

test('v7.13 Fighter weapon tactic resonances apply and obey disabled class slot', () => {
  const cases = [
    ['axe', 'press', COMBAT.axePressWin, 'Axe (Press)'],
    ['fists', 'press', COMBAT.fistsPressWin, 'Fists (Press)'],
    ['flail', 'press', COMBAT.flailPressWin, 'Flail (Press)'],
    ['sword', 'guard', COMBAT.swordGuardWin, 'Sword (Guard)'],
    ['dagger', 'feint', COMBAT.daggerFeintWin, 'Dagger (Feint)'],
  ];
  for (const [weapon, stance, val, label] of cases) {
    const m = createMatch({ a: blank({ cls: 'fighter', weapon }), b: blank(), rng: createRng(3) });
    m.a.stance = stance;
    const p2 = computePhase2(m.a, m.b, 1, {});
    assert.ok(p2.win.some((x) => x.source === label && x.value === val), label);
    m.a.disabled.push('class');
    const p2Off = computePhase2(m.a, m.b, 1, {});
    assert.ok(!p2Off.win.some((x) => x.source === label), `${label} off when disabled`);
  }
});

test('v7.13 Cestus Press Hype bonus respects classActive (disabled/disarmed gives no bonus)', () => {
  // Active Cestus pressing gets base Hype + 5 extra.
  const m1 = createMatch({ a: blank({ cls: 'cestus', power: 5 }), b: blank({ power: 5, humor: 'melancholic' }), rng: scripted([0.5, 0.5, e5(99999), e5(99999), e5(99999)]) });
  const r1 = playRound(m1, { stance: 'press' });
  assert.equal(r1.resHype, CLASS_RESONANCE.cestus.hype);
  assert.ok(hypeOf(m1) >= 20);

  // Disabled class slot grants 0 extra resonance Hype.
  const m2 = createMatch({ a: blank({ cls: 'cestus', power: 5 }), b: blank({ power: 5, humor: 'melancholic' }), rng: scripted([0.5, 0.5, e5(99999), e5(99999), e5(99999)]) });
  m2.a.disabled.push('class');
  const r2 = playRound(m2, { stance: 'press' });
  assert.equal(r2.resHype, 0);
  assert.equal(hypeOf(m1) - hypeOf(m2), CLASS_RESONANCE.cestus.hype);
});

test('v7.13 Blood-Bearer Press lifts off-hand strike chance from 15% to 20%', () => {
  // A loses round 1 (roll 99999), both miss main strikes, A makes off-hand strike while Pressing.
  const mPress = createMatch({ a: blank({ cls: 'bloodBearer', power: 5, speed: 5 }), b: blank({ power: 5, speed: 5, humor: 'choleric' }), rng: scripted([0.5, 0.5, e5(99999), e5(99999), e5(99999), e5(99999)]) });
  const rP = playRound(mPress, { stance: 'press' });
  const offP = rP.checks.find((c) => c.label === 'Off-hand strike');
  assert.ok(offP);
  assert.equal(offP.chance, 20000);

  const mSteady = createMatch({ a: blank({ cls: 'bloodBearer', power: 5, speed: 5 }), b: blank({ power: 5, speed: 5, humor: 'choleric' }), rng: scripted([0.5, 0.5, e5(99999), e5(99999), e5(99999), e5(99999)]) });
  const rS = playRound(mSteady, { stance: 'steady' });
  const offS = rS.checks.find((c) => c.label === 'Off-hand strike');
  assert.ok(offS);
  assert.equal(offS.chance, 15000);
});

test('v7.13 suggestTactic respects Sagittarius Steady vs Sanguine without breaking Choleric/Melancholic counters', () => {
  const mk = (humor) => createMatch({ a: blank({ cls: 'sagittarius', speed: 5 }), b: blank({ speed: 5, humor }), rng: createRng(10) });
  assert.equal(suggestTactic(mk('sanguine')), 'steady');
  assert.equal(suggestTactic(mk('choleric')), 'guard');
  assert.equal(suggestTactic(mk('melancholic')), 'feint');
});

test('v7.13 Fighter 3 weapon-group signatures work across signatureDef, combat, explain, UI, and Codex', () => {
  for (const w of Object.keys(WEAPONS)) {
    const group = WEAPON_GROUP[w];
    assert.ok(WEAPON_SIGNATURES[group], `weapon ${w} maps to group ${group}`);
    const f = blank({ cls: 'fighter', weapon: w, level: 3 });
    assert.equal(signatureDef(f).name, WEAPON_SIGNATURES[group].name);
    assert.equal(signatureOf(f).name, WEAPON_SIGNATURES[group].name);
  }
  // Fallback still preserves SIGNATURES.fighter if weapon is omitted.
  assert.equal(signatureDef({ cls: 'fighter', weapon: null }).name, SIGNATURES.fighter.name);

  // Heavy Crushing Blow applies +1 Power and opponent -2 Speed via explain.roundStats and combat.
  const m = createMatch({ a: blank({ cls: 'fighter', weapon: 'club', level: 3, power: 10, speed: 6 }), b: blank({ power: 10, speed: 6 }), rng: createRng(4) });
  useSignature(m);
  const stats = roundStats(m);
  assert.equal(stats.A.power, 11);
  assert.equal(stats.B.speed, 4);

  // Card & Codex expose weapon-group signatures.
  const html = fighterCard(blank({ cls: 'fighter', weapon: 'bow', level: 3 }));
  assert.match(html, /Deadeye Volley/);
  const sigCodex = ENTRIES.find((e) => e.key === 'basics:signatures');
  assert.match(sigCodex.rules, /Crimson Flourish/);
  assert.match(sigCodex.rules, /Crushing Blow/);
  assert.match(sigCodex.rules, /Deadeye Volley/);
});

test('v7.13 Samnite Shield Wall parry grants +8% win next round and narrates without "ripostes"', () => {
  const m = createMatch({ a: blank({ cls: 'samnite' }), b: blank(), rng: scripted([e5(1), e5(1)]) });
  const r = roundRecord({ round: 1, winner: 'B' });
  const chk = injuryCheck(m, m.b, m.a, r, 'First strike');
  assert.equal(chk.parry.shield, true);
  assert.equal(chk.parry.success, true);
  assert.equal(m.a.shieldCounterRound, 2);

  const p2 = computePhase2(m.a, m.b, 2, {});
  assert.ok(p2.win.some((x) => x.source === 'Shield Wall' && x.value === COMBAT.shieldCounterWin));

  const lines = narrateRound(m, { ...r, stances: { A: 'steady', B: 'steady' }, initiative: { first: 'B', rolls: { A: 1, B: 6 }, speed: { A: { total: 3, mods: [] }, B: { total: 3, mods: [] } } }, win: { base: 50000, chance: 50000, modsA: [], modsB: [] }, roll: 99999, endEffects: [] });
  const parryLine = lines.find((l) => l.type === 'parry')?.text ?? '';
  assert.match(parryLine, /catches it on the shield/);
  assert.match(parryLine, /\+8% win chance/);
  assert.doesNotMatch(parryLine, /ripostes/i);
});

test('v7.13 Ornitharius +1 Speed cap with 1+ Birds matches effectiveSpeed, fighterCard, and guards missing decor', () => {
  const noBird = blank({ cls: 'ornitharius', speed: 5, decor: { bird: 0 } });
  const oneBird = blank({ cls: 'ornitharius', speed: 5, decor: { bird: 1 } });
  const threeBirds = blank({ cls: 'ornitharius', speed: 5, decor: { bird: 3 } });
  const missingDecor = blank({ cls: 'ornitharius', speed: 5, decor: {} });

  assert.equal(effectiveSpeed(noBird), 5);
  assert.equal(effectiveSpeed(oneBird), 6);
  assert.equal(effectiveSpeed(threeBirds), 6);

  const m1 = createMatch({ a: oneBird, b: blank(), rng: createRng(5) });
  const m3 = createMatch({ a: threeBirds, b: blank(), rng: createRng(5) });
  const mMissing = createMatch({ a: missingDecor, b: blank(), rng: createRng(5) });
  assert.equal(computeSpeed(m1.a, 1).total, 6);
  assert.equal(computeSpeed(m3.a, 1).total, 6);
  assert.equal(computeSpeed(mMissing.a, 1).total, 5);
  assert.ok(Number.isFinite(computePhase2(mMissing.a, mMissing.b, 1, {}).enemy.reduce((s, x) => s + x.value, 0)));

  const card = fighterCard(oneBird);
  assert.match(card, /Birds of Prey/);
  assert.match(card, /<b>6<\/b>/);
});

test('v7.13 fightView suppresses resonance tooltip when class slot is disabled', () => {
  const m = createMatch({ a: blank({ cls: 'samnite' }), b: blank({ humor: 'choleric' }), rng: createRng(7) });
  const onHtml = fightView(m, { showMath: false, speed: 'normal' }, { tier: 1, name: 'The Dirt Pits' });
  assert.match(onHtml, /behind the tower shield/);

  m.a.disabled.push('class');
  const offHtml = fightView(m, { showMath: false, speed: 'normal' }, { tier: 1, name: 'The Dirt Pits' });
  assert.doesNotMatch(offHtml, /behind the tower shield/);
});

test('v7.13 Ash-Hungry odds preview fires Feed the Ash on Round 1 and Light-RPS matchups are active', () => {
  const a = blank({ cls: 'ashHungry', level: 3, power: 10, speed: 6 });
  const b = blank({ cls: 'samnite', level: 3, power: 10, speed: 6 });
  const withSig = estimateOdds(a, b, { n: 200, seed: 42, useSignatures: true });
  const noSig = estimateOdds(a, b, { n: 200, seed: 42, useSignatures: false });
  assert.ok(withSig.win > noSig.win, `Ash-Hungry R1 Feed the Ash should lift odds (${withSig.win} vs ${noSig.win})`);

  // Light-RPS matchups include Ornitharius, Samnite, Ash-Hungry, Thorn-Blade, and no ashHungry/flail vs armor trap.
  assert.ok(MATCHUPS.some((x) => x.style === 'ornitharius' && x.vs.includes('bow')));
  assert.ok(MATCHUPS.some((x) => x.style === 'samnite' && x.vs.includes('bloodBearer')));
  assert.ok(MATCHUPS.some((x) => x.style === 'ashHungry' && x.vs.includes('samnite')));
  assert.ok(MATCHUPS.some((x) => x.style === 'thornBlade' && x.vs.includes('fists')));
  assert.ok(!MATCHUPS.some((x) => x.style === 'ashHungry' && x.vs.includes('armor')));
});
